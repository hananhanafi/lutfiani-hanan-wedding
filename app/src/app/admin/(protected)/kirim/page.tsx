import { supabaseAdmin } from "@/utils/supabase/admin";
import KirimPage from "@/components/KirimPage";
import type { Guest } from "@/types";
import { getAdminSession } from "@/lib/auth";

export default async function KirimPageRoute() {
  const session = await getAdminSession();
  const role = (session?.user as { role?: string })?.role ?? "admin";
  const staffId = (session?.user as { staffId?: string })?.staffId;

  let guestsQuery = supabaseAdmin.from("guests").select("*").order("name", { ascending: true });
  if (role === "sender" && staffId) {
    guestsQuery = guestsQuery.eq("created_by", staffId);
  }

  const [{ data: guests }, { data: config }] = await Promise.all([
    guestsQuery,
    supabaseAdmin.from("site_config").select("partner_one_name, partner_two_name").eq("id", 1).single(),
  ]);

  const coupleName = config
    ? `${config.partner_one_name} & ${config.partner_two_name}`
    : "Kami";

  return <KirimPage guests={(guests as Guest[]) ?? []} coupleName={coupleName} />;
}
