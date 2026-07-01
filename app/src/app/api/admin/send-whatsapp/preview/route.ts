import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { buildInvitationMessage, type WaMessageType } from "@/lib/waMessage";

/**
 * POST /api/admin/send-whatsapp/preview
 * Body: { guestId, messageType } — returns the exact invitation text that would
 * be sent to that guest (used for the "Pratinjau" before sending).
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const guestId: string | undefined = body.guestId;
  const messageType: WaMessageType = body.messageType === "general" ? "general" : "muslim";
  if (!guestId) return NextResponse.json({ error: "guestId required" }, { status: 400 });

  const { data: guest } = await supabaseAdmin
    .from("guests")
    .select("name, plus_one_name, token")
    .eq("id", guestId)
    .maybeSingle();
  if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });

  const coupleName = process.env.NEXT_PUBLIC_COUPLE_NAME ?? "Kami";

  // Same sign-off resolution as the send route
  let signOffName = coupleName;
  const staffId = token.staffId as string | undefined;
  if (staffId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(staffId)) {
    const { data: staff } = await supabaseAdmin.from("staff").select("name").eq("id", staffId).maybeSingle();
    if (staff?.name) signOffName = staff.name as string;
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const message = buildInvitationMessage({
    guestName: guest.name as string,
    plusOneName: guest.plus_one_name as string | null,
    invitationLink: `${appUrl}/?token=${guest.token}`,
    messageType,
    coupleName,
    signOffName,
  });

  return NextResponse.json({ message, guestName: guest.name });
}
