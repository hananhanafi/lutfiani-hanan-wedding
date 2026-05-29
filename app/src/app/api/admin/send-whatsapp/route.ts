import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { sendTemplateMessage, formatPhoneForWA } from "@/lib/whatsapp";

/**
 * POST /api/admin/send-whatsapp
 * Body: { guestIds: string[] } — send WhatsApp template to selected guests
 * Or:   { guestId: string }   — send to a single guest
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const guestIds: string[] = body.guestIds ?? (body.guestId ? [body.guestId] : []);

  if (guestIds.length === 0) {
    return NextResponse.json({ error: "guestIds required" }, { status: 400 });
  }

  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "id";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (!templateName) {
    return NextResponse.json({ error: "WHATSAPP_TEMPLATE_NAME not configured" }, { status: 500 });
  }

  // Fetch guests
  const { data: guests, error } = await supabaseAdmin
    .from("guests")
    .select("*")
    .in("id", guestIds);

  if (error || !guests) {
    return NextResponse.json({ error: "Failed to fetch guests" }, { status: 500 });
  }

  const results: { guestId: string; success: boolean; error?: string; messageId?: string }[] = [];

  for (const guest of guests) {
    if (!guest.phone_number?.trim()) {
      results.push({ guestId: guest.id, success: false, error: "No phone number" });
      continue;
    }

    const phone = formatPhoneForWA(guest.phone_number);
    const invitationLink = `${appUrl}/?token=${guest.token}`;
    const passLink = `${appUrl}/pass?token=${guest.token}`;

    try {
      const { messageId } = await sendTemplateMessage({
        to: phone,
        templateName,
        languageCode: templateLang,
        parameters: [guest.name, invitationLink],
        buttonUrls: [invitationLink, passLink],
      });

      // Update guest record with message ID and status
      await supabaseAdmin
        .from("guests")
        .update({
          whatsapp_status: "sent",
          whatsapp_message_id: messageId,
        })
        .eq("id", guest.id);

      results.push({ guestId: guest.id, success: true, messageId });
    } catch (err) {
      // Mark as failed
      await supabaseAdmin
        .from("guests")
        .update({ whatsapp_status: "failed" })
        .eq("id", guest.id);

      results.push({
        guestId: guest.id,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const sent = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return NextResponse.json({ sent, failed, results });
}
