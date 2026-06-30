import { supabaseAdmin } from "@/utils/supabase/admin";
import Link from "next/link";
import type { Guest } from "@/types";

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

async function getStats() {
  const { data } = await supabaseAdmin.from("guests").select("attending, checked_in");
  if (!data) return { total: 0, attending: 0, declined: 0, pending: 0, checkedIn: 0 };

  const attending = data.filter((g) => g.attending === true).length;
  const declined = data.filter((g) => g.attending === false).length;
  const pending = data.filter((g) => g.attending === null).length;
  const checkedIn = data.filter((g) => g.checked_in === true).length;

  return { total: data.length, attending, declined, pending, checkedIn };
}

async function getCheckinGuests() {
  const { data } = await supabaseAdmin
    .from("guests")
    .select("*")
    .eq("attending", true)
    .order("checked_in_at", { ascending: false });
  return (data as Guest[]) ?? [];
}

async function getGroupStats() {
  const [{ data: groups }, { data: guestRows }] = await Promise.all([
    supabaseAdmin
      .from("guest_groups")
      .select("id, name, expected_pax, arrived_pax")
      .order("position", { ascending: true })
      .order("name", { ascending: true }),
    supabaseAdmin.from("guests").select("group_id, plus_one_name"),
  ]);

  const autoPax = new Map<string, number>();
  for (const r of guestRows ?? []) {
    if (!r.group_id) continue;
    autoPax.set(r.group_id, (autoPax.get(r.group_id) ?? 0) + 1 + (r.plus_one_name?.trim() ? 1 : 0));
  }

  const rows = (groups ?? []).map((g) => ({
    id: g.id as string,
    name: g.name as string,
    expected: (g.expected_pax as number | null) ?? autoPax.get(g.id) ?? 0,
    arrived: (g.arrived_pax as number) ?? 0,
  }));
  return {
    rows,
    totalExpected: rows.reduce((s, r) => s + r.expected, 0),
    totalArrived: rows.reduce((s, r) => s + r.arrived, 0),
  };
}

export default async function AdminDashboard() {
  const [stats, checkinGuests, groupStats] = await Promise.all([getStats(), getCheckinGuests(), getGroupStats()]);
  const checkedIn = checkinGuests.filter((g) => g.checked_in);
  const notArrived = checkinGuests.filter((g) => !g.checked_in);

  const cards = [
    { label: "Total Undangan", value: stats.total, color: "bg-blue-50 text-blue-700", icon: "📋" },
    { label: "Hadir", value: stats.attending, color: "bg-green-50 text-green-700", icon: "🎉" },
    { label: "Tidak Hadir", value: stats.declined, color: "bg-red-50 text-red-700", icon: "💌" },
    { label: "Belum Konfirmasi", value: stats.pending, color: "bg-yellow-50 text-yellow-700", icon: "⏳" },
    { label: "Sudah Check-in", value: stats.checkedIn, color: "bg-[var(--color-cream-dark)] text-[var(--color-gold)]", icon: "✅" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Dasbor</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map(({ label, value, color, icon }) => (
          <div key={label} className={`rounded-xl p-4 ${color}`}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-3xl font-bold">{value}</div>
            <div className="text-xs font-medium mt-1 opacity-80">{label}</div>
          </div>
        ))}
      </div>

      {/* Attendance progress bar */}
      {stats.attending > 0 && (
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Tingkat Kehadiran — {Math.round((stats.attending / (stats.attending + stats.declined || 1)) * 100)}%
          </p>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-gold)] rounded-full transition-all"
              style={{ width: `${Math.round((stats.attending / (stats.attending + stats.declined || 1)) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{stats.attending} hadir</span>
            <span>{stats.declined} tidak hadir</span>
          </div>
        </div>
      )}

      {/* Check-in progress bar */}
      {stats.attending > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Progres Check-in — {Math.round((stats.checkedIn / (stats.attending || 1)) * 100)}%
          </p>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-400 rounded-full transition-all"
              style={{ width: `${Math.round((stats.checkedIn / (stats.attending || 1)) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{stats.checkedIn} sudah check-in</span>
            <span>{stats.attending - stats.checkedIn} belum tiba</span>
          </div>
        </div>
      )}

      {/* Group attendance (pax) */}
      {groupStats.rows.length > 0 && (
        <div className="bg-white rounded-xl p-5 mt-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">
              Kehadiran per Grup — {groupStats.totalArrived} / {groupStats.totalExpected} orang
            </p>
            <Link href="/admin/groups" className="text-xs text-[var(--color-gold)] hover:underline">Kelola Grup →</Link>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-[var(--color-gold)] rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.round((groupStats.totalArrived / (groupStats.totalExpected || 1)) * 100))}%` }}
            />
          </div>
          <div className="space-y-2">
            {groupStats.rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-40 truncate flex-shrink-0">{r.name}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${r.arrived >= r.expected && r.expected > 0 ? "bg-green-400" : "bg-[var(--color-gold)]"}`}
                    style={{ width: `${Math.min(100, Math.round((r.arrived / (r.expected || 1)) * 100))}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-14 text-right flex-shrink-0">{r.arrived}/{r.expected}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/guests" className="px-4 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] transition-colors">
          Lihat Daftar Tamu →
        </Link>
      </div>

      {/* Check-in section */}
      {checkinGuests.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 mt-8 mb-1">Check-in Tamu</h2>
          <p className="text-sm text-gray-500 mb-4">{checkedIn.length} dari {checkinGuests.length} tamu telah tiba</p>

          <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 rounded-full transition-all"
                style={{ width: `${Math.round((checkedIn.length / (checkinGuests.length || 1)) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>✅ {checkedIn.length} sudah tiba</span>
              <span>⏳ {notArrived.length} belum tiba</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">✅ Sudah Tiba ({checkedIn.length})</h3>
              <div className="space-y-2">
                {checkedIn.length === 0 ? (
                  <p className="text-sm text-gray-400 bg-white rounded-xl p-4 shadow-sm">Belum ada tamu yang check-in.</p>
                ) : checkedIn.map((g) => (
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
            <div>
              <h3 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider mb-3">⏳ Belum Tiba ({notArrived.length})</h3>
              <div className="space-y-2">
                {notArrived.length === 0 ? (
                  <p className="text-sm text-gray-400 bg-white rounded-xl p-4 shadow-sm">Semua tamu sudah check-in! 🎉</p>
                ) : notArrived.map((g) => (
                  <div key={g.id} className="bg-white rounded-xl px-4 py-3 shadow-sm">
                    <p className="font-medium text-gray-800 text-sm">{g.name}</p>
                    {g.plus_one_name && <p className="text-xs text-gray-400">Pasangan: {g.plus_one_name}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
