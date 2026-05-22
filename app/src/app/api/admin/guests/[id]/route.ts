import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json();
  const { name, email, phone_number, attending, plus_one_name, group_name, side, message, checked_in, email_sent, whatsapp_status } = body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name?.trim() || null;
  if (email !== undefined) updateData.email = email?.trim() || null;
  if (phone_number !== undefined) updateData.phone_number = phone_number?.trim() || null;
  if (attending !== undefined) updateData.attending = attending;
  if (plus_one_name !== undefined) updateData.plus_one_name = plus_one_name?.trim() || null;
  if (group_name !== undefined) updateData.group_name = group_name?.trim() || null;
  if (side !== undefined) updateData.side = side?.trim() || null;
  if (message !== undefined) updateData.message = message?.trim() || null;
  if (checked_in !== undefined) {
    updateData.checked_in = checked_in;
    updateData.checked_in_at = checked_in ? new Date().toISOString() : null;
  }
  if (email_sent !== undefined) updateData.email_sent = email_sent;
  if (whatsapp_status !== undefined) updateData.whatsapp_status = whatsapp_status;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
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
