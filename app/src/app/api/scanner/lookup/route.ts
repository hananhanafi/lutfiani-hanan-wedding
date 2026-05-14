import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { name, pin } = await req.json();

    if (pin !== process.env.SCANNER_PIN) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Please enter a name." }, { status: 400 });
    }

    const { data: guests } = await supabaseAdmin
      .from("guests")
      .select("id, name, attending, plus_one_name, checked_in, token")
      .ilike("name", `%${name.trim()}%`)
      .eq("attending", true)
      .limit(5);

    return NextResponse.json({ guests: guests ?? [] });
  } catch (err) {
    console.error("Lookup error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { guestId, pin } = await req.json();

    if (pin !== process.env.SCANNER_PIN) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
    }

    const { data: guest } = await supabaseAdmin
      .from("guests")
      .select("checked_in, name, plus_one_name")
      .eq("id", guestId)
      .single();

    if (!guest) return NextResponse.json({ error: "Guest not found." }, { status: 404 });

    if (guest.checked_in) {
      return NextResponse.json({ warning: "already_checked_in", guest });
    }

    await supabaseAdmin
      .from("guests")
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq("id", guestId);

    return NextResponse.json({ success: true, guest });
  } catch (err) {
    console.error("Manual checkin error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
