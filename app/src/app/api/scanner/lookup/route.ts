import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { verifyScannerPin } from "@/lib/scannerAuth";

export async function POST(req: NextRequest) {
  try {
    const { name, pin } = await req.json();

    if (!verifyScannerPin(pin)) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Please enter a name." }, { status: 400 });
    }

    const [{ data: adminGuests }, { data: rsvpGuests }] = await Promise.all([
      supabaseAdmin
        .from("guests")
        .select("id, name, attending, plus_one_name, checked_in, token")
        .ilike("name", `%${name.trim()}%`)
        .eq("attending", true)
        .limit(5),
      supabaseAdmin
        .from("rsvp_submissions")
        .select("id, name, attending, plus_one_name, checked_in, token")
        .ilike("name", `%${name.trim()}%`)
        .eq("attending", true)
        .limit(5),
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

    const { data: guest } = await supabaseAdmin
      .from(table)
      .select("checked_in, name, plus_one_name")
      .eq("id", guestId)
      .single();

    if (!guest) return NextResponse.json({ error: "Guest not found." }, { status: 404 });

    if (guest.checked_in) {
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
