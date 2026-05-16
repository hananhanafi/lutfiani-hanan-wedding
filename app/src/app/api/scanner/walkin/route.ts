import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { pin, name, plus_one_name, group_name, side } = await req.json();

    if (pin !== process.env.SCANNER_PIN) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: "Guest name is required." }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: "Name must be 100 characters or fewer." }, { status: 400 });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("guests")
      .insert({
        name: name.trim(),
        plus_one_name: plus_one_name?.trim() || null,
        group_name: group_name?.trim() || null,
        side: side?.trim() || null,
        attending: true,
        token: uuidv4(),
        checked_in: true,
        checked_in_at: now,
        submitted_at: now,
      })
      .select("id, name, plus_one_name")
      .single();

    if (error) {
      console.error("Walk-in add error:", error);
      return NextResponse.json({ error: "Failed to add guest." }, { status: 500 });
    }

    return NextResponse.json({ success: true, guest: data }, { status: 201 });
  } catch (err) {
    console.error("Walk-in error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
