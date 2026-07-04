import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { readConnectorId, isSessionConnector } from "@/lib/sessionConnector";
import { canUseSession } from "@/lib/sessionOwnership";

/**
 * Proxy to the WhatsApp microservice's contact endpoints.
 * Allowed for admins and senders, with two gates:
 *  - session ownership (senders may only use sessions they own), and
 *  - browser binding (only the browser that connected the session may read its contacts).
 * Contacts are read on demand (user action) — nothing is fetched automatically.
 */

const NOT_CONNECTOR_MSG =
  "Hanya browser yang menghubungkan WhatsApp ini yang dapat mengakses kontaknya. Hubungkan ulang sesi dari browser ini.";

function service() {
  const url = process.env.WA_SERVICE_URL;
  if (!url) throw new Error("WA_SERVICE_URL not configured");
  return { base: url.replace(/\/$/, ""), key: process.env.WA_SERVICE_API_KEY ?? "" };
}

/** Auth + ownership + browser-binding checks. Returns an error response, or null if allowed. */
async function authorize(req: NextRequest, sessionId: string): Promise<NextResponse | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canUseSession(sessionId, token.role as string, token.staffId as string | undefined))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await isSessionConnector(sessionId, readConnectorId(req)))) {
    return NextResponse.json({ error: NOT_CONNECTOR_MSG }, { status: 403 });
  }
  return null;
}

// GET /api/admin/whatsapp-contacts?sessionId=xxx — load contacts for a session
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const denied = await authorize(req, sessionId);
  if (denied) return denied;

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
  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const denied = await authorize(req, sessionId);
  if (denied) return denied;

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
