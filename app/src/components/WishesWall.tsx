"use client";

import { useState, useEffect, useCallback } from "react";

const EMOJIS = ["\u2764\uFE0F", "\uD83C\uDF89", "\uD83E\uDD42", "\uD83D\uDE0D", "\uD83D\uDE4F"];
const REACTIONS_KEY = "wish_reactions";
const PAGE_SIZE = 6;

interface Wish {
  id: string;
  name: string;
  message: string;
  created_at: string;
  reactions?: Record<string, number>;
}

interface Props {
  isAdmin?: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function loadMyReactions(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(REACTIONS_KEY) ?? "{}"); } catch { return {}; }
}
function saveMyReactions(r: Record<string, boolean>) {
  localStorage.setItem(REACTIONS_KEY, JSON.stringify(r));
}

export default function WishesWall({ isAdmin = false }: Props) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [myReactions, setMyReactions] = useState<Record<string, boolean>>({});

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => { setMyReactions(loadMyReactions()); }, []);

  const fetchWishes = useCallback(async (p: number) => {
    const res = await fetch(`/api/wishes?page=${p}&limit=${PAGE_SIZE}`);
    if (res.ok) {
      const json = await res.json();
      setWishes(json.data ?? []);
      setTotal(json.total ?? 0);
    }
  }, []);

  useEffect(() => { fetchWishes(page); }, [fetchWishes, page]);

  const handleReact = async (wishId: string, emoji: string) => {
    const key = `${wishId}_${emoji}`;
    const alreadyReacted = myReactions[key];

    setWishes((prev) => prev.map((w) => {
      if (w.id !== wishId) return w;
      const r = { ...(w.reactions ?? {}) };
      if (alreadyReacted) {
        r[emoji] = Math.max(0, (r[emoji] ?? 1) - 1);
        if (r[emoji] === 0) delete r[emoji];
      } else {
        r[emoji] = (r[emoji] ?? 0) + 1;
      }
      return { ...w, reactions: r };
    }));

    const newMyReactions = { ...myReactions, [key]: !alreadyReacted };
    if (!newMyReactions[key]) delete newMyReactions[key];
    setMyReactions(newMyReactions);
    saveMyReactions(newMyReactions);

    await fetch(`/api/wishes/${wishId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji, remove: alreadyReacted }),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !message.trim()) return setError("Harap isi kedua kolom.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      if (!res.ok) throw new Error("Gagal mengirim.");
      setSubmitted(true);
      setName("");
      setMessage("");
      setPage(1);
      fetchWishes(1);
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pesan ini?")) return;
    await fetch(`/api/admin/wishes/${id}`, { method: "DELETE" });
    const newTotal = total - 1;
    const newTotalPages = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
    const newPage = Math.min(page, newTotalPages);
    setPage(newPage);
    fetchWishes(newPage);
  };

  return (
    <section id="wishes" className="glass-bg py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-gold)] mb-3 font-[family-name:var(--font-lato)]">
            Doa &amp; Harapan
          </p>
          <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-wedding)] text-[#3a3028]">
            Leave a Message
          </h2>
          <div className="w-12 h-px bg-[var(--color-gold)] mx-auto mt-4" />
        </div>

        {!isAdmin && (
          <div className="glass rounded-2xl p-6 mb-10">
            {submitted ? (
              <p className="text-center text-[#9a7d5a] font-[family-name:var(--font-lato)]">
                Terima kasih atas pesanmu!{" "}
                <button onClick={() => setSubmitted(false)} className="text-[var(--color-gold)] underline">
                  Tulis lagi
                </button>
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full border border-[#e0d5c5] rounded-lg px-4 py-2.5 text-[#3a3028] focus:outline-none focus:border-[var(--color-gold)] font-[family-name:var(--font-lato)] bg-white/70"
                />
                <textarea
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tulis ucapan selamat Anda" rows={3}
                  className="w-full border border-[#e0d5c5] rounded-lg px-4 py-2.5 text-[#3a3028] focus:outline-none focus:border-[var(--color-gold)] font-[family-name:var(--font-lato)] bg-white/70 resize-none"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" disabled={submitting}
                  className="w-full py-3 bg-[var(--color-gold)] text-white rounded-xl text-sm tracking-widest uppercase hover:bg-[var(--color-gold-hover)] transition-colors font-[family-name:var(--font-lato)] disabled:opacity-50">
                  {submitting ? "Mengirim" : "Kirim Pesan"}
                </button>
              </form>
            )}
          </div>
        )}

        {wishes.length === 0 ? (
          <p className="text-center text-[#9a7d5a] font-[family-name:var(--font-lato)]">
            Belum ada pesan. Jadilah yang pertama!
          </p>
        ) : (
          <>
            <div className="space-y-4">
              {wishes.map((w) => (
                <div key={w.id} className="glass rounded-2xl px-5 py-4 relative">
                  <p className="font-[family-name:var(--font-wedding)] text-[#3a3028] font-medium mb-1">{w.name}</p>
                  <p className="text-[#3a3028]/70 font-[family-name:var(--font-lato)] text-sm leading-relaxed pr-12">{w.message}</p>
                  <p className="text-xs text-[#9a7d5a] mt-2 mb-3 font-[family-name:var(--font-lato)]">{formatDate(w.created_at)}</p>

                  {!isAdmin && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {EMOJIS.map((emoji) => {
                        const key = `${w.id}_${emoji}`;
                        const reacted = !!myReactions[key];
                        const count = w.reactions?.[emoji] ?? 0;
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReact(w.id, emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all font-[family-name:var(--font-lato)] ${
                              reacted
                                ? "bg-[var(--color-gold)] text-white shadow-sm scale-105"
                                : "bg-white/60 text-[#9a7d5a] hover:bg-[#f5efe6] hover:scale-105"
                            }`}
                          >
                            <span>{emoji}</span>
                            {count > 0 && <span className="font-medium">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {isAdmin && (
                    <button onClick={() => handleDelete(w.id)}
                      className="absolute top-3 right-3 text-xs text-red-400 hover:text-red-600 transition-colors">
                      Hapus
                    </button>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-full border border-[var(--color-gold)] text-[var(--color-gold)] text-sm hover:bg-[var(--color-gold)] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-[family-name:var(--font-lato)]">
                  Sebelumnya
                </button>
                <span className="text-sm text-[#9a7d5a] font-[family-name:var(--font-lato)]">{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-full border border-[var(--color-gold)] text-[var(--color-gold)] text-sm hover:bg-[var(--color-gold)] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-[family-name:var(--font-lato)]">
                  Berikutnya
                </button>
              </div>
            )}

            {total > 0 && (
              <p className="text-center text-xs text-[#c9b99a] mt-3 font-[family-name:var(--font-lato)]">
                {total} pesan
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
