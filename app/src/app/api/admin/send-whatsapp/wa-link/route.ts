import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { buildInvitationMessage, type WaMessageType } from "@/lib/waMessage";
import { formatPhoneForWA } from "@/lib/whatsapp";
import { buildPassUrl } from "@/lib/qrcode";

/**
 * POST /api/admin/send-whatsapp/wa-link
 * Body: { guestId, messageType }
 * Returns a wa.me click-to-chat URL with the invitation pre-filled, including a
 * note linking to the guest's QR pass (images can't be attached via wa.me).
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
    .select("name, plus_one_name, phone_number, token")
    .eq("id", guestId)
    .maybeSingle();
  if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  if (!guest.phone_number?.trim()) {
    return NextResponse.json({ error: "Tamu tidak punya nomor WhatsApp." }, { status: 400 });
  }

  const coupleName = process.env.NEXT_PUBLIC_COUPLE_NAME ?? "Kami";
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
    passLink: buildPassUrl(guest.token as string), // QR note (no image over wa.me)
    messageType,
    coupleName,
    signOffName,
  });

  const phone = formatPhoneForWA(guest.phone_number);
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  // `text` + `phone` let the client build a device-specific link (whatsapp:// on
  // mobile, web.whatsapp.com on desktop) that skips the wa.me landing page.
  return NextResponse.json({ url, text: message, guestName: guest.name, phone });
}
