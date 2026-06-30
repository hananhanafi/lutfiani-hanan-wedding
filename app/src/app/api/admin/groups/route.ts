import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";

const SIDES = ["bride", "groom"];

function normalizeSide(side: unknown): string | null {
  const s = typeof side === "string" ? side.trim().toLowerCase() : "";
  return SIDES.includes(s) ? s : null;
}

/**
 * GET /api/admin/groups — list groups with guest counts.
 * Readable by any authenticated staff (the Kirim/guest forms need it for the dropdown).
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: groups, error }, { data: guestRows }] = await Promise.all([
    supabaseAdmin
      .from("guest_groups")
      .select("*")
      .order("position", { ascending: true })
      .order("name", { ascending: true }),
    supabaseAdmin.from("guests").select("group_id, plus_one_name"),
  ]);

  if (error) return NextResponse.json({ error: "Failed to fetch groups." }, { status: 500 });

  // Per group: member count and auto pax (each member = 1, +1 for a plus-one)
  const counts = new Map<string, number>();
  const autoPax = new Map<string, number>();
  for (const row of guestRows ?? []) {
    if (!row.group_id) continue;
    counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1);
    const add = 1 + (row.plus_one_name?.trim() ? 1 : 0);
    autoPax.set(row.group_id, (autoPax.get(row.group_id) ?? 0) + add);
  }

  const withCounts = (groups ?? []).map((g) => {
    const auto = autoPax.get(g.id) ?? 0;
    const effective = g.expected_pax ?? auto;
    return { ...g, guest_count: counts.get(g.id) ?? 0, expected_pax_auto: auto, expected_pax_effective: effective };
  });
  return NextResponse.json({ groups: withCounts });
}

/**
 * POST /api/admin/groups — create a group (any staff).
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Nama grup wajib diisi." }, { status: 400 });
  if (name.length > 100) return NextResponse.json({ error: "Nama grup maksimal 100 karakter." }, { status: 400 });

  // Case-insensitive duplicate check
  const { data: existing } = await supabaseAdmin
    .from("guest_groups")
    .select("id")
    .ilike("name", name)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: "Grup dengan nama ini sudah ada." }, { status: 409 });

  // Append new groups at the end of the manual order
  const { data: last } = await supabaseAdmin
    .from("guest_groups")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = (last?.position ?? -1) + 1;

  const { data, error } = await supabaseAdmin
    .from("guest_groups")
    .insert({
      name,
      side: normalizeSide(body.side),
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
      position: nextPosition,
    })
    .select()
    .single();

  if (error) {
    console.error("Create group error:", error);
    return NextResponse.json({ error: "Gagal membuat grup." }, { status: 500 });
  }

  return NextResponse.json({ group: { ...data, guest_count: 0 } }, { status: 201 });
}
