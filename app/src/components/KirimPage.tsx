"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Guest } from "@/types";

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

  // Add guest
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone_number: "", group_name: "", side: "" as "" | "bride" | "groom" });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");

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
        setAddForm({ name: "", phone_number: "", group_name: "", side: "" });
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
  const filtered = allGuests.filter((g) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      g.name.toLowerCase().includes(q) ||
      (g.phone_number ?? "").includes(q) ||
      (g.group_name ?? "").toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (tab === "unsent") return !isWaSent(g);
    if (tab === "sent") return isWaSent(g);
    return true;
  });

  const unsentCount = allGuests.filter((g) => !isWaSent(g)).length;
  const sentCount = allGuests.filter((g) => isWaSent(g)).length;

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
    if (selectedIds.size === 0) return;
    if (connectedSessions.length === 1) {
      handleSelectSender(connectedSessions[0].sessionId);
    } else {
      setSendStep("pick-sender");
    }
  };

  const handleSelectSender = async (sessionId: string) => {
    setSelectedSession(sessionId);
    setOtpCode("");
    setOtpError("");
    setOtpSending(true);
    setSendStep("otp");
    try {
      const res = await fetch("/api/admin/whatsapp-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error ?? "Gagal mengirim OTP");
      } else {
        setOtpPhoneLast4(data.phone ?? "");
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
    const CHUNK = 10;

    for (let i = 0; i < toSend.length; i += CHUNK) {
      const chunk = toSend.slice(i, i + CHUNK);
      try {
        const res = await fetch("/api/admin/send-whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestIds: chunk.map((g) => g.id),
            sessionId: selectedSession,
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
        if (r?.success) return { ...g, whatsapp_status: "sent" as const };
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
      return <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">✓ Terkirim</span>;
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
                  <input
                    value={addForm.group_name}
                    onChange={(e) => setAddForm((p) => ({ ...p, group_name: e.target.value }))}
                    maxLength={100}
                    placeholder="cth. Keluarga"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
                  />
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
          onClick={() => { setAddForm({ name: "", phone_number: "", group_name: "", side: "" }); setAddError(""); setShowAddModal(true); }}
          className="flex-shrink-0 px-3 py-2 bg-[var(--color-gold)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-gold-hover)] transition-colors"
        >
          + Tamu
        </button>
      </div>

      {/* WhatsApp status banner */}
      {sessionsLoading ? null : connectedSessions.length > 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm flex-shrink-0">
            ✓
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800">WhatsApp Terhubung</p>
            <p className="text-xs text-green-600 truncate">
              {connectedSessions.map((s) => `${s.sessionId}${s.phone ? ` (+${s.phone})` : ""}`).join(", ")}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-white text-sm flex-shrink-0">
            !
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">WhatsApp Belum Terhubung</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Hubungkan WhatsApp terlebih dahulu agar bisa kirim undangan.
            </p>
          </div>
          <Link
            href="/admin/whatsapp"
            className="flex-shrink-0 text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors whitespace-nowrap"
          >
            Hubungkan →
          </Link>
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
            ["all", `Semua (${allGuests.length})`],
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

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari nama atau nomor..."
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[var(--color-gold)] bg-white shadow-sm"
      />

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
              </label>
            );
          })}
        </div>
      )}

      {/* Fixed bottom send bar */}
      {selectedIds.size > 0 && sendStep === "idle" && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 sm:relative sm:bottom-auto sm:border-0 sm:bg-transparent sm:p-0 sm:mt-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">{selectedIds.size} tamu dipilih</p>
            <p className="text-xs text-gray-400">
              {guests.filter((g) => selectedIds.has(g.id) && !g.phone_number?.trim()).length > 0
                ? `${guests.filter((g) => selectedIds.has(g.id) && !g.phone_number?.trim()).length} tanpa nomor (dilewati)`
                : "Semua punya nomor WA"}
            </p>
          </div>
          <button
            onClick={startSend}
            disabled={connectedSessions.length === 0}
            className="flex-shrink-0 px-5 py-2.5 bg-[#25d366] text-white rounded-xl text-sm font-medium hover:bg-[#1da851] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Kirim WA →
          </button>
        </div>
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
              {/* Pick sender */}
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
