"use client";

import { useEffect, useState } from "react";
import type { RsvpSubmission } from "@/types";

const SIDE_LABEL: Record<string, string> = { bride: "Bride", groom: "Groom" };

export default function RsvpPage() {
  const [submissions, setSubmissions] = useState<RsvpSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAttending, setFilterAttending] = useState<"" | "true" | "false">("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/rsvp");
    const data = await res.json();
    setSubmissions(data.submissions ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus submission ini?")) return;
    setDeleting(id);
    await fetch("/api/admin/rsvp", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    setDeleting(null);
  };

  const filtered = submissions.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone_number?.includes(q) ||
      s.group_name?.toLowerCase().includes(q);
    const matchAttending =
      filterAttending === "" || String(s.attending) === filterAttending;
    return matchSearch && matchAttending;
  });

  const attending = submissions.filter((s) => s.attending).length;
  const notAttending = submissions.filter((s) => !s.attending).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-gray-800">RSVP Submissions</h1>
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">{attending} Hadir</span>
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700">{notAttending} Tidak Hadir</span>
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600">{submissions.length} Total</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Cari nama, email, telp…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-gold)]"
        />
        <select
          value={filterAttending}
          onChange={(e) => setFilterAttending(e.target.value as "" | "true" | "false")}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-gold)]"
        >
          <option value="">Semua Kehadiran</option>
          <option value="true">Hadir</option>
          <option value="false">Tidak Hadir</option>
        </select>
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-400">Memuat…</div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center text-gray-400">Tidak ada submission.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  {["Nama", "Email", "Telepon", "Kehadiran", "+1", "Grup", "Pihak", "Pesan", "Check-in", "Dikirim", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.email ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{s.phone_number ?? "—"}</td>
                    <td className="px-4 py-3">
                      {s.attending
                        ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Hadir</span>
                        : <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">Tidak</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.plus_one_name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.group_name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs capitalize">{s.side ? SIDE_LABEL[s.side] ?? s.side : "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate" title={s.message ?? ""}>{s.message ?? "—"}</td>
                    <td className="px-4 py-3">
                      {s.checked_in
                        ? <span className="text-xs text-green-600">✅ {s.checked_in_at ? new Date(s.checked_in_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Ya"}</span>
                        : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(s.submitted_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deleting === s.id}
                        className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filtered.map((s) => (
              <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-800">{s.name}</p>
                  {s.attending
                    ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs shrink-0">Hadir</span>
                    : <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs shrink-0">Tidak</span>}
                </div>
                {s.email && <p className="text-xs text-gray-400">{s.email}</p>}
                {s.phone_number && <p className="text-xs text-gray-400">{s.phone_number}</p>}
                {s.plus_one_name && <p className="text-xs text-gray-500">+1: {s.plus_one_name}</p>}
                {s.group_name && <p className="text-xs text-gray-500">Grup: {s.group_name}</p>}
                {s.side && <p className="text-xs text-gray-500 capitalize">Pihak: {SIDE_LABEL[s.side] ?? s.side}</p>}
                {s.message && <p className="text-xs text-gray-500 italic">"{s.message}"</p>}
                {s.checked_in && <p className="text-xs text-green-600">✅ Check-in</p>}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-gray-400">{new Date(s.submitted_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting === s.id}
                    className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
