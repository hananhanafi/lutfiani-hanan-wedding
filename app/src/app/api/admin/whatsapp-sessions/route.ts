import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWhatsAppSessions } from "@/lib/whatsapp";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await getWhatsAppSessions();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing session id" }, { status: 400 });

  const serviceUrl = process.env.WA_SERVICE_URL;
  if (!serviceUrl) return NextResponse.json({ error: "WA_SERVICE_URL not configured" }, { status: 500 });

  const apiKey = process.env.WA_SERVICE_API_KEY ?? "";

  try {
    const res = await fetch(`${serviceUrl.replace(/\/$/, "")}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ id, name }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create session" },
      { status: 500 }
    );
  }
}
