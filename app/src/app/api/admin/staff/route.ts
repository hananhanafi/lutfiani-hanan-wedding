import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import bcrypt from "bcryptjs";

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (token.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET(req: NextRequest) {
  const err = await requireAdmin(req);
  if (err) return err;

  const { data, error } = await supabaseAdmin
    .from("staff")
    .select("id, name, username, email, role, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to fetch staff." }, { status: 500 });
  return NextResponse.json({ staff: data });
}

export async function POST(req: NextRequest) {
  const err = await requireAdmin(req);
  if (err) return err;

  const body = await req.json();
  const { name, email, username, password, role } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!email?.trim()) return NextResponse.json({ error: "Email is required." }, { status: 400 });
  if (!password || password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  if (!["admin", "sender"].includes(role)) return NextResponse.json({ error: "Role must be admin or sender." }, { status: 400 });

  // Check for duplicate email
  const { data: existing } = await supabaseAdmin
    .from("staff")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .single();
  if (existing) return NextResponse.json({ error: "Email already in use." }, { status: 409 });

  // Check for duplicate username
  const cleanUsername = username?.trim() || null;
  if (cleanUsername) {
    const { data: existingUsername } = await supabaseAdmin
      .from("staff")
      .select("id")
      .eq("username", cleanUsername)
      .single();
    if (existingUsername) return NextResponse.json({ error: "Username already in use." }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { data, error } = await supabaseAdmin
    .from("staff")
    .insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      username: cleanUsername,
      password_hash,
      role,
      is_active: true,
    })
    .select("id, name, username, email, role, is_active, created_at")
    .single();

  if (error) return NextResponse.json({ error: "Failed to create staff account." }, { status: 500 });
  return NextResponse.json({ staff: data }, { status: 201 });
}
