import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function getServiceUrl() {
  const url = process.env.WA_SERVICE_URL;
  if (!url) throw new Error("WA_SERVICE_URL not configured");
  return url.replace(/\/$/, "");
}

function getApiKey() {
  return process.env.WA_SERVICE_API_KEY ?? "";
}

// POST /api/admin/whatsapp-sessions/[id]/pairing-code
// Body: { phoneNumber: string }
// Returns: { code: string } — 8-character pairing code (e.g. "ABCD-1234")
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (!body.phoneNumber) {
    return NextResponse.json({ error: "Missing phoneNumber" }, { status: 400 });
  }

  try {
    const res = await fetch(`${getServiceUrl()}/sessions/${id}/pairing-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": getApiKey() },
      body: JSON.stringify({ phoneNumber: body.phoneNumber }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
