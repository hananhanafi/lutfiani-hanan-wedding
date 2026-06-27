import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const ALLOWED_EMOJIS = ["❤️", "🎉", "🥂", "😍", "🙏"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { limited } = await checkRateLimit(getClientIp(req), "wish_react", 60, 600); // 60 per 10 min
  if (limited) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi dalam beberapa menit." },
      { status: 429 }
    );
  }

  const { id } = await params;
  const { emoji, remove } = await req.json();

  if (!ALLOWED_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: "Invalid emoji." }, { status: 400 });
  }

  // Fetch current reactions
  const { data: wish, error: fetchError } = await supabaseAdmin
    .from("wishes")
    .select("reactions")
    .eq("id", id)
    .single();

  if (fetchError || !wish) {
    return NextResponse.json({ error: "Wish not found." }, { status: 404 });
  }

  const reactions: Record<string, number> = wish.reactions ?? {};
  const current = reactions[emoji] ?? 0;

  if (remove) {
    reactions[emoji] = Math.max(0, current - 1);
    if (reactions[emoji] === 0) delete reactions[emoji];
  } else {
    reactions[emoji] = current + 1;
  }

  const { error: updateError } = await supabaseAdmin
    .from("wishes")
    .update({ reactions })
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ reactions });
}
