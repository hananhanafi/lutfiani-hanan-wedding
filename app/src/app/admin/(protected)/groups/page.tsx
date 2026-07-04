"use client";

import { useState, useEffect, useCallback } from "react";
import type { GuestGroup } from "@/types";

type FormState = { name: string; side: "" | "bride" | "groom"; notes: string; expected_pax: string };
const EMPTY_FORM: FormState = { name: "", side: "", notes: "", expected_pax: "" };

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

  // Group invitation QR modal
  const [qrModal, setQrModal] = useState<{ name: string; url: string; dataUrl: string } | null>(null);
  const [qrLoadingId, setQrLoadingId] = useState<string | null>(null);
  const openQr = async (g: GuestGroup) => {
    setQrLoadingId(g.id);
    try {
      const res = await fetch(`/api/admin/groups/${g.id}/qr`);
      const data = await res.json();
      if (res.ok) setQrModal({ name: data.name, url: data.url, dataUrl: data.qrDataUrl });
    } catch {
      /* ignore */
    } finally {
      setQrLoadingId(null);
    }
  };

  // Group check-in history + undo
  const [historyGroup, setHistoryGroup] = useState<GuestGroup | null>(null);
  const [historyEvents, setHistoryEvents] = useState<{ id: string; pax: number; created_at: string }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [undoingId, setUndoingId] = useState<string | null>(null);

  const openHistory = async (g: GuestGroup) => {
    setHistoryGroup(g);
    setHistoryEvents([]);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/admin/groups/${g.id}/checkins`);
      const data = await res.json();
      setHistoryEvents(data.events ?? []);
    } catch {
      /* ignore */
    } finally {
      setHistoryLoading(false);
    }
  };

  const undoCheckin = async (eventId: string) => {
    if (!historyGroup) return;
    setUndoingId(eventId);
    try {
      const res = await fetch(`/api/admin/groups/${historyGroup.id}/checkins?eventId=${eventId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setHistoryEvents((prev) => prev.filter((e) => e.id !== eventId));
        setGroups((prev) => prev.map((g) => (g.id === historyGroup.id ? { ...g, arrived_pax: data.arrived_pax } : g)));
      }
    } finally {
      setUndoingId(null);
    }
  };

  // Send group invitation into a WhatsApp group chat
  const [sendWaGroup, setSendWaGroup] = useState<GuestGroup | null>(null);
  const [waSessions, setWaSessions] = useState<{ sessionId: string; status: string; phone: string | null }[]>([]);
  const [waSession, setWaSession] = useState("");
  const [waList, setWaList] = useState<{ jid: string; subject: string }[] | null>(null);
  const [waSelectedJid, setWaSelectedJid] = useState("");
  const [waLoadingGroups, setWaLoadingGroups] = useState(false);
  const [waSending, setWaSending] = useState(false);
  const [waMsg, setWaMsg] = useState("");
  // OTP gate before sending to a WhatsApp group
  const [waOtpStep, setWaOtpStep] = useState<"idle" | "otp">("idle");
  const [waOtpCode, setWaOtpCode] = useState("");
  const [waOtpSending, setWaOtpSending] = useState(false);
  const [waOtpVerifying, setWaOtpVerifying] = useState(false);
  const [waOtpError, setWaOtpError] = useState("");
  const [waOtpLast4, setWaOtpLast4] = useState("");

  const resetWaOtp = () => {
    setWaOtpStep("idle");
    setWaOtpCode("");
    setWaOtpError("");
    setWaOtpLast4("");
    setWaOtpSending(false);
    setWaOtpVerifying(false);
  };

  const openSendWa = async (g: GuestGroup) => {
    setSendWaGroup(g);
    setWaList(null);
    setWaSession("");
    setWaSelectedJid(g.wa_group_jid ?? "");
    setWaMsg("");
    resetWaOtp();
    try {
      const res = await fetch("/api/admin/whatsapp-sessions");
      const data = await res.json();
      const connected = (data.sessions ?? []).filter((s: { status: string }) => s.status === "connected");
      setWaSessions(connected);
      if (connected.length === 1) setWaSession(connected[0].sessionId);
    } catch {
      setWaSessions([]);
    }
  };

  const loadWaGroups = async () => {
    if (!waSession) return;
    setWaLoadingGroups(true);
    setWaMsg("");
    try {
      const res = await fetch(`/api/admin/groups/wa-groups?sessionId=${encodeURIComponent(waSession)}`);
      const data = await res.json();
      if (!res.ok) { setWaMsg(data.error ?? "Gagal memuat grup WhatsApp."); setWaList([]); }
      else setWaList(data.groups ?? []);
    } catch {
      setWaMsg("Koneksi error.");
      setWaList([]);
    } finally {
      setWaLoadingGroups(false);
    }
  };

  // Gate the send behind OTP verification of the sender number (1-day window).
  const startSendWa = async () => {
    if (!sendWaGroup || !waSelectedJid || !waSession) return;
    setWaMsg("");
    setWaOtpError("");
    // Already verified within the window? send straight away.
    try {
      const chk = await fetch(`/api/admin/whatsapp-otp?sessionId=${encodeURIComponent(waSession)}`);
      const chkData = await chk.json();
      if (chkData.verified) { doSendWa(); return; }
    } catch { /* fall through to OTP */ }

    // Request a fresh OTP to the sender's own number.
    setWaOtpSending(true);
    setWaOtpStep("otp");
    setWaOtpCode("");
    try {
      const res = await fetch("/api/admin/whatsapp-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: waSession }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWaOtpError(data.error ?? "Gagal mengirim OTP");
      } else if (data.alreadyVerified) {
        resetWaOtp();
        doSendWa();
        return;
      } else {
        setWaOtpLast4(data.phoneLast4 ?? "");
      }
    } catch {
      setWaOtpError("Gagal mengirim OTP");
    } finally {
      setWaOtpSending(false);
    }
  };

  const verifyOtpAndSend = async () => {
    if (waOtpCode.length !== 6) return;
    setWaOtpVerifying(true);
    setWaOtpError("");
    try {
      const res = await fetch("/api/admin/whatsapp-otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: waSession, code: waOtpCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setWaOtpError(data.error ?? "OTP tidak valid");
        return;
      }
      resetWaOtp();
      doSendWa();
    } catch {
      setWaOtpError("Gagal memverifikasi OTP");
    } finally {
      setWaOtpVerifying(false);
    }
  };

  const doSendWa = async () => {
    if (!sendWaGroup || !waSelectedJid || !waSession) return;
    const sel = (waList ?? []).find((x) => x.jid === waSelectedJid);
    setWaSending(true);
    setWaMsg("");
    try {
      const res = await fetch(`/api/admin/groups/${sendWaGroup.id}/send-wa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: waSession, waGroupJid: waSelectedJid, waGroupName: sel?.subject ?? null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWaMsg(data.error ?? "Gagal mengirim.");
      } else {
        setWaMsg("✓ Undangan terkirim ke grup WhatsApp.");
        setGroups((prev) => prev.map((g) => (g.id === sendWaGroup.id ? { ...g, wa_group_jid: waSelectedJid, wa_group_name: sel?.subject ?? null } : g)));
      }
    } catch {
      setWaMsg("Koneksi error.");
    } finally {
      setWaSending(false);
    }
  };

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
    setForm({
      name: g.name,
      side: (g.side as "" | "bride" | "groom") ?? "",
      notes: g.notes ?? "",
      expected_pax: g.expected_pax != null ? String(g.expected_pax) : "",
    });
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
        body: JSON.stringify({
          name: form.name,
          side: form.side || null,
          notes: form.notes || null,
          ...(editingId ? { expected_pax: form.expected_pax.trim() === "" ? null : Number(form.expected_pax) } : {}),
        }),
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
        <div className="flex items-center gap-2 flex-shrink-0">
          {groups.length > 0 && (
            <a
              href="/api/admin/groups/export-qr"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors whitespace-nowrap"
            >
              🖨️ Cetak QR
            </a>
          )}
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-[var(--color-gold)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-gold-hover)] transition-colors whitespace-nowrap"
          >
            + Tambah Grup
          </button>
        </div>
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
                <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>
                    👥 Hadir {g.arrived_pax ?? 0} / {g.expected_pax_effective ?? 0} orang
                    {g.expected_pax == null && <span className="text-gray-300"> (auto)</span>}
                  </span>
                  {(g.arrived_pax ?? 0) > 0 && (
                    <button onClick={() => openHistory(g)} className="text-[var(--color-gold)] hover:underline">Riwayat</button>
                  )}
                </div>
              </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-shrink-0 pl-8 sm:pl-0">
                <button
                  onClick={() => openQr(g)}
                  disabled={qrLoadingId === g.id}
                  className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors disabled:opacity-50"
                >
                  {qrLoadingId === g.id ? "…" : "QR"}
                </button>
                <button
                  onClick={() => openSendWa(g)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-[#25d366] text-[#1da851] hover:bg-[#25d366]/10 transition-colors"
                  title={g.wa_group_name ? `Terhubung: ${g.wa_group_name}` : "Kirim undangan ke grup WhatsApp"}
                >
                  Kirim WA
                </button>
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
              {editingId && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Perkiraan jumlah orang <span className="text-gray-400 text-[10px] normal-case">(opsional)</span></label>
                  <input
                    type="number"
                    min={0}
                    value={form.expected_pax}
                    onChange={(e) => setForm((p) => ({ ...p, expected_pax: e.target.value }))}
                    placeholder="Otomatis dari anggota"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Kosongkan untuk hitung otomatis (anggota + pasangan).</p>
                </div>
              )}
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

      {/* Send group invitation to a WhatsApp group */}
      {sendWaGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Kirim ke Grup WhatsApp</h2>
                <p className="text-xs text-gray-500">Grup: <span className="font-medium text-[var(--color-gold)]">{sendWaGroup.name}</span></p>
              </div>
              <button onClick={() => setSendWaGroup(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            <div className="px-5 py-4 space-y-4 overflow-y-auto">
              {waOtpStep === "otp" ? (
                <div className="space-y-4">
                  {waOtpSending ? (
                    <div className="flex flex-col items-center py-4 space-y-3">
                      <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin" />
                      <p className="text-sm text-gray-600">Mengirim kode OTP ke nomor pengirim…</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-center space-y-1">
                        <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center text-2xl">🔐</div>
                        <p className="text-sm text-gray-600">Kode OTP telah dikirim ke nomor pengirim</p>
                        {waOtpLast4 && <p className="text-xs text-gray-400">Nomor berakhiran ****{waOtpLast4}</p>}
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Masukkan 6 digit OTP"
                        value={waOtpCode}
                        onChange={(e) => { setWaOtpCode(e.target.value.replace(/\D/g, "")); setWaOtpError(""); }}
                        className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                        autoFocus
                      />
                      {waOtpError && <p className="text-xs text-red-500 text-center">{waOtpError}</p>}
                      <div className="flex items-center justify-between">
                        <button onClick={() => { resetWaOtp(); }} className="text-xs text-gray-400 hover:text-gray-600">← Batal</button>
                        <button onClick={startSendWa} className="text-xs text-green-600 hover:text-green-700">Kirim ulang OTP</button>
                      </div>
                    </>
                  )}
                </div>
              ) : waSessions.length === 0 ? (
                <p className="text-sm text-amber-600">Tidak ada sesi WhatsApp yang terhubung.</p>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Kirim dari</label>
                    <div className="flex gap-2">
                      <select
                        value={waSession}
                        onChange={(e) => { setWaSession(e.target.value); setWaList(null); setWaSelectedJid(""); }}
                        className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white"
                      >
                        <option value="">— Pilih sesi —</option>
                        {waSessions.map((s) => <option key={s.sessionId} value={s.sessionId}>{s.sessionId}{s.phone ? ` (+${s.phone})` : ""}</option>)}
                      </select>
                      <button
                        onClick={loadWaGroups}
                        disabled={!waSession || waLoadingGroups}
                        className="px-3 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] disabled:opacity-50 transition-colors flex-shrink-0"
                      >
                        {waLoadingGroups ? "…" : "Muat Grup"}
                      </button>
                    </div>
                  </div>

                  {waList && (
                    waList.length === 0 ? (
                      <p className="text-sm text-gray-400">Tidak ada grup WhatsApp pada akun ini.</p>
                    ) : (
                      <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                        {waList.map((wg) => (
                          <label key={wg.jid} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="wa-group"
                              checked={waSelectedJid === wg.jid}
                              onChange={() => setWaSelectedJid(wg.jid)}
                              className="accent-[var(--color-gold)]"
                            />
                            <span className="text-sm text-gray-800 truncate">{wg.subject || wg.jid}</span>
                          </label>
                        ))}
                      </div>
                    )
                  )}

                  {waMsg && <p className={`text-sm ${waMsg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{waMsg}</p>}
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
              <button type="button" onClick={() => { resetWaOtp(); setSendWaGroup(null); }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Tutup</button>
              {waOtpStep === "otp" ? (
                <button
                  type="button"
                  onClick={verifyOtpAndSend}
                  disabled={waOtpCode.length !== 6 || waOtpVerifying || waSending}
                  className="px-5 py-2 bg-[#25d366] text-white rounded-lg text-sm font-medium hover:bg-[#1da851] disabled:opacity-50 transition-colors"
                >
                  {waOtpVerifying ? "Memverifikasi…" : waSending ? "Mengirim…" : "Verifikasi & Kirim"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startSendWa}
                  disabled={!waSelectedJid || !waSession || waSending}
                  className="px-5 py-2 bg-[#25d366] text-white rounded-lg text-sm font-medium hover:bg-[#1da851] disabled:opacity-50 transition-colors"
                >
                  {waSending ? "Mengirim…" : "Kirim Undangan"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Group check-in history + undo */}
      {historyGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Riwayat Check-in</h2>
                <p className="text-xs text-gray-500">{historyGroup.name}</p>
              </div>
              <button onClick={() => setHistoryGroup(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-5 py-4 overflow-y-auto">
              {historyLoading ? (
                <p className="text-sm text-gray-400">Memuat…</p>
              ) : historyEvents.length === 0 ? (
                <p className="text-sm text-gray-400">Belum ada riwayat check-in.</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {historyEvents.map((ev) => (
                    <li key={ev.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm text-gray-800">+{ev.pax} orang</p>
                        <p className="text-[11px] text-gray-400">{new Date(ev.created_at).toLocaleString("id-ID")}</p>
                      </div>
                      <button
                        onClick={() => undoCheckin(ev.id)}
                        disabled={undoingId === ev.id}
                        className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-red-400 hover:border-red-300 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        {undoingId === ev.id ? "…" : "Batalkan"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Group invitation QR modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-5 text-center">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800 truncate">{qrModal.name}</h2>
              <button onClick={() => setQrModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none flex-shrink-0">&times;</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrModal.dataUrl} alt="QR Undangan Grup" className="w-56 h-56 mx-auto rounded-xl" />
            <p className="text-[11px] text-gray-400 mt-2 break-all">{qrModal.url}</p>
            <div className="flex gap-2 mt-4">
              <a href={qrModal.dataUrl} download={`qr-${qrModal.name}.png`} className="flex-1 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] transition-colors">Unduh</a>
              <a href={qrModal.url} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">Buka Pass</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
