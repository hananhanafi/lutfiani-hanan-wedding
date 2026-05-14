import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { token, pin, preview } = await req.json();

    // Validate scanner PIN
    if (pin !== process.env.SCANNER_PIN) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
    }

    if (!token) {
      return NextResponse.json({ error: "No token provided." }, { status: 400 });
    }

    // Look up guest by token
    const { data: guest, error } = await supabaseAdmin
      .from("guests")
      .select("id, name, attending, plus_one_name, checked_in, checked_in_at")
      .eq("token", token)
      .single();

    if (error || !guest) {
      return NextResponse.json({ error: "Invalid QR code. Guest not found." }, { status: 404 });
    }

    if (!guest.attending) {
      return NextResponse.json({ error: "This guest RSVPed as not attending." }, { status: 400 });
    }

    if (guest.checked_in) {
      return NextResponse.json({
        warning: "already_checked_in",
        guest: {
          name: guest.name,
          plus_one_name: guest.plus_one_name,
          checked_in_at: guest.checked_in_at,
        },
      });
    }

    // Preview mode: return guest info without checking in
    if (preview) {
      return NextResponse.json({
        preview: true,
        guest: {
          token,
          name: guest.name,
          plus_one_name: guest.plus_one_name,
        },
      });
    }

    // Mark as checked in
    await supabaseAdmin
      .from("guests")
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq("id", guest.id);

    return NextResponse.json({
      success: true,
      guest: {
        name: guest.name,
        plus_one_name: guest.plus_one_name,
      },
    });
  } catch (err) {
    console.error("Scanner error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
