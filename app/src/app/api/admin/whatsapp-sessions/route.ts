import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { getWhatsAppSessions } from "@/lib/whatsapp";
import { recordSessionOwner, getOwnedSessionIds } from "@/lib/sessionOwnership";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await getWhatsAppSessions();

    // Senders only see sessions they own
    if (token.role === "sender") {
      const ownedIds = await getOwnedSessionIds("sender", token.staffId as string | undefined);
      const filtered = (data.sessions ?? []).filter((s: { sessionId: string }) =>
        (ownedIds ?? []).includes(s.sessionId)
      );
      return NextResponse.json({ sessions: filtered });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    if (res.ok) {
      // Record ownership (staffId is null for env-admin)
      await recordSessionOwner(id, (token.staffId as string | undefined) ?? null);
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create session" },
      { status: 500 }
    );
  }
}
