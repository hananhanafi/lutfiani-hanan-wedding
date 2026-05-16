import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, phone_number, attending, plus_one_name, group_name, side, message } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (!phone_number?.trim()) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("guests")
    .insert({
      name: name.trim(),
      email: email?.trim() || null,
      phone_number: phone_number?.trim() || null,
      attending: attending ?? null,
      plus_one_name: plus_one_name?.trim() || null,
      group_name: group_name?.trim() || null,
      side: side?.trim() || null,
      message: message?.trim() || null,
      token: uuidv4(),
    })
    .select()
    .single();

  if (error) {
    console.error("Add guest error:", error);
    return NextResponse.json({ error: "Failed to add guest." }, { status: 500 });
  }

  return NextResponse.json({ success: true, guest: data }, { status: 201 });
}
