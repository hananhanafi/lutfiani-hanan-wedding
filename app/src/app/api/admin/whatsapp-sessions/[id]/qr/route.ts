import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const serviceUrl = process.env.WA_SERVICE_URL;
  if (!serviceUrl) return NextResponse.json({ error: "WA_SERVICE_URL not configured" }, { status: 500 });

  const apiKey = process.env.WA_SERVICE_API_KEY ?? "";

  try {
    const res = await fetch(`${serviceUrl.replace(/\/$/, "")}/sessions/${id}/qr`, {
      headers: { "x-api-key": apiKey },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
