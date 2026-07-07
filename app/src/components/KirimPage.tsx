"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Guest } from "@/types";
import { EditGuestModal } from "@/components/GuestTable";

interface WASession {
  sessionId: string;
  status: string;
  phone: string | null;
}

type SendStep = "idle" | "pick-sender" | "otp" | "sending" | "done";

interface SendResult {
  guestId: string;
  name: string;
  success: boolean;
  error?: string;
  senderNumber?: string | null;
  sentBy?: string | null;
}

export default function KirimPage({
  guests: initialGuests,
  coupleName,
}: {
  guests: Guest[];
  coupleName: string;
}) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [sessions, setSessions] = useState<WASession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Filter
  const [tab, setTab] = useState<"all" | "unsent" | "sent">("unsent");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Send flow
  const [sendStep, setSendStep] = useState<SendStep>("idle");
  const [selectedSession, setSelectedSession] = useState("");
  const [messageType, setMessageType] = useState<"muslim" | "general">("muslim");

  // Message preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewText, setPreviewText] = useState("");
  const [previewGuestName, setPreviewGuestName] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  // Manual wa.me step-through (ban-safe alternative — operator sends from their own WhatsApp)
  const [waManual, setWaManual] = useState<{ queue: Guest[]; index: number } | null>(null);
  const [waManualBusy, setWaManualBusy] = useState(false);

  const startWaManual = () => {
    const queue = guests.filter((g) => selectedIds.has(g.id) && g.phone_number?.trim());
    if (queue.length === 0) return;
    setWaManual({ queue, index: 0 });
  };

  const openCurrentWa = async () => {
    if (!waManual) return;
    const g = waManual.queue[waManual.index];
    if (!g) return;
    // Mobile → open the WhatsApp app directly via the whatsapp:// deep link
    // (skips the wa.me "Continue to Chat" landing page). Desktop → web.whatsapp.com
    // /send opens the chat directly when logged in. wa.me is the fallback.
    const isMobile = /android|iphone|ipad|ipod|iemobile|opera mini|mobile/i.test(
      typeof navigator !== "undefined" ? navigator.userAgent : ""
    );
    // Pre-open a tab within the click gesture (desktop only) so popup blockers allow it.
    const win = isMobile ? null : window.open("about:blank", "_blank");
    try {
      const res = await fetch("/api/admin/send-whatsapp/wa-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: g.id, messageType }),
      });
      const data = await res.json();
      if (res.ok && data.phone && data.text != null) {
        const enc = encodeURIComponent(data.text);
        if (isMobile) {
          // Same-tab navigation to the app scheme; the OS switches to WhatsApp
          // and this admin page stays put underneath.
          window.location.href = `whatsapp://send?phone=${data.phone}&text=${enc}`;
        } else {
          const url = `https://web.whatsapp.com/send?phone=${data.phone}&text=${enc}`;
          if (win) win.location.href = url; else window.open(url, "_blank");
        }
      } else if (res.ok && data.url) {
        // Fallback to the wa.me landing page
        if (win) win.location.href = data.url; else window.open(data.url, "_blank");
      } else {
        win?.close();
        alert(data.error ?? "Gagal membuat link WhatsApp.");
      }
    } catch {
      win?.close();
      alert("Koneksi error.");
    }
  };

  const waManualNext = async (markSent: boolean) => {
    if (!waManual) return;
    const g = waManual.queue[waManual.index];
    if (markSent && g) {
      setWaManualBusy(true);
      try {
        await fetch("/api/admin/send-whatsapp/mark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestId: g.id }),
        });
        setGuests((prev) => prev.map((x) => (x.id === g.id ? { ...x, whatsapp_status: "sent" as const } : x)));
      } catch {
        /* ignore */
      } finally {
        setWaManualBusy(false);
      }
    }
    const next = waManual.index + 1;
    if (next >= waManual.queue.length) {
      setWaManual(null);
      setSelectedIds(new Set());
    } else {
      setWaManual({ ...waManual, index: next });
    }
  };

  const openPreview = async () => {
    const g = guests.find((x) => selectedIds.has(x.id) && x.phone_number?.trim());
    if (!g) return;
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewText("");
    try {
      const res = await fetch("/api/admin/send-whatsapp/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: g.id, messageType }),
      });
      const data = await res.json();
      if (res.ok) { setPreviewText(data.message ?? ""); setPreviewGuestName(data.guestName ?? ""); }
      else setPreviewText(data.error ?? "Gagal memuat pratinjau.");
    } catch {
      setPreviewText("Koneksi error.");
    } finally {
      setPreviewLoading(false);
    }
  };
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpPhoneLast4, setOtpPhoneLast4] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [sentSoFar, setSentSoFar] = useState(0);
  const [totalSending, setTotalSending] = useState(0);
  const [results, setResults] = useState<SendResult[]>([]);

  // Search
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState(""); // "" = all, "__none__" = no group, else group_id

  // Add guest
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone_number: "", group_id: "", side: "" as "" | "bride" | "groom", is_vip: false });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");

  // Guest-group master data (for the quick-add dropdown)
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    let active = true;
    fetch("/api/admin/groups")
      .then((r) => r.json())
      .then((d) => { if (active) setGroups(d.groups ?? []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Edit guest
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddSaving(true);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, attending: null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error ?? "Gagal menambahkan tamu.");
      } else {
        setGuests((prev) => [data.guest, ...prev]);
        setAddForm({ name: "", phone_number: "", group_id: "", side: "", is_vip: false });
        setShowAddModal(false);
      }
    } catch {
      setAddError("Koneksi error. Coba lagi.");
    } finally {
      setAddSaving(false);
    }
  };

  useEffect(() => {
    fetch("/api/admin/whatsapp-sessions")
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, []);



  const connectedSessions = sessions.filter((s) => s.status === "connected");

  const isWaSent = (g: Guest) =>
    g.whatsapp_status === "sent" ||
    g.whatsapp_status === "delivered" ||
    g.whatsapp_status === "read";

  const allGuests = guests.filter((g) => g.phone_number?.trim());
  // Scope = search + group filter (but NOT the sent/unsent tab). Tab counters
  // are derived from this so they reflect the active group filter.
  const scoped = allGuests.filter((g) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      g.name.toLowerCase().includes(q) ||
      (g.phone_number ?? "").includes(q) ||
      (g.group_name ?? "").toLowerCase().includes(q);
    if (!matchSearch) return false;
    const matchGroup =
      !groupFilter ||
      (groupFilter === "__none__" ? !g.group_id : g.group_id === groupFilter);
    return matchGroup;
  });
  const filtered = scoped.filter((g) => {
    if (tab === "unsent") return !isWaSent(g);
    if (tab === "sent") return isWaSent(g);
    return true;
  });

  const allCount = scoped.length;
  const unsentCount = scoped.filter((g) => !isWaSent(g)).length;
  const sentCount = scoped.filter((g) => isWaSent(g)).length;

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((g) => selectedIds.has(g.id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((g) => next.delete(g.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((g) => next.add(g.id));
        return next;
      });
    }
  };

  const selectAllUnsent = () => {
    const ids = allGuests.filter((g) => !isWaSent(g)).map((g) => g.id);
    setSelectedIds(new Set(ids));
    setTab("unsent");
  };

  // ── Send flow ──
  const startSend = () => {
    if (selectedIds.size === 0 || !selectedSession) return;
    handleSelectSender(selectedSession);
  };

  const handleSelectSender = async (sessionId: string) => {
    setSelectedSession(sessionId);
    setOtpCode("");
    setOtpError("");
    setOtpSending(true);
    setSendStep("otp");
    try {
      // Check if already verified within 1-hour window
      const checkRes = await fetch(`/api/admin/whatsapp-otp?sessionId=${encodeURIComponent(sessionId)}`);
      const checkData = await checkRes.json();
      if (checkData.verified) {
        setOtpPhoneLast4(checkData.phoneLast4 ?? "");
        setOtpSending(false);
        await doSend();
        return;
      }
      // No valid verification — send a new OTP
      const res = await fetch("/api/admin/whatsapp-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error ?? "Gagal mengirim OTP");
      } else if (data.alreadyVerified) {
        setOtpPhoneLast4(data.phoneLast4 ?? "");
        setOtpSending(false);
        await doSend();
        return;
      } else {
        setOtpPhoneLast4(data.phoneLast4 ?? "");
      }
    } catch {
      setOtpError("Gagal mengirim OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpVerifying(true);
    setOtpError("");
    try {
      const res = await fetch("/api/admin/whatsapp-otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedSession, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setOtpError(data.error ?? "OTP tidak valid");
        setOtpVerifying(false);
        return;
      }
    } catch {
      setOtpError("Gagal memverifikasi OTP");
      setOtpVerifying(false);
      return;
    }
    setOtpVerifying(false);
    await doSend();
  };

  const doSend = async () => {
    const toSend = guests.filter(
      (g) => selectedIds.has(g.id) && g.phone_number?.trim()
    );
    setSendStep("sending");
    setResults([]);
    setSentSoFar(0);
    setTotalSending(toSend.length);

    const allResults: SendResult[] = [];
    const CHUNK = 5;

    for (let i = 0; i < toSend.length; i += CHUNK) {
      const chunk = toSend.slice(i, i + CHUNK);
      try {
        const res = await fetch("/api/admin/send-whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestIds: chunk.map((g) => g.id),
            sessionId: selectedSession,
            messageType,
          }),
        });
        const data = await res.json();
        allResults.push(...(data.results ?? []));
      } catch {
        allResults.push(
          ...chunk.map((g) => ({
            guestId: g.id,
            name: g.name,
            success: false,
            error: "Network error",
          }))
        );
      }
      setResults([...allResults]);
      setSentSoFar(allResults.length);
    }

    // Update local guest state
    setGuests((prev) =>
      prev.map((g) => {
        const r = allResults.find((x) => x.guestId === g.id);
        if (r?.success) return { ...g, whatsapp_status: "sent" as const, whatsapp_sender_number: r.senderNumber ?? selectedSession, whatsapp_sent_by: r.sentBy ?? null };
        return g;
      })
    );
    setSendStep("done");
  };

  const resetSend = () => {
    setSendStep("idle");
    setSelectedIds(new Set());
    setResults([]);
  };

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  const waStatusBadge = (g: Guest) => {
    if (isWaSent(g))
      return (
        <span className="inline-flex flex-col gap-0.5">
          <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">✓ Terkirim</span>
          {g.whatsapp_sender_number && <span className="text-[10px] text-gray-400">📱 {g.whatsapp_sender_number}</span>}
        </span>
      );
    if (g.whatsapp_status === "failed")
      return <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full">✗ Gagal</span>;
    return <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">Belum</span>;
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Add Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Tambah Tamu Baru</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddGuest} className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nama <span className="text-red-400">*</span></label>
                <input
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
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
                  value={addForm.phone_number}
                  onChange={(e) => setAddForm((p) => ({ ...p, phone_number: e.target.value }))}
                  maxLength={30}
                  placeholder="0812345678"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Grup</label>
                  <select
                    value={addForm.group_id}
                    onChange={(e) => setAddForm((p) => ({ ...p, group_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white"
                  >
                    <option value="">— Tanpa grup —</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pihak</label>
                  <select
                    value={addForm.side}
                    onChange={(e) => setAddForm((p) => ({ ...p, side: e.target.value as "" | "bride" | "groom" }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white"
                  >
                    <option value="">—</option>
                    <option value="bride">Mempelai Wanita</option>
                    <option value="groom">Mempelai Pria</option>
                  </select>
                </div>
              </div>
              {addError && <p className="text-sm text-red-500">{addError}</p>}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addForm.is_vip}
                  onChange={(e) => setAddForm((p) => ({ ...p, is_vip: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-[var(--color-gold)]"
                />
                <span className="text-sm font-medium text-gray-700">Tamu VIP</span>
                <span className="text-xs text-gray-400">(undangan khusus)</span>
              </label>
              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Batal</button>
                <button type="submit" disabled={addSaving} className="px-5 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] disabled:opacity-50 transition-colors">
                  {addSaving ? "Menambahkan..." : "Tambah Tamu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Kirim Undangan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kirim undangan WhatsApp ke tamu dengan mudah</p>
        </div>
        <button
          onClick={() => { setAddForm({ name: "", phone_number: "", group_id: "", side: "", is_vip: false }); setAddError(""); setShowAddModal(true); }}
          className="flex-shrink-0 px-3 py-2 bg-[var(--color-gold)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-gold-hover)] transition-colors"
        >
          + Tamu
        </button>
      </div>

      {/* Sender picker */}
      {sessionsLoading ? (
        <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
      ) : connectedSessions.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-white text-sm flex-shrink-0">!</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">WhatsApp Belum Terhubung</p>
            <p className="text-xs text-amber-700 mt-0.5">Hubungkan untuk kirim otomatis, atau pilih tamu di bawah lalu tekan <span className="font-semibold">📱 Kirim Manual</span> untuk kirim dari WhatsApp Anda sendiri.</p>
          </div>
          <Link
            href="/admin/whatsapp"
            className="flex-shrink-0 text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors whitespace-nowrap"
          >
            Hubungkan →
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pengirim WhatsApp</p>
          <div className="space-y-2">
            {connectedSessions.map((s) => (
              <button
                key={s.sessionId}
                onClick={() => setSelectedSession(s.sessionId)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-colors text-left ${
                  selectedSession === s.sessionId
                    ? "border-[#25d366] bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  selectedSession === s.sessionId ? "border-[#25d366] bg-[#25d366]" : "border-gray-300"
                }`}>
                  {selectedSession === s.sessionId && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{s.sessionId}</p>
                  {s.phone && <p className="text-xs text-gray-500">+{s.phone}</p>}
                </div>
                {selectedSession === s.sessionId && (
                  <span className="text-xs text-[#25d366] font-medium flex-shrink-0">✓ Dipilih</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick action */}
      {/* {unsentCount > 0 && connectedSessions.length > 0 && (
        <button
          onClick={selectAllUnsent}
          className="w-full py-3 bg-[var(--color-cream-dark)] border border-[var(--color-gold)] text-[var(--color-gold)] rounded-xl text-sm font-medium hover:bg-[var(--color-gold)] hover:text-white transition-colors"
        >
          Pilih Semua yang Belum Terkirim ({unsentCount} tamu)
        </button>
      )} */}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {(
          [
            ["all", `Semua (${allCount})`],
            ["unsent", `Belum (${unsentCount})`],
            ["sent", `Terkirim (${sentCount})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === key ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search + group filter */}
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau nomor..."
          className="flex-1 min-w-0 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[var(--color-gold)] bg-white shadow-sm"
        />
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[var(--color-gold)] bg-white shadow-sm max-w-[45%]"
        >
          <option value="">Semua grup</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          <option value="__none__">Tanpa grup</option>
        </select>
      </div>

      {/* Select-all row */}
      {filtered.length > 0 && (
        <label className="flex items-center gap-3 px-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={toggleAll}
            className="w-4 h-4 rounded border-gray-300 accent-[var(--color-gold)] cursor-pointer"
          />
          <span className="text-sm text-gray-600">
            {allFilteredSelected ? "Batal pilih semua" : `Pilih semua (${filtered.length})`}
          </span>
          {selectedIds.size > 0 && (
            <span className="ml-auto text-xs font-medium text-[var(--color-gold)]">
              {selectedIds.size} dipilih
            </span>
          )}
        </label>
      )}

      {/* Guest cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">Tidak ada tamu ditemukan.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((g) => {
            const selected = selectedIds.has(g.id);
            return (
              <label
                key={g.id}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-colors ${
                  selected
                    ? "border-[var(--color-gold)] bg-[var(--color-cream-dark)]"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleSelect(g.id)}
                  className="w-4 h-4 rounded border-gray-300 accent-[var(--color-gold)] cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800 truncate">{g.name}</span>
                    {g.is_vip && <span className="text-[10px] px-1.5 py-0.5 bg-[var(--color-cream-dark)] text-[var(--color-gold)] rounded-full">⭐ VIP</span>}
                    {waStatusBadge(g)}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{g.phone_number}</p>
                  {g.group_name && (
                    <p className="text-[10px] text-gray-400 truncate">{g.group_name}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setEditingGuest(g); }}
                  className="flex-shrink-0 p-1.5 text-gray-400 hover:text-[var(--color-gold)] transition-colors"
                  title="Edit tamu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </label>
            );
          })}
        </div>
      )}

      {/* Fixed bottom send bar */}
      {selectedIds.size > 0 && sendStep === "idle" && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex flex-col gap-2 sm:relative sm:bottom-auto sm:border-0 sm:bg-transparent sm:p-0 sm:mt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Tipe pesan:</span>
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              {([["muslim", "🕌 Muslim"], ["general", "Umum"]] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMessageType(val)}
                  className={`px-3 py-1 text-xs transition-colors ${
                    messageType === val ? "bg-[var(--color-gold)] text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={openPreview}
              className="ml-auto text-xs text-[var(--color-gold)] hover:underline whitespace-nowrap"
            >
              👁 Pratinjau
            </button>
          </div>
          <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">{selectedIds.size} tamu dipilih</p>
            <p className="text-xs text-gray-400 truncate">
              {selectedSession
                ? `Via: ${selectedSession}`
                : connectedSessions.length === 0
                ? "WhatsApp belum terhubung"
                : "Pilih pengirim di atas"}
            </p>
          </div>
          {connectedSessions.length === 0 ? (
            // No connected number → manual wa.me is the primary way to send
            <>
              <button
                onClick={startWaManual}
                title="Kirim manual dari WhatsApp Anda sendiri (aman dari blokir)"
                className="flex-shrink-0 px-5 py-2.5 bg-[#25d366] text-white rounded-xl text-sm font-medium hover:bg-[#1da851] transition-colors whitespace-nowrap"
              >
                📱 Kirim Manual
              </button>
              <Link
                href="/admin/whatsapp"
                className="flex-shrink-0 text-xs text-amber-600 hover:underline whitespace-nowrap"
              >
                Hubungkan WA
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={startWaManual}
                title="Kirim manual dari WhatsApp Anda sendiri (aman dari blokir)"
                className="flex-shrink-0 px-3 py-2.5 border border-[#25d366] text-[#1da851] rounded-xl text-sm font-medium hover:bg-[#25d366]/10 transition-colors whitespace-nowrap"
              >
                Manual
              </button>
              <button
                onClick={startSend}
                disabled={!selectedSession}
                className="flex-shrink-0 px-5 py-2.5 bg-[#25d366] text-white rounded-xl text-sm font-medium hover:bg-[#1da851] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Kirim WA →
              </button>
            </>
          )}
          </div>
        </div>
      )}

      {/* Manual wa.me step-through */}
      {waManual && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Kirim Manual (wa.me)</h2>
                <p className="text-xs text-gray-500">{waManual.index + 1} dari {waManual.queue.length} tamu</p>
              </div>
              <button onClick={() => setWaManual(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div className="text-center">
                <p className="text-lg font-medium text-gray-800">{waManual.queue[waManual.index]?.name}</p>
                <p className="text-xs text-gray-400">{waManual.queue[waManual.index]?.phone_number}</p>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Buka WhatsApp, tekan kirim, lalu kembali ke sini dan tandai terkirim. QR masuk sudah disertakan sebagai link di dalam pesan.
              </p>
              <button
                onClick={openCurrentWa}
                className="w-full py-3 bg-[#25d366] text-white rounded-xl text-sm font-medium hover:bg-[#1da851] transition-colors"
              >
                Buka WhatsApp
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => waManualNext(false)}
                  disabled={waManualBusy}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Lewati
                </button>
                <button
                  onClick={() => waManualNext(true)}
                  disabled={waManualBusy}
                  className="flex-1 py-2.5 bg-[var(--color-gold)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-gold-hover)] disabled:opacity-50 transition-colors"
                >
                  {waManualBusy ? "..." : "Tandai Terkirim →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Pratinjau Pesan</h2>
                <p className="text-xs text-gray-500">
                  {messageType === "general" ? "Tipe: Umum" : "Tipe: Muslim"}
                  {previewGuestName && ` · contoh untuk ${previewGuestName}`}
                </p>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-5 py-4 overflow-y-auto">
              {previewLoading ? (
                <p className="text-sm text-gray-400">Memuat…</p>
              ) : (
                <div className="bg-[#f3fbef] border border-green-100 rounded-xl p-3 text-sm text-gray-800 whitespace-pre-wrap break-words">
                  {previewText}
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-2">
                QR code masuk dikirim sebagai pesan terpisah setelah teks ini.
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-5 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit guest modal */}
      {editingGuest && (
        <EditGuestModal
          guest={editingGuest}
          onClose={() => setEditingGuest(null)}
          onUpdated={(updated) => {
            setGuests((prev) => prev.map((g) => g.id === updated.id ? updated : g));
            setEditingGuest(null);
          }}
        />
      )}

      {/* ── Send Modal ── */}
      {sendStep !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">
                {sendStep === "pick-sender"
                  ? "Pilih Pengirim"
                  : sendStep === "otp"
                  ? "Verifikasi OTP"
                  : sendStep === "sending"
                  ? "Mengirim..."
                  : "Selesai"}
              </h2>
              {sendStep !== "sending" && (
                <button onClick={resetSend} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              )}
            </div>

            <div className="px-5 py-5 space-y-4">
              {/* Pick sender — fallback if somehow reached */}
              {sendStep === "pick-sender" && (
                <>
                  <p className="text-sm text-gray-600">Pilih nomor WhatsApp pengirim:</p>
                  <div className="space-y-2">
                    {connectedSessions.map((s) => (
                      <button
                        key={s.sessionId}
                        onClick={() => handleSelectSender(s.sessionId)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors text-left"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">{s.sessionId}</p>
                          {s.phone && <p className="text-xs text-gray-400">+{s.phone}</p>}
                        </div>
                        <span className="text-green-500 text-lg">→</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* OTP */}
              {sendStep === "otp" && (
                <>
                  {otpSending ? (
                    <div className="flex flex-col items-center py-4 space-y-2">
                      <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin" />
                      <p className="text-sm text-gray-500">Mengirim kode OTP...</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-center space-y-1">
                        <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center text-2xl">🔐</div>
                        <p className="text-sm text-gray-600">Kode OTP dikirim ke nomor pengirim</p>
                        {otpPhoneLast4 && (
                          <p className="text-xs text-gray-400">Nomor berakhiran ****{otpPhoneLast4}</p>
                        )}
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="6 digit OTP"
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value.replace(/\D/g, ""));
                          setOtpError("");
                        }}
                        className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                        autoFocus
                      />
                      {otpError && <p className="text-sm text-red-500 text-center">{otpError}</p>}
                      <div className="flex items-center justify-between">
                        <button onClick={() => setSendStep("pick-sender")} className="text-xs text-gray-400 hover:text-gray-600">← Ganti</button>
                        <button onClick={() => handleSelectSender(selectedSession)} disabled={otpSending} className="text-xs text-green-600 hover:text-green-700 disabled:opacity-50">Kirim ulang</button>
                      </div>
                      <button
                        onClick={handleVerifyOtp}
                        disabled={otpCode.length !== 6 || otpVerifying}
                        className="w-full py-2.5 bg-[#25d366] text-white rounded-xl text-sm font-medium hover:bg-[#1da851] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {otpVerifying ? "Memverifikasi..." : `Verifikasi & Kirim (${selectedIds.size} tamu)`}
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Sending — live progress */}
              {sendStep === "sending" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Mengirim undangan...</span>
                    <span className="font-medium text-gray-800">{sentSoFar} / {totalSending}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#25d366] rounded-full transition-all duration-500"
                      style={{ width: `${totalSending > 0 ? (sentSoFar / totalSending) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {results.map((r) => (
                      <div key={r.guestId} className="flex items-center gap-2 px-2 py-1 text-sm">
                        <span className={r.success ? "text-green-500 flex-shrink-0" : "text-red-400 flex-shrink-0"}>
                          {r.success ? "✓" : "✗"}
                        </span>
                        <span className="text-gray-700 flex-1 truncate">{r.name}</span>
                        {!r.success && <span className="text-xs text-red-400 shrink-0">{r.error}</span>}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-center text-gray-400">Jangan tutup halaman ini</p>
                </div>
              )}

              {/* Done */}
              {sendStep === "done" && (
                <div className="space-y-4">
                  <div className="text-center space-y-2 py-2">
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">Selesai!</p>
                    <p className="text-sm text-green-600">{successCount} pesan berhasil dikirim</p>
                    {failCount > 0 && <p className="text-sm text-red-500">{failCount} gagal</p>}
                  </div>
                  {failCount > 0 && (
                    <div className="max-h-32 overflow-y-auto border border-red-100 rounded-xl divide-y divide-red-50">
                      {results.filter((r) => !r.success).map((r) => (
                        <div key={r.guestId} className="flex items-center gap-2 px-3 py-2 text-sm">
                          <span className="text-gray-700 flex-1 truncate">{r.name}</span>
                          <span className="text-xs text-red-400 shrink-0">{r.error}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={resetSend}
                    className="w-full py-2.5 bg-[var(--color-gold)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-gold-hover)] transition-colors"
                  >
                    Selesai
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
