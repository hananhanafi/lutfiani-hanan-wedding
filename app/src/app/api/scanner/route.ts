import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { verifyScannerPin } from "@/lib/scannerAuth";

export async function POST(req: NextRequest) {
  try {
    const { token, pin, preview, pax } = await req.json();

    // Validate scanner PIN
    if (!verifyScannerPin(pin)) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
    }

    if (!token) {
      return NextResponse.json({ error: "No token provided." }, { status: 400 });
    }

    // Look up token in guests first, then rsvp_submissions
    let guest: { id: string; name: string; attending: boolean | null; plus_one_name: string | null; checked_in: boolean; checked_in_at: string | null; rsvp_submission_id?: string | null; allow_multi_checkin?: boolean } | null = null;
    let source: "guests" | "rsvp_submissions" = "guests";

    const { data: adminGuest } = await supabaseAdmin
      .from("guests")
      .select("id, name, attending, plus_one_name, checked_in, checked_in_at, rsvp_submission_id, allow_multi_checkin")
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
      // Not an individual token — maybe a GROUP token (group invitation / pax check-in)
      const { data: group } = await supabaseAdmin
        .from("guest_groups")
        .select("id, name, token, expected_pax, arrived_pax, first_arrived_at")
        .eq("token", token)
        .maybeSingle();

      if (!group) {
        return NextResponse.json({ error: "Invalid QR code. Guest not found." }, { status: 404 });
      }

      const { data: members } = await supabaseAdmin
        .from("guests")
        .select("name, plus_one_name")
        .eq("group_id", group.id);

      const autoPax = (members ?? []).reduce((sum, m) => sum + 1 + (m.plus_one_name?.trim() ? 1 : 0), 0);
      const expected = group.expected_pax ?? autoPax;

      if (preview) {
        return NextResponse.json({
          preview: true,
          type: "group",
          group: {
            token,
            name: group.name,
            expected_pax: expected,
            arrived_pax: group.arrived_pax ?? 0,
            members: (members ?? []).map((m) => ({ name: m.name, plus_one_name: m.plus_one_name })),
          },
        });
      }

      // Confirm: add pax (incremental, no cap), log the scan, mark member guests checked in
      const addPax = Math.max(1, Math.floor(Number(pax)) || 1);
      const now = new Date().toISOString();
      const newArrived = (group.arrived_pax ?? 0) + addPax;

      await supabaseAdmin
        .from("guest_groups")
        .update({ arrived_pax: newArrived, last_arrived_at: now, first_arrived_at: group.first_arrived_at ?? now })
        .eq("id", group.id);

      await supabaseAdmin.from("group_checkin_events").insert({ group_id: group.id, pax: addPax });

      await supabaseAdmin
        .from("guests")
        .update({ checked_in: true, checked_in_at: now })
        .eq("group_id", group.id)
        .eq("checked_in", false);

      return NextResponse.json({
        success: true,
        type: "group",
        group: { name: group.name, arrived_pax: newArrived, expected_pax: expected },
      });
    }

    // Block re-check-in unless this guest's QR is allowed to be scanned repeatedly
    if (guest.checked_in && !guest.allow_multi_checkin) {
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
