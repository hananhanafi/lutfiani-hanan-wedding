import type { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/utils/supabase/admin";

const COOKIE = "wa_connector";
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Read the browser's connector id from its cookie (null if not set yet). */
export function readConnectorId(req: NextRequest): string | null {
  return req.cookies.get(COOKIE)?.value ?? null;
}

/**
 * Ensure the browser has a stable connector id. If the cookie is missing, a new
 * id is generated and set on the given response. Returns the id either way.
 */
export function ensureConnectorCookie(req: NextRequest, res: NextResponse): string {
  const existing = req.cookies.get(COOKIE)?.value;
  if (existing) return existing;
  const id = crypto.randomUUID();
  res.cookies.set(COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: ONE_YEAR });
  return id;
}

/** Record (or update) which browser connected a session. */
export async function recordSessionConnector(sessionId: string, connectorId: string): Promise<void> {
  await supabaseAdmin
    .from("whatsapp_session_connectors")
    .upsert({ session_id: sessionId, connector_id: connectorId, updated_at: new Date().toISOString() }, { onConflict: "session_id" });
}

/** True only if this browser is the one that connected the session. */
export async function isSessionConnector(sessionId: string, connectorId: string | null): Promise<boolean> {
  if (!connectorId) return false;
  const { data } = await supabaseAdmin
    .from("whatsapp_session_connectors")
    .select("connector_id")
    .eq("session_id", sessionId)
    .maybeSingle();
  return !!data && data.connector_id === connectorId;
}
