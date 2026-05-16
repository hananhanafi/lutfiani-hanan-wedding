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
        <h1 className="text-2xl font-semibold text-gray-800">Daftar Tamu</h1>
        {/* <div className="flex items-center gap-2">
          <a
            href="/api/admin/export-qr"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-[var(--color-gold)] text-[var(--color-gold)] rounded-lg text-sm hover:bg-[var(--color-cream-dark)] transition-colors"
          >
            Ekspor QR 📷
          </a>
          <a
            href="/api/admin/export"
            className="px-4 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] transition-colors"
          >
            Ekspor CSV ↓
          </a>
        </div> */}
      </div>
      <GuestTable guests={(guests as Guest[]) ?? []} />
    </div>
  );
}
