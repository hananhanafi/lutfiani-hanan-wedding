import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionOwner, recordSessionOwner } from "@/lib/sessionOwnership";

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

  // Record session ownership at pairing time so this session shows up for the
  // staff who connected it. (The QR path does this via POST /whatsapp-sessions;
  // the phone-pairing path previously skipped it, hiding the session from senders.)
  const user = session.user as { role?: string; staffId?: string } | undefined;
  const role = user?.role ?? "admin";
  const staffId = user?.staffId;
  if (role === "sender") {
    if (!staffId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // A sender may pair an unowned (new) session — claiming it — but not one owned by someone else.
    const owner = await getSessionOwner(id);
    if (owner && owner !== staffId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  await recordSessionOwner(id, staffId ?? null);

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
