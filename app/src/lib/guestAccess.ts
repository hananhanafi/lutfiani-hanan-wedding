import { supabaseAdmin } from "@/utils/supabase/admin";

/**
 * Whether the current principal may act on a specific guest record.
 *
 * - Admins (role !== "sender") may act on any guest.
 * - Senders may only act on guests they created (guests.created_by === staffId).
 *
 * Returns false if the guest does not exist.
 */
export async function canModifyGuest(
  guestId: string,
  role: string | undefined,
  staffId: string | undefined
): Promise<boolean> {
  if (role !== "sender") return true;
  if (!staffId) return false;
  const { data } = await supabaseAdmin
    .from("guests")
    .select("created_by")
    .eq("id", guestId)
    .single();
  return !!data && data.created_by === staffId;
}
