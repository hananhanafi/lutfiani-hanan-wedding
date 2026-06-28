import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Admin-only proxy to the WhatsApp microservice's contact endpoints.
 * Contacts are read on demand (user action) — nothing is fetched automatically.
 */

function service() {
  const url = process.env.WA_SERVICE_URL;
  if (!url) throw new Error("WA_SERVICE_URL not configured");
  return { base: url.replace(/\/$/, ""), key: process.env.WA_SERVICE_API_KEY ?? "" };
}

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (token.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { error: null };
}

// GET /api/admin/whatsapp-contacts?sessionId=xxx — load contacts for a session
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  try {
    const { base, key } = service();
    const res = await fetch(`${base}/sessions/${encodeURIComponent(sessionId)}/contacts`, {
      headers: { "x-api-key": key },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

// POST /api/admin/whatsapp-contacts — body { sessionId } — force a re-sync, then return contacts
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  try {
    const { base, key } = service();
    const res = await fetch(`${base}/sessions/${encodeURIComponent(sessionId)}/contacts/refresh`, {
      method: "POST",
      headers: { "x-api-key": key },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
