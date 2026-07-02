"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function EnterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only allow same-origin relative paths (guards against open-redirect)
  const rawRedirect = searchParams.get("redirect") ?? "/";
  const redirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";

  const [stage, setStage] = useState<"loading" | "form">("loading");
  const [partnerNames, setPartnerNames] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Auto-unlock: succeeds immediately if site password is disabled
    fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoUnlock: true }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.unlocked) {
          router.replace(redirect);
        } else {
          if (data.partnerOneName && data.partnerTwoName) {
            setPartnerNames(`${data.partnerOneName} & ${data.partnerTwoName}`);
          }
          setStage("form");
        }
      })
      .catch(() => setStage("form"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.unlocked) {
        router.replace(redirect);
      } else {
        setError(data.error ?? "Kata sandi salah.");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (stage === "loading") {
    return (
      <div className="min-h-screen bg-[#fffbf5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffbf5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-4xl mb-4">💍</div>
        <h1 className="text-3xl font-[family-name:var(--font-wedding)] text-[#3a3028] mb-2">
          {partnerNames || "Anda Diundang"}
        </h1>
        <p className="text-sm text-[#9a7d5a] mb-8 font-[family-name:var(--font-lato)]">
          Masukkan kata sandi undangan untuk melanjutkan
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kata Sandi"
            className="w-full border border-[#e0d5c5] rounded-lg px-4 py-3 text-[#3a3028] text-center text-lg tracking-widest focus:outline-none focus:border-[var(--color-gold)] font-[family-name:var(--font-lato)]"
            autoFocus
            autoComplete="current-password"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !password}
            className="w-full py-3 bg-[var(--color-gold)] text-white rounded-xl text-sm tracking-widest uppercase hover:bg-[var(--color-gold-hover)] transition-colors disabled:opacity-50 font-[family-name:var(--font-lato)]"
          >
            {submitting ? "Memeriksa…" : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
