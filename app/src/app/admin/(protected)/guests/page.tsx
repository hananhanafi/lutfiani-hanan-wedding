import { supabaseAdmin } from "@/utils/supabase/admin";
import GuestTable from "@/components/GuestTable";
import type { Guest } from "@/types";

export default async function GuestsPage() {
  const { data: guests } = await supabaseAdmin
    .from("guests")
    .select("*")
    .order("submitted_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Guest List</h1>
        <a
          href="/api/admin/export"
          className="px-4 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] transition-colors"
        >
          Export CSV ↓
        </a>
      </div>
      <GuestTable guests={(guests as Guest[]) ?? []} />
    </div>
  );
}
