import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getWhatsAppStatus } from "@/lib/whatsapp";

/**
 * GET /api/admin/whatsapp-status
 * Returns the self-hosted WhatsApp service connection status.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const status = await getWhatsAppStatus();
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to check status" },
      { status: 500 }
    );
  }
}
