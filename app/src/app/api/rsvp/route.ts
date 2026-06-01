import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { v4 as uuidv4 } from "uuid";
import { sendMail } from "@/lib/mailer";
import { generatePassQrDataUrl, dataUrlToBase64, buildPassUrl } from "@/lib/qrcode";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { limited } = await checkRateLimit(ip, "rsvp", 5, 600); // 5 per 10 min
    if (limited) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi dalam beberapa menit." },
        { status: 429 }
      );
    }

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
    const qrDataUrl = attending ? await generatePassQrDataUrl(qrUrl) : null;

    // Upsert: update existing submission if same email, otherwise insert new
    let isUpdate = false;
    let submission = null;
    let dbError = null;

    if (email?.trim()) {
      const { data: existing } = await supabaseAdmin
        .from("rsvp_submissions")
        .select("id")
        .ilike("email", email.trim())
        .maybeSingle();

      if (existing) {
        isUpdate = true;
        const { data: updated, error: updateError } = await supabaseAdmin
          .from("rsvp_submissions")
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
        submission = updated;
      }
    }

    if (!submission) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("rsvp_submissions")
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
      submission = inserted;
      dbError = insertError;
    }

    if (dbError || !submission) {
      console.error("Supabase error:", dbError);
      return NextResponse.json({ error: "Failed to save RSVP." }, { status: 500 });
    }

    // Auto-link to guest list by email or phone
    try {
      const lookupFilters: string[] = [];
      if (email?.trim()) lookupFilters.push(`email.eq.${email.trim()}`);
      if (phone_number?.trim()) lookupFilters.push(`phone_number.eq.${phone_number.trim()}`);
      if (lookupFilters.length > 0) {
        const { data: matchedGuest } = await supabaseAdmin
          .from("guests")
          .select("id")
          .or(lookupFilters.join(","))
          .limit(1)
          .maybeSingle();
        if (matchedGuest) {
          await supabaseAdmin
            .from("guests")
            .update({
              attending,
              message: message?.trim() || null,
              plus_one_name: plus_one_name?.trim() || null,
              rsvp_submitted_at: new Date().toISOString(),
              rsvp_submission_id: submission.id,
            })
            .eq("id", matchedGuest.id);
        }
      }
    } catch (linkErr) {
      console.error("Guest auto-link error (RSVP still saved):", linkErr);
    }

    // Send emails (non-blocking)
    try {
      if (email) {
        if (attending && qrDataUrl) {
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
        } else if (!attending) {
          await sendMail({
            to: email,
            subject: "Thank you for your response 💌",
            html: `
              <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #fffbf5; color: #3a3028;">
                <h1 style="font-size: 28px; text-align: center; margin-bottom: 8px;">Thank you, ${name}!</h1>
                <p style="text-align: center; color: #9a7d5a; margin-bottom: 24px;">
                  We received your RSVP and understand that you won't be able to join us on our special day.
                </p>
                <p style="text-align: center; color: #3a3028; margin-bottom: 24px;">
                  We truly appreciate you letting us know, and we hope to celebrate with you another time.
                </p>
                <p style="text-align: center; color: #9a7d5a; font-size: 13px;">With love 💛</p>
              </div>
            `,
          });
        }
      }

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
      guest: { id: submission.id, name: submission.name, token: submission.token },
      qrDataUrl,
      qrUrl,
    });
  } catch (err) {
    console.error("RSVP error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

