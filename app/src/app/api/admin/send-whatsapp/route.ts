import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { sendWhatsAppMessage, sendWhatsAppImage, sendWhatsAppImageBase64, formatPhoneForWA, getWhatsAppStatus } from "@/lib/whatsapp";
import { generatePassQrDataUrl, dataUrlToBase64, buildPassUrl } from "@/lib/qrcode";
import { canUseSession } from "@/lib/sessionOwnership";
import { buildInvitationMessage } from "@/lib/waMessage";

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
  // Which invitation template to use: "muslim" (Islamic greeting) or "general"/national.
  const messageType: "muslim" | "general" = body.messageType === "general" ? "general" : "muslim";

  // Anti-ban limits (configurable via env)
  const MAX_BATCH = parseInt(process.env.WA_MAX_BATCH ?? "20", 10);   // per request
  const DAILY_LIMIT = parseInt(process.env.WA_DAILY_LIMIT ?? "80", 10); // rolling 24h per session

  if (guestIds.length === 0) {
    return NextResponse.json({ error: "guestIds required" }, { status: 400 });
  }
  if (guestIds.length > MAX_BATCH) {
    return NextResponse.json({ error: `Maksimal ${MAX_BATCH} penerima per batch` }, { status: 400 });
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

  // Sign-off name: when sent from a staff account, use that staff member's name;
  // otherwise (primary/env admin) fall back to the couple name.
  let signOffName = coupleName;
  const staffId = token.staffId as string | undefined;
  if (staffId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(staffId)) {
    const { data: staff } = await supabaseAdmin.from("staff").select("name").eq("id", staffId).maybeSingle();
    if (staff?.name) signOffName = staff.name as string;
  }

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

  // Rolling 24h daily cap per sender session (ban prevention). We count prior
  // sends recorded in rate_limits and only allow the remainder in this batch.
  const capBucket = sessionId ?? "global";
  const dayStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: sentToday } = await supabaseAdmin
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("ip", capBucket)
    .eq("action", "wa_send")
    .gte("created_at", dayStart);
  let allowance = Math.max(0, DAILY_LIMIT - (sentToday ?? 0));

  for (const guest of guests) {
    if (!guest.phone_number?.trim()) {
      results.push({ guestId: guest.id, name: guest.name, success: false, error: "No phone number" });
      continue;
    }

    if (allowance <= 0) {
      results.push({ guestId: guest.id, name: guest.name, success: false, error: `Batas harian ${DAILY_LIMIT} pesan tercapai. Coba lagi besok.` });
      continue;
    }
    // Count this attempt toward the daily cap (records it in rate_limits)
    allowance--;
    await supabaseAdmin.from("rate_limits").insert({ ip: capBucket, action: "wa_send" });

    const phone = formatPhoneForWA(guest.phone_number);
    const invitationLink = `${appUrl}/?token=${guest.token}`;

    const message = buildInvitationMessage({
      guestName: guest.name,
      plusOneName: guest.plus_one_name,
      invitationLink,
      messageType,
      coupleName,
      signOffName,
    });

    try {
      let messageId: string;
      let waSentAt: string | undefined;

      if (imageUrl) {
        // Send image with the invitation text as caption
        const result = await sendWhatsAppImage({ to: phone, imageUrl, caption: message, sessionId });
        messageId = result.messageId;
      } else {
        // Text-only message
        const result = await sendWhatsAppMessage({ to: phone, message, sessionId });
        messageId = result.messageId;
        waSentAt = result.sentAt;
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
      const sentAt = waSentAt ?? new Date().toISOString();
      const { error: dbError } = await supabaseAdmin
        .from("guests")
        .update({
          whatsapp_status: "sent",
          whatsapp_message_id: messageId,
          whatsapp_sent_by: sentBy,
          whatsapp_sender_number: senderNumber,
          whatsapp_sent_at: sentAt,
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
            whatsapp_sent_at: sentAt,
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
