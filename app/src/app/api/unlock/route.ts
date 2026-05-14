import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import crypto from "crypto";

function computeUnlockToken(): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  return crypto.createHmac("sha256", secret).update("site_unlocked").digest("hex");
}

function hashPassword(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
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
    res.cookies.set("site_unlocked", computeUnlockToken(), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
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

  const inputHash = hashPassword(String(password));
  if (inputHash !== config.site_password_hash) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  return setUnlockedCookie(NextResponse.json({ unlocked: true }));
}
