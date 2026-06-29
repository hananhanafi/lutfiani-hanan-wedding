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
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupSaving, setGroupSaving] = useState(false);
  const [groupError, setGroupError] = useState("");

  const [contacts, setContacts] = useState<WAContact[] | null>(null); // null = not loaded yet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: { name: string; reason: string }[] } | null>(null);
  // Review/edit step: editable names before they're saved as guests
  const [reviewList, setReviewList] = useState<{ phone: string; name: string }[] | null>(null);

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

  const createGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    setGroupSaving(true);
    setGroupError("");
    try {
      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGroupError(data.error ?? "Gagal membuat grup.");
      } else {
        setGroups((prev) => [...prev, { id: data.group.id, name: data.group.name }].sort((a, b) => a.name.localeCompare(b.name)));
        setTargetGroup(data.group.id);
        setNewGroupName("");
        setCreatingGroup(false);
      }
    } catch {
      setGroupError("Koneksi error. Coba lagi.");
    } finally {
      setGroupSaving(false);
    }
  };

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

  // Open the editable review step with the selected contacts' names prefilled.
  const openReview = () => {
    const chosen = (contacts ?? []).filter((c) => selected.has(c.phone));
    if (chosen.length === 0) return;
    setError("");
    setResult(null);
    setReviewList(chosen.map((c) => ({ phone: c.phone, name: c.name })));
  };

  const doImport = async () => {
    if (!reviewList) return;
    const guests = reviewList
      .filter((c) => c.phone)
      .map((c) => ({ name: c.name.trim() || c.phone, phone_number: c.phone }));
    if (guests.length === 0) { setReviewList(null); return; }
    setImporting(true);
    setError("");
    try {
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
        setReviewList(null);
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
          Ambil kontak dari nomor WhatsApp yang terhubung lalu tambahkan sebagai tamu. Hanya kontak (nama &amp; nomor) yang dibaca — riwayat chat tidak diakses. Kontak hanya bisa diambil dari browser yang menghubungkan WhatsApp tersebut.
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
                {creatingGroup ? (
                  <div className="flex gap-2">
                    <input
                      value={newGroupName}
                      onChange={(e) => { setNewGroupName(e.target.value); setGroupError(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); createGroup(); } }}
                      placeholder="Nama grup baru"
                      maxLength={100}
                      autoFocus
                      className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
                    />
                    <button
                      onClick={createGroup}
                      disabled={groupSaving || !newGroupName.trim()}
                      className="px-3 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] disabled:opacity-50 transition-colors flex-shrink-0"
                    >
                      {groupSaving ? "…" : "Simpan"}
                    </button>
                    <button
                      onClick={() => { setCreatingGroup(false); setNewGroupName(""); setGroupError(""); }}
                      className="px-3 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm hover:bg-gray-50 transition-colors flex-shrink-0"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={targetGroup}
                      onChange={(e) => setTargetGroup(e.target.value)}
                      className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white"
                    >
                      <option value="">— Tanpa grup —</option>
                      {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <button
                      onClick={() => { setCreatingGroup(true); setGroupError(""); }}
                      className="px-3 py-2 border border-[var(--color-gold)] text-[var(--color-gold)] rounded-lg text-sm hover:bg-[var(--color-cream-dark)] transition-colors flex-shrink-0 whitespace-nowrap"
                      title="Buat grup baru"
                    >
                      + Baru
                    </button>
                  </div>
                )}
                {groupError && <p className="text-xs text-red-500 mt-1">{groupError}</p>}
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
                onClick={openReview}
                className="px-5 py-2 bg-[var(--color-gold)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-gold-hover)] transition-colors"
              >
                Tinjau &amp; Tambah ({selectedCount})
              </button>
            </div>
          )}

          {/* Review & edit names before saving */}
          {reviewList && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
                  <div>
                    <h2 className="text-base font-semibold text-gray-800">Tinjau &amp; Edit Nama</h2>
                    <p className="text-xs text-gray-500">
                      Sesuaikan nama sebelum disimpan{targetGroup ? <> ke grup <span className="font-medium text-[var(--color-gold)]">{groups.find((g) => g.id === targetGroup)?.name}</span></> : ""}.
                    </p>
                  </div>
                  <button onClick={() => setReviewList(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                </div>

                <div className="px-5 py-3 overflow-y-auto flex-1">
                  {reviewList.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">Semua kontak dihapus dari daftar.</p>
                  ) : (
                    <ul className="space-y-2">
                      {reviewList.map((c, i) => (
                        <li key={c.phone} className="flex items-center gap-2">
                          <input
                            value={c.name}
                            onChange={(e) => setReviewList((prev) => prev!.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                            placeholder={c.phone}
                            maxLength={100}
                            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
                          />
                          <span className="text-xs text-gray-400 w-28 truncate text-right flex-shrink-0">{c.phone}</span>
                          <button
                            onClick={() => setReviewList((prev) => prev!.filter((_, idx) => idx !== i))}
                            className="text-gray-300 hover:text-red-500 text-lg leading-none flex-shrink-0"
                            title="Hapus dari daftar"
                          >
                            &times;
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[11px] text-gray-400 mt-3">Nama yang dikosongkan akan memakai nomor telepon.</p>
                </div>

                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
                  <button type="button" onClick={() => setReviewList(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Batal</button>
                  <button
                    type="button"
                    onClick={doImport}
                    disabled={importing || reviewList.length === 0}
                    className="px-5 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] disabled:opacity-50 transition-colors"
                  >
                    {importing ? "Menyimpan…" : `Simpan ${reviewList.length} ke Tamu`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
