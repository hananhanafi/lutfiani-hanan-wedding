import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";

async function requireAuth(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

/** GET /api/admin/groups/[id]/checkins — group pax check-in history (newest first). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireAuth(req);
  if (err) return err;

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("group_checkin_events")
    .select("id, pax, created_at")
    .eq("group_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Gagal memuat riwayat." }, { status: 500 });
  return NextResponse.json({ events: data ?? [] });
}

/**
 * DELETE /api/admin/groups/[id]/checkins?eventId=xxx — undo one scan:
 * remove the event and subtract its pax from the group's arrived_pax.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireAuth(req);
  if (err) return err;

  const { id } = await params;
  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const { data: event } = await supabaseAdmin
    .from("group_checkin_events")
    .select("id, pax, group_id")
    .eq("id", eventId)
    .eq("group_id", id)
    .maybeSingle();
  if (!event) return NextResponse.json({ error: "Riwayat tidak ditemukan." }, { status: 404 });

  const { data: group } = await supabaseAdmin
    .from("guest_groups")
    .select("arrived_pax")
    .eq("id", id)
    .maybeSingle();

  const newArrived = Math.max(0, (group?.arrived_pax ?? 0) - (event.pax as number));

  await supabaseAdmin.from("group_checkin_events").delete().eq("id", eventId);
  await supabaseAdmin.from("guest_groups").update({ arrived_pax: newArrived }).eq("id", id);

  return NextResponse.json({ success: true, arrived_pax: newArrived });
}
