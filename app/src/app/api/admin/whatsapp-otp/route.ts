import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { canUseSession } from "@/lib/sessionOwnership";
import { supabaseAdmin } from "@/utils/supabase/admin";

// How long a verified session stays authorized to send (re-OTP after this).
const VERIFIED_WINDOW_MS = 24 * 60 * 60 * 1000; // 1 day
const CODE_WINDOW_MS = 10 * 60 * 1000;           // 10 min

/**
 * OTP state is persisted in Supabase (table `wa_otp_state`) rather than in
 * memory, so the 1-day verified window survives serverless cold starts and
 * instance switches. Verification is bound to (sessionId, sender phone).
 *   - code / code_expires_at: the short-lived one-time code
 *   - verified_until: once verified, sends are allowed until this time
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function isVerified(sessionId: string, phone: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("wa_otp_state")
    .select("phone, verified_until")
    .eq("session_id", sessionId)
    .maybeSingle();
  return !!(
    data &&
    data.phone === phone &&
    data.verified_until &&
    Date.now() < new Date(data.verified_until).getTime()
  );
}

/** Fetch the session's own connected phone from the WA microservice. */
async function getSessionPhone(sessionId: string): Promise<string | null> {
  const serviceUrl = process.env.WA_SERVICE_URL;
  if (!serviceUrl) return null;
  const apiKey = process.env.WA_SERVICE_API_KEY ?? "";
  try {
    const res = await fetch(`${serviceUrl.replace(/\/$/, "")}/sessions/${sessionId}/status`, {
      headers: { "x-api-key": apiKey },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status !== "connected" || !data.phone) return null;
    return data.phone as string;
  } catch {
    return null;
  }
}

/**
 * GET /api/admin/whatsapp-otp?sessionId=xxx
 * Returns { verified: bool, phoneLast4: string } so the UI can skip OTP when already valid.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  if (!await canUseSession(sessionId, token.role as string, token.staffId as string | undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.WA_SERVICE_URL) {
    return NextResponse.json({ error: "WA_SERVICE_URL not configured" }, { status: 500 });
  }

  const phone = await getSessionPhone(sessionId);
  if (!phone) return NextResponse.json({ verified: false });

  const verified = await isVerified(sessionId, phone);
  return NextResponse.json({ verified, phoneLast4: phone.slice(-4) });
}

/**
 * POST /api/admin/whatsapp-otp
 * Body: { sessionId: string }
 * If already verified within the verification window, returns { alreadyVerified: true, phoneLast4 }.
 * Otherwise sends a new OTP (valid 10 min) to the sender's own number.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const sessionId: string = body.sessionId;

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  if (!await canUseSession(sessionId, token.role as string, token.staffId as string | undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceUrl = process.env.WA_SERVICE_URL;
  if (!serviceUrl) {
    return NextResponse.json({ error: "WA_SERVICE_URL not configured" }, { status: 500 });
  }

  const phone = await getSessionPhone(sessionId);
  if (!phone) {
    return NextResponse.json({ error: "Session not connected or phone unknown" }, { status: 400 });
  }

  // Return early if already verified for this phone
  if (await isVerified(sessionId, phone)) {
    return NextResponse.json({ alreadyVerified: true, phoneLast4: phone.slice(-4) });
  }

  // Generate OTP (10-minute window) and persist it
  const code = generateOTP();
  const codeExpiresAt = new Date(Date.now() + CODE_WINDOW_MS).toISOString();
  await supabaseAdmin.from("wa_otp_state").upsert({
    session_id: sessionId,
    phone,
    code,
    code_expires_at: codeExpiresAt,
    verified_until: null,
    updated_at: new Date().toISOString(),
  });

  // Send OTP to the sender's own number
  const apiKey = process.env.WA_SERVICE_API_KEY ?? "";
  const sendRes = await fetch(`${serviceUrl.replace(/\/$/, "")}/sessions/${sessionId}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({
      to: phone,
      message: `🔐 Kode OTP Anda: *${code}*\n\nKode ini berlaku 10 menit.\nJangan bagikan kode ini kepada siapapun.`,
    }),
  });

  const sendData = await sendRes.json().catch(() => ({}));

  if (!sendRes.ok || !sendData.success) {
    await supabaseAdmin.from("wa_otp_state").delete().eq("session_id", sessionId);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }

  return NextResponse.json({ success: true, phoneLast4: phone.slice(-4) });
}

/**
 * PUT /api/admin/whatsapp-otp
 * Body: { sessionId: string, code: string }
 * Verifies the OTP. On success, marks session as verified for 1 day.
 */
export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { sessionId, code } = body;

  if (!sessionId || !code) {
    return NextResponse.json({ error: "sessionId and code required" }, { status: 400 });
  }

  if (!await canUseSession(sessionId, token.role as string, token.staffId as string | undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: stored } = await supabaseAdmin
    .from("wa_otp_state")
    .select("code, code_expires_at, phone")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!stored || !stored.code) {
    return NextResponse.json({ error: "OTP not found. Request a new one." }, { status: 400 });
  }

  if (!stored.code_expires_at || Date.now() > new Date(stored.code_expires_at).getTime()) {
    await supabaseAdmin.from("wa_otp_state").delete().eq("session_id", sessionId);
    return NextResponse.json({ error: "OTP expired. Request a new one." }, { status: 400 });
  }

  if (stored.code !== String(code).trim()) {
    return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
  }

  // Mark as verified for the verification window, bound to the sender's phone
  await supabaseAdmin
    .from("wa_otp_state")
    .update({
      code: null,
      code_expires_at: null,
      verified_until: new Date(Date.now() + VERIFIED_WINDOW_MS).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId);

  return NextResponse.json({ verified: true });
}
