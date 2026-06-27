import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { v4 as uuidv4 } from "uuid";

/* ── CSV column aliases (case-insensitive) ──────────────────
   Accepted headers for each field. First match wins.
   Required: name, phone_number
   Optional: email, group_name, side, attending, plus_one_name, message
─────────────────────────────────────────────────────────── */
const ALIASES: Record<string, string[]> = {
  name:          ["name", "nama", "full name", "full_name", "guest name", "guest_name"],
  email:         ["email", "e-mail", "email address"],
  phone_number:  ["phone", "phone_number", "whatsapp", "no whatsapp", "no. whatsapp", "nomor whatsapp", "hp", "handphone"],
  group_name:    ["group", "group_name", "group name", "from", "dari", "asal"],
  side:          ["side", "pihak", "of", "guest of"],
  attending:     ["attending", "hadir", "rsvp", "will attend"],
  plus_one_name: ["plus_one", "plus_one_name", "plus one", "plus one name", "tamu tambahan"],
  message:       ["message", "pesan", "ucapan", "notes", "catatan"],
};

function detectField(header: string): string | null {
  const h = header.trim().toLowerCase();
  for (const [field, aliases] of Object.entries(ALIASES)) {
    if (aliases.includes(h)) return field;
  }
  return null;
}

function parseAttending(val: string): boolean | null {
  const v = val.trim().toLowerCase();
  if (["yes", "true", "1", "hadir", "ya", "attend", "attending"].includes(v)) return true;
  if (["no", "false", "0", "tidak", "tidak hadir", "decline", "regret"].includes(v)) return false;
  return null;
}

function parseSide(val: string): string | null {
  const v = val.trim().toLowerCase();
  if (["bride", "wanita", "mempelai wanita", "perempuan"].includes(v)) return "bride";
  if (["groom", "pria", "mempelai pria", "laki-laki", "laki"].includes(v)) return "groom";
  return null;
}

/** Minimal RFC-4180 CSV parser — handles quoted fields with embedded commas/newlines. */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const normalized = text.replace(/\r\n?/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (inQuotes) {
      if (ch === '"' && normalized[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(field); field = ""; }
      else if (ch === '\n') {
        row.push(field); field = "";
        if (row.some((c) => c.trim())) rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
  }
  row.push(field);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const text = await (file as File).text();
  const rows = parseCSV(text);
  if (rows.length < 2) {
    return NextResponse.json({ error: "CSV must have a header row and at least one data row." }, { status: 400 });
  }

  const headers = rows[0];
  const fieldMap: Record<number, string> = {};
  for (let i = 0; i < headers.length; i++) {
    const field = detectField(headers[i]);
    if (field) fieldMap[i] = field;
  }

  if (!Object.values(fieldMap).includes("name")) {
    return NextResponse.json(
      { error: 'CSV must have a "name" column. Accepted headers: name, nama, full name.' },
      { status: 400 }
    );
  }

  const MAX_ROWS = 2000;
  if (rows.length - 1 > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows. Maximum ${MAX_ROWS} guests per import.` },
      { status: 400 }
    );
  }

  const toInsert: Record<string, unknown>[] = [];
  const skipped: { row: number; reason: string }[] = [];
  // Track email/phone seen earlier in THIS file to avoid duplicate inserts that
  // would otherwise abort the whole batch on a unique-constraint violation.
  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();

  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    const record: Record<string, unknown> = {};

    for (const [idx, field] of Object.entries(fieldMap)) {
      const val = (cols[Number(idx)] ?? "").trim();
      record[field] = val;
    }

    const name = (record.name as string | undefined)?.trim();
    if (!name) { skipped.push({ row: r + 1, reason: "Missing name" }); continue; }

    const email = (record.email as string | undefined)?.trim() || null;
    const phone = (record.phone_number as string | undefined)?.trim() || null;

    const emailKey = email?.toLowerCase();
    if (emailKey && seenEmails.has(emailKey)) {
      skipped.push({ row: r + 1, reason: `Duplicate email in file: ${email}` });
      continue;
    }
    if (phone && seenPhones.has(phone)) {
      skipped.push({ row: r + 1, reason: `Duplicate phone in file: ${phone}` });
      continue;
    }
    if (emailKey) seenEmails.add(emailKey);
    if (phone) seenPhones.add(phone);

    toInsert.push({
      name,
      email,
      phone_number:   phone,
      group_name:     (record.group_name as string | undefined)?.trim() || null,
      side:           record.side ? parseSide(record.side as string) : null,
      attending:      record.attending ? parseAttending(record.attending as string) : null,
      plus_one_name:  (record.plus_one_name as string | undefined)?.trim() || null,
      message:        (record.message as string | undefined)?.trim() || null,
      is_vip:         false,
      token:          uuidv4(),
    });
  }

  if (toInsert.length === 0) {
    return NextResponse.json(
      { error: "No valid rows found in CSV.", skipped },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("guests")
    .insert(toInsert)
    .select();

  if (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: "Database insert failed." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    imported: data?.length ?? 0,
    guests: data ?? [],
    skipped,
  }, { status: 201 });
}
