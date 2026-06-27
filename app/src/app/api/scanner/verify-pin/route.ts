import { NextRequest, NextResponse } from "next/server";
import { verifyScannerPin } from "@/lib/scannerAuth";

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    return NextResponse.json({ valid: verifyScannerPin(pin) });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
