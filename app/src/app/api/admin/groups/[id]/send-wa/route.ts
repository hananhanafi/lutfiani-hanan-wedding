import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { canUseSession } from "@/lib/sessionOwnership";
import { sendWhatsAppMessage, sendWhatsAppImageBase64 } from "@/lib/whatsapp";
import { generatePassQrDataUrl, dataUrlToBase64, buildPassUrl } from "@/lib/qrcode";

/**
 * POST /api/admin/groups/[id]/send-wa
 * Body: { sessionId, waGroupJid, waGroupName? }
 * Sends the group's invitation message + group QR into a WhatsApp group chat,
 * and remembers the linked chat on the group.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const sessionId: string | undefined = body.sessionId;
  const waGroupJid: string | undefined = body.waGroupJid;
  const waGroupName: string | null = typeof body.waGroupName === "string" ? body.waGroupName : null;

  if (!sessionId || !waGroupJid) {
    return NextResponse.json({ error: "sessionId dan waGroupJid wajib." }, { status: 400 });
  }
  if (!waGroupJid.endsWith("@g.us")) {
    return NextResponse.json({ error: "Target bukan grup WhatsApp yang valid." }, { status: 400 });
  }
  if (!(await canUseSession(sessionId, token.role as string, token.staffId as string | undefined))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Load the group + members (for expected pax)
  const { data: group } = await supabaseAdmin
    .from("guest_groups")
    .select("id, name, token, expected_pax")
    .eq("id", id)
    .maybeSingle();
  if (!group?.token) return NextResponse.json({ error: "Grup tidak ditemukan." }, { status: 404 });

  const { data: members } = await supabaseAdmin.from("guests").select("plus_one_name").eq("group_id", id);
  const autoPax = (members ?? []).reduce((s, m) => s + 1 + (m.plus_one_name?.trim() ? 1 : 0), 0);
  const expected = group.expected_pax ?? autoPax;

  const coupleName = process.env.NEXT_PUBLIC_COUPLE_NAME ?? "Kami";
  const passUrl = buildPassUrl(group.token as string);
  const heart = "\u{1F90D}";
  const pray = "\u{1F64F}";

  const message =
    `Assalamualaikum Warahmatullahi Wabarakatuh ${heart}\n\n` +
    `Tanpa mengurangi rasa hormat, perkenankan kami mengundang anggota grup *${group.name}* untuk hadir dalam acara pernikahan ${coupleName}.\n\n` +
    `Berikut undangan grup beserta QR masuk (berlaku untuk ${expected} orang):\n${passUrl}\n\n` +
    `Cukup tunjukkan satu QR ini saat tiba di venue ${pray}\n\n` +
    `Wassalamualaikum Warahmatullahi Wabarakatuh\n\nHormat Kami,\n${coupleName}`;

  try {
    await sendWhatsAppMessage({ to: waGroupJid, message, sessionId });

    // Send the group QR image as a follow-up
    try {
      const qrBase64 = dataUrlToBase64(await generatePassQrDataUrl(passUrl));
      await new Promise((r) => setTimeout(r, 800));
      await sendWhatsAppImageBase64({
        to: waGroupJid,
        imageBase64: qrBase64,
        caption: `🎫 QR Masuk Grup — ${group.name}\nTunjukkan saat tiba di venue`,
        sessionId,
      });
    } catch {
      // QR image is best-effort; the link is already in the message
    }

    // Remember the linked chat
    await supabaseAdmin
      .from("guest_groups")
      .update({ wa_group_jid: waGroupJid, wa_group_name: waGroupName })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal mengirim." }, { status: 500 });
  }
}
