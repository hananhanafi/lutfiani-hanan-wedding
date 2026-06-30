import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { generatePassQrDataUrl, buildPassUrl } from "@/lib/qrcode";

/**
 * GET /api/admin/groups/[id]/qr — group invitation QR (data URL) + pass link.
 * Any authenticated staff.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data: group, error } = await supabaseAdmin
    .from("guest_groups")
    .select("name, token")
    .eq("id", id)
    .maybeSingle();

  if (error || !group?.token) {
    return NextResponse.json({ error: "Grup tidak ditemukan." }, { status: 404 });
  }

  const url = buildPassUrl(group.token as string);
  const qrDataUrl = await generatePassQrDataUrl(url);
  return NextResponse.json({ name: group.name, url, qrDataUrl });
}
