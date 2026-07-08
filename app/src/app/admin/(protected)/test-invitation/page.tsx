import { supabaseAdmin } from "@/utils/supabase/admin";
import TestInvitation from "@/components/TestInvitation";
import { getAdminSession } from "@/lib/auth";

export default async function TestInvitationRoute() {
  const session = await getAdminSession();
  const role = (session?.user as { role?: string })?.role ?? "admin";
  const staffId = (session?.user as { staffId?: string })?.staffId;

  let query = supabaseAdmin
    .from("guests")
    .select("id, name, phone_number, plus_one_name")
    .order("name", { ascending: true });
  if (role === "sender" && staffId) {
    query = query.eq("created_by", staffId);
  }
  const { data: guests } = await query;

  return <TestInvitation guests={guests ?? []} />;
}
