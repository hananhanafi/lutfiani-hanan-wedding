import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

/**
 * GET — Meta webhook verification (called once when you register the webhook URL).
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST — Receives status updates and incoming messages from WhatsApp Cloud API.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  // WhatsApp sends a specific structure
  const entries = body?.entry;
  if (!Array.isArray(entries)) {
    return NextResponse.json({ status: "ok" });
  }

  for (const entry of entries) {
    const changes = entry?.changes;
    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      if (change?.field !== "messages") continue;

      const statuses = change?.value?.statuses;
      if (!Array.isArray(statuses)) continue;

      for (const status of statuses) {
        const messageId = status?.id;
        const statusValue = status?.status; // sent, delivered, read, failed

        if (!messageId || !statusValue) continue;

        // Map WhatsApp status to our schema values
        const validStatuses = ["sent", "delivered", "read", "failed"];
        if (!validStatuses.includes(statusValue)) continue;

        // Update guest record by message ID
        await supabaseAdmin
          .from("guests")
          .update({ whatsapp_status: statusValue })
          .eq("whatsapp_message_id", messageId);
      }
    }
  }

  // Always respond 200 to acknowledge receipt (Meta retries on non-200)
  return NextResponse.json({ status: "ok" });
}
