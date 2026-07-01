"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const QrScanner = dynamic(() => import("@/components/QrScanner"), { ssr: false });

type ScanResult =
  | { status: "success"; name: string; plus_one_name?: string }
  | { status: "already_checked_in"; name: string; checked_in_at?: string }
  | { status: "group_success"; name: string; arrived: number; expected: number }
  | { status: "error"; message: string };

type LookupGuest = {
  id: string;
  name: string;
  plus_one_name?: string;
  group_name?: string | null;
  checked_in: boolean;
  source: "guests" | "rsvp_submissions";
};

export default function ScannerPage() {
  const [pin, setPin] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  // Confirmation modal state
  type PendingGuest = { token: string; name: string; plus_one_name?: string };
  const [pendingGuest, setPendingGuest] = useState<PendingGuest | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Group check-in modal state
  type PendingGroup = { token: string; name: string; expected_pax: number; arrived_pax: number; members: { name: string; plus_one_name?: string | null }[] };
  const [pendingGroup, setPendingGroup] = useState<PendingGroup | null>(null);
  const [groupPax, setGroupPax] = useState(1);
  const [confirmingGroup, setConfirmingGroup] = useState(false);

  // Manual lookup state
  const [tab, setTab] = useState<"scan" | "lookup" | "walkin">("scan");
  const [lookupName, setLookupName] = useState("");
  const [lookupResults, setLookupResults] = useState<LookupGuest[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");

  // Walk-in state
  const [walkinName, setWalkinName] = useState("");
  const [walkinPlusOne, setWalkinPlusOne] = useState("");
  const [walkinGroup, setWalkinGroup] = useState("");
  const [walkinSide, setWalkinSide] = useState<"" | "bride" | "groom">("");
  const [walkinLoading, setWalkinLoading] = useState(false);
  const [walkinResult, setWalkinResult] = useState<{ name: string; plus_one_name?: string } | null>(null);
  const [walkinError, setWalkinError] = useState("");

  // Guest-group master data (loaded after PIN unlock) for the walk-in group picker
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const loadGroups = useCallback(async (pinValue: string) => {
    try {
      const res = await fetch("/api/scanner/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinValue }),
      });
      const data = await res.json();
      if (res.ok) setGroups(data.groups ?? []);
    } catch {
      /* non-fatal — walk-in still works */
    }
  }, []);

  // Desktop layout detection
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // PIN verification
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    setPinLoading(true);
    try {
      const res = await fetch("/api/scanner/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.valid) {
        setPinVerified(true);
        loadGroups(pin);
      } else {
        setPinError("PIN salah. Silakan coba lagi.");
      }
    } catch {
      setPinError("Koneksi error. Periksa jaringan dan coba lagi.");
    } finally {
      setPinLoading(false);
    }
  };

  // QR scan handler — preview only, no check-in yet
  const handleScan = useCallback(async (scannedText: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);
    setScanning(false);

    // Extract token from URL (e.g. https://yoursite.com/pass?token=abc)
    let token = scannedText;
    try {
      const url = new URL(scannedText);
      token = url.searchParams.get("token") ?? scannedText;
    } catch {}

    const res = await fetch("/api/scanner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, pin, preview: true }),
    });

    const data = await res.json();

    if (data.preview && data.type === "group") {
      // Group QR → pax confirmation modal
      setPendingGroup(data.group);
      setGroupPax(Math.max(1, (data.group.expected_pax ?? 1) - (data.group.arrived_pax ?? 0)));
    } else if (data.preview) {
      // Individual guest confirmation modal
      setPendingGuest(data.guest);
    } else if (data.warning === "already_checked_in") {
      setResult({ status: "already_checked_in", name: data.guest.name, checked_in_at: data.guest.checked_in_at });
    } else {
      setResult({ status: "error", message: data.error ?? "Terjadi kesalahan." });
    }

    processingRef.current = false;
    setProcessing(false);
  }, [pin]);

  // Confirm group check-in (adds pax; can be scanned again to add more)
  const handleConfirmGroup = async () => {
    if (!pendingGroup) return;
    setConfirmingGroup(true);
    const res = await fetch("/api/scanner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: pendingGroup.token, pin, pax: groupPax }),
    });
    const data = await res.json();
    setPendingGroup(null);
    setConfirmingGroup(false);
    if (data.success) {
      setResult({ status: "group_success", name: data.group.name, arrived: data.group.arrived_pax, expected: data.group.expected_pax });
    } else {
      setResult({ status: "error", message: data.error ?? "Terjadi kesalahan." });
    }
  };

  const handleCancelGroup = () => {
    setPendingGroup(null);
    processingRef.current = false;
    setScanning(true);
  };

  // Confirm check-in after modal
  const handleConfirmCheckin = async () => {
    if (!pendingGuest) return;
    setConfirming(true);
    const res = await fetch("/api/scanner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: pendingGuest.token, pin }),
    });
    const data = await res.json();
    setPendingGuest(null);
    setConfirming(false);
    if (data.success) {
      setResult({ status: "success", ...data.guest });
    } else if (data.warning === "already_checked_in") {
      setResult({ status: "already_checked_in", name: data.guest.name, checked_in_at: data.guest.checked_in_at });
    } else {
      setResult({ status: "error", message: data.error ?? "Terjadi kesalahan." });
    }
  };

  const handleCancelCheckin = () => {
    setPendingGuest(null);
    processingRef.current = false;
    setScanning(true);
  };

  // Manual lookup
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupLoading(true);
    setLookupMessage("");
    setLookupResults([]);

    const res = await fetch("/api/scanner/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: lookupName, pin }),
    });
    const data = await res.json();
    setLookupLoading(false);

    if (data.guests?.length === 0) setLookupMessage("Tamu tidak ditemukan.");
    else setLookupResults(data.guests ?? []);
  };

  const handleManualCheckin = async (guestId: string, source: LookupGuest["source"]) => {
    const res = await fetch("/api/scanner/lookup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId, source, pin }),
    });
    const data = await res.json();
    if (data.success) {
      setLookupResults((prev) => prev.map((g) => g.id === guestId ? { ...g, checked_in: true } : g));
      setLookupMessage(`✅ ${data.guest.name} berhasil check-in!`);
    } else if (data.warning === "already_checked_in") {
      setLookupMessage(`⚠️ ${data.guest.name} sudah check-in sebelumnya.`);
    } else {
      setLookupMessage(data.error ?? "Error.");
    }
  };

  // Walk-in: add new guest and immediately check in
  const handleWalkin = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkinError("");
    setWalkinResult(null);
    setWalkinLoading(true);
    try {
      const res = await fetch("/api/scanner/walkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, name: walkinName, plus_one_name: walkinPlusOne, group_id: walkinGroup, side: walkinSide }),
      });
      const data = await res.json();
      if (res.ok) {
        setWalkinResult(data.guest);
        setWalkinName("");
        setWalkinPlusOne("");
        setWalkinGroup("");
        setWalkinSide("");
      } else {
        setWalkinError(data.error ?? "Gagal menambahkan tamu.");
      }
    } catch {
      setWalkinError("Koneksi error. Coba lagi.");
    } finally {
      setWalkinLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setScanning(true);
  };

  // ── PIN screen ──────────────────────────────────────────────
  if (!pinVerified) {
    return (
      <div className="min-h-screen bg-[#fffbf5] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🎟️</div>
            <h1 className="text-2xl font-[family-name:var(--font-wedding)] text-[#3a3028]">Scanner Tamu</h1>
            <p className="text-[#9a7d5a] text-sm mt-1 font-[family-name:var(--font-lato)]">Masukkan PIN untuk melanjutkan</p>
          </div>
          <form onSubmit={handleVerifyPin} className="bg-white rounded-2xl shadow-sm border border-[#e8ddd0] p-6 space-y-4">
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="• • • • • •"
              className="w-full border border-[#e8ddd0] rounded-xl px-4 py-3 text-[#3a3028] placeholder-[#c9b99a] text-center text-2xl tracking-widest focus:outline-none focus:border-[var(--color-gold)] bg-[#fffbf5] font-[family-name:var(--font-lato)]"
              maxLength={10}
              autoFocus
            />
            {pinError && <p className="text-red-500 text-sm text-center font-[family-name:var(--font-lato)]">{pinError}</p>}
            <button
              type="submit"
              disabled={pinLoading}
              className="w-full py-3 bg-[var(--color-gold)] text-white rounded-xl font-medium hover:bg-[var(--color-gold-hover)] transition-colors disabled:opacity-60 font-[family-name:var(--font-lato)]"
            >
              {pinLoading ? "Memverifikasi…" : "Buka Scanner"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Result card (shared between mobile inline + desktop overlay) ──────────
  const ResultCard = () => !result ? null : (
    <div className={`rounded-2xl p-6 text-center border ${
      result.status === "success" || result.status === "group_success" ? "bg-green-50 border-green-200" :
      result.status === "already_checked_in" ? "bg-amber-50 border-amber-200" :
      "bg-red-50 border-red-200"
    }`}>
      <div className="text-4xl mb-3">
        {result.status === "success" || result.status === "group_success" ? "✅" : result.status === "already_checked_in" ? "⚠️" : "❌"}
      </div>
      {result.status === "group_success" && (
        <>
          <p className="text-green-800 font-[family-name:var(--font-wedding)] text-xl">{result.name}</p>
          <p className="text-green-700 text-sm mt-1 font-[family-name:var(--font-lato)]">
            Hadir: <span className="font-semibold">{result.arrived}</span> / {result.expected} orang
          </p>
          {result.arrived > result.expected && (
            <p className="text-amber-600 text-xs mt-1 font-[family-name:var(--font-lato)]">Melebihi perkiraan</p>
          )}
          <p className="text-green-600 text-xs mt-3 font-[family-name:var(--font-lato)]">Grup berhasil check-in!</p>
        </>
      )}
      {result.status === "success" && (
        <>
          <p className="text-green-800 font-[family-name:var(--font-wedding)] text-xl">{result.name}</p>
          {result.plus_one_name && <p className="text-green-600 text-sm mt-1 font-[family-name:var(--font-lato)]">Pasangan: {result.plus_one_name}</p>}
          <p className="text-green-600 text-xs mt-3 font-[family-name:var(--font-lato)]">Berhasil check-in!</p>
        </>
      )}
      {result.status === "already_checked_in" && (
        <>
          <p className="text-amber-800 font-[family-name:var(--font-wedding)] text-xl">{result.name}</p>
          <p className="text-amber-600 text-sm mt-1 font-[family-name:var(--font-lato)]">Sudah check-in sebelumnya</p>
          {result.checked_in_at && (
            <p className="text-amber-500 text-xs mt-1 font-[family-name:var(--font-lato)]">
              pukul {new Date(result.checked_in_at).toLocaleTimeString("id-ID")}
            </p>
          )}
        </>
      )}
      {result.status === "error" && (
        <>
          <p className="text-red-700 font-semibold font-[family-name:var(--font-lato)]">QR Code Tidak Valid</p>
          <p className="text-red-500 text-sm mt-1 font-[family-name:var(--font-lato)]">{result.message}</p>
        </>
      )}
      <button
        onClick={reset}
        className="mt-4 px-6 py-2 border border-[#e8ddd0] text-[#9a7d5a] bg-white rounded-xl text-sm hover:bg-[#fffbf5] transition-colors font-[family-name:var(--font-lato)]"
      >
        Tamu Berikutnya
      </button>
    </div>
  );

  // ── Main scanner UI ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fffbf5]">

      {/* ── Confirmation Modal ── */}
      {pendingGuest && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-[#e8ddd0]">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">🎟️</div>
              <h2 className="text-xl font-[family-name:var(--font-wedding)] text-[#3a3028] mb-1">{pendingGuest.name}</h2>
              {pendingGuest.plus_one_name && (
                <p className="text-[#9a7d5a] text-sm font-[family-name:var(--font-lato)]">Pasangan: {pendingGuest.plus_one_name}</p>
              )}
              <p className="text-[#9a7d5a] text-sm mt-4 font-[family-name:var(--font-lato)]">Konfirmasi check-in tamu ini?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelCheckin}
                disabled={confirming}
                className="flex-1 py-3 border border-[#e8ddd0] text-[#9a7d5a] rounded-xl text-sm hover:bg-[#fffbf5] transition-colors disabled:opacity-50 font-[family-name:var(--font-lato)]"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmCheckin}
                disabled={confirming}
                className="flex-1 py-3 bg-[var(--color-gold)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-gold-hover)] transition-colors disabled:opacity-50 font-[family-name:var(--font-lato)]"
              >
                {confirming ? "Memproses…" : "✓ Check-in"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Group check-in modal ── */}
      {pendingGroup && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-[#e8ddd0]">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">👨‍👩‍👧‍👦</div>
              <h2 className="text-xl font-[family-name:var(--font-wedding)] text-[#3a3028] mb-1">{pendingGroup.name}</h2>
              <p className="text-[#9a7d5a] text-sm font-[family-name:var(--font-lato)]">
                Diharapkan {pendingGroup.expected_pax} orang
                {pendingGroup.arrived_pax > 0 && <> • sudah hadir {pendingGroup.arrived_pax}</>}
              </p>
            </div>

            {pendingGroup.members.length > 0 && (
              <div className="max-h-28 overflow-y-auto bg-[#fffbf5] border border-[#e8ddd0] rounded-xl px-3 py-2 mb-4">
                {pendingGroup.members.map((m, i) => (
                  <p key={i} className="text-xs text-[#3a3028] font-[family-name:var(--font-lato)] truncate">
                    {m.name}{m.plus_one_name ? ` & ${m.plus_one_name}` : ""}
                  </p>
                ))}
              </div>
            )}

            <label className="block text-xs text-[#9a7d5a] mb-1 uppercase tracking-wide font-[family-name:var(--font-lato)] text-center">Jumlah hadir sekarang</label>
            <div className="flex items-center justify-center gap-3 mb-5">
              <button
                type="button"
                onClick={() => setGroupPax((p) => Math.max(1, p - 1))}
                className="w-10 h-10 rounded-full border border-[#e8ddd0] text-[#9a7d5a] text-xl hover:bg-[#fffbf5]"
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={groupPax}
                onChange={(e) => setGroupPax(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 text-center text-2xl font-semibold border border-[#e8ddd0] rounded-xl py-2 text-[#3a3028] focus:outline-none focus:border-[var(--color-gold)]"
              />
              <button
                type="button"
                onClick={() => setGroupPax((p) => p + 1)}
                className="w-10 h-10 rounded-full border border-[#e8ddd0] text-[#9a7d5a] text-xl hover:bg-[#fffbf5]"
              >
                +
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelGroup}
                disabled={confirmingGroup}
                className="flex-1 py-3 border border-[#e8ddd0] text-[#9a7d5a] rounded-xl text-sm hover:bg-[#fffbf5] transition-colors disabled:opacity-50 font-[family-name:var(--font-lato)]"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmGroup}
                disabled={confirmingGroup}
                className="flex-1 py-3 bg-[var(--color-gold)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-gold-hover)] transition-colors disabled:opacity-50 font-[family-name:var(--font-lato)]"
              >
                {confirmingGroup ? "Memproses…" : `✓ Check-in ${groupPax}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ DESKTOP LAYOUT ══════════════════ */}
      {isDesktop && (
        <div className="h-screen flex flex-col overflow-hidden">
          {/* Top bar: header + tabs */}
          <div className="flex-shrink-0 bg-[#fffbf5] border-b border-[#e8ddd0] px-6 py-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-xl font-[family-name:var(--font-wedding)] text-[#3a3028]">Scanner Tamu</h1>
                <p className="text-xs text-[#9a7d5a] font-[family-name:var(--font-lato)]">Check-in Pernikahan</p>
              </div>
              <div className="flex bg-white border border-[#e8ddd0] rounded-xl p-1 shadow-sm">
                {(["scan", "lookup", "walkin"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setResult(null); setScanning(t === "scan"); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors font-[family-name:var(--font-lato)] ${
                      tab === t ? "bg-[var(--color-gold)] text-white shadow-sm" : "text-[#9a7d5a] hover:text-[#3a3028]"
                    }`}
                  >
                    {t === "scan" ? "📷 Scan" : t === "lookup" ? "🔍 Cari" : "➕ Tamu Baru"}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setPinVerified(false)}
              className="text-xs text-[#c9b99a] hover:text-[#9a7d5a] font-[family-name:var(--font-lato)] transition-colors"
            >
              🔒 Kunci
            </button>
          </div>

          {/* Full-width camera area */}
          <div className="flex-1 relative bg-black overflow-hidden">
            {/* Camera feed — always rendered when on scan tab */}
            {tab === "scan" && scanning && !result && (
              <>
                <div className="absolute inset-0">
                  <QrScanner onScan={handleScan} active={scanning} fullscreen />
                </div>
                <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
                  <p className="text-white/50 text-sm font-[family-name:var(--font-lato)]">Arahkan kamera ke QR code tamu</p>
                </div>
                <button
                  onClick={() => setScanning(false)}
                  className="absolute top-4 right-4 px-4 py-2 bg-black/50 text-white/80 rounded-xl text-sm hover:bg-black/70 transition-colors font-[family-name:var(--font-lato)] backdrop-blur-sm"
                >
                  Hentikan Kamera
                </button>
              </>
            )}

            {/* Result overlay */}
            {tab === "scan" && result && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/75 p-8">
                <div className="w-full max-w-sm">
                  <ResultCard />
                </div>
              </div>
            )}

            {/* Start camera prompt */}
            {tab === "scan" && !scanning && !result && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setScanning(true)}
                  disabled={processing}
                  className="px-12 py-6 bg-[var(--color-gold)] text-white rounded-2xl text-xl font-medium hover:bg-[var(--color-gold-hover)] transition-colors disabled:opacity-50 shadow-lg font-[family-name:var(--font-lato)]"
                >
                  {processing ? "Memproses..." : "📷 Mulai Scan"}
                </button>
              </div>
            )}

            {/* Lookup / Walkin panels — floating centered over dark bg */}
            {tab === "lookup" && (
              <div className="absolute inset-0 flex items-start justify-center pt-12 overflow-y-auto">
                <div className="w-full max-w-lg bg-[#fffbf5] rounded-2xl shadow-2xl border border-[#e8ddd0] p-6 mb-12">
                  <form onSubmit={handleLookup} className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={lookupName}
                      onChange={(e) => setLookupName(e.target.value)}
                      placeholder="Cari nama tamu…"
                      className="flex-1 border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-[#3a3028] placeholder-[#c9b99a] text-sm focus:outline-none focus:border-[var(--color-gold)] bg-white font-[family-name:var(--font-lato)]"
                    />
                    <button
                      type="submit"
                      disabled={lookupLoading}
                      className="px-4 py-2.5 bg-[var(--color-gold)] text-white rounded-xl text-sm hover:bg-[var(--color-gold-hover)] disabled:opacity-50 font-[family-name:var(--font-lato)]"
                    >
                      {lookupLoading ? "…" : "Cari"}
                    </button>
                  </form>
                  {lookupMessage && (
                    <p className="text-center text-sm text-[#9a7d5a] mb-3 font-[family-name:var(--font-lato)]">{lookupMessage}</p>
                  )}
                  <div className="space-y-3">
                    {lookupResults.map((g) => (
                      <div key={g.id} className="bg-white border border-[#e8ddd0] rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                          <p className="text-[#3a3028] font-medium font-[family-name:var(--font-lato)]">{g.name}</p>
                          {g.plus_one_name && <p className="text-[#9a7d5a] text-xs font-[family-name:var(--font-lato)]">Pasangan: {g.plus_one_name}</p>}
                          {g.group_name && <p className="text-[#c9b99a] text-xs font-[family-name:var(--font-lato)]">Grup: {g.group_name}</p>}
                        </div>
                        {g.checked_in ? (
                          <span className="text-green-600 text-xs font-medium font-[family-name:var(--font-lato)]">✅ Selesai</span>
                        ) : (
                          <button
                            onClick={() => handleManualCheckin(g.id, g.source)}
                            className="px-3 py-1.5 bg-[var(--color-gold)] text-white rounded-lg text-xs hover:bg-[var(--color-gold-hover)] transition-colors font-[family-name:var(--font-lato)]"
                          >
                            Check In
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "walkin" && (
              <div className="absolute inset-0 flex items-start justify-center pt-12 overflow-y-auto">
                <div className="w-full max-w-lg bg-[#fffbf5] rounded-2xl shadow-2xl border border-[#e8ddd0] p-6 mb-12">
                  {walkinResult && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4 text-center">
                      <div className="text-4xl mb-2">✅</div>
                      <p className="text-green-800 font-[family-name:var(--font-wedding)] text-xl">{walkinResult.name}</p>
                      {walkinResult.plus_one_name && (
                        <p className="text-green-600 text-sm mt-1 font-[family-name:var(--font-lato)]">Pasangan: {walkinResult.plus_one_name}</p>
                      )}
                      <p className="text-green-600 text-xs mt-2 font-[family-name:var(--font-lato)]">Berhasil ditambahkan &amp; check-in!</p>
                      <button
                        onClick={() => setWalkinResult(null)}
                        className="mt-4 px-5 py-2 border border-[#e8ddd0] text-[#9a7d5a] bg-white rounded-xl text-sm hover:bg-[#fffbf5] transition-colors font-[family-name:var(--font-lato)]"
                      >
                        Tambah Lagi
                      </button>
                    </div>
                  )}
                  {!walkinResult && (
                    <form onSubmit={handleWalkin} className="space-y-3">
                      <div>
                        <label className="block text-xs text-[#9a7d5a] mb-1 uppercase tracking-wide font-[family-name:var(--font-lato)]">
                          Nama Tamu <span className="text-red-400">*</span>
                        </label>
                        <input
                          required
                          value={walkinName}
                          onChange={(e) => setWalkinName(e.target.value)}
                          maxLength={100}
                          placeholder="Nama lengkap"
                          className="w-full border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-[#3a3028] placeholder-[#c9b99a] text-sm focus:outline-none focus:border-[var(--color-gold)] bg-white font-[family-name:var(--font-lato)]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#9a7d5a] mb-1 uppercase tracking-wide font-[family-name:var(--font-lato)]">Pendamping atau Plus One</label>
                        <input
                          value={walkinPlusOne}
                          onChange={(e) => setWalkinPlusOne(e.target.value)}
                          maxLength={100}
                          placeholder="Nama pasangan (opsional)"
                          className="w-full border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-[#3a3028] placeholder-[#c9b99a] text-sm focus:outline-none focus:border-[var(--color-gold)] bg-white font-[family-name:var(--font-lato)]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#9a7d5a] mb-1 uppercase tracking-wide font-[family-name:var(--font-lato)]">
                          Dari / Grup <span className="text-red-400">*</span>
                        </label>
                        <select
                          required
                          value={walkinGroup}
                          onChange={(e) => setWalkinGroup(e.target.value)}
                          className="w-full border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-[#3a3028] text-sm focus:outline-none focus:border-[var(--color-gold)] bg-white font-[family-name:var(--font-lato)]"
                        >
                          <option value="" disabled>Pilih grup…</option>
                          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-[#9a7d5a] mb-1 uppercase tracking-wide font-[family-name:var(--font-lato)]">
                          Tamu dari <span className="text-red-400">*</span>
                        </label>
                        <select
                          required
                          value={walkinSide}
                          onChange={(e) => setWalkinSide(e.target.value as "" | "bride" | "groom")}
                          className="w-full border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-[#3a3028] text-sm focus:outline-none focus:border-[var(--color-gold)] bg-white font-[family-name:var(--font-lato)]"
                        >
                          <option value="" disabled>Pilih sisi mempelai…</option>
                          <option value="bride">Mempelai Wanita</option>
                          <option value="groom">Mempelai Pria</option>
                        </select>
                      </div>
                      {walkinError && (
                        <p className="text-red-500 text-sm text-center font-[family-name:var(--font-lato)]">{walkinError}</p>
                      )}
                      <button
                        type="submit"
                        disabled={walkinLoading}
                        className="w-full py-3 bg-[var(--color-gold)] text-white rounded-xl font-medium hover:bg-[var(--color-gold-hover)] transition-colors disabled:opacity-60 font-[family-name:var(--font-lato)]"
                      >
                        {walkinLoading ? "Menambahkan…" : "➕ Tambah & Check In"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════ MOBILE LAYOUT ══════════════════ */}
      {!isDesktop && (
        <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-[family-name:var(--font-wedding)] text-[#3a3028]">Scanner Tamu</h1>
              <p className="text-xs text-[#9a7d5a] font-[family-name:var(--font-lato)]">Check-in Pernikahan</p>
            </div>
            <button
              onClick={() => setPinVerified(false)}
              className="text-xs text-[#c9b99a] hover:text-[#9a7d5a] font-[family-name:var(--font-lato)] transition-colors"
            >
              Kunci
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-white border border-[#e8ddd0] rounded-xl p-1 shadow-sm">
            {(["scan", "lookup", "walkin"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setResult(null); setScanning(t === "scan"); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors font-[family-name:var(--font-lato)] ${
                  tab === t ? "bg-[var(--color-gold)] text-white shadow-sm" : "text-[#9a7d5a] hover:text-[#3a3028]"
                }`}
              >
                {t === "scan" ? "📷 Scan" : t === "lookup" ? "🔍 Cari" : "➕ Tamu Baru"}
              </button>
            ))}
          </div>

          {/* ── SCAN TAB ── */}
          {tab === "scan" && (
            <div className="space-y-3">
              {result && <ResultCard />}
              {!result && scanning && (
                <div>
                  <div className="rounded-2xl overflow-hidden border border-[#e8ddd0] shadow-sm">
                    <QrScanner onScan={handleScan} active={scanning} />
                  </div>
                  <p className="text-center text-[#9a7d5a] text-xs mt-3 font-[family-name:var(--font-lato)]">Arahkan kamera ke QR code tamu</p>
                  <button
                    onClick={() => setScanning(false)}
                    className="w-full mt-3 py-2 border border-[#e8ddd0] text-[#9a7d5a] bg-white rounded-xl text-sm hover:bg-[#fffbf5] transition-colors font-[family-name:var(--font-lato)]"
                  >
                    Hentikan Kamera
                  </button>
                </div>
              )}
              {!result && !scanning && (
                <button
                  onClick={() => setScanning(true)}
                  disabled={processing}
                  className="w-full py-6 bg-[var(--color-gold)] text-white rounded-2xl text-lg font-medium hover:bg-[var(--color-gold-hover)] transition-colors disabled:opacity-50 shadow-sm font-[family-name:var(--font-lato)]"
                >
                  {processing ? "Memproses..." : "📷 Mulai Scan"}
                </button>
              )}
            </div>
          )}

          {/* ── LOOKUP TAB ── */}
          {tab === "lookup" && (
            <div>
              <form onSubmit={handleLookup} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={lookupName}
                  onChange={(e) => setLookupName(e.target.value)}
                  placeholder="Cari nama tamu…"
                  className="flex-1 border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-[#3a3028] placeholder-[#c9b99a] text-sm focus:outline-none focus:border-[var(--color-gold)] bg-white font-[family-name:var(--font-lato)]"
                />
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="px-4 py-2.5 bg-[var(--color-gold)] text-white rounded-xl text-sm hover:bg-[var(--color-gold-hover)] disabled:opacity-50 font-[family-name:var(--font-lato)]"
                >
                  {lookupLoading ? "…" : "Cari"}
                </button>
              </form>
              {lookupMessage && (
                <p className="text-center text-sm text-[#9a7d5a] mb-3 font-[family-name:var(--font-lato)]">{lookupMessage}</p>
              )}
              <div className="space-y-3">
                {lookupResults.map((g) => (
                  <div key={g.id} className="bg-white border border-[#e8ddd0] rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[#3a3028] font-medium font-[family-name:var(--font-lato)]">{g.name}</p>
                      {g.plus_one_name && <p className="text-[#9a7d5a] text-xs font-[family-name:var(--font-lato)]">Pasangan: {g.plus_one_name}</p>}
                      {g.group_name && <p className="text-[#c9b99a] text-xs font-[family-name:var(--font-lato)]">Grup: {g.group_name}</p>}
                    </div>
                    {g.checked_in ? (
                      <span className="text-green-600 text-xs font-medium font-[family-name:var(--font-lato)]">✅ Selesai</span>
                    ) : (
                      <button
                        onClick={() => handleManualCheckin(g.id, g.source)}
                        className="px-3 py-1.5 bg-[var(--color-gold)] text-white rounded-lg text-xs hover:bg-[var(--color-gold-hover)] transition-colors font-[family-name:var(--font-lato)]"
                      >
                        Check In
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── WALK-IN TAB ── */}
          {tab === "walkin" && (
            <div>
              {walkinResult && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4 text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-green-800 font-[family-name:var(--font-wedding)] text-xl">{walkinResult.name}</p>
                  {walkinResult.plus_one_name && (
                    <p className="text-green-600 text-sm mt-1 font-[family-name:var(--font-lato)]">Pasangan: {walkinResult.plus_one_name}</p>
                  )}
                  <p className="text-green-600 text-xs mt-2 font-[family-name:var(--font-lato)]">Berhasil ditambahkan &amp; check-in!</p>
                  <button
                    onClick={() => setWalkinResult(null)}
                    className="mt-4 px-5 py-2 border border-[#e8ddd0] text-[#9a7d5a] bg-white rounded-xl text-sm hover:bg-[#fffbf5] transition-colors font-[family-name:var(--font-lato)]"
                  >
                    Tambah Lagi
                  </button>
                </div>
              )}
              {!walkinResult && (
                <form onSubmit={handleWalkin} className="space-y-3">
                  <div>
                    <label className="block text-xs text-[#9a7d5a] mb-1 uppercase tracking-wide font-[family-name:var(--font-lato)]">
                      Nama Tamu <span className="text-red-400">*</span>
                    </label>
                    <input
                      required
                      value={walkinName}
                      onChange={(e) => setWalkinName(e.target.value)}
                      maxLength={100}
                      placeholder="Nama lengkap"
                      className="w-full border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-[#3a3028] placeholder-[#c9b99a] text-sm focus:outline-none focus:border-[var(--color-gold)] bg-white font-[family-name:var(--font-lato)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#9a7d5a] mb-1 uppercase tracking-wide font-[family-name:var(--font-lato)]">Pendamping atau Plus One</label>
                    <input
                      value={walkinPlusOne}
                      onChange={(e) => setWalkinPlusOne(e.target.value)}
                      maxLength={100}
                      placeholder="Nama pasangan (opsional)"
                      className="w-full border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-[#3a3028] placeholder-[#c9b99a] text-sm focus:outline-none focus:border-[var(--color-gold)] bg-white font-[family-name:var(--font-lato)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#9a7d5a] mb-1 uppercase tracking-wide font-[family-name:var(--font-lato)]">
                      Dari / Grup <span className="text-red-400">*</span>
                    </label>
                    <select
                      required
                      value={walkinGroup}
                      onChange={(e) => setWalkinGroup(e.target.value)}
                      className="w-full border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-[#3a3028] text-sm focus:outline-none focus:border-[var(--color-gold)] bg-white font-[family-name:var(--font-lato)]"
                    >
                      <option value="" disabled>Pilih grup…</option>
                      {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#9a7d5a] mb-1 uppercase tracking-wide font-[family-name:var(--font-lato)]">
                      Tamu dari <span className="text-red-400">*</span>
                    </label>
                    <select
                      required
                      value={walkinSide}
                      onChange={(e) => setWalkinSide(e.target.value as "" | "bride" | "groom")}
                      className="w-full border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-[#3a3028] text-sm focus:outline-none focus:border-[var(--color-gold)] bg-white font-[family-name:var(--font-lato)]"
                    >
                      <option value="" disabled>Pilih sisi mempelai…</option>
                      <option value="bride">Mempelai Wanita</option>
                      <option value="groom">Mempelai Pria</option>
                    </select>
                  </div>
                  {walkinError && (
                    <p className="text-red-500 text-sm text-center font-[family-name:var(--font-lato)]">{walkinError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={walkinLoading}
                    className="w-full py-3 bg-[var(--color-gold)] text-white rounded-xl font-medium hover:bg-[var(--color-gold-hover)] transition-colors disabled:opacity-60 font-[family-name:var(--font-lato)]"
                  >
                    {walkinLoading ? "Menambahkan…" : "➕ Tambah & Check In"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
