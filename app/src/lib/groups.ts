import { supabaseAdmin } from "@/utils/supabase/admin";

/**
 * Resolve a guest's group from the master table.
 *
 * - If `groupId` is a valid guest_groups id, that group is authoritative and its
 *   name is mirrored into the denormalized `group_name`.
 * - Otherwise fall back to free-text `groupName` (legacy / public RSVP), with no link.
 *
 * Returns the pair to persist on the guest row.
 */
export async function resolveGroup(
  groupId: unknown,
  groupName: unknown
): Promise<{ groupId: string | null; groupName: string | null }> {
  const id = typeof groupId === "string" && groupId.trim() ? groupId.trim() : null;
  const freeText = typeof groupName === "string" && groupName.trim() ? groupName.trim() : null;

  if (id) {
    const { data } = await supabaseAdmin.from("guest_groups").select("id, name").eq("id", id).maybeSingle();
    if (data) return { groupId: data.id as string, groupName: data.name as string };
  }
  return { groupId: null, groupName: freeText };
}
