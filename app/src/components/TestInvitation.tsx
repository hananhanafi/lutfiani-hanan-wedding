"use client";

import { useEffect, useMemo, useState } from "react";

type Session = { sessionId: string; status: string; phone: string | null };
type PickGuest = { id: string; name: string; phone_number?: string | null; plus_one_name?: string | null };

export default function TestInvitation({ guests }: { guests: PickGuest[] }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [phone, setPhone] = useState("");
  const [messageType, setMessageType] = useState<"muslim" | "general">("muslim");

  // Real guest picker (default) vs manual sample
  const [guestId, setGuestId] = useState("");
  const [guestSearch, setGuestSearch] = useState("");
  const [guestName, setGuestName] = useState("Tamu Undangan");
  const [plusOneName, setPlusOneName] = useState("");

  const [preview, setPreview] = useState("");
  const [step, setStep] = useState<"idle" | "otp" | "sending" | "done">("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpLast4, setOtpLast4] = useState("");
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const connected = sessions.filter((s) => s.status === "connected");
  const usingGuest = guestId !== "";

  const filteredGuests = useMemo(() => {
    const q = guestSearch.toLowerCase().trim();
    const list = q
      ? guests.filter((g) => g.name.toLowerCase().includes(q) || (g.phone_number ?? "").includes(q))
      : guests;
    return list.slice(0, 50);
  }, [guests, guestSearch]);

  useEffect(() => {
    fetch("/api/admin/whatsapp-sessions")
      .then((r) => r.json())
      .then((d) => {
        const list: Session[] = d.sessions ?? [];
        setSessions(list);
        const c = list.filter((s) => s.status === "connected");
        if (c.length === 1) setSessionId(c[0].sessionId);
      })
      .catch(() => {});
  }, []);

  // Live preview (debounced) — uses the real guest when one is picked
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/test-invitation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            usingGuest
              ? { preview: true, messageType, guestId }
              : { preview: true, messageType, guestName, plusOneName }
          ),
        });
        const data = await res.json();
        if (res.ok) setPreview(data.message ?? "");
      } catch {
        /* ignore */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [messageType, guestId, guestName, plusOneName, usingGuest]);

  const resetOtp = () => {
    setStep("idle");
    setOtpCode("");
    setOtpLast4("");
    setOtpSending(false);
    setOtpVerifying(false);
  };

  const sendBody = () =>
    usingGuest
      ? { phone, messageType, guestId, sessionId }
      : { phone, messageType, guestName, plusOneName, sessionId };

  const doSend = async () => {
    setStep("sending");
    setErr("");
    setOkMsg("");
    try {
      const res = await fetch("/api/admin/test-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendBody()),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Gagal mengirim.");
        setStep("idle");
        return;
      }
      setOkMsg(`✓ Undangan terkirim ke ${data.phone}. Cek WhatsApp Anda.`);
      setStep("done");
    } catch {
      setErr("Koneksi error.");
      setStep("idle");
    }
  };

  const startSend = async () => {
    setErr("");
    setOkMsg("");
    if (!sessionId) return setErr("Pilih sesi pengirim.");
    if (!phone.trim()) return setErr("Masukkan nomor WhatsApp tujuan.");
    try {
      const chk = await fetch(`/api/admin/whatsapp-otp?sessionId=${encodeURIComponent(sessionId)}`);
      const cd = await chk.json();
      if (cd.verified) {
        doSend();
        return;
      }
    } catch {
      /* fall through */
    }
    setOtpSending(true);
    setStep("otp");
    setOtpCode("");
    try {
      const res = await fetch("/api/admin/whatsapp-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) setErr(data.error ?? "Gagal mengirim OTP");
      else if (data.alreadyVerified) {
        resetOtp();
        doSend();
        return;
      } else setOtpLast4(data.phoneLast4 ?? "");
    } catch {
      setErr("Gagal mengirim OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const verifyAndSend = async () => {
    if (otpCode.length !== 6) return;
    setOtpVerifying(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/whatsapp-otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setErr(data.error ?? "OTP tidak valid");
        return;
      }
      resetOtp();
      doSend();
    } catch {
      setErr("Gagal memverifikasi OTP");
    } finally {
      setOtpVerifying(false);
    }
  };

  const busy = step === "sending" || otpSending || otpVerifying;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Coba Kirim Undangan</h1>
      <p className="text-sm text-gray-500 mb-6">
        Kirim pesan undangan asli ke nomor Anda sendiri untuk melihat persis seperti yang akan diterima tamu.
      </p>

      <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
        {/* Sender */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Kirim dari</label>
          {connected.length === 0 ? (
            <p className="text-sm text-amber-600">Tidak ada sesi WhatsApp yang terhubung. Hubungkan di menu WhatsApp.</p>
          ) : (
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white"
            >
              <option value="">— Pilih sesi —</option>
              {connected.map((s) => (
                <option key={s.sessionId} value={s.sessionId}>
                  {s.sessionId}{s.phone ? ` (+${s.phone})` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Destination phone */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nomor WhatsApp tujuan</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08123456789"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
          />
          <p className="text-xs text-gray-400 mt-1">Nomor Anda sendiri untuk uji coba.</p>
        </div>

        {/* Guest picker */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tamu (pesan asli)</label>
          <input
            value={guestSearch}
            onChange={(e) => setGuestSearch(e.target.value)}
            placeholder="Cari nama tamu…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] mb-2"
          />
          <select
            value={guestId}
            onChange={(e) => setGuestId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white"
          >
            <option value="">— Ketik nama contoh (manual) —</option>
            {filteredGuests.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}{g.plus_one_name ? ` & ${g.plus_one_name}` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {usingGuest
              ? "Menggunakan nama & link undangan asli tamu ini (QR ikut dikirim)."
              : "Tidak memilih tamu — pakai nama contoh di bawah."}
          </p>
        </div>

        {/* Sample name + partner (only when no real guest selected) */}
        {!usingGuest && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nama tamu (contoh)</label>
              <input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={100}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pasangan (opsional)</label>
              <input
                value={plusOneName}
                onChange={(e) => setPlusOneName(e.target.value)}
                maxLength={100}
                placeholder="—"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
          </div>
        )}

        {/* Message type */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tipe pesan</label>
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            {([["muslim", "🕌 Muslim"], ["general", "Umum"]] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setMessageType(val)}
                className={`px-4 py-1.5 text-sm transition-colors ${
                  messageType === val ? "bg-[var(--color-gold)] text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pratinjau pesan</label>
          <div className="bg-[#e5ddd5] rounded-lg p-3">
            <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap break-words shadow-sm">
              {preview || "…"}
            </div>
          </div>
          {usingGuest && <p className="text-xs text-gray-400 mt-1">🎫 Gambar QR juga akan dikirim setelah pesan ini.</p>}
        </div>

        {err && <p className="text-sm text-red-500">{err}</p>}
        {okMsg && <p className="text-sm text-green-600">{okMsg}</p>}

        {/* OTP step */}
        {step === "otp" ? (
          <div className="space-y-3 border-t border-gray-100 pt-4">
            {otpSending ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-4 h-4 border-2 border-green-200 border-t-green-500 rounded-full animate-spin" />
                Mengirim kode OTP ke nomor pengirim…
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Masukkan kode OTP yang dikirim ke nomor pengirim {otpLast4 && <span className="text-gray-400">(****{otpLast4})</span>}
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "")); setErr(""); }}
                  placeholder="6 digit OTP"
                  className="w-full text-center text-xl tracking-[0.4em] font-mono px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <button onClick={resetOtp} className="text-xs text-gray-400 hover:text-gray-600">← Batal</button>
                  <button onClick={startSend} className="text-xs text-green-600 hover:text-green-700">Kirim ulang OTP</button>
                </div>
                <button
                  onClick={verifyAndSend}
                  disabled={otpCode.length !== 6 || otpVerifying}
                  className="w-full py-2.5 bg-[#25d366] text-white rounded-xl text-sm font-medium hover:bg-[#1da851] disabled:opacity-50 transition-colors"
                >
                  {otpVerifying ? "Memverifikasi…" : "Verifikasi & Kirim"}
                </button>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={startSend}
            disabled={busy || connected.length === 0}
            className="w-full py-3 bg-[#25d366] text-white rounded-xl text-sm font-medium hover:bg-[#1da851] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {step === "sending" ? "Mengirim…" : "Kirim ke Nomor Saya"}
          </button>
        )}
      </div>
    </div>
  );
}
