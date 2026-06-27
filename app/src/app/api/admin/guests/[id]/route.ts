import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { pgOrValue } from "@/lib/pgrest";
import { resolveGroup } from "@/lib/groups";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Senders may only edit guests they created
  if (token.role === "sender") {
    const { data: existing } = await supabaseAdmin.from("guests").select("created_by").eq("id", id).single();
    if (!existing || existing.created_by !== token.staffId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await req.json();
  const { name, email, phone_number, attending, plus_one_name, group_name, group_id, side, message, checked_in, email_sent, whatsapp_status, is_vip } = body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name?.trim() || null;
  if (email !== undefined) updateData.email = email?.trim() || null;
  if (phone_number !== undefined) updateData.phone_number = phone_number?.trim() || null;
  if (attending !== undefined) updateData.attending = attending;
  if (plus_one_name !== undefined) updateData.plus_one_name = plus_one_name?.trim() || null;
  if (group_id !== undefined || group_name !== undefined) {
    // group_id is authoritative (mirrors master name); free-text group_name is the legacy fallback
    const resolved = await resolveGroup(group_id, group_name);
    updateData.group_id = resolved.groupId;
    updateData.group_name = resolved.groupName;
  }
  if (side !== undefined) updateData.side = side?.trim() || null;
  if (message !== undefined) updateData.message = message?.trim() || null;
  if (checked_in !== undefined) {
    updateData.checked_in = checked_in;
    updateData.checked_in_at = checked_in ? new Date().toISOString() : null;
  }
  if (email_sent !== undefined) updateData.email_sent = email_sent;
  if (whatsapp_status !== undefined) updateData.whatsapp_status = whatsapp_status;
  if (is_vip !== undefined) updateData.is_vip = is_vip === true;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  // Uniqueness checks (exclude self)
  const orFilters: string[] = [];
  if (updateData.email) orFilters.push(`email.eq.${pgOrValue(updateData.email as string)}`);
  if (updateData.phone_number) orFilters.push(`phone_number.eq.${pgOrValue(updateData.phone_number as string)}`);
  if (orFilters.length > 0) {
    const { data: conflict } = await supabaseAdmin
      .from("guests")
      .select("id, email, phone_number")
      .or(orFilters.join(","))
      .neq("id", id)
      .limit(1)
      .maybeSingle();
    if (conflict) {
      if (conflict.email === updateData.email) {
        return NextResponse.json({ error: "Email sudah digunakan oleh tamu lain." }, { status: 409 });
      }
      return NextResponse.json({ error: "Nomor telepon sudah digunakan oleh tamu lain." }, { status: 409 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("guests")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Update guest error:", error);
    return NextResponse.json({ error: "Failed to update guest." }, { status: 500 });
  }

  return NextResponse.json({ success: true, guest: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabaseAdmin.from("guests").delete().eq("id", id);

  if (error) {
    console.error("Delete guest error:", error);
    return NextResponse.json({ error: "Failed to delete guest." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
