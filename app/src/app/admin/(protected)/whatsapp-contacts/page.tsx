"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type WASession = { sessionId: string; status: string; phone: string | null; name?: string | null };
type WAContact = { phone: string; name: string };

export default function WhatsAppContactsPage() {
  const [sessions, setSessions] = useState<WASession[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [targetGroup, setTargetGroup] = useState("");

  const [contacts, setContacts] = useState<WAContact[] | null>(null); // null = not loaded yet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: { name: string; reason: string }[] } | null>(null);

  // Session list + groups load on mount (these are NOT contact reads).
  useEffect(() => {
    fetch("/api/admin/whatsapp-sessions")
      .then((r) => r.json())
      .then((d) => {
        const connected: WASession[] = (d.sessions ?? []).filter((s: WASession) => s.status === "connected");
        setSessions(connected);
        if (connected.length === 1) setSelectedSession(connected[0].sessionId);
      })
      .catch(() => {});
    fetch("/api/admin/groups")
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .catch(() => {});
  }, []);

  // Contacts are only fetched when the admin clicks (rule: no automatic read).
  const loadContacts = useCallback(async (refresh: boolean) => {
    if (!selectedSession) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = refresh
        ? await fetch("/api/admin/whatsapp-contacts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: selectedSession }),
          })
        : await fetch(`/api/admin/whatsapp-contacts?sessionId=${encodeURIComponent(selectedSession)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat kontak.");
        setContacts([]);
      } else {
        setContacts(data.contacts ?? []);
        setSelected(new Set());
      }
    } catch {
      setError("Koneksi error. Coba lagi.");
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSession]);

  const filtered = (contacts ?? []).filter((c) => {
    const q = search.trim().toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.phone));
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((c) => next.delete(c.phone));
      else filtered.forEach((c) => next.add(c.phone));
      return next;
    });
  };
  const toggleOne = (phone: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone); else next.add(phone);
      return next;
    });

  const doImport = async () => {
    const chosen = (contacts ?? []).filter((c) => selected.has(c.phone));
    if (chosen.length === 0) return;
    setImporting(true);
    setError("");
    try {
      const guests = chosen.map((c) => ({ name: c.name.trim() || c.phone, phone_number: c.phone }));
      const res = await fetch("/api/admin/guests/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: targetGroup || undefined, guests }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengimpor.");
      } else {
        setResult({ created: data.created ?? 0, skipped: data.skipped ?? [] });
        // Drop the imported ones from the selection so they're not re-added
        setSelected(new Set());
      }
    } catch {
      setError("Koneksi error. Coba lagi.");
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = selected.size;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Kontak WhatsApp</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Ambil kontak dari nomor WhatsApp yang terhubung lalu tambahkan sebagai tamu. Hanya kontak (nama &amp; nomor) yang dibaca — riwayat chat tidak diakses.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center space-y-3">
          <div className="text-5xl">📱</div>
          <p className="text-gray-700 font-medium">Belum ada WhatsApp yang terhubung</p>
          <Link href="/admin/whatsapp" className="inline-block px-5 py-2.5 bg-[#25d366] text-white rounded-xl text-sm font-medium hover:bg-[#1da851] transition-colors">
            Hubungkan WhatsApp
          </Link>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nomor pengirim</label>
                <select
                  value={selectedSession}
                  onChange={(e) => { setSelectedSession(e.target.value); setContacts(null); setSelected(new Set()); setResult(null); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white"
                >
                  <option value="">— Pilih sesi —</option>
                  {sessions.map((s) => (
                    <option key={s.sessionId} value={s.sessionId}>
                      {s.sessionId}{s.phone ? ` (+${s.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tambah ke grup (opsional)</label>
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white"
                >
                  <option value="">— Tanpa grup —</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => loadContacts(false)}
                disabled={!selectedSession || loading}
                className="px-4 py-2 bg-[var(--color-gold)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-gold-hover)] disabled:opacity-50 transition-colors"
              >
                {loading ? "Memuat…" : contacts === null ? "📇 Muat Kontak" : "↻ Muat Ulang"}
              </button>
              {contacts !== null && (
                <button
                  onClick={() => loadContacts(true)}
                  disabled={!selectedSession || loading}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] disabled:opacity-50 transition-colors"
                  title="Minta WhatsApp menyinkronkan ulang daftar kontak"
                >
                  Sinkron ulang
                </button>
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          {/* Result summary */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <p className="text-sm text-green-700">✓ {result.created} tamu ditambahkan{targetGroup ? " ke grup terpilih" : ""}.</p>
              {result.skipped.length > 0 && (
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer">{result.skipped.length} dilewati</summary>
                  <ul className="mt-1 space-y-0.5 max-h-40 overflow-y-auto">
                    {result.skipped.map((s, i) => (
                      <li key={i} className="flex justify-between gap-2"><span className="truncate">{s.name}</span><span className="text-gray-400 flex-shrink-0">{s.reason}</span></li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {/* Contact list */}
          {contacts !== null && (
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama atau nomor…"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
                />
              </div>

              {contacts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  Tidak ada kontak. Jika baru terhubung, coba &quot;Sinkron ulang&quot; atau buka WhatsApp di HP agar kontak tersinkron.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 accent-[var(--color-gold)]" />
                      Pilih semua ({filtered.length})
                    </label>
                    <span>{selectedCount} dipilih</span>
                  </div>
                  <div className="max-h-[50vh] overflow-y-auto divide-y divide-gray-50 border border-gray-100 rounded-lg">
                    {filtered.map((c) => (
                      <label key={c.phone} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={selected.has(c.phone)} onChange={() => toggleOne(c.phone)} className="w-4 h-4 rounded border-gray-300 accent-[var(--color-gold)] flex-shrink-0" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm text-gray-800 truncate">{c.name || <span className="text-gray-400 italic">tanpa nama</span>}</span>
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{c.phone}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Sticky import action */}
          {selectedCount > 0 && (
            <div className="sticky bottom-16 sm:bottom-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3 flex items-center justify-between gap-3">
              <span className="text-sm text-gray-700">{selectedCount} kontak dipilih</span>
              <button
                onClick={doImport}
                disabled={importing}
                className="px-5 py-2 bg-[var(--color-gold)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-gold-hover)] disabled:opacity-50 transition-colors"
              >
                {importing ? "Menambahkan…" : `Tambah ${selectedCount} ke Tamu`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
