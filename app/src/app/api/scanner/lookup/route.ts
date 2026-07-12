import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { verifyScannerPin } from "@/lib/scannerAuth";
import { escapeLike } from "@/lib/pgrest";

export async function POST(req: NextRequest) {
  try {
    const { name, pin } = await req.json();

    if (!verifyScannerPin(pin)) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Please enter a name." }, { status: 400 });
    }

    // Search ALL guests regardless of RSVP status — the scanner can check in
    // anyone (attending, declined, or unconfirmed), matching the QR-scan flow.
    const pattern = `%${escapeLike(name.trim())}%`;
    const [{ data: adminGuests }, { data: rsvpGuests }] = await Promise.all([
      supabaseAdmin
        .from("guests")
        .select("id, name, attending, plus_one_name, group_name, checked_in, token")
        .ilike("name", pattern)
        .limit(8),
      supabaseAdmin
        .from("rsvp_submissions")
        .select("id, name, attending, plus_one_name, group_name, checked_in, token")
        .ilike("name", pattern)
        .limit(8),
    ]);

    const guests = [
      ...(adminGuests ?? []).map((g) => ({ ...g, source: "guests" as const })),
      ...(rsvpGuests ?? []).map((g) => ({ ...g, source: "rsvp_submissions" as const })),
    ].slice(0, 8);

    return NextResponse.json({ guests });
  } catch (err) {
    console.error("Lookup error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { guestId, source, pin } = await req.json();

    if (!verifyScannerPin(pin)) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
    }

    const table = source === "rsvp_submissions" ? "rsvp_submissions" : "guests";
    // Only the guests table carries the multi-checkin flag.
    const columns = table === "guests" ? "checked_in, name, plus_one_name, allow_multi_checkin" : "checked_in, name, plus_one_name";

    const { data: guest } = await supabaseAdmin
      .from(table)
      .select(columns)
      .eq("id", guestId)
      .single<{ checked_in: boolean; name: string; plus_one_name: string | null; allow_multi_checkin?: boolean }>();

    if (!guest) return NextResponse.json({ error: "Guest not found." }, { status: 404 });

    if (guest.checked_in && !guest.allow_multi_checkin) {
      return NextResponse.json({ warning: "already_checked_in", guest });
    }

    await supabaseAdmin
      .from(table)
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq("id", guestId);

    return NextResponse.json({ success: true, guest });
  } catch (err) {
    console.error("Manual checkin error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
