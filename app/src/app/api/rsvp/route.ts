import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { v4 as uuidv4 } from "uuid";
import { sendMail } from "@/lib/mailer";
import { generatePassQrDataUrl, dataUrlToBase64, buildPassUrl } from "@/lib/qrcode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone_number, attending, plus_one_name, group_name, side, message } = body;

    if (!name || typeof attending !== "boolean") {
      return NextResponse.json({ error: "Name and attendance are required." }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: "Name must be 100 characters or fewer." }, { status: 400 });
    }
    if (email && email.trim().length > 254) {
      return NextResponse.json({ error: "Email must be 254 characters or fewer." }, { status: 400 });
    }
    if (phone_number && phone_number.trim().length > 30) {
      return NextResponse.json({ error: "Phone number must be 30 characters or fewer." }, { status: 400 });
    }
    if (plus_one_name && plus_one_name.trim().length > 100) {
      return NextResponse.json({ error: "Plus one name must be 100 characters or fewer." }, { status: 400 });
    }
    if (group_name && group_name.trim().length > 100) {
      return NextResponse.json({ error: "Group name must be 100 characters or fewer." }, { status: 400 });
    }
    if (message && message.trim().length > 500) {
      return NextResponse.json({ error: "Message must be 500 characters or fewer." }, { status: 400 });
    }

    const token = uuidv4();
    const qrUrl = buildPassUrl(token);

    // Generate QR code as base64 data URL
    const qrDataUrl = attending ? await generatePassQrDataUrl(qrUrl) : null;

    // Upsert: update existing record if email matches, otherwise insert new
    let isUpdate = false;
    let guest = null;
    let dbError = null;

    if (email?.trim()) {
      const { data: existing } = await supabaseAdmin
        .from("guests")
        .select("id")
        .ilike("email", email.trim())  // case-insensitive match
        .maybeSingle();

      if (existing) {
        isUpdate = true;
        const { data: updated, error: updateError } = await supabaseAdmin
          .from("guests")
          .update({
            name: name.trim(),
            email: email?.trim() || null,
            phone_number: phone_number?.trim() || null,
            attending,
            plus_one_name: plus_one_name?.trim() || null,
            group_name: group_name?.trim() || null,
            side: side?.trim() || null,
            message: message?.trim() || null,
            token,
            checked_in: false,
            checked_in_at: null,
            submitted_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (updateError) {
          console.error("Supabase update error:", updateError);
          return NextResponse.json({ error: "Failed to update RSVP." }, { status: 500 });
        }

        guest = updated;
        dbError = null;
      }
    }

    if (!guest) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("guests")
        .insert({
          name: name.trim(),
          email: email?.trim() || null,
          phone_number: phone_number?.trim() || null,
          attending,
          plus_one_name: plus_one_name?.trim() || null,
          group_name: group_name?.trim() || null,
          side: side?.trim() || null,
          message: message?.trim() || null,
          token,
        })
        .select()
        .single();
      guest = inserted;
      dbError = insertError;
    }

    if (dbError || !guest) {
      console.error("Supabase error:", dbError);
      return NextResponse.json({ error: "Failed to save RSVP." }, { status: 500 });
    }

    // Send emails (non-blocking — RSVP succeeds even if email fails)
    try {
      if (attending && email && qrDataUrl) {
        const qrBase64 = dataUrlToBase64(qrDataUrl);
        await sendMail({
          to: email,
          subject: isUpdate ? "Your Updated Wedding Entry Pass 💌" : "Your Wedding Entry Pass 💌",
          html: `
            <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #fffbf5; color: #3a3028;">
              <h1 style="font-size: 28px; text-align: center; margin-bottom: 8px;">We can't wait to see you!</h1>
              <p style="text-align: center; color: #9a7d5a; margin-bottom: 24px;">Dear ${name}, your RSVP has been ${isUpdate ? "updated" : "confirmed"}.</p>
              <p style="text-align: center; color: #3a3028; margin-bottom: 8px;">Please show this QR code at the entrance:</p>
              <div style="text-align: center; margin: 24px 0;">
                <img src="cid:qrcode" alt="Your Entry QR Code" width="200" style="border-radius: 12px;" />
              </div>
              <p style="text-align: center; font-size: 13px; color: #9a7d5a;">
                You can also access your pass at:<br/>
                <a href="${qrUrl}" style="color: #c9a96e;">${qrUrl}</a>
              </p>
              ${plus_one_name ? `<p style="text-align:center; font-size:13px; color:#9a7d5a; margin-top:8px;">Plus one: ${plus_one_name}</p>` : ""}
            </div>
          `,
          attachments: [{ filename: "entry-pass.png", content: qrBase64, encoding: "base64", contentType: "image/png", cid: "qrcode" }],
        });
      }

      // Notify the couple
      const notifyEmail = process.env.GMAIL_USER!;
      if (attending) {
        await sendMail({
          to: notifyEmail,
          subject: isUpdate ? `RSVP Updated: ${name} is still attending!` : `New RSVP: ${name} is attending!`,
          html: `
            <p><strong>${name}</strong> has RSVPed as <strong>attending</strong>.</p>
            ${plus_one_name ? `<p>Plus one: ${plus_one_name}</p>` : ""}
            ${group_name ? `<p>Group: ${group_name}</p>` : ""}
            ${side ? `<p>Guest of: ${side}</p>` : ""}
            ${email ? `<p>Email: ${email}</p>` : ""}
          `,
        });
      } else {
        await sendMail({
          to: notifyEmail,
          subject: isUpdate ? `RSVP Updated: ${name} can no longer attend` : `RSVP: ${name} cannot attend`,
          html: `<p><strong>${name}</strong> has RSVPed as <strong>not attending</strong>.</p>`,
        });
      }
    } catch (emailErr) {
      console.error("Email send error (RSVP still saved):", emailErr);
    }

    return NextResponse.json({
      success: true,
      updated: isUpdate,
      guest: { id: guest.id, name: guest.name, token: guest.token },
      qrDataUrl,
      qrUrl,
    });
  } catch (err) {
    console.error("RSVP error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
