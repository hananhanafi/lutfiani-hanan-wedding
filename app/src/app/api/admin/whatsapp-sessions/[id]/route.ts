import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { canUseSession } from "@/lib/sessionOwnership";
import { supabaseAdmin } from "@/utils/supabase/admin";

function getServiceUrl() {
  const url = process.env.WA_SERVICE_URL;
  if (!url) throw new Error("WA_SERVICE_URL not configured");
  return url.replace(/\/$/, "");
}

function getApiKey() {
  return process.env.WA_SERVICE_API_KEY ?? "";
}

// GET /api/admin/whatsapp-sessions/[id] — session status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (!await canUseSession(id, token.role as string, token.staffId as string | undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const res = await fetch(`${getServiceUrl()}/sessions/${id}/status`, {
      headers: { "x-api-key": getApiKey() },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

// POST /api/admin/whatsapp-sessions/[id] — connect/disconnect/fresh
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (!await canUseSession(id, token.role as string, token.staffId as string | undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action } = await req.json();

  let endpoint = "";
  if (action === "connect") endpoint = `/sessions/${id}/connect`;
  else if (action === "connect-fresh") endpoint = `/sessions/${id}/connect/fresh`;
  else if (action === "disconnect") endpoint = `/sessions/${id}/disconnect`;
  else return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  try {
    const res = await fetch(`${getServiceUrl()}${endpoint}`, {
      method: "POST",
      headers: { "x-api-key": getApiKey() },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

// DELETE /api/admin/whatsapp-sessions/[id] — delete session
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (!await canUseSession(id, token.role as string, token.staffId as string | undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const res = await fetch(`${getServiceUrl()}/sessions/${id}`, {
      method: "DELETE",
      headers: { "x-api-key": getApiKey() },
    });
    const data = await res.json();

    // Remove ownership record
    if (res.ok) {
      await supabaseAdmin.from("whatsapp_session_owners").delete().eq("session_id", id);
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
