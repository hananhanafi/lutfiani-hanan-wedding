import { supabaseAdmin } from "@/utils/supabase/admin";
import KirimPage from "@/components/KirimPage";
import type { Guest } from "@/types";

export default async function KirimPageRoute() {
  const [{ data: guests }, { data: config }] = await Promise.all([
    supabaseAdmin.from("guests").select("*").order("name", { ascending: true }),
    supabaseAdmin.from("site_config").select("partner_one_name, partner_two_name").eq("id", 1).single(),
  ]);

  const coupleName = config
    ? `${config.partner_one_name} & ${config.partner_two_name}`
    : "Kami";

  return <KirimPage guests={(guests as Guest[]) ?? []} coupleName={coupleName} />;
}
