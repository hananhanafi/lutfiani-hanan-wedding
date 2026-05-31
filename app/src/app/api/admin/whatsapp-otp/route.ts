import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { canUseSession } from "@/lib/sessionOwnership";

/**
 * In-memory OTP store: sessionId -> { code, phone, expiresAt, verified, verifiedUntil }
 * - code/expiresAt: the one-time code sent to the user (short-lived)
 * - verified/verifiedUntil: once verified, stays valid for 1 hour bound to the session's phone
 */
const otpStore = new Map<string, {
  code: string;
  expiresAt: number;       // code expiry (10 min)
  phone: string;           // sender phone — verification is tied to this
  verified: boolean;
  verifiedUntil: number;   // verified-state expiry (1 hour)
}>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isVerified(sessionId: string, phone: string): boolean {
  const stored = otpStore.get(sessionId);
  return !!(stored?.verified && stored.phone === phone && Date.now() < stored.verifiedUntil);
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

  const serviceUrl = process.env.WA_SERVICE_URL;
  if (!serviceUrl) return NextResponse.json({ error: "WA_SERVICE_URL not configured" }, { status: 500 });

  // Fetch current phone of the session
  const apiKey = process.env.WA_SERVICE_API_KEY ?? "";
  const statusRes = await fetch(`${serviceUrl.replace(/\/$/, "")}/sessions/${sessionId}/status`, {
    headers: { "x-api-key": apiKey },
  });
  const statusData = await statusRes.json().catch(() => ({}));

  if (!statusRes.ok || statusData.status !== "connected" || !statusData.phone) {
    return NextResponse.json({ verified: false });
  }

  const phone: string = statusData.phone;
  const verified = isVerified(sessionId, phone);
  return NextResponse.json({ verified, phoneLast4: phone.slice(-4) });
}

/**
 * POST /api/admin/whatsapp-otp
 * Body: { sessionId: string }
 * If already verified within 1 h, returns { alreadyVerified: true, phoneLast4 }.
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

  const apiKey = process.env.WA_SERVICE_API_KEY ?? "";

  // Get the session's own phone number
  const statusRes = await fetch(`${serviceUrl.replace(/\/$/, "")}/sessions/${sessionId}/status`, {
    headers: { "x-api-key": apiKey },
  });
  const statusData = await statusRes.json().catch(() => ({}));

  if (!statusRes.ok || statusData.status !== "connected" || !statusData.phone) {
    return NextResponse.json({ error: "Session not connected or phone unknown" }, { status: 400 });
  }

  const phone: string = statusData.phone;

  // Return early if already verified for this phone
  if (isVerified(sessionId, phone)) {
    return NextResponse.json({ alreadyVerified: true, phoneLast4: phone.slice(-4) });
  }

  // Generate OTP (10-minute window)
  const code = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore.set(sessionId, { code, expiresAt, phone, verified: false, verifiedUntil: 0 });

  // Send OTP to the sender's own number
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
    otpStore.delete(sessionId);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }

  return NextResponse.json({ success: true, phoneLast4: phone.slice(-4) });
}

/**
 * PUT /api/admin/whatsapp-otp
 * Body: { sessionId: string, code: string }
 * Verifies the OTP. On success, marks session as verified for 1 hour.
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

  const stored = otpStore.get(sessionId);

  if (!stored) {
    return NextResponse.json({ error: "OTP not found. Request a new one." }, { status: 400 });
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(sessionId);
    return NextResponse.json({ error: "OTP expired. Request a new one." }, { status: 400 });
  }

  if (stored.code !== code.trim()) {
    return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
  }

  // Mark as verified for 1 hour, bound to the sender's phone
  otpStore.set(sessionId, {
    ...stored,
    code: "",
    verified: true,
    verifiedUntil: Date.now() + 60 * 60 * 1000,
  });

  return NextResponse.json({ verified: true });
}
