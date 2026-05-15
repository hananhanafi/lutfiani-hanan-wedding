import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

const DEFAULT_LIMIT = 6;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabaseAdmin
    .from("wishes")
    .select("id, name, message, created_at, reactions", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count ?? 0, page, limit });
}

export async function POST(req: NextRequest) {
  const { name, message } = await req.json();

  if (!name?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Name and message are required." }, { status: 400 });
  }

  if (name.trim().length > 100) {
    return NextResponse.json({ error: "Name must be 100 characters or fewer." }, { status: 400 });
  }
  if (message.trim().length > 1000) {
    return NextResponse.json({ error: "Message must be 1000 characters or fewer." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("wishes")
    .insert({ name: name.trim(), message: message.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
