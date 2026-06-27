import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";

/**
 * Render a value as a safe CSV cell:
 * - Neutralizes spreadsheet formula injection by prefixing a leading
 *   `= + - @ \t \r` with a single quote.
 * - Escapes embedded double-quotes by doubling them, then wraps in quotes.
 */
function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: guests } = await supabaseAdmin
    .from("guests")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (!guests) return NextResponse.json({ error: "No data" }, { status: 500 });

  const headers = ["Nama", "Email", "Telepon", "Hadir", "Plus Satu", "Grup", "Pihak", "Pesan", "Dikirim Pada", "Check-in", "Waktu Check-in", "Email Terkirim", "WA Terkirim"];

  const rows = guests.map((g) => [
    g.name,
    g.email ?? "",
    g.phone_number ?? "",
    g.attending === true ? "Ya" : g.attending === false ? "Tidak" : "Menunggu",
    g.plus_one_name ?? "",
    g.group_name ?? "",
    g.side ?? "",
    g.message ?? "",
    g.submitted_at,
    g.checked_in ? "Ya" : "Tidak",
    g.checked_in_at ?? "",
    g.email_sent ? "Ya" : "Tidak",
    g.whatsapp_status ?? "Belum",
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="daftar-tamu-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
