import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { canModifyGuest } from "@/lib/guestAccess";

/**
 * POST /api/admin/send-whatsapp/mark
 * Marks a guest's whatsapp_status as "sent" after the admin manually sent via wa.me
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { guestId } = await req.json();
  if (!guestId) return NextResponse.json({ error: "guestId required" }, { status: 400 });

  if (!(await canModifyGuest(guestId, token.role as string | undefined, token.staffId as string | undefined))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("guests")
    .update({ whatsapp_status: "sent", whatsapp_sent_at: new Date().toISOString() })
    .eq("id", guestId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
