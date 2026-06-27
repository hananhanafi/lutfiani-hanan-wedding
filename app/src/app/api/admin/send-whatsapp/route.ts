import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { sendWhatsAppMessage, sendWhatsAppImage, sendWhatsAppImageBase64, formatPhoneForWA, getWhatsAppStatus } from "@/lib/whatsapp";
import { generatePassQrDataUrl, dataUrlToBase64, buildPassUrl } from "@/lib/qrcode";
import { canUseSession } from "@/lib/sessionOwnership";

/**
 * POST /api/admin/send-whatsapp
 * Body: { guestIds: string[], sessionId?: string } — send WA message to selected guests via service
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const guestIds: string[] = body.guestIds ?? (body.guestId ? [body.guestId] : []);
  const sessionId: string | undefined = body.sessionId;
  const imageUrl: string | undefined = body.imageUrl || process.env.WA_IMAGE_URL || undefined;

  if (guestIds.length === 0) {
    return NextResponse.json({ error: "guestIds required" }, { status: 400 });
  }
  if (guestIds.length > 50) {
    return NextResponse.json({ error: "Maksimal 50 penerima per batch" }, { status: 400 });
  }

  // Enforce session ownership for senders
  if (sessionId && !await canUseSession(sessionId, token.role as string, token.staffId as string | undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  // Fetch guests
  const { data: guests, error } = await supabaseAdmin
    .from("guests")
    .select("*")
    .in("id", guestIds);

  if (error || !guests) {
    return NextResponse.json({ error: "Failed to fetch guests" }, { status: 500 });
  }

  const coupleName = process.env.NEXT_PUBLIC_COUPLE_NAME ?? "Kami";
  const sentBy = (token.staffId as string | undefined) ?? null;

  // Resolve the sender session's phone + account name (non-fatal)
  let senderPhone: string | null = null;
  let senderName: string | null = null;
  try {
    const sessionStatus = await getWhatsAppStatus(sessionId);
    senderPhone = sessionStatus.phone ?? null;
    senderName = sessionStatus.name ?? null;
  } catch {
    // ignore — store sessionId as fallback
  }

  // Stored on each guest as "Phone Number (Name)", falling back gracefully:
  // "628xxx (Wedding Official)" → "628xxx" → sessionId → null
  const senderLabel = senderPhone
    ? (senderName ? `${senderPhone} (${senderName})` : senderPhone)
    : (sessionId ?? null);

  const results: { guestId: string; name: string; success: boolean; error?: string; messageId?: string; senderNumber?: string | null; sentBy?: string | null; dbError?: string | null }[] = [];

  for (const guest of guests) {
    if (!guest.phone_number?.trim()) {
      results.push({ guestId: guest.id, name: guest.name, success: false, error: "No phone number" });
      continue;
    }

    const phone = formatPhoneForWA(guest.phone_number);
    const invitationLink = `${appUrl}/?token=${guest.token}`;
    const passLink = `${appUrl}/pass?token=${guest.token}`;

    const heart = "\u{1F90D}";
    const pray = "\u{1F64F}";

    // Address the guest and, when present, their partner (plus-one)
    const recipient = guest.plus_one_name?.trim()
      ? `*${guest.name}* & *${guest.plus_one_name.trim()}*`
      : `*${guest.name}*`;

    const message =
      `Assalamualaikum Warahmatullahi Wabarakatuh ${heart}\n\n` +
      `Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk hadir dalam acara pernikahan kami.\n\n` +
      `Berikut link undangan kami, untuk info lengkap dari acara bisa kunjungi :\n${invitationLink}\n\n` +
      `Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir ${pray}\n\n` +
      `Wassalamualaikum Warahmatullahi Wabarakatuh\n\n` +
      `Hormat Kami,\n${coupleName}`;

    try {
      let messageId: string;

      if (imageUrl) {
        // Send image with the invitation text as caption
        const result = await sendWhatsAppImage({ to: phone, imageUrl, caption: message, sessionId });
        messageId = result.messageId;
      } else {
        // Text-only message
        const result = await sendWhatsAppMessage({ to: phone, message, sessionId });
        messageId = result.messageId;
      }

      // Send QR code as second message
      try {
        const passUrl = buildPassUrl(guest.token);
        const qrDataUrl = await generatePassQrDataUrl(passUrl);
        const qrBase64 = dataUrlToBase64(qrDataUrl);
        await new Promise((r) => setTimeout(r, 1000)); // small delay between messages
        await sendWhatsAppImageBase64({
          to: phone,
          imageBase64: qrBase64,
          caption: `🎫 *QR Masuk — ${guest.name}*\nTunjukkan QR code ini saat tiba di venue`,
          sessionId,
        });
      } catch {
        // QR send failure is non-fatal — invitation was already sent
      }

      const senderNumber = senderLabel;
      const { error: dbError } = await supabaseAdmin
        .from("guests")
        .update({
          whatsapp_status: "sent",
          whatsapp_message_id: messageId,
          whatsapp_sent_by: sentBy,
          whatsapp_sender_number: senderNumber,
        })
        .eq("id", guest.id);

      if (dbError) {
        console.error("[send-whatsapp] DB update failed:", dbError);
        // Retry without FK field in case sentBy causes a constraint error
        const { error: retryError } = await supabaseAdmin
          .from("guests")
          .update({
            whatsapp_status: "sent",
            whatsapp_message_id: messageId,
            whatsapp_sender_number: senderNumber,
          })
          .eq("id", guest.id);
        if (retryError) {
          console.error("[send-whatsapp] DB retry failed:", retryError);
        }
      }

      results.push({ guestId: guest.id, name: guest.name, success: true, messageId, senderNumber, sentBy, dbError: dbError?.message ?? null });
    } catch (err) {
      await supabaseAdmin
        .from("guests")
        .update({ whatsapp_status: "failed" })
        .eq("id", guest.id);

      results.push({
        guestId: guest.id,
        name: guest.name,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }

    // Delay between messages to avoid rate limiting
    if (guestIds.length > 1) {
      await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
    }
  }

  const sent = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return NextResponse.json({ sent, failed, results });
}
