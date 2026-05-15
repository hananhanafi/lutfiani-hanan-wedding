import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },

});

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string; encoding: string; contentType: string; cid?: string }[];
}) {
  return transporter.sendMail({
    from: `"Hanan & Hanafi" <${process.env.GMAIL_USER}>`,
    ...options,
  });
}
