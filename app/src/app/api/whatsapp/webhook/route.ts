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

    // ── Outgoing message status (delivery/read receipts + send errors like 463) ──
    if (data.type === "status") {
      const statusMap: Record<number, "failed" | "sent" | "delivered" | "read"> = {
        0: "failed", 2: "sent", 3: "delivered", 4: "read", 5: "read",
      };
      const mapped = typeof data.status === "number" ? statusMap[data.status] : undefined;
      const wamId: string | undefined = data.messageId;
      if (!wamId || !mapped) return NextResponse.json({ received: true });

      const { data: guest } = await supabaseAdmin
        .from("guests")
        .select("id, whatsapp_status")
        .eq("whatsapp_message_id", wamId)
        .maybeSingle();
      if (!guest) return NextResponse.json({ received: true });

      // Guard against downgrades (e.g. a late "delivered" after "read")
      const rank: Record<string, number> = { sent: 1, delivered: 2, read: 3 };
      const current = (guest.whatsapp_status as string | null) ?? null;
      const apply = mapped === "failed"
        ? current !== "delivered" && current !== "read" // don't overwrite a confirmed delivery
        : (rank[mapped] ?? 0) > (rank[current ?? ""] ?? 0);
      if (apply) {
        await supabaseAdmin.from("guests").update({ whatsapp_status: mapped }).eq("id", guest.id);
      }
      return NextResponse.json({ received: true, updated: apply });
    }

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
