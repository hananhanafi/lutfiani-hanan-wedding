import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";

/**
 * POST /api/admin/groups/reorder — persist a new group order (admin only).
 * Body: { ids: string[] } — the full list of group ids in the desired order.
 * Each group's `position` is set to its index in the array.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (token.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const ids: unknown = body.ids;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "ids must be an array of group ids." }, { status: 400 });
  }

  const results = await Promise.all(
    (ids as string[]).map((id, index) =>
      supabaseAdmin.from("guest_groups").update({ position: index }).eq("id", id)
    )
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error("Reorder groups error:", failed.error);
    return NextResponse.json({ error: "Gagal menyimpan urutan." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
