import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const UNLOCK_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Build an expiring, HMAC-signed unlock cookie value: `${expiry}.${sig}`.
 * Embedding the expiry means a leaked cookie value stops working after the TTL,
 * and the value changes on every issuance (vs. a single eternal constant).
 */
function buildUnlockCookie(): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  const expiry = Date.now() + UNLOCK_TTL_MS;
  const sig = crypto.createHmac("sha256", secret).update(`site_unlocked:${expiry}`).digest("hex");
  return `${expiry}.${sig}`;
}

/** Verify a stored site password against either a bcrypt or legacy SHA-256 hash. */
async function verifySitePassword(plain: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith("$2")) {
    return bcrypt.compare(plain, storedHash);
  }
  // Legacy unsalted SHA-256 (backward compatibility for pre-bcrypt passwords)
  const legacy = crypto.createHash("sha256").update(plain).digest("hex");
  return legacy === storedHash;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password, autoUnlock } = body;

  const supabase = await createClient();
  const { data: config } = await supabase
    .from("site_config")
    .select("site_password_enabled, site_password_hash, partner_one_name, partner_two_name")
    .eq("id", 1)
    .single();

  if (!config) {
    return NextResponse.json({ error: "Configuration not found." }, { status: 500 });
  }

  const setUnlockedCookie = (res: NextResponse) => {
    res.cookies.set("site_unlocked", buildUnlockCookie(), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: Math.floor(UNLOCK_TTL_MS / 1000), // 7 days
      path: "/",
    });
    return res;
  };

  // Password protection is off — unlock immediately
  if (!config.site_password_enabled) {
    return setUnlockedCookie(NextResponse.json({ unlocked: true }));
  }

  // Auto-unlock probe from /enter page mount — tell client a password is required
  if (autoUnlock) {
    return NextResponse.json({
      requiresPassword: true,
      partnerOneName: config.partner_one_name,
      partnerTwoName: config.partner_two_name,
    });
  }

  // Verify submitted password
  if (!password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  const ok = config.site_password_hash
    ? await verifySitePassword(String(password), config.site_password_hash)
    : false;
  if (!ok) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  return setUnlockedCookie(NextResponse.json({ unlocked: true }));
}
