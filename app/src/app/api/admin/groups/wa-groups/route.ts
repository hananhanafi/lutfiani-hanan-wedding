import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { canUseSession } from "@/lib/sessionOwnership";

/**
 * GET /api/admin/groups/wa-groups?sessionId=xxx
 * Lists the WhatsApp groups the session's account participates in (jid + subject),
 * so the admin can pick which chat to send a group invitation to.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  if (!(await canUseSession(sessionId, token.role as string, token.staffId as string | undefined))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceUrl = process.env.WA_SERVICE_URL;
  if (!serviceUrl) return NextResponse.json({ error: "WA_SERVICE_URL not configured" }, { status: 500 });

  try {
    const res = await fetch(`${serviceUrl.replace(/\/$/, "")}/sessions/${encodeURIComponent(sessionId)}/groups`, {
      headers: { "x-api-key": process.env.WA_SERVICE_API_KEY ?? "" },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
