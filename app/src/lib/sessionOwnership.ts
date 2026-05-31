import { supabaseAdmin } from "@/utils/supabase/admin";

/**
 * Records the owner of a WhatsApp session when it is created.
 * staffId may be null for the primary env-admin.
 */
export async function recordSessionOwner(sessionId: string, staffId: string | null) {
  if (!staffId) return; // env-admin owns nothing — they can use any session
  await supabaseAdmin
    .from("whatsapp_session_owners")
    .upsert({ session_id: sessionId, staff_id: staffId }, { onConflict: "session_id" });
}

/**
 * Returns the staffId that owns this session, or null if no ownership record exists
 * (which means it was created by the env-admin and is accessible to all admins).
 */
export async function getSessionOwner(sessionId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("whatsapp_session_owners")
    .select("staff_id")
    .eq("session_id", sessionId)
    .single();
  return data?.staff_id ?? null;
}

/**
 * Returns true if the given staffId may use the given session.
 * - Admins (role !== 'sender') always pass.
 * - Senders pass only if they own the session.
 */
export async function canUseSession(
  sessionId: string,
  role: string,
  staffId: string | undefined
): Promise<boolean> {
  if (role !== "sender") return true;
  if (!staffId) return false;
  const owner = await getSessionOwner(sessionId);
  // If no ownership record, session was created by env-admin — senders cannot use it
  if (!owner) return false;
  return owner === staffId;
}

/**
 * Returns the list of sessionIds a sender is allowed to use.
 * For admins, returns null (meaning "all sessions allowed").
 */
export async function getOwnedSessionIds(
  role: string,
  staffId: string | undefined
): Promise<string[] | null> {
  if (role !== "sender") return null;
  if (!staffId) return [];
  const { data } = await supabaseAdmin
    .from("whatsapp_session_owners")
    .select("session_id")
    .eq("staff_id", staffId);
  return (data ?? []).map((r) => r.session_id as string);
}
