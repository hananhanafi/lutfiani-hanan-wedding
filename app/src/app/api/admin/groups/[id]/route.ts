import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";

const SIDES = ["bride", "groom"];

function normalizeSide(side: unknown): string | null {
  const s = typeof side === "string" ? side.trim().toLowerCase() : "";
  return SIDES.includes(s) ? s : null;
}

async function requireAuth(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

/**
 * GET /api/admin/groups/[id] — list the guests in this group (any staff).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireAuth(req);
  if (err) return err;

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("guests")
    .select("id, name, phone_number, plus_one_name, attending, checked_in, is_vip")
    .eq("group_id", id)
    .order("name", { ascending: true });

  if (error) {
    console.error("Fetch group guests error:", error);
    return NextResponse.json({ error: "Gagal memuat tamu." }, { status: 500 });
  }

  return NextResponse.json({ guests: data ?? [] });
}

/**
 * PATCH /api/admin/groups/[id] — rename / edit a group (any staff).
 * A rename propagates to the denormalized guests.group_name mirror.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireAuth(req);
  if (err) return err;

  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  let newName: string | null = null;

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Nama grup wajib diisi." }, { status: 400 });
    if (name.length > 100) return NextResponse.json({ error: "Nama grup maksimal 100 karakter." }, { status: 400 });

    // Case-insensitive duplicate check, excluding self
    const { data: conflict } = await supabaseAdmin
      .from("guest_groups")
      .select("id")
      .ilike("name", name)
      .neq("id", id)
      .maybeSingle();
    if (conflict) return NextResponse.json({ error: "Grup dengan nama ini sudah ada." }, { status: 409 });

    updates.name = name;
    newName = name;
  }
  if (body.side !== undefined) updates.side = normalizeSide(body.side);
  if (body.notes !== undefined) updates.notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
  if (body.expected_pax !== undefined) {
    // null / "" → reset to auto; otherwise a non-negative integer
    const n = body.expected_pax === null || body.expected_pax === "" ? null : Number(body.expected_pax);
    updates.expected_pax = n === null ? null : Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  }

  const { data, error } = await supabaseAdmin
    .from("guest_groups")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    console.error("Update group error:", error);
    return NextResponse.json({ error: "Gagal memperbarui grup." }, { status: 500 });
  }

  // Propagate the rename to the denormalized mirror on guests
  if (newName) {
    await supabaseAdmin.from("guests").update({ group_name: newName }).eq("group_id", id);
  }

  // Re-count for the response
  const { count } = await supabaseAdmin
    .from("guests")
    .select("id", { count: "exact", head: true })
    .eq("group_id", id);

  return NextResponse.json({ group: { ...data, guest_count: count ?? 0 } });
}

/**
 * DELETE /api/admin/groups/[id] — delete a group (any staff).
 * Guests in this group are unassigned: group_id is nulled by the FK (ON DELETE
 * SET NULL) and we also clear the denormalized group_name so the list stays consistent.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireAuth(req);
  if (err) return err;

  const { id } = await params;

  // Clear the denormalized mirror before deleting (after delete, group_id becomes null)
  await supabaseAdmin.from("guests").update({ group_name: null }).eq("group_id", id);

  const { error } = await supabaseAdmin.from("guest_groups").delete().eq("id", id);
  if (error) {
    console.error("Delete group error:", error);
    return NextResponse.json({ error: "Gagal menghapus grup." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
