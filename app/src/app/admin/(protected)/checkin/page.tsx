import { supabaseAdmin } from "@/utils/supabase/admin";
import type { Guest } from "@/types";

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default async function CheckinDashboard() {
  const { data: guests } = await supabaseAdmin
    .from("guests")
    .select("*")
    .eq("attending", true)
    .order("checked_in_at", { ascending: false });

  const allGuests = (guests as Guest[]) ?? [];
  const checkedIn = allGuests.filter((g) => g.checked_in);
  const notArrived = allGuests.filter((g) => !g.checked_in);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Dasbor Check-in</h1>
      <p className="text-sm text-gray-500 mb-6">
        {checkedIn.length} dari {allGuests.length} tamu telah tiba
      </p>

      {/* Progress */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 rounded-full transition-all"
            style={{ width: `${Math.round((checkedIn.length / (allGuests.length || 1)) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>✅ {checkedIn.length} sudah tiba</span>
          <span>⏳ {notArrived.length} belum tiba</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Checked In */}
        <div>
          <h2 className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">
            ✅ Sudah Tiba ({checkedIn.length})
          </h2>
          <div className="space-y-2">
            {checkedIn.length === 0 && (
              <p className="text-sm text-gray-400 bg-white rounded-xl p-4 shadow-sm">Belum ada tamu yang check-in.</p>
            )}
            {checkedIn.map((g) => (
              <div key={g.id} className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{g.name}</p>
                  {g.plus_one_name && <p className="text-xs text-gray-400">Pasangan: {g.plus_one_name}</p>}

                </div>
                <span className="text-xs text-gray-400">{g.checked_in_at ? formatTime(g.checked_in_at) : ""}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Not Arrived */}
        <div>
          <h2 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider mb-3">
            ⏳ Belum Tiba ({notArrived.length})
          </h2>
          <div className="space-y-2">
            {notArrived.length === 0 && (
              <p className="text-sm text-gray-400 bg-white rounded-xl p-4 shadow-sm">Semua tamu sudah check-in! 🎉</p>
            )}
            {notArrived.map((g) => (
              <div key={g.id} className="bg-white rounded-xl px-4 py-3 shadow-sm">
                <p className="font-medium text-gray-800 text-sm">{g.name}</p>
                {g.plus_one_name && <p className="text-xs text-gray-400">Pasangan: {g.plus_one_name}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
