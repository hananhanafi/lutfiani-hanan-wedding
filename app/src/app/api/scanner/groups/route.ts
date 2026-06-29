import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { verifyScannerPin } from "@/lib/scannerAuth";

/**
 * POST /api/scanner/groups — return the guest-group master list for the walk-in form.
 * PIN-protected (the scanner has no admin session).
 */
export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (!verifyScannerPin(pin)) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("guest_groups")
      .select("id, name")
      .order("position", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Scanner groups error:", error);
      return NextResponse.json({ error: "Failed to load groups." }, { status: 500 });
    }

    return NextResponse.json({ groups: data ?? [] });
  } catch (err) {
    console.error("Scanner groups error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
