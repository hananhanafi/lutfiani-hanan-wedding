import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { buildInvitationMessage, type WaMessageType } from "@/lib/waMessage";
import { sendWhatsAppMessage, sendWhatsAppImageBase64, formatPhoneForWA } from "@/lib/whatsapp";
import { generatePassQrDataUrl, dataUrlToBase64, buildPassUrl } from "@/lib/qrcode";
import { canUseSession } from "@/lib/sessionOwnership";

/**
 * POST /api/admin/test-invitation
 * Body: { phone, messageType, sessionId, guestId?, guestName?, plusOneName?, preview? }
 *
 * Sends the invitation to an arbitrary number (e.g. the admin's own) to test it.
 * When `guestId` is given it builds the EXACT message that guest would receive
 * (real name, plus-one, their token link) and also sends the guest's QR pass
 * image — identical to a real send. Without a guest it uses the sample fields.
 * With { preview: true } it just returns the text.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const preview: boolean = body.preview === true;
  const phoneRaw: string = (body.phone ?? "").toString().trim();
  const messageType: WaMessageType = body.messageType === "general" ? "general" : "muslim";
  const sessionId: string | undefined = body.sessionId;
  const guestId: string | undefined = body.guestId || undefined;

  const coupleName = process.env.NEXT_PUBLIC_COUPLE_NAME ?? "Kami";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  // Sign-off: staff name when sent from a staff account, else the couple name.
  let signOffName = coupleName;
  const staffId = token.staffId as string | undefined;
  if (staffId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(staffId)) {
    const { data: staff } = await supabaseAdmin.from("staff").select("name").eq("id", staffId).maybeSingle();
    if (staff?.name) signOffName = staff.name as string;
  }

  // Resolve the recipient content — a real guest (exact message) or sample fields.
  let guestName: string;
  let plusOneName: string | null;
  let invitationLink: string;
  let guestToken: string | null = null;

  if (guestId) {
    const { data: guest } = await supabaseAdmin
      .from("guests")
      .select("name, plus_one_name, token")
      .eq("id", guestId)
      .maybeSingle();
    if (!guest) return NextResponse.json({ error: "Tamu tidak ditemukan." }, { status: 404 });
    guestName = guest.name as string;
    plusOneName = (guest.plus_one_name as string | null) ?? null;
    guestToken = guest.token as string;
    invitationLink = `${appUrl}/?token=${guestToken}`;
  } else {
    guestName = (body.guestName ?? "").toString().trim() || "Tamu Undangan";
    plusOneName = (body.plusOneName ?? "").toString().trim() || null;
    invitationLink = `${appUrl}/`;
  }

  // Same as the real send: no passLink note in the text (the QR goes as an image).
  const message = buildInvitationMessage({
    guestName,
    plusOneName,
    invitationLink,
    messageType,
    coupleName,
    signOffName,
  });

  if (preview) return NextResponse.json({ message, guestName });

  if (!phoneRaw) return NextResponse.json({ error: "Nomor WhatsApp wajib diisi." }, { status: 400 });
  if (!sessionId) return NextResponse.json({ error: "Pilih sesi pengirim." }, { status: 400 });
  if (!(await canUseSession(sessionId, token.role as string, staffId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const phone = formatPhoneForWA(phoneRaw);
    const result = await sendWhatsAppMessage({ to: phone, message, sessionId });

    // Send the guest's QR pass image as a follow-up (matches the real send).
    if (guestToken) {
      try {
        const qrBase64 = dataUrlToBase64(await generatePassQrDataUrl(buildPassUrl(guestToken)));
        await new Promise((r) => setTimeout(r, 1000));
        await sendWhatsAppImageBase64({
          to: phone,
          imageBase64: qrBase64,
          caption: `🎫 *QR Masuk — ${guestName}*\nTunjukkan QR code ini saat tiba di venue`,
          sessionId,
        });
      } catch {
        // QR image is best-effort; the text was already sent
      }
    }

    return NextResponse.json({ success: true, phone, sentAt: result.sentAt ?? new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal mengirim." }, { status: 500 });
  }
}
