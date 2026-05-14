import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    const valid = String(pin).trim() === String(process.env.SCANNER_PIN ?? "").trim();
    return NextResponse.json({ valid });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
