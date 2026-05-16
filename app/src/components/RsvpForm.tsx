"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Props {
  rsvpDeadline?: string;
  guestName?: string;
}

interface RsvpResult {
  name: string;
  attending: boolean;
  updated?: boolean;
  qrDataUrl?: string;
  qrUrl?: string;
  phone_number?: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function RsvpForm({ rsvpDeadline, guestName }: Props) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RsvpResult | null>(null);

  const [form, setForm] = useState({
    name: guestName ?? "",
    email: "",
    phone_number: "",
    attending: "",
    plus_one_name: "",
    group_name: "",
    side: "",
    message: "",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Harap masukkan nama Anda.");
    if (!form.phone_number.trim()) return setError("Harap masukkan nomor WhatsApp Anda.");
    if (form.attending === "") return setError("Harap pilih kehadiran Anda.");

    setLoading(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          attending: form.attending === "yes",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Terjadi kesalahan.");

      setResult({
        name: form.name,
        attending: form.attending === "yes",
        updated: data.updated ?? false,
        qrDataUrl: data.qrDataUrl,
        qrUrl: data.qrUrl,
        phone_number: form.phone_number,
      });
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success" && result) {
    return <SuccessScreen result={result} />;
  }

  return (
    <section id="rsvp" className="bg-[#fffbf5] py-16 px-4">
      <div className="max-w-xl mx-auto">
        <p className="text-sm uppercase tracking-widest text-[var(--color-gold)] mb-3 text-center font-[family-name:var(--font-lato)]">
          Konfirmasi Kehadiran
        </p>
        <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-wedding)] text-[#3a3028] mb-2 text-center">
          RSVP
        </h2>
        {rsvpDeadline && (
          <p className="text-center text-sm text-[#9a7d5a] mb-8 font-[family-name:var(--font-lato)]">
            Harap konfirmasi sebelum <strong>{formatDate(rsvpDeadline)}</strong>
          </p>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#9a7d5a] mb-1 font-[family-name:var(--font-lato)]">
              Nama Lengkap *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Ahmad Rizki"
              readOnly={!!guestName}
              className={`w-full border border-[#e0d5c5] rounded-lg px-4 py-2.5 text-[#3a3028] focus:outline-none focus:border-[var(--color-gold)] font-[family-name:var(--font-lato)] ${
                guestName ? "bg-[#f5f0ea] cursor-not-allowed" : ""
              }`}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#9a7d5a] mb-1 font-[family-name:var(--font-lato)]">
              Email <span className="normal-case text-[var(--color-gold)]">(untuk menerima pass QR Anda)</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="your@email.com"
              className="w-full border border-[#e0d5c5] rounded-lg px-4 py-2.5 text-[#3a3028] focus:outline-none focus:border-[var(--color-gold)] font-[family-name:var(--font-lato)]"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#9a7d5a] mb-1 font-[family-name:var(--font-lato)]">
              Nomor WhatsApp <span className="normal-case text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={form.phone_number}
              onChange={(e) => set("phone_number", e.target.value)}
              placeholder="e.g. +62812345678"
              className="w-full border border-[#e0d5c5] rounded-lg px-4 py-2.5 text-[#3a3028] focus:outline-none focus:border-[var(--color-gold)] font-[family-name:var(--font-lato)]"
            />
          </div>

          {/* Attendance */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#9a7d5a] mb-2 font-[family-name:var(--font-lato)]">
              Apakah Anda hadir? *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "yes", label: "Dengan Senang Hati" },
                { value: "no", label: "Dengan Menyesal Tidak Bisa" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("attending", value)}
                  className={`py-3 rounded-xl border text-sm transition-colors font-[family-name:var(--font-lato)] ${
                    form.attending === value
                      ? "bg-[var(--color-gold)] border-[var(--color-gold)] text-white"
                      : "border-[#e0d5c5] text-[#9a7d5a] hover:border-[var(--color-gold)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Plus One (only if attending) */}
          {form.attending === "yes" && (
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#9a7d5a] mb-1 font-[family-name:var(--font-lato)]">
                Nama Plus One <span className="normal-case text-[var(--color-gold)]">(opsional)</span>
              </label>
              <input
                type="text"
                value={form.plus_one_name}
                onChange={(e) => set("plus_one_name", e.target.value)}
                placeholder="Nama lengkap tamu"
                className="w-full border border-[#e0d5c5] rounded-lg px-4 py-2.5 text-[#3a3028] focus:outline-none focus:border-[var(--color-gold)] font-[family-name:var(--font-lato)]"
              />
            </div>
          )}

          {/* Group Name */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#9a7d5a] mb-1 font-[family-name:var(--font-lato)]">
              Dari mana / Nama Grup <span className="normal-case text-[var(--color-gold)]">(opsional)</span>
            </label>
            <input
              type="text"
              value={form.group_name}
              onChange={(e) => set("group_name", e.target.value)}
              placeholder="mis. Keluarga Jakarta, Teman Kuliah"
              className="w-full border border-[#e0d5c5] rounded-lg px-4 py-2.5 text-[#3a3028] focus:outline-none focus:border-[var(--color-gold)] font-[family-name:var(--font-lato)]"
            />
          </div>

          {/* Side */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#9a7d5a] mb-2 font-[family-name:var(--font-lato)]">
              Tamu dari *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "bride", label: "Mempelai Wanita" },
                { value: "groom", label: "Mempelai Pria" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("side", value)}
                  className={`py-3 rounded-xl border text-sm transition-colors font-[family-name:var(--font-lato)] ${
                    form.side === value
                      ? "bg-[var(--color-gold)] border-[var(--color-gold)] text-white"
                      : "border-[#e0d5c5] text-[#9a7d5a] hover:border-[var(--color-gold)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#9a7d5a] mb-1 font-[family-name:var(--font-lato)]">
              Tinggalkan Pesan <span className="normal-case text-[var(--color-gold)]">(opsional)</span>
            </label>
            <textarea
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Ucapan selamat untuk pasangan..."
              rows={3}
              className="w-full border border-[#e0d5c5] rounded-lg px-4 py-2.5 text-[#3a3028] focus:outline-none focus:border-[var(--color-gold)] resize-none font-[family-name:var(--font-lato)]"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-[family-name:var(--font-lato)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[var(--color-gold)] text-white rounded-xl text-sm tracking-widest uppercase hover:bg-[var(--color-gold-hover)] transition-colors disabled:opacity-50 font-[family-name:var(--font-lato)]"
          >
            {loading ? "Mengirim..." : "Kirim RSVP"}
          </button>
        </form>
      </div>
    </section>
  );
}

function SuccessScreen({ result }: { result: RsvpResult }) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (result.attending) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(t);
    }
  }, [result.attending]);

  const phone = result.phone_number?.replace(/\D/g, "") ?? "";
  const whatsappUrl = result.qrUrl && phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(`Halo! Pass masuk pernikahanmu sudah siap: ${result.qrUrl}`)}`
    : result.qrUrl
    ? `https://wa.me/?text=${encodeURIComponent(`Pass masuk pernikahanku: ${result.qrUrl}`)}`
    : null;



  return (
    <section className="py-16 px-4 bg-[var(--color-cream-dark)] relative overflow-hidden">
      {showConfetti && <Confetti />}
      <div className="max-w-md mx-auto text-center">
        <div className="text-4xl mb-4">{result.attending ? "🎉" : "💌"}</div>
        <h2 className="text-3xl font-[family-name:var(--font-wedding)] text-[#3a3028] mb-3">
          {result.attending ? (result.updated ? "RSVP Diperbarui!" : "Sampai jumpa di sana!") : "Kami akan merindukanmu!"}
        </h2>
        <p className="text-[#9a7d5a] mb-8 font-[family-name:var(--font-lato)]">
          {result.attending
            ? result.updated
              ? `RSVP kamu telah diperbarui, ${result.name}. Pass masuk QR baru telah dikirim ke emailmu.`
              : `Terima kasih, ${result.name}! RSVP kamu sudah dikonfirmasi. Simpan pass masuk QR kamu di bawah ini.`
            : `Terima kasih sudah memberi tahu kami, ${result.name}. Semoga kita segera bertemu!`}
        </p>

        {result.attending && result.qrDataUrl && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <p className="text-xs uppercase tracking-widest text-[var(--color-gold)] mb-4 font-[family-name:var(--font-lato)]">
              Pass Masuk Anda
            </p>
            <Image
              src={result.qrDataUrl}
              alt="QR Entry Pass"
              width={200}
              height={200}
              className="mx-auto rounded-xl"
            />
            <p className="text-xs text-[#9a7d5a] mt-3 font-[family-name:var(--font-lato)]">
              Screenshot ini atau cek emailmu
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-5">
              {/* Download */}
              <a
                href={result.qrDataUrl}
                download="my-wedding-pass.png"
                className="flex-1 py-2.5 border border-[var(--color-gold)] text-[var(--color-gold)] rounded-xl text-sm hover:bg-[var(--color-gold)] hover:text-white transition-colors font-[family-name:var(--font-lato)]"
              >
                Simpan QR Code
              </a>

              {/* WhatsApp */}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-[#25d366] text-white rounded-xl text-sm hover:bg-[#1ebe5d] transition-colors font-[family-name:var(--font-lato)]"
                >
                  Bagikan via WhatsApp
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Confetti ──────────────────────────────────────────────── */
const CONFETTI_COLORS = ["#c9a96e", "#f0d080", "#e8c5b0", "#fff7d4", "#b8945a", "#faedcd", "#ffffff"];
const CONFETTI_COUNT = 80;

function Confetti() {
  const pieces = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const left = Math.random() * 100;
    const delay = Math.random() * 1.2;
    const duration = 2.5 + Math.random() * 2;
    const size = 6 + Math.random() * 8;
    const rotate = Math.random() * 360;
    const drift = (Math.random() - 0.5) * 120;
    return { color, left, delay, duration, size, rotate, drift };
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-[150] overflow-hidden">
      {pieces.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: "-20px",
            width: p.size,
            height: p.size * 0.5,
            backgroundColor: p.color,
            borderRadius: "2px",
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
