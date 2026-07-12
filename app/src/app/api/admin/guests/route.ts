import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { v4 as uuidv4 } from "uuid";
import { pgOrValue } from "@/lib/pgrest";
import { resolveGroup } from "@/lib/groups";

/** Normalize phone: strip +, spaces, dashes, parens → digits only, convert leading 0 to 62 */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, phone_number, attending, plus_one_name, group_name, group_id, side, message, is_vip, allow_multi_checkin } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (!phone_number?.trim()) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(phone_number);

  // Resolve the group from master data when group_id is given (authoritative,
  // keeps group_name in sync); otherwise fall back to free-text group_name.
  const { groupId: resolvedGroupId, groupName: resolvedGroupName } = await resolveGroup(group_id, group_name);

  // Uniqueness checks
  const orFilters: string[] = [];
  if (email?.trim()) orFilters.push(`email.eq.${pgOrValue(email.trim())}`);
  if (normalizedPhone) orFilters.push(`phone_number.eq.${pgOrValue(normalizedPhone)}`);
  if (orFilters.length > 0) {
    const { data: existing } = await supabaseAdmin
      .from("guests")
      .select("id, email, phone_number")
      .or(orFilters.join(","))
      .limit(1)
      .maybeSingle();
    if (existing) {
      if (existing.email === email?.trim()) {
        return NextResponse.json({ error: "Email sudah digunakan oleh tamu lain." }, { status: 409 });
      }
      return NextResponse.json({ error: "Nomor telepon sudah digunakan oleh tamu lain." }, { status: 409 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("guests")
    .insert({
      name: name.trim(),
      email: email?.trim() || null,
      phone_number: normalizedPhone || null,
      attending: attending ?? null,
      plus_one_name: plus_one_name?.trim() || null,
      group_name: resolvedGroupName,
      group_id: resolvedGroupId,
      side: side?.trim() || null,
      message: message?.trim() || null,
      is_vip: is_vip === true,
      allow_multi_checkin: allow_multi_checkin === true,
      token: uuidv4(),
      created_by: typeof token.staffId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token.staffId) ? token.staffId : null,
    })
    .select()
    .single();

  if (error) {
    console.error("Add guest error:", error);
    return NextResponse.json({ error: "Failed to add guest." }, { status: 500 });
  }

  return NextResponse.json({ success: true, guest: data }, { status: 201 });
}
