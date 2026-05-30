import { supabaseAdmin } from "@/utils/supabase/admin";
import GuestTable from "@/components/GuestTable";
import type { Guest } from "@/types";

export default async function GuestsPage() {
  const [{ data: guests }, { data: config }] = await Promise.all([
    supabaseAdmin.from("guests").select("*").order("submitted_at", { ascending: false }),
    supabaseAdmin.from("site_config").select("partner_one_name, partner_two_name").eq("id", 1).single(),
  ]);

  const coupleName = config
    ? `${config.partner_one_name} & ${config.partner_two_name}`
    : "Kami";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Daftar Tamu</h1>
      </div>
      <GuestTable guests={(guests as Guest[]) ?? []} coupleName={coupleName} />
    </div>
  );
}
