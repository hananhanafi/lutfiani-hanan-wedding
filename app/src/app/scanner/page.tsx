"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";

const QrScanner = dynamic(() => import("@/components/QrScanner"), { ssr: false });

type ScanResult =
  | { status: "success"; name: string; plus_one_name?: string }
  | { status: "already_checked_in"; name: string; checked_in_at?: string }
  | { status: "error"; message: string };

type LookupGuest = {
  id: string;
  name: string;
  plus_one_name?: string;
  checked_in: boolean;
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

  // Manual lookup state
  const [tab, setTab] = useState<"scan" | "lookup">("scan");
  const [lookupName, setLookupName] = useState("");
  const [lookupResults, setLookupResults] = useState<LookupGuest[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");

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
      } else {
        setPinError("Incorrect PIN. Please try again.");
      }
    } catch {
      setPinError("Connection error. Check your network and try again.");
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

    if (data.preview) {
      // Show confirmation modal
      setPendingGuest(data.guest);
    } else if (data.warning === "already_checked_in") {
      setResult({ status: "already_checked_in", name: data.guest.name, checked_in_at: data.guest.checked_in_at });
    } else {
      setResult({ status: "error", message: data.error ?? "Unknown error." });
    }

    processingRef.current = false;
    setProcessing(false);
  }, [pin]);

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
      setResult({ status: "error", message: data.error ?? "Unknown error." });
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

    if (data.guests?.length === 0) setLookupMessage("No guests found with that name.");
    else setLookupResults(data.guests ?? []);
  };

  const handleManualCheckin = async (guestId: string) => {
    const res = await fetch("/api/scanner/lookup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId, pin }),
    });
    const data = await res.json();
    if (data.success) {
      setLookupResults((prev) => prev.map((g) => g.id === guestId ? { ...g, checked_in: true } : g));
      setLookupMessage(`✅ ${data.guest.name} checked in successfully!`);
    } else if (data.warning === "already_checked_in") {
      setLookupMessage(`⚠️ ${data.guest.name} was already checked in.`);
    } else {
      setLookupMessage(data.error ?? "Error.");
    }
  };

  const reset = () => {
    setResult(null);
    setScanning(true);
  };

  // ── PIN screen ──────────────────────────────────────────────
  if (!pinVerified) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🎟️</div>
            <h1 className="text-2xl font-bold text-white">Guest Scanner</h1>
            <p className="text-gray-400 text-sm mt-1">Enter your scanner PIN to continue</p>
          </div>
          <form onSubmit={handleVerifyPin} className="bg-white/10 rounded-2xl p-6 space-y-4">
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 text-center text-xl tracking-widest focus:outline-none focus:border-[var(--color-gold)]"
              maxLength={10}
              autoFocus
            />
            {pinError && <p className="text-red-400 text-sm text-center">{pinError}</p>}
            <button
              type="submit"
              disabled={pinLoading}
              className="w-full py-3 bg-[var(--color-gold)] text-white rounded-xl font-medium hover:bg-[var(--color-gold-hover)] transition-colors disabled:opacity-60"
            >
              {pinLoading ? "Verifying…" : "Unlock Scanner"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Main scanner UI ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#1a1a2e] px-4 py-6">

      {/* ── Confirmation Modal ── */}
      {pendingGuest && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-[#1e2240] rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-white/10">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">🎟️</div>
              <h2 className="text-xl font-bold text-white mb-1">{pendingGuest.name}</h2>
              {pendingGuest.plus_one_name && (
                <p className="text-gray-400 text-sm">+1: {pendingGuest.plus_one_name}</p>
              )}
              <p className="text-gray-400 text-sm mt-4">Confirm check-in for this guest?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelCheckin}
                disabled={confirming}
                className="flex-1 py-3 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCheckin}
                disabled={confirming}
                className="flex-1 py-3 bg-[var(--color-gold)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-gold-hover)] transition-colors disabled:opacity-50"
              >
                {confirming ? "Checking in…" : "✓ Check In"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Guest Scanner</h1>
            <p className="text-xs text-gray-400">Wedding Check-in</p>
          </div>
          <button
            onClick={() => setPinVerified(false)}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            Lock
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/10 rounded-xl p-1 mb-5">
          {(["scan", "lookup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setResult(null); setScanning(t === "scan"); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-[var(--color-gold)] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t === "scan" ? "📷 QR Scan" : "🔍 Name Lookup"}
            </button>
          ))}
        </div>

        {/* ── SCAN TAB ── */}
        {tab === "scan" && (
          <div>
            {/* Result screen */}
            {result && (
              <div className={`rounded-2xl p-6 mb-4 text-center ${
                result.status === "success" ? "bg-green-900/50 border border-green-500/30" :
                result.status === "already_checked_in" ? "bg-yellow-900/50 border border-yellow-500/30" :
                "bg-red-900/50 border border-red-500/30"
              }`}>
                <div className="text-4xl mb-3">
                  {result.status === "success" ? "✅" : result.status === "already_checked_in" ? "⚠️" : "❌"}
                </div>
                {result.status === "success" && (
                  <>
                    <p className="text-green-300 font-bold text-xl">{result.name}</p>
                    {result.plus_one_name && <p className="text-green-400 text-sm mt-1">+1: {result.plus_one_name}</p>}
                    <p className="text-green-400 text-xs mt-3">Checked in successfully!</p>
                  </>
                )}
                {result.status === "already_checked_in" && (
                  <>
                    <p className="text-yellow-300 font-bold text-xl">{result.name}</p>
                    <p className="text-yellow-400 text-sm mt-1">Already checked in</p>
                    {result.checked_in_at && (
                      <p className="text-yellow-500 text-xs mt-1">
                        at {new Date(result.checked_in_at).toLocaleTimeString()}
                      </p>
                    )}
                  </>
                )}
                {result.status === "error" && (
                  <>
                    <p className="text-red-300 font-bold">Invalid QR Code</p>
                    <p className="text-red-400 text-sm mt-1">{result.message}</p>
                  </>
                )}
                <button
                  onClick={reset}
                  className="mt-4 px-6 py-2 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition-colors"
                >
                  Scan Next Guest
                </button>
              </div>
            )}

            {/* Scanner */}
            {!result && (
              <>
                {scanning ? (
                  <div>
                    <QrScanner onScan={handleScan} active={scanning} />
                    <p className="text-center text-gray-400 text-xs mt-3">Point camera at guest&apos;s QR code</p>
                    <button
                      onClick={() => setScanning(false)}
                      className="w-full mt-3 py-2 bg-white/10 text-gray-300 rounded-xl text-sm hover:bg-white/20 transition-colors"
                    >
                      Stop Camera
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setScanning(true)}
                    disabled={processing}
                    className="w-full py-6 bg-[var(--color-gold)] text-white rounded-2xl text-lg font-medium hover:bg-[var(--color-gold-hover)] transition-colors disabled:opacity-50"
                  >
                    {processing ? "Processing..." : "📷 Start Scanning"}
                  </button>
                )}
              </>
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
                placeholder="Search guest name..."
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-[var(--color-gold)]"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-4 py-2.5 bg-[var(--color-gold)] text-white rounded-xl text-sm hover:bg-[var(--color-gold-hover)] disabled:opacity-50"
              >
                {lookupLoading ? "..." : "Search"}
              </button>
            </form>

            {lookupMessage && (
              <p className="text-center text-sm text-gray-300 mb-3">{lookupMessage}</p>
            )}

            <div className="space-y-3">
              {lookupResults.map((g) => (
                <div key={g.id} className="bg-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{g.name}</p>
                    {g.plus_one_name && <p className="text-gray-400 text-xs">+1: {g.plus_one_name}</p>}
                  </div>
                  {g.checked_in ? (
                    <span className="text-green-400 text-xs font-medium">✅ Done</span>
                  ) : (
                    <button
                      onClick={() => handleManualCheckin(g.id)}
                      className="px-3 py-1.5 bg-[var(--color-gold)] text-white rounded-lg text-xs hover:bg-[var(--color-gold-hover)] transition-colors"
                    >
                      Check In
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
