import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { pgOrValue } from "@/lib/pgrest";

/**
 * POST /api/whatsapp/webhook
 * Receives incoming WhatsApp messages from the self-hosted Baileys service.
 * Body: { from, pushName, text, contentType, timestamp, messageId, hasMedia }
 */
export async function POST(req: NextRequest) {
  // Verify the request comes from our service (optional: check shared secret)
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = process.env.WA_SERVICE_API_KEY;
  if (expectedKey && apiKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { from, pushName, text, messageId, timestamp } = data;

    if (!from) {
      return NextResponse.json({ error: "Missing 'from'" }, { status: 400 });
    }

    // Try to match the sender to an existing guest by phone number
    const phone = from.startsWith("62") ? from : `62${from}`;
    const { data: guest } = await supabaseAdmin
      .from("guests")
      .select("id, name")
      .or(`phone_number.eq.${pgOrValue(phone)},phone_number.eq.${pgOrValue("0" + phone.slice(2))},phone_number.eq.${pgOrValue("+" + phone)}`)
      .maybeSingle();

    // Log the incoming message (you could store these in a messages table)
    console.log(
      `[WA Incoming] From: ${from} (${pushName ?? "unknown"})${guest ? ` [Guest: ${guest.name}]` : ""} — "${text?.slice(0, 100)}"`
    );

    // If the guest replied, update their whatsapp_status to "read"
    if (guest) {
      await supabaseAdmin
        .from("guests")
        .update({ whatsapp_status: "read" })
        .eq("id", guest.id);
    }

    return NextResponse.json({ received: true, guestId: guest?.id ?? null });
  } catch (err) {
    console.error("[WA Webhook] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
