import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { sendMail } from "@/lib/mailer";
import { generatePassQrDataUrl, dataUrlToBase64, buildPassUrl } from "@/lib/qrcode";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { guestId } = await req.json();
  if (!guestId) return NextResponse.json({ error: "guestId required" }, { status: 400 });

  const { data: guest, error } = await supabaseAdmin
    .from("guests")
    .select("*")
    .eq("id", guestId)
    .single();

  if (error || !guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });

  if (!guest.email) return NextResponse.json({ error: "Guest has no email address" }, { status: 400 });
  if (!guest.attending) return NextResponse.json({ error: "Guest is not attending" }, { status: 400 });

  const qrUrl = buildPassUrl(guest.token);
  const qrDataUrl = await generatePassQrDataUrl(qrUrl);
  const qrBase64 = dataUrlToBase64(qrDataUrl);

  try {
    await sendMail({
      to: guest.email,
      subject: "Your Wedding Entry Pass 💌",
      html: `
        <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #fffbf5; color: #3a3028;">
          <h1 style="font-size: 28px; text-align: center; margin-bottom: 8px;">We can't wait to see you!</h1>
          <p style="text-align: center; color: #9a7d5a; margin-bottom: 24px;">Dear ${guest.name}, please find your wedding entry pass below.</p>
          <p style="text-align: center; color: #3a3028; margin-bottom: 8px;">Please show this QR code at the entrance:</p>
          <div style="text-align: center; margin: 24px 0;">
            <img src="cid:qrcode" alt="Your Entry QR Code" width="200" style="border-radius: 12px;" />
          </div>
          <p style="text-align: center; font-size: 13px; color: #9a7d5a;">
            You can also access your pass at:<br/>
            <a href="${qrUrl}" style="color: #c9a96e;">${qrUrl}</a>
          </p>
          ${guest.plus_one_name ? `<p style="text-align:center; font-size:13px; color:#9a7d5a; margin-top:8px;">Plus one: ${guest.plus_one_name}</p>` : ""}
        </div>
      `,
      attachments: [{ filename: "entry-pass.png", content: qrBase64, encoding: "base64", contentType: "image/png", cid: "qrcode" }],
    });
  } catch (emailErr) {
    console.error("Nodemailer error:", emailErr);
    return NextResponse.json({ error: "Failed to send email", detail: String(emailErr) }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
