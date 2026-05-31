"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface WASession {
  sessionId: string;
  status: "disconnected" | "connecting" | "qr" | "connected";
  phone: string | null;
}

type WizardStep = "create" | "method" | "qr" | "pair-phone" | "pair-code" | "success";

export default function WhatsAppPage() {
  const [sessions, setSessions] = useState<WASession[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Wizard
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>("create");
  const [wizardId, setWizardId] = useState("");
  const [wizardError, setWizardError] = useState("");
  const [wizardBusy, setWizardBusy] = useState(false);
  const [wizardPhone, setWizardPhone] = useState<string | null>(null);
  const [activeWizardId, setActiveWizardId] = useState<string | null>(null);

  // Phone pairing
  const [pairPhoneInput, setPairPhoneInput] = useState("");
  const [pairCode, setPairCode] = useState<string | null>(null);

  // QR
  const [qrData, setQrData] = useState<{ sessionId: string; qr: string } | null>(null);
  const [qrCountdown, setQrCountdown] = useState(60);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp-sessions");
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  // Detect wizard session becoming connected
  useEffect(() => {
    if (!activeWizardId) return;
    if (wizardStep !== "qr" && wizardStep !== "pair-code") return;
    const s = sessions.find((x) => x.sessionId === activeWizardId);
    if (s?.status === "connected") {
      setWizardPhone(s.phone);
      setWizardStep("success");
      setQrData(null);
      stopCountdown();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, activeWizardId, wizardStep]);

  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setQrCountdown(60);
    countdownRef.current = setInterval(() => {
      setQrCountdown((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
  }, []);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  useEffect(() => () => stopCountdown(), [stopCountdown]);

  const refreshQr = useCallback(
    async (sessionId: string) => {
      try {
        const res = await fetch(`/api/admin/whatsapp-sessions/${sessionId}/qr`);
        const data = await res.json();
        if (data.qr) {
          setQrData({ sessionId, qr: data.qr });
          startCountdown();
        } else if (data.status === "connected") {
          setQrData(null);
          stopCountdown();
          fetchSessions();
        }
      } catch {
        /* ignore */
      }
    },
    [fetchSessions, startCountdown, stopCountdown]
  );

  // Auto-refresh QR every 15s
  useEffect(() => {
    if (!qrData) return;
    const interval = setInterval(() => refreshQr(qrData.sessionId), 15000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrData?.sessionId, refreshQr]);

  const openWizard = () => {
    setWizardId("");
    setWizardStep("create");
    setWizardError("");
    setWizardPhone(null);
    setActiveWizardId(null);
    setPairPhoneInput("");
    setPairCode(null);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setQrData(null);
    setPairCode(null);
    stopCountdown();
  };

  // Step 1 → 2: just advance to method picker (no network call yet)
  const handleWizardStart = () => {
    const id = wizardId.trim();
    if (!id) return;
    setWizardError("");
    setWizardStep("method");
  };

  // Method: QR — create session + connect + get QR
  const handleMethodQr = async () => {
    const id = wizardId.trim();
    setWizardError("");
    setWizardBusy(true);
    try {
      await fetch("/api/admin/whatsapp-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: id }),
      });
      const res = await fetch(`/api/admin/whatsapp-sessions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
      const data = await res.json();
      if (data.qr) {
        setQrData({ sessionId: id, qr: data.qr });
        setActiveWizardId(id);
        setWizardStep("qr");
        startCountdown();
        fetchSessions();
      } else if (data.status === "connected") {
        const s = sessions.find((x) => x.sessionId === id);
        setWizardPhone(s?.phone ?? null);
        setActiveWizardId(id);
        setWizardStep("success");
        fetchSessions();
      } else {
        setWizardError(data.error ?? "Tidak ada QR. Coba lagi.");
        setWizardStep("method");
      }
    } catch {
      setWizardError("Gagal menghubungkan. Periksa koneksi server WhatsApp.");
      setWizardStep("method");
    } finally {
      setWizardBusy(false);
    }
  };

  // Method: Phone pairing — show phone number input
  const handleMethodPhone = () => {
    setWizardError("");
    setPairPhoneInput("");
    setPairCode(null);
    setWizardStep("pair-phone");
  };

  // Phone pairing: request code
  const handleRequestPairCode = async () => {
    const id = wizardId.trim();
    const phone = pairPhoneInput.replace(/[^0-9]/g, "");
    if (!phone) {
      setWizardError("Masukkan nomor telepon yang valid.");
      return;
    }
    setWizardError("");
    setWizardBusy(true);
    try {
      const res = await fetch(`/api/admin/whatsapp-sessions/${id}/pairing-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWizardError(data.error ?? "Gagal mendapatkan kode. Coba lagi.");
      } else {
        setPairCode(data.code ?? null);
        setActiveWizardId(id);
        setWizardStep("pair-code");
        fetchSessions();
      }
    } catch {
      setWizardError("Gagal menghubungkan ke server WhatsApp.");
    } finally {
      setWizardBusy(false);
    }
  };

  const connectSession = (sessionId: string) => {
    // Re-open wizard at the method picker for the existing session
    setWizardId(sessionId);
    setWizardStep("method");
    setWizardError("");
    setWizardPhone(null);
    setActiveWizardId(null);
    setPairPhoneInput("");
    setPairCode(null);
    setWizardOpen(true);
  };

  const disconnectSession = async (sessionId: string) => {
    setActionLoading(sessionId);
    try {
      await fetch(`/api/admin/whatsapp-sessions/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      fetchSessions();
    } catch {
      alert("Gagal memutus");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm(`Hapus sesi "${sessionId}"? Data autentikasi akan hilang.`)) return;
    setActionLoading(sessionId);
    try {
      await fetch(`/api/admin/whatsapp-sessions/${sessionId}`, { method: "DELETE" });
      fetchSessions();
    } catch {
      alert("Gagal menghapus");
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, [string, string, string]> = {
      connected:    ["bg-green-50 text-green-700",   "bg-green-500",  "Terhubung"],
      connecting:   ["bg-yellow-50 text-yellow-700", "bg-yellow-500", "Menghubungkan..."],
      qr:           ["bg-blue-50 text-blue-700",     "bg-yellow-500", "Menunggu QR"],
      disconnected: ["bg-gray-100 text-gray-600",    "bg-gray-400",   "Terputus"],
    };
    const [cls, dot, label] = map[status] ?? map.disconnected;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
        <span className={`w-2 h-2 rounded-full mr-1.5 ${dot}`} />
        {label}
      </span>
    );
  };

  const STEPS = ["Nama Sesi", "Sambungkan", "Selesai"];
  const stepIdx =
    wizardStep === "create" || wizardStep === "method" ? 0
    : wizardStep === "success" ? 2
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">WhatsApp</h1>
        <button
          onClick={fetchSessions}
          className="text-sm text-[var(--color-gold)] hover:text-[var(--color-gold-hover)] transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Wizard Modal */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Hubungkan WhatsApp</h2>
              <button onClick={closeWizard} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            {/* Step indicators */}
            <div className="flex items-center px-5 pt-4 pb-2">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      i < stepIdx ? "bg-green-500 text-white" : i === stepIdx ? "bg-[var(--color-gold)] text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      {i < stepIdx ? "✓" : i + 1}
                    </div>
                    <span className={`text-[10px] mt-1 ${i === stepIdx ? "text-[var(--color-gold)] font-medium" : "text-gray-400"}`}>
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px w-4 mb-4 flex-shrink-0 ${i < stepIdx ? "bg-green-300" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Create */}
            {wizardStep === "create" && (
              <div className="px-5 pb-6 pt-2 space-y-4">
                <p className="text-sm text-gray-600">Beri nama untuk nomor WhatsApp yang akan mengirim undangan.</p>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nama Sesi</label>
                  <input
                    type="text"
                    value={wizardId}
                    onChange={(e) => setWizardId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                    placeholder="ortu / ayah / mama"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && wizardId.trim() && handleWizardStart()}
                  />
                  <p className="text-xs text-gray-400 mt-1">Hanya huruf &amp; angka. Contoh: ortu, ayah, mama atau nama</p>
                </div>
                {wizardError && <p className="text-sm text-red-500">{wizardError}</p>}
                <button
                  onClick={handleWizardStart}
                  disabled={!wizardId.trim()}
                  className="w-full py-2.5 bg-[#25d366] text-white rounded-xl text-sm font-medium hover:bg-[#1da851] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Lanjut →
                </button>
              </div>
            )}

            {/* Step 1b: Method picker */}
            {wizardStep === "method" && (
              <div className="px-5 pb-6 pt-2 space-y-3">
                <p className="text-sm text-gray-600">Pilih cara menghubungkan <span className="font-medium text-gray-800">{wizardId}</span>:</p>
                {wizardError && <p className="text-sm text-red-500">{wizardError}</p>}
                <button
                  onClick={handleMethodQr}
                  disabled={wizardBusy}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 border-gray-200 hover:border-[var(--color-gold)] hover:bg-[var(--color-cream-dark)] disabled:opacity-50 transition-colors text-left"
                >
                  <span className="text-3xl flex-shrink-0">📷</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Scan QR Code</p>
                    <p className="text-xs text-gray-500 mt-0.5">Perlu 2 perangkat — buka WhatsApp di HP lain dan scan kode QR</p>
                  </div>
                </button>
                <button
                  onClick={handleMethodPhone}
                  disabled={wizardBusy}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 border-gray-200 hover:border-[var(--color-gold)] hover:bg-[var(--color-cream-dark)] disabled:opacity-50 transition-colors text-left"
                >
                  <span className="text-3xl flex-shrink-0">📱</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Kode Nomor Telepon</p>
                    <p className="text-xs text-gray-500 mt-0.5">Cukup 1 perangkat — masukkan kode 8 karakter di aplikasi WhatsApp Anda</p>
                  </div>
                </button>
                <button onClick={() => setWizardStep("create")} className="text-xs text-gray-400 hover:text-gray-600">
                  ← Ganti nama sesi
                </button>
              </div>
            )}

            {/* Step 2a: Enter phone number for pairing */}
            {wizardStep === "pair-phone" && (
              <div className="px-5 pb-6 pt-2 space-y-4">
                <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 space-y-1">
                  <p className="font-semibold">Nomor telepon WhatsApp yang akan ditautkan</p>
                  <p className="text-xs text-blue-600">Masukkan nomor yang terdaftar di WhatsApp (format internasional, tanpa +)</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nomor Telepon</label>
                  <input
                    type="tel"
                    value={pairPhoneInput}
                    onChange={(e) => { setPairPhoneInput(e.target.value); setWizardError(""); }}
                    placeholder="6281234567890"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:border-[var(--color-gold)] font-mono tracking-wide"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && !wizardBusy && handleRequestPairCode()}
                  />
                  <p className="text-xs text-gray-400 mt-1">Contoh: 6281234567890 (tanpa + atau spasi)</p>
                </div>
                {wizardError && <p className="text-sm text-red-500">{wizardError}</p>}
                <button
                  onClick={handleRequestPairCode}
                  disabled={!pairPhoneInput.trim() || wizardBusy}
                  className="w-full py-2.5 bg-[#25d366] text-white rounded-xl text-sm font-medium hover:bg-[#1da851] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {wizardBusy ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Mengambil kode...
                    </span>
                  ) : "Dapatkan Kode →"}
                </button>
                <button onClick={() => setWizardStep("method")} className="text-xs text-gray-400 hover:text-gray-600">
                  ← Kembali
                </button>
              </div>
            )}

            {/* Step 2b: Display pairing code */}
            {wizardStep === "pair-code" && (
              <div className="px-5 pb-6 pt-2 space-y-4">
                <div className="bg-[var(--color-cream-dark)] rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Cara memasukkan kode di HP:</p>
                  <div className="space-y-2">
                    {[
                      ["1", "Buka WhatsApp di HP Anda"],
                      ["2", "Ketuk ⋮ (titik tiga) → Perangkat Tertaut"],
                      ["3", "Ketuk \"Tautkan Perangkat\""],
                      ["4", "Ketuk \"Tautkan dengan nomor telepon\""],
                      ["5", "Masukkan kode 8 karakter di bawah ini"],
                    ].map(([n, text]) => (
                      <div key={n} className="flex items-center gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-gold)] text-white text-[10px] font-bold flex items-center justify-center">{n}</span>
                        <span className="text-xs text-gray-700">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {pairCode ? (
                  <div className="flex flex-col items-center space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Kode Pemasangan</p>
                    <div className="bg-gray-900 text-green-400 font-mono text-3xl font-bold tracking-[0.35em] px-6 py-4 rounded-2xl select-all">
                      {pairCode}
                    </div>
                    <p className="text-xs text-gray-400">Ketuk untuk menyalin</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4 space-y-2">
                    <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Mengambil kode...</p>
                  </div>
                )}

                <p className="text-xs text-center text-gray-400">
                  Setelah Anda memasukkan kode, halaman ini otomatis lanjut.
                </p>
              </div>
            )}

            {/* Step 2: QR */}
            {wizardStep === "qr" && (
              <div className="px-5 pb-6 pt-2 space-y-4">
                <div className="bg-[var(--color-cream-dark)] rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Cara scan di HP:</p>
                  <div className="space-y-2">
                    {[
                      ["1", "Buka WhatsApp di HP"],
                      ["2", "Ketuk ⋮ (titik tiga) → Perangkat Tertaut"],
                      ["3", "Ketuk \"Tautkan Perangkat\""],
                      ["4", "Arahkan kamera ke QR di bawah"],
                    ].map(([n, text]) => (
                      <div key={n} className="flex items-center gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-gold)] text-white text-[10px] font-bold flex items-center justify-center">{n}</span>
                        <span className="text-xs text-gray-700">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {qrData ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="bg-white p-3 rounded-xl border-2 border-gray-100 shadow-sm">
                      <img src={qrData.qr} alt="QR Code WhatsApp" className="w-52 h-52 block" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-9 h-9 flex-shrink-0">
                        <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                          <circle
                            cx="18" cy="18" r="14" fill="none"
                            stroke={qrCountdown > 20 ? "#22c55e" : "#f59e0b"}
                            strokeWidth="3"
                            strokeDasharray={`${2 * Math.PI * 14}`}
                            strokeDashoffset={`${2 * Math.PI * 14 * (1 - qrCountdown / 60)}`}
                            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-600">{qrCountdown}s</span>
                      </div>
                      <span className="text-xs text-gray-500">QR kedaluwarsa dalam {qrCountdown} detik</span>
                    </div>
                    <button onClick={() => refreshQr(qrData.sessionId)} className="text-xs text-[var(--color-gold)] hover:underline">
                      ↻ Perbarui QR manual
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 space-y-2">
                    <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Memuat QR...</p>
                  </div>
                )}

                <p className="text-xs text-center text-gray-400">Setelah scan, halaman ini otomatis lanjut ke langkah berikutnya.</p>
              </div>
            )}

            {/* Step 3: Success */}
            {wizardStep === "success" && (
              <div className="px-5 pb-6 pt-3 text-center space-y-4">
                <div className="flex flex-col items-center space-y-3 py-2">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-800">WhatsApp Terhubung!</p>
                    {wizardPhone && <p className="text-sm text-gray-500 mt-0.5">Nomor: <span className="font-medium text-gray-700">+{wizardPhone}</span></p>}
                    <p className="text-xs text-gray-400 mt-0.5">Sesi: {activeWizardId}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Sekarang buka halaman{" "}
                  <Link href="/admin/kirim" onClick={closeWizard} className="font-medium text-[var(--color-gold)] hover:underline">Kirim Undangan</Link>{" "}
                  untuk mulai kirim ke tamu.
                </p>
                <button
                  onClick={closeWizard}
                  className="w-full py-2.5 bg-[var(--color-gold)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-gold-hover)] transition-colors"
                >
                  Selesai
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat...</div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center space-y-4">
          <div className="text-6xl">📱</div>
          <div>
            <p className="text-gray-700 font-medium text-lg">Belum ada perangkat terhubung</p>
            <p className="text-sm text-gray-400 mt-1">Hubungkan WhatsApp untuk bisa kirim undangan</p>
          </div>
          <button
            onClick={openWizard}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#25d366] text-white rounded-xl font-medium hover:bg-[#1da851] transition-colors"
          >
            📲 Hubungkan WhatsApp Sekarang
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={openWizard}
            className="flex items-center gap-2 px-4 py-2 bg-[#25d366] text-white rounded-xl text-sm font-medium hover:bg-[#1da851] transition-colors"
          >
            + Tambah Perangkat
          </button>
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.sessionId} className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${s.status === "connected" ? "bg-green-50" : "bg-gray-100"}`}>
                    📱
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800">{s.sessionId}</span>
                      {statusBadge(s.status)}
                    </div>
                    {s.phone ? (
                      <p className="text-sm text-gray-500 mt-0.5">+{s.phone}</p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">Belum terhubung</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.status === "connected" ? (
                    <button
                      onClick={() => disconnectSession(s.sessionId)}
                      disabled={actionLoading === s.sessionId}
                      className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      Putuskan
                    </button>
                  ) : (
                    <button
                      onClick={() => connectSession(s.sessionId)}
                      disabled={actionLoading === s.sessionId}
                      className="px-3 py-1.5 text-sm bg-[#25d366] text-white rounded-lg hover:bg-[#1da851] disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === s.sessionId ? "..." : "Hubungkan"}
                    </button>
                  )}
                  <button
                    onClick={() => deleteSession(s.sessionId)}
                    disabled={actionLoading === s.sessionId}
                    className="px-2 py-1.5 text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors"
                    title="Hapus sesi"
                  >
                    🗑
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
