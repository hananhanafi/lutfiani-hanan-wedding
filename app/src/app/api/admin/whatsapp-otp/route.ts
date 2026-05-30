import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * In-memory OTP store: sessionId -> { code, expiresAt }
 * In production, use Redis or similar. For this app, in-memory is fine.
 */
const otpStore = new Map<string, { code: string; expiresAt: number }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/admin/whatsapp-otp
 * Body: { sessionId: string }
 * Sends a 6-digit OTP to the sender's own WhatsApp number.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const sessionId: string = body.sessionId;

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
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

  const phone = statusData.phone; // already in format like "6281234567890"

  // Generate OTP
  const code = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(sessionId, { code, expiresAt });

  // Send OTP to the sender's own number
  const sendRes = await fetch(`${serviceUrl.replace(/\/$/, "")}/sessions/${sessionId}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      to: phone,
      message: `🔐 Kode OTP Anda: *${code}*\n\nKode ini berlaku 5 menit.\nJangan bagikan kode ini kepada siapapun.`,
    }),
  });

  const sendData = await sendRes.json().catch(() => ({}));

  if (!sendRes.ok || !sendData.success) {
    otpStore.delete(sessionId);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }

  return NextResponse.json({ success: true, phone: phone.slice(-4) }); // only return last 4 digits
}

/**
 * PUT /api/admin/whatsapp-otp
 * Body: { sessionId: string, code: string }
 * Verifies the OTP.
 */
export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { sessionId, code } = body;

  if (!sessionId || !code) {
    return NextResponse.json({ error: "sessionId and code required" }, { status: 400 });
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

  // OTP valid — remove it (single use)
  otpStore.delete(sessionId);

  return NextResponse.json({ verified: true });
}
