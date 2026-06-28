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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireAdmin(req);
  if (err) return err;

  const { id } = await params;
  const body = await req.json();
  const { name, email, username, role, is_active, password } = body;

  // Prevent modifying the env-based admin
  if (id === "admin-env") return NextResponse.json({ error: "Cannot modify the primary admin." }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (name !== undefined) {
    if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    updates.name = name.trim();
  }
  if (email !== undefined) {
    const cleanEmail = email?.trim().toLowerCase();
    if (!cleanEmail) return NextResponse.json({ error: "Email is required." }, { status: 400 });
    // Check uniqueness, excluding self
    const { data: existingEmail } = await supabaseAdmin
      .from("staff")
      .select("id")
      .eq("email", cleanEmail)
      .neq("id", id)
      .maybeSingle();
    if (existingEmail) return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    updates.email = cleanEmail;
  }
  if (username !== undefined) {
    const cleanUsername = username?.trim() || null;
    if (cleanUsername) {
      // Check uniqueness, excluding self
      const { data: existing } = await supabaseAdmin
        .from("staff")
        .select("id")
        .eq("username", cleanUsername)
        .neq("id", id)
        .single();
      if (existing) return NextResponse.json({ error: "Username already in use." }, { status: 409 });
    }
    updates.username = cleanUsername;
  }
  if (role !== undefined) {
    if (!["admin", "sender"].includes(role)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    updates.role = role;
  }
  if (is_active !== undefined) updates.is_active = Boolean(is_active);
  if (password !== undefined) {
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    updates.password_hash = await bcrypt.hash(password, 12);
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "No fields to update." }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("staff")
    .update(updates)
    .eq("id", id)
    .select("id, name, username, email, role, is_active, created_at")
    .single();

  if (error) return NextResponse.json({ error: "Failed to update staff." }, { status: 500 });
  return NextResponse.json({ staff: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireAdmin(req);
  if (err) return err;

  const { id } = await params;
  if (id === "admin-env") return NextResponse.json({ error: "Cannot delete the primary admin." }, { status: 400 });

  const { error } = await supabaseAdmin.from("staff").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete staff." }, { status: 500 });
  return NextResponse.json({ success: true });
}
