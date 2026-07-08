import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { buildInvitationMessage, type WaMessageType } from "@/lib/waMessage";
import { sendWhatsAppMessage, formatPhoneForWA } from "@/lib/whatsapp";
import { canUseSession } from "@/lib/sessionOwnership";

/**
 * POST /api/admin/test-invitation
 * Body: { phone, messageType, guestName?, plusOneName?, sessionId, preview? }
 * Sends the invitation message to an arbitrary number (e.g. the admin's own),
 * for testing how it looks. With { preview: true } it just returns the text.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const preview: boolean = body.preview === true;
  const phoneRaw: string = (body.phone ?? "").toString().trim();
  const messageType: WaMessageType = body.messageType === "general" ? "general" : "muslim";
  const guestName: string = (body.guestName ?? "").toString().trim() || "Tamu Undangan";
  const plusOneName: string | null = (body.plusOneName ?? "").toString().trim() || null;
  const sessionId: string | undefined = body.sessionId;

  const coupleName = process.env.NEXT_PUBLIC_COUPLE_NAME ?? "Kami";

  // Sign-off: staff name when sent from a staff account, else the couple name.
  let signOffName = coupleName;
  const staffId = token.staffId as string | undefined;
  if (staffId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(staffId)) {
    const { data: staff } = await supabaseAdmin.from("staff").select("name").eq("id", staffId).maybeSingle();
    if (staff?.name) signOffName = staff.name as string;
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const message = buildInvitationMessage({
    guestName,
    plusOneName,
    invitationLink: `${appUrl}/`,
    messageType,
    coupleName,
    signOffName,
  });

  if (preview) return NextResponse.json({ message });

  if (!phoneRaw) return NextResponse.json({ error: "Nomor WhatsApp wajib diisi." }, { status: 400 });
  if (!sessionId) return NextResponse.json({ error: "Pilih sesi pengirim." }, { status: 400 });
  if (!(await canUseSession(sessionId, token.role as string, staffId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const phone = formatPhoneForWA(phoneRaw);
    const result = await sendWhatsAppMessage({ to: phone, message, sessionId });
    return NextResponse.json({ success: true, phone, sentAt: result.sentAt ?? new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal mengirim." }, { status: 500 });
  }
}
