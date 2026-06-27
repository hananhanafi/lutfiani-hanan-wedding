import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { v4 as uuidv4 } from "uuid";
import { resolveGroup } from "@/lib/groups";

const MAX = 500;

/** Normalize phone: digits only, leading 0 → 62 (matches POST /api/admin/guests). */
function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}

/**
 * POST /api/admin/guests/bulk
 * Body: { group_id?: string, guests: [{ name, phone_number, side? }] }
 * Inserts many guests at once, deduping within the payload and against existing
 * phone numbers. Returns { created, skipped: [{ name, reason }] }.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const incoming: unknown = body.guests;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return NextResponse.json({ error: "guests required" }, { status: 400 });
  }
  if (incoming.length > MAX) {
    return NextResponse.json({ error: `Maksimal ${MAX} kontak per impor.` }, { status: 400 });
  }

  // Group is authoritative when provided; keeps group_name mirror in sync.
  const { groupId, groupName } = await resolveGroup(body.group_id, undefined);

  const createdBy =
    typeof token.staffId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token.staffId)
      ? token.staffId
      : null;

  const skipped: { name: string; reason: string }[] = [];
  const seenPhones = new Set<string>();
  const candidates: { name: string; phone: string; side: string | null }[] = [];

  for (const raw of incoming as Record<string, unknown>[]) {
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const phone = normalizePhone(typeof raw.phone_number === "string" ? raw.phone_number : "");
    const side = raw.side === "bride" || raw.side === "groom" ? raw.side : null;

    if (!name) { skipped.push({ name: "(tanpa nama)", reason: "Nama kosong" }); continue; }
    if (!phone) { skipped.push({ name, reason: "Nomor kosong" }); continue; }
    if (seenPhones.has(phone)) { skipped.push({ name, reason: "Duplikat dalam pilihan" }); continue; }
    seenPhones.add(phone);
    candidates.push({ name, phone, side });
  }

  // Skip numbers that already exist as guests
  let existing = new Set<string>();
  if (candidates.length > 0) {
    const { data } = await supabaseAdmin
      .from("guests")
      .select("phone_number")
      .in("phone_number", candidates.map((c) => c.phone));
    existing = new Set((data ?? []).map((r) => r.phone_number as string));
  }

  const toInsert = candidates
    .filter((c) => {
      if (existing.has(c.phone)) { skipped.push({ name: c.name, reason: "Sudah ada di daftar tamu" }); return false; }
      return true;
    })
    .map((c) => ({
      name: c.name,
      phone_number: c.phone,
      attending: null,
      group_id: groupId,
      group_name: groupName,
      side: c.side,
      is_vip: false,
      token: uuidv4(),
      created_by: createdBy,
    }));

  let created = 0;
  if (toInsert.length > 0) {
    const { data, error } = await supabaseAdmin.from("guests").insert(toInsert).select("id");
    if (error) {
      console.error("Bulk add guests error:", error);
      return NextResponse.json({ error: "Gagal menambahkan tamu." }, { status: 500 });
    }
    created = data?.length ?? 0;
  }

  return NextResponse.json({ created, skipped });
}
