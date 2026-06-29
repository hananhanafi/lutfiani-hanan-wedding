"use client";

import { useState, useEffect, useCallback } from "react";
import type { GuestGroup } from "@/types";

type FormState = { name: string; side: "" | "bride" | "groom"; notes: string };
const EMPTY_FORM: FormState = { name: "", side: "", notes: "" };

type GroupGuest = {
  id: string;
  name: string;
  phone_number: string | null;
  plus_one_name: string | null;
  attending: boolean | null;
  checked_in: boolean;
  is_vip: boolean;
};

const sideLabel = (side?: string | null) =>
  side === "bride" ? "Mempelai Wanita" : side === "groom" ? "Mempelai Pria" : null;

export default function GroupsPage() {
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Add guests directly into a group
  const EMPTY_GUEST = { name: "", phone_number: "", plus_one_name: "", side: "" as "" | "bride" | "groom", is_vip: false };
  const [addGuestGroup, setAddGuestGroup] = useState<GuestGroup | null>(null);
  const [guestForm, setGuestForm] = useState(EMPTY_GUEST);
  const [guestSaving, setGuestSaving] = useState(false);
  const [guestError, setGuestError] = useState("");
  const [justAdded, setJustAdded] = useState<string | null>(null);

  // Contact Picker import (Android Chrome and other supporting browsers)
  const [contactSupported, setContactSupported] = useState(false);
  const [importGroup, setImportGroup] = useState<GuestGroup | null>(null);
  const [pickedContacts, setPickedContacts] = useState<{ name: string; phone: string; include: boolean }[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: { name: string; reason: string }[] } | null>(null);

  useEffect(() => {
    const nav = navigator as Navigator & { contacts?: { select?: unknown } };
    setContactSupported(typeof navigator !== "undefined" && !!nav.contacts && typeof nav.contacts.select === "function");
  }, []);

  // Inline expand: show a group's guests when its count is clicked
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [groupGuests, setGroupGuests] = useState<Record<string, GroupGuest[]>>({});
  const [guestsLoading, setGuestsLoading] = useState(false);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!groupGuests[id]) {
      setGuestsLoading(true);
      try {
        const res = await fetch(`/api/admin/groups/${id}`);
        const data = await res.json();
        setGroupGuests((prev) => ({ ...prev, [id]: data.guests ?? [] }));
      } catch {
        setGroupGuests((prev) => ({ ...prev, [id]: [] }));
      } finally {
        setGuestsLoading(false);
      }
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/groups");
      const data = await res.json();
      setGroups(data.groups ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setFormError(""); setShowForm(true); };
  const openEdit = (g: GuestGroup) => {
    setEditingId(g.id);
    setForm({ name: g.name, side: (g.side as "" | "bride" | "groom") ?? "", notes: g.notes ?? "" });
    setFormError("");
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/groups/${editingId}` : "/api/admin/groups";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, side: form.side || null, notes: form.notes || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Gagal menyimpan grup.");
      } else if (editingId) {
        // Replace in place — preserve the manual order
        setGroups((prev) => prev.map((g) => (g.id === editingId ? data.group : g)));
        setShowForm(false);
      } else {
        // New groups are appended at the end (server assigns the next position)
        setGroups((prev) => [...prev, data.group]);
        setShowForm(false);
      }
    } catch {
      setFormError("Koneksi error. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/groups/${id}`, { method: "DELETE" });
      if (res.ok) setGroups((prev) => prev.filter((g) => g.id !== id));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const persistOrder = async (ordered: GuestGroup[]) => {
    try {
      const res = await fetch("/api/admin/groups/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: ordered.map((g) => g.id) }),
      });
      if (!res.ok) load(); // resync from server if persistence failed
    } catch {
      load();
    }
  };

  const openAddGuest = (g: GuestGroup) => {
    setAddGuestGroup(g);
    setGuestForm({ ...EMPTY_GUEST, side: (g.side as "" | "bride" | "groom") ?? "" });
    setGuestError("");
    setJustAdded(null);
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addGuestGroup) return;
    setGuestError("");
    setGuestSaving(true);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...guestForm, group_id: addGuestGroup.id, attending: null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGuestError(data.error ?? "Gagal menambahkan tamu.");
      } else {
        setJustAdded(data.guest?.name ?? guestForm.name);
        // Bump the group's guest count locally
        setGroups((prev) => prev.map((g) => (g.id === addGuestGroup.id ? { ...g, guest_count: (g.guest_count ?? 0) + 1 } : g)));
        // Invalidate the cached guest list so the inline expand refetches
        setGroupGuests((prev) => { const next = { ...prev }; delete next[addGuestGroup.id]; return next; });
        // Keep the group + side selected; clear the rest so the next guest is quick to add
        setGuestForm((p) => ({ ...EMPTY_GUEST, side: p.side }));
      }
    } catch {
      setGuestError("Koneksi error. Coba lagi.");
    } finally {
      setGuestSaving(false);
    }
  };

  // Open the OS contact picker, then stage the chosen contacts for review.
  const pickContactsForGroup = async (g: GuestGroup) => {
    type ContactInfo = { name?: string[]; tel?: string[] };
    const nav = navigator as Navigator & {
      contacts?: { select?: (props: string[], opts?: { multiple?: boolean }) => Promise<ContactInfo[]> };
    };
    if (!nav.contacts?.select) return;
    try {
      const selected = await nav.contacts.select(["name", "tel"], { multiple: true });
      const mapped = selected
        .map((c) => ({ name: (c.name?.[0] ?? "").trim(), phone: (c.tel?.[0] ?? "").trim(), include: true }))
        .filter((c) => c.phone); // a guest needs a phone number
      if (mapped.length === 0) return; // cancelled or no usable contacts
      setAddGuestGroup(null);   // close the single-add modal if it was open
      setImportResult(null);
      setImportGroup(g);
      setPickedContacts(mapped);
    } catch {
      // user dismissed the picker, or it's unavailable — no-op
    }
  };

  const submitImport = async () => {
    if (!importGroup) return;
    const guests = pickedContacts
      .filter((c) => c.include && c.name.trim() && c.phone.trim())
      .map((c) => ({ name: c.name.trim(), phone_number: c.phone.trim(), side: importGroup.side ?? null }));
    if (guests.length === 0) { setImportGroup(null); return; }

    setImporting(true);
    try {
      const res = await fetch("/api/admin/guests/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: importGroup.id, guests }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult({ created: data.created ?? 0, skipped: data.skipped ?? [] });
        setGroups((prev) => prev.map((g) => (g.id === importGroup.id ? { ...g, guest_count: (g.guest_count ?? 0) + (data.created ?? 0) } : g)));
        setGroupGuests((prev) => { const next = { ...prev }; delete next[importGroup.id]; return next; });
        setPickedContacts([]);
      } else {
        setImportResult({ created: 0, skipped: [{ name: "—", reason: data.error ?? "Gagal mengimpor." }] });
      }
    } catch {
      setImportResult({ created: 0, skipped: [{ name: "—", reason: "Koneksi error." }] });
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (i: number) => {
    if (dragIndex !== null && dragIndex !== i) {
      const next = [...groups];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(i, 0, moved);
      setGroups(next);
      persistOrder(next);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Master Grup Tamu</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola daftar grup/asal tamu yang dipakai di seluruh panel</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-[var(--color-gold)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-gold-hover)] transition-colors"
        >
          + Tambah Grup
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Belum ada grup. Tambah grup pertama.
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">Seret grup untuk mengubah urutan.</p>
          {groups.map((g, i) => (
            <div key={g.id}>
            <div
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => { e.preventDefault(); handleDrop(i); }}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              className={`flex flex-col gap-3 sm:flex-row sm:items-center p-4 rounded-xl border bg-white border-gray-200 transition-all ${
                dragIndex === i ? "opacity-40" : ""
              } ${dragOverIndex === i && dragIndex !== i ? "ring-2 ring-[var(--color-gold)]" : ""}`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-gray-300 cursor-grab active:cursor-grabbing select-none flex-shrink-0 mt-1" title="Seret untuk mengubah urutan">⠿</span>
              <div className="w-9 h-9 rounded-full bg-[var(--color-cream-dark)] flex items-center justify-center text-[var(--color-gold)] font-semibold text-sm flex-shrink-0">
                {g.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800">{g.name}</span>
                  {sideLabel(g.side) && (
                    <span className="text-[10px] px-2 py-0.5 bg-pink-50 text-pink-600 rounded-full">{sideLabel(g.side)}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleExpand(g.id)}
                    className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {g.guest_count ?? 0} tamu {expandedId === g.id ? "▲" : "▼"}
                  </button>
                </div>
                {g.notes && <p className="text-xs text-gray-400 truncate mt-0.5">{g.notes}</p>}
              </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-shrink-0 pl-8 sm:pl-0">
                <button
                  onClick={() => openAddGuest(g)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-cream-dark)] transition-colors"
                >
                  + Tamu
                </button>
                <button
                  onClick={() => openEdit(g)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors"
                >
                  Ubah
                </button>
                {confirmDeleteId === g.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(g.id)}
                      disabled={deletingId === g.id}
                      className="text-xs px-2.5 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      {deletingId === g.id ? "..." : "Hapus"}
                    </button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500">Batal</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(g.id)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-red-400 hover:border-red-300 hover:bg-red-50 transition-colors"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>

            {expandedId === g.id && (
              <div className="ml-12 mt-1 mb-1 rounded-xl border border-gray-100 bg-gray-50 p-3">
                {guestsLoading && !groupGuests[g.id] ? (
                  <p className="text-xs text-gray-400">Memuat tamu…</p>
                ) : (groupGuests[g.id]?.length ?? 0) === 0 ? (
                  <p className="text-xs text-gray-400">Belum ada tamu di grup ini.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {groupGuests[g.id].map((gu) => (
                      <li key={gu.id} className="flex items-center justify-between gap-2 py-1.5">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-700 truncate">
                            {gu.name}
                            {gu.is_vip && <span className="ml-1 text-[10px] text-[var(--color-gold)]">★ VIP</span>}
                          </p>
                          {gu.plus_one_name && <p className="text-[11px] text-gray-400 truncate">Pasangan: {gu.plus_one_name}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[11px] text-gray-400">{gu.phone_number ?? "—"}</span>
                          {gu.checked_in && <span className="text-[10px] text-green-600">✓ hadir</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            </div>
          ))}
        </div>
      )}

      {confirmDeleteId && (
        <p className="text-xs text-amber-600">
          Menghapus grup akan melepas tautannya dari tamu terkait (label grup pada tamu tersebut akan dikosongkan). Data tamu tidak dihapus.
        </p>
      )}

      {/* Contact import review / result modal */}
      {importGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Impor dari Kontak</h2>
                <p className="text-xs text-gray-500">ke grup <span className="font-medium text-[var(--color-gold)]">{importGroup.name}</span></p>
              </div>
              <button onClick={() => { setImportGroup(null); setPickedContacts([]); setImportResult(null); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            {importResult ? (
              <div className="px-5 py-5 space-y-3 overflow-y-auto">
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  ✓ {importResult.created} tamu ditambahkan ke <span className="font-medium">{importGroup.name}</span>.
                </p>
                {importResult.skipped.length > 0 && (
                  <div className="text-xs text-gray-500">
                    <p className="font-medium text-gray-600 mb-1">{importResult.skipped.length} dilewati:</p>
                    <ul className="space-y-0.5 max-h-40 overflow-y-auto">
                      {importResult.skipped.map((s, i) => (
                        <li key={i} className="flex justify-between gap-2"><span className="truncate">{s.name}</span><span className="text-gray-400 flex-shrink-0">{s.reason}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex justify-end pt-1">
                  <button onClick={() => { setImportGroup(null); setImportResult(null); }} className="px-5 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] transition-colors">Selesai</button>
                </div>
              </div>
            ) : (
              <>
                <div className="px-5 py-3 overflow-y-auto flex-1">
                  <p className="text-xs text-gray-500 mb-3">{pickedContacts.filter((c) => c.include).length} dari {pickedContacts.length} kontak dipilih. Hapus centang untuk melewati.</p>
                  <ul className="space-y-2">
                    {pickedContacts.map((c, i) => (
                      <li key={i} className={`flex items-center gap-2 rounded-lg border p-2 ${c.include ? "border-gray-200" : "border-gray-100 opacity-50"}`}>
                        <input
                          type="checkbox"
                          checked={c.include}
                          onChange={(e) => setPickedContacts((prev) => prev.map((x, idx) => idx === i ? { ...x, include: e.target.checked } : x))}
                          className="w-4 h-4 rounded border-gray-300 accent-[var(--color-gold)] flex-shrink-0"
                        />
                        <input
                          value={c.name}
                          onChange={(e) => setPickedContacts((prev) => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                          placeholder="Nama"
                          className="flex-1 min-w-0 border border-gray-200 rounded px-2 py-1 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
                        />
                        <span className="text-xs text-gray-400 flex-shrink-0 w-28 truncate text-right">{c.phone}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
                  <button type="button" onClick={() => { setImportGroup(null); setPickedContacts([]); }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Batal</button>
                  <button
                    type="button"
                    onClick={submitImport}
                    disabled={importing || pickedContacts.filter((c) => c.include && c.name.trim()).length === 0}
                    className="px-5 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] disabled:opacity-50 transition-colors"
                  >
                    {importing ? "Mengimpor..." : `Tambah ${pickedContacts.filter((c) => c.include && c.name.trim()).length} Tamu`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add guests to a group modal */}
      {addGuestGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Tambah Tamu</h2>
                <p className="text-xs text-gray-500">ke grup <span className="font-medium text-[var(--color-gold)]">{addGuestGroup.name}</span></p>
              </div>
              <button onClick={() => setAddGuestGroup(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddGuest} className="px-5 py-5 space-y-4">
              {contactSupported && (
                <button
                  type="button"
                  onClick={() => addGuestGroup && pickContactsForGroup(addGuestGroup)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-[var(--color-gold)] text-[var(--color-gold)] text-sm hover:bg-[var(--color-cream-dark)] transition-colors"
                >
                  📇 Impor dari Kontak HP
                </button>
              )}
              {justAdded && (
                <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  ✓ <span className="font-medium">{justAdded}</span> ditambahkan. Tambah tamu berikutnya?
                </p>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nama <span className="text-red-400">*</span></label>
                <input
                  required
                  value={guestForm.name}
                  onChange={(e) => setGuestForm((p) => ({ ...p, name: e.target.value }))}
                  maxLength={100}
                  placeholder="Nama lengkap"
                  autoFocus
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">No. WhatsApp <span className="text-red-400">*</span></label>
                <input
                  required
                  type="tel"
                  value={guestForm.phone_number}
                  onChange={(e) => setGuestForm((p) => ({ ...p, phone_number: e.target.value }))}
                  maxLength={30}
                  placeholder="0812345678"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pendamping</label>
                  <input
                    value={guestForm.plus_one_name}
                    onChange={(e) => setGuestForm((p) => ({ ...p, plus_one_name: e.target.value }))}
                    maxLength={100}
                    placeholder="Nama pasangan"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pihak</label>
                  <select
                    value={guestForm.side}
                    onChange={(e) => setGuestForm((p) => ({ ...p, side: e.target.value as "" | "bride" | "groom" }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white"
                  >
                    <option value="">—</option>
                    <option value="bride">Mempelai Wanita</option>
                    <option value="groom">Mempelai Pria</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={guestForm.is_vip}
                  onChange={(e) => setGuestForm((p) => ({ ...p, is_vip: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-[var(--color-gold)]"
                />
                <span className="text-sm font-medium text-gray-700">Tamu VIP</span>
              </label>
              {guestError && <p className="text-sm text-red-500">{guestError}</p>}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setAddGuestGroup(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Selesai</button>
                <button type="submit" disabled={guestSaving} className="px-5 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] disabled:opacity-50 transition-colors">
                  {guestSaving ? "Menambahkan..." : "Tambah Tamu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">{editingId ? "Ubah Grup" : "Tambah Grup Baru"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nama Grup <span className="text-red-400">*</span></label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  maxLength={100}
                  placeholder="cth. Keluarga, Kampus, Kantor"
                  autoFocus
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pihak <span className="text-gray-400 text-[10px] normal-case">(opsional)</span></label>
                <select
                  value={form.side}
                  onChange={(e) => setForm((p) => ({ ...p, side: e.target.value as "" | "bride" | "groom" }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white"
                >
                  <option value="">—</option>
                  <option value="bride">Mempelai Wanita</option>
                  <option value="groom">Mempelai Pria</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Catatan <span className="text-gray-400 text-[10px] normal-case">(opsional)</span></label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  maxLength={200}
                  placeholder="Keterangan singkat"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
                />
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Batal</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] disabled:opacity-50 transition-colors">
                  {saving ? "Menyimpan..." : editingId ? "Simpan" : "Buat Grup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
