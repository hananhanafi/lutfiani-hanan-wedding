"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      username: form.username,
      password: form.password,
      redirect: false,
    });

    setLoading(false);
    if (res?.ok) {
      router.push(callbackUrl);
    } else {
      setError("Nama pengguna atau kata sandi salah.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fffbf5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-[family-name:var(--font-wedding)] text-[#3a3028]">Panel Admin</h1>
          <p className="text-sm text-[#9a7d5a] mt-1 font-[family-name:var(--font-lato)]">Manajemen Undangan Pernikahan</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#9a7d5a] mb-1 font-[family-name:var(--font-lato)]">
              Nama Pengguna
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              className="w-full border border-[#e0d5c5] rounded-lg px-4 py-2.5 text-[#3a3028] focus:outline-none focus:border-[var(--color-gold)]"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-[#9a7d5a] mb-1 font-[family-name:var(--font-lato)]">
              Kata Sandi
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full border border-[#e0d5c5] rounded-lg px-4 py-2.5 text-[#3a3028] focus:outline-none focus:border-[var(--color-gold)]"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[var(--color-gold)] text-white rounded-xl text-sm tracking-widest uppercase hover:bg-[var(--color-gold-hover)] transition-colors disabled:opacity-50"
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
