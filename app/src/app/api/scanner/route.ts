import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { verifyScannerPin } from "@/lib/scannerAuth";

export async function POST(req: NextRequest) {
  try {
    const { token, pin, preview } = await req.json();

    // Validate scanner PIN
    if (!verifyScannerPin(pin)) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
    }

    if (!token) {
      return NextResponse.json({ error: "No token provided." }, { status: 400 });
    }

    // Look up token in guests first, then rsvp_submissions
    let guest: { id: string; name: string; attending: boolean | null; plus_one_name: string | null; checked_in: boolean; checked_in_at: string | null; rsvp_submission_id?: string | null } | null = null;
    let source: "guests" | "rsvp_submissions" = "guests";

    const { data: adminGuest } = await supabaseAdmin
      .from("guests")
      .select("id, name, attending, plus_one_name, checked_in, checked_in_at, rsvp_submission_id")
      .eq("token", token)
      .maybeSingle();

    if (adminGuest) {
      guest = adminGuest;
      source = "guests";
    } else {
      const { data: rsvpGuest } = await supabaseAdmin
        .from("rsvp_submissions")
        .select("id, name, attending, plus_one_name, checked_in, checked_in_at")
        .eq("token", token)
        .maybeSingle();
      if (rsvpGuest) {
        guest = rsvpGuest;
        source = "rsvp_submissions";
      }
    }

    if (!guest) {
      return NextResponse.json({ error: "Invalid QR code. Guest not found." }, { status: 404 });
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
    const checkedInAt = new Date().toISOString();
    await supabaseAdmin
      .from(source)
      .update({ checked_in: true, checked_in_at: checkedInAt })
      .eq("id", guest.id);

    // Sync check-in to the other table
    if (source === "guests" && guest.rsvp_submission_id) {
      await supabaseAdmin
        .from("rsvp_submissions")
        .update({ checked_in: true, checked_in_at: checkedInAt })
        .eq("id", guest.rsvp_submission_id);
    } else if (source === "rsvp_submissions") {
      await supabaseAdmin
        .from("guests")
        .update({ checked_in: true, checked_in_at: checkedInAt })
        .eq("rsvp_submission_id", guest.id);
    }

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
