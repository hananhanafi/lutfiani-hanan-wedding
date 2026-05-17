"use client";

import { useState } from "react";
import type { Guest } from "@/types";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone_number: "",
  attending: "" as "" | "true" | "false",
  plus_one_name: "",
  group_name: "",
  side: "" as "" | "bride" | "groom",
  message: "",
};

function AddGuestModal({ onClose, onAdded }: { onClose: () => void; onAdded: (guest: Guest) => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (field: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          attending: form.attending === "true" ? true : form.attending === "false" ? false : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menambahkan tamu.");
      } else {
        onAdded(data.guest);
        onClose();
      }
    } catch {
      setError("Koneksi error. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Tambah Tamu Baru</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nama <span className="text-red-400">*</span></label>
            <input
              required
              value={form.name}
              onChange={set("name")}
              maxLength={100}
              placeholder="Nama lengkap"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
            />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                maxLength={254}
                placeholder="email@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">No. WhatsApp <span className="text-red-400">*</span></label>
              <input
                required
                type="tel"
                value={form.phone_number}
                onChange={set("phone_number")}
                maxLength={30}
                placeholder="+62 812 345 678"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
          </div>

          {/* Attending + Plus One */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Kehadiran</label>
              <select
                value={form.attending}
                onChange={set("attending")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white"
              >
                <option value="">Belum Konfirmasi</option>
                <option value="true">Hadir</option>
                <option value="false">Tidak Hadir</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Plus One</label>
              <input
                value={form.plus_one_name}
                onChange={set("plus_one_name")}
                maxLength={100}
                placeholder="Nama pasangan"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
          </div>

          {/* Group + Side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Grup</label>
              <input
                value={form.group_name}
                onChange={set("group_name")}
                maxLength={100}
                placeholder="cth. Keluarga, Kampus"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pihak</label>
              <select
                value={form.side}
                onChange={set("side")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white"
              >
                <option value="">—</option>
                <option value="bride">Mempelai Wanita</option>
                <option value="groom">Mempelai Pria</option>
              </select>
            </div>
          </div>

          {/* Message / Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Catatan / Pesan</label>
            <textarea
              value={form.message}
              onChange={set("message")}
              maxLength={500}
              rows={2}
              placeholder="Catatan opsional untuk tamu ini"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] disabled:opacity-50 transition-colors"
            >
              {saving ? "Menambahkan…" : "Tambah Tamu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditGuestModal({ guest, onClose, onUpdated }: { guest: Guest; onClose: () => void; onUpdated: (guest: Guest) => void }) {
  const [form, setForm] = useState({
    name: guest.name,
    email: guest.email ?? "",
    phone_number: guest.phone_number ?? "",
    attending: (guest.attending === true ? "true" : guest.attending === false ? "false" : "") as "" | "true" | "false",
    plus_one_name: guest.plus_one_name ?? "",
    group_name: guest.group_name ?? "",
    side: (guest.side ?? "") as "" | "bride" | "groom",
    message: guest.message ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/guests/${guest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          attending: form.attending === "true" ? true : form.attending === "false" ? false : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan perubahan.");
      } else {
        onUpdated(data.guest);
        onClose();
      }
    } catch {
      setError("Koneksi error. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Edit Tamu</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nama <span className="text-red-400">*</span></label>
            <input required value={form.name} onChange={set("name")} maxLength={100} placeholder="Nama lengkap"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</label>
              <input type="email" value={form.email} onChange={set("email")} maxLength={254} placeholder="email@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">No. WhatsApp <span className="text-red-400">*</span></label>
              <input required type="tel" value={form.phone_number} onChange={set("phone_number")} maxLength={30} placeholder="+62 812 345 678"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Kehadiran</label>
              <select value={form.attending} onChange={set("attending")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white">
                <option value="">Belum Konfirmasi</option>
                <option value="true">Hadir</option>
                <option value="false">Tidak Hadir</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Plus One</label>
              <input value={form.plus_one_name} onChange={set("plus_one_name")} maxLength={100} placeholder="Nama pasangan"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Grup</label>
              <input value={form.group_name} onChange={set("group_name")} maxLength={100} placeholder="cth. Keluarga, Kampus"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pihak</label>
              <select value={form.side} onChange={set("side")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white">
                <option value="">—</option>
                <option value="bride">Mempelai Wanita</option>
                <option value="groom">Mempelai Pria</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Catatan / Pesan</label>
            <textarea value={form.message} onChange={set("message")} maxLength={500} rows={2} placeholder="Catatan opsional untuk tamu ini"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] resize-none" />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] disabled:opacity-50 transition-colors">
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const statusBadge = (attending: boolean | undefined) => {
  if (attending === true) return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Hadir</span>;
  if (attending === false) return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">Tidak Hadir</span>;
  return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">Menunggu</span>;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function SendEmailButton({ guest }: { guest: Guest }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (!guest.email || !guest.attending) return <span className="text-gray-300 text-xs">—</span>;

  const handleSend = async () => {
    setStatus("sending");
    try {
      const res = await fetch("/api/admin/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: guest.id }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") return <span className="text-green-600 text-xs font-medium">✅ Terkirim</span>;
  if (status === "error") return <span className="text-red-500 text-xs">Gagal</span>;

  return (
    <button
      onClick={handleSend}
      disabled={status === "sending"}
      className="text-xs px-2 py-1 rounded bg-[var(--color-gold)] text-white hover:bg-[var(--color-gold-hover)] disabled:opacity-50 transition-colors whitespace-nowrap"
    >
      {status === "sending" ? "Mengirim…" : "Kirim Pass"}
    </button>
  );
}

function WhatsAppButton({ guest }: { guest: Guest }) {
  if (!guest.attending || !guest.phone_number) return <span className="text-gray-300 text-xs">—</span>;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const passUrl = `${appUrl}/pass?token=${guest.token}`;
  const text = encodeURIComponent(`Halo ${guest.name.split(" ")[0]}! Ini adalah pass masuk pernikahanmu: ${passUrl}`);
  const phone = guest.phone_number.replace(/\D/g, "");
  const waUrl = `https://wa.me/${phone}?text=${text}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs px-2 py-1 rounded bg-[#25d366] text-white hover:bg-[#1da851] transition-colors whitespace-nowrap inline-block"
    >
      WhatsApp
    </a>
  );
}

function DeleteButton({ guestId, guestName, onDeleted }: { guestId: string; guestName: string; onDeleted: (id: string) => void }) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/guests/${guestId}`, { method: "DELETE" });
      if (res.ok) onDeleted(guestId);
    } catch {
      // silently fail — button resets
    } finally {
      setDeleting(false);
      setConfirm(false);
    }
  };

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 whitespace-nowrap">Hapus {guestName.split(" ")[0]}?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {deleting ? "…" : "Ya"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          Tidak
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs px-2 py-1 rounded border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors whitespace-nowrap"
    >
      Hapus
    </button>
  );
}

/* ── CSV Import Modal ──────────────────────────────────────── */
function CsvImportModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: (guests: Guest[]) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: { row: number; reason: string }[] } | null>(null);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/guests/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Import gagal."); return; }
      setResult({ imported: data.imported, skipped: data.skipped ?? [] });
      if (data.imported > 0) {
        onImported(data.guests ?? []);
      }
    } catch {
      setError("Koneksi error. Coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Import Tamu via CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Format guide */}
          <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500 space-y-1 font-mono leading-relaxed">
            <p className="font-sans font-semibold text-gray-600 mb-2 text-xs uppercase tracking-wide">Format CSV</p>
            <p>Kolom <span className="text-red-400">wajib</span>: <code>name</code></p>
            <p>Kolom opsional: <code>phone</code>, <code>email</code>, <code>group</code>, <code>side</code>, <code>attending</code>, <code>plus_one</code>, <code>message</code></p>
            <p className="pt-1 font-sans text-gray-400">Nilai <code>side</code>: bride / groom</p>
            <p className="font-sans text-gray-400">Nilai <code>attending</code>: yes / no</p>
          </div>

          {/* Download template */}
          <a
            href="data:text/csv;charset=utf-8,%EF%BB%BFname,phone,email,group,side,attending%0AJohn Doe,+62812345678,john@example.com,College Friends,groom,yes"
            download="guest-import-template.csv"
            className="inline-block text-xs text-[var(--color-gold)] hover:underline"
          >
            ↓ Unduh template CSV
          </a>

          {/* File picker */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pilih File</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); setError(""); }}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[var(--color-gold)] file:text-white hover:file:bg-[var(--color-gold-hover)] cursor-pointer"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {result && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm space-y-1">
              <p className="font-medium text-green-700">✓ {result.imported} tamu berhasil diimport.</p>
              {result.skipped.length > 0 && (
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer">{result.skipped.length} baris dilewati</summary>
                  <ul className="mt-1 ml-3 list-disc space-y-0.5">
                    {result.skipped.map((s) => (
                      <li key={s.row}>Baris {s.row}: {s.reason}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              {result ? "Tutup" : "Batal"}
            </button>
            {!result && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-5 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] disabled:opacity-50 transition-colors"
              >
                {uploading ? "Mengimport…" : "Import"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── WhatsApp Batch Modal ──────────────────────────────────── */
const DEFAULT_TEMPLATE =
  "Assalamualaikum Warahmatullahi Wabarakatuh 🤍\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i *{name}* untuk hadir dalam acara pernikahan kami.\n\nBerikut link undangan kami, untuk informasi lengkap mengenai acara dapat diakses melalui:\n{link}\n\nMerupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i *{name}* berkenan untuk hadir dan memberikan doa restu kepada kedua mempelai 🙏\n\nTerima kasih banyak atas perhatian dan doanya ✨\n\nWassalamualaikum Warahmatullahi Wabarakatuh\n\nHormat kami,\n[Nama Mempelai]";

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("62")) return digits;
  return digits;
}

function WhatsAppBatchModal({
  guests,
  onClose,
}: {
  guests: Guest[];
  onClose: () => void;
}) {
  const eligible = guests.filter((g) => g.phone_number?.trim());
  const skipped  = guests.filter((g) => !g.phone_number?.trim());

  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [step, setStep]         = useState<"compose" | "send">("compose");
  const [current, setCurrent]   = useState(0);
  const [sent, setSent]         = useState<Set<string>>(new Set());

  const base = typeof window !== "undefined" ? window.location.origin : "";

  function buildMessage(guest: Guest) {
    const link = `${base}/?token=${guest.token}`;
    return template
      .replace(/\{name\}/gi, guest.name)
      .replace(/\{link\}/gi, link);
  }

  function openWa(guest: Guest) {
    const phone = formatPhone(guest.phone_number!);
    const text  = encodeURIComponent(buildMessage(guest));
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener");
    setSent((prev) => new Set(prev).add(guest.id));
  }

  function next() {
    if (current < eligible.length - 1) setCurrent((c) => c + 1);
    else onClose();
  }

  if (step === "send") {
    const guest   = eligible[current];
    const preview = buildMessage(guest);
    const isDone  = current >= eligible.length;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Kirim WhatsApp</h2>
              <p className="text-xs text-gray-400 mt-0.5">{current + 1} / {eligible.length} tamu</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <div
              className="h-1 bg-[var(--color-gold)] transition-all"
              style={{ width: `${((current) / eligible.length) * 100}%` }}
            />
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Guest info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-cream-dark)] flex items-center justify-center text-[var(--color-gold)] font-semibold text-sm shrink-0">
                {guest.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">{guest.name}</p>
                <p className="text-xs text-gray-400">{guest.phone_number}</p>
              </div>
              {sent.has(guest.id) && (
                <span className="ml-auto text-xs text-green-600 font-medium">✓ Terbuka</span>
              )}
            </div>

            {/* Message preview */}
            <div className="bg-[#dcf8c6] rounded-xl rounded-bl-none px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed shadow-sm">
              {preview}
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={next}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                {current < eligible.length - 1 ? "Lewati →" : "Selesai"}
              </button>
              <div className="flex gap-2">
                {sent.has(guest.id) ? (
                  <button
                    type="button"
                    onClick={next}
                    className="px-5 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] transition-colors"
                  >
                    {current < eligible.length - 1 ? "Lanjut →" : "Selesai ✓"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openWa(guest)}
                    className="px-5 py-2 bg-[#25d366] text-white rounded-lg text-sm hover:bg-[#1ebe5d] transition-colors flex items-center gap-2"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.096.541 4.066 1.487 5.788L0 24l6.39-1.467A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.003-1.37l-.36-.214-3.713.853.882-3.613-.235-.371A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                    Buka WhatsApp
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compose step
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Kirim WhatsApp Massal</h2>
            <p className="text-xs text-gray-400 mt-0.5">{eligible.length} tamu dengan nomor HP</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {/* Placeholder guide */}
          <div className="flex gap-3 text-xs text-gray-400">
            <span className="bg-gray-100 rounded px-2 py-1 font-mono"><code>{"{name}"}</code> — nama tamu</span>
            <span className="bg-gray-100 rounded px-2 py-1 font-mono"><code>{"{link}"}</code> — link undangan</span>
          </div>

          {/* Template editor */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Template Pesan</label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={7}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[var(--color-gold)] resize-none font-mono leading-relaxed"
            />
          </div>

          {/* Guest list */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Daftar Tamu ({eligible.length})
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
              {eligible.map((g) => (
                <div key={g.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="font-medium text-gray-700 flex-1 truncate">{g.name}</span>
                  <span className="text-gray-400 text-xs shrink-0">{g.phone_number}</span>
                </div>
              ))}
            </div>
          </div>

          {skipped.length > 0 && (
            <p className="text-xs text-amber-500">{skipped.length} tamu dilewati (tidak ada nomor HP).</p>
          )}
        </div>

        <div className="px-6 pb-5 flex items-center justify-between gap-3 shrink-0 border-t border-gray-100 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Batal
          </button>
          <button
            type="button"
            disabled={eligible.length === 0}
            onClick={() => { setCurrent(0); setStep("send"); }}
            className="px-5 py-2 bg-[#25d366] text-white rounded-lg text-sm hover:bg-[#1ebe5d] disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.096.541 4.066 1.487 5.788L0 24l6.39-1.467A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.003-1.37l-.36-.214-3.713.853.882-3.613-.235-.371A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
            Mulai Kirim ({eligible.length})
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GuestTable({ guests: initialGuests }: { guests: Guest[] }) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showWaModal, setShowWaModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleDeleted = (id: string) =>
    setGuests((prev) => prev.filter((g) => g.id !== id));

  const handleAdded = (guest: Guest) =>
    setGuests((prev) => [guest, ...prev]);

  const handleUpdated = (guest: Guest) =>
    setGuests((prev) => prev.map((g) => g.id === guest.id ? guest : g));

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleExportSelected = () => {
    const toExport = guests.filter((g) => selectedIds.has(g.id));
    const headers = ["Nama", "Email", "Telepon", "Hadir", "Plus Satu", "Grup", "Pihak", "Pesan", "Dikirim Pada", "Check-in", "Waktu Check-in"];
    const rows = toExport.map((g) => [
      g.name,
      g.email ?? "",
      g.phone_number ?? "",
      g.attending === true ? "Ya" : g.attending === false ? "Tidak" : "Menunggu",
      g.plus_one_name ?? "",
      g.group_name ?? "",
      g.side ?? "",
      (g.message ?? "").replace(/,/g, ";"),
      g.submitted_at,
      g.checked_in ? "Ya" : "Tidak",
      g.checked_in_at ?? "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v)}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rsvp-terpilih-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = guests.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      (g.email ?? "").toLowerCase().includes(q) ||
      (g.group_name ?? "").toLowerCase().includes(q) ||
      (g.side ?? "").toLowerCase().includes(q)
    );
  });

  const allFilteredSelected = filtered.length > 0 && filtered.every((g) => selectedIds.has(g.id));
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

  return (
    <div className="space-y-4">
      {showAddModal && (
        <AddGuestModal onClose={() => setShowAddModal(false)} onAdded={handleAdded} />
      )}
      {showImportModal && (
        <CsvImportModal onClose={() => setShowImportModal(false)} onImported={(newGuests) => setGuests((prev) => [...newGuests, ...prev])} />
      )}
      {showWaModal && (
        <WhatsAppBatchModal
          guests={guests.filter((g) => selectedIds.has(g.id))}
          onClose={() => setShowWaModal(false)}
        />
      )}
      {editingGuest && (
        <EditGuestModal guest={editingGuest} onClose={() => setEditingGuest(null)} onUpdated={handleUpdated} />
      )}

      {/* Search + Add */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, email, grup, atau pihak…"
          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[var(--color-gold)] bg-white shadow-sm"
        />
        <div className="relative shrink-0">
          <button
            onClick={() => setShowExportMenu((v) => !v)}
            disabled={selectedIds.size === 0}
            className="px-4 py-2.5 border border-[var(--color-gold)] text-[var(--color-gold)] rounded-lg text-sm hover:bg-[var(--color-cream-dark)] transition-colors whitespace-nowrap shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            Ekspor{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""} ↓
          </button>
          {showExportMenu && selectedIds.size > 0 && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]">
                <button
                  onClick={() => { handleExportSelected(); setShowExportMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  CSV ↓
                </button>
                <a
                  href={`/api/admin/export-qr?ids=${Array.from(selectedIds).join(",")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowExportMenu(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  QR PDF 📷
                </a>
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="shrink-0 px-4 py-2.5 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] transition-colors whitespace-nowrap shadow-sm"
        >
          + Tambah Tamu
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          className="shrink-0 px-4 py-2.5 border border-[var(--color-gold)] text-[var(--color-gold)] rounded-lg text-sm hover:bg-[var(--color-cream-dark)] transition-colors whitespace-nowrap shadow-sm"
        >
          Import CSV ↑
        </button>
        <button
          onClick={() => setShowWaModal(true)}
          disabled={selectedIds.size === 0}
          className="shrink-0 px-4 py-2.5 bg-[#25d366] text-white rounded-lg text-sm hover:bg-[#1ebe5d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shadow-sm"
        >
          WA{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""} 💬
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {guests.length === 0 ? (
          <div className="p-10 text-center text-gray-400 shadow-sm">
            Belum ada RSVP. Bagikan link undangan atau tambah tamu secara manual.
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">Tidak ada tamu yang cocok dengan pencarian.</div>
        ) : null}

        {/* Mobile cards */}
        <div className="sm:hidden">
          {/* Mobile select-all bar */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAll}
                  className="w-5 h-5 rounded border-gray-300 cursor-pointer accent-[var(--color-gold)] shrink-0"
                />
                <span className="text-sm text-gray-600">
                  {allFilteredSelected ? "Batalkan Semua" : "Pilih Semua"}
                </span>
              </label>
              {selectedIds.size > 0 && (
                <span className="text-xs text-[var(--color-gold)] font-medium">{selectedIds.size} dipilih</span>
              )}
            </div>
          )}
          <div className="divide-y divide-gray-100">
          {filtered.map((g) => (
            <div key={g.id} className={`p-4 space-y-2 ${selectedIds.has(g.id) ? "bg-amber-50" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="flex items-center cursor-pointer -m-2 p-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(g.id)}
                      onChange={() => toggleSelect(g.id)}
                      className="w-5 h-5 rounded border-gray-300 cursor-pointer accent-[var(--color-gold)] shrink-0"
                    />
                  </label>
                  <span className="font-medium text-gray-800">{g.name}</span>
                </div>
                {statusBadge(g.attending)}
              </div>
              {g.plus_one_name && <p className="text-xs text-gray-500">+1: {g.plus_one_name}</p>}
              {g.group_name && <p className="text-xs text-gray-500">Grup: {g.group_name}</p>}
              {g.side && <p className="text-xs text-gray-500 capitalize">Pihak: {g.side}</p>}
              {g.email && <p className="text-xs text-gray-400">{g.email}</p>}
              {g.phone_number && <p className="text-xs text-gray-400">{g.phone_number}</p>}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-400">{formatDate(g.submitted_at)}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingGuest(g)}
                    className="text-xs px-2 py-1 rounded border border-[var(--color-gold)]/50 text-[var(--color-gold)] hover:bg-[var(--color-cream-dark)] transition-colors whitespace-nowrap"
                  >
                    Edit
                  </button>
                  <SendEmailButton guest={g} />
                  <WhatsAppButton guest={g} />
                  <DeleteButton guestId={g.id} guestName={g.name} onDeleted={handleDeleted} />
                </div>
              </div>
              {g.checked_in && <span className="text-xs text-green-600 font-medium">✅ Sudah Check-in</span>}
            </div>
          ))}
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-[var(--color-gold)]"
                  />
                </th>
                {["Nama", "Email", "Telepon", "Status", "+1", "Grup", "Pihak", "Pesan", "Dikirim", "Check-in", "Pass", "WhatsApp", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((g) => (
                <tr key={g.id} className={`hover:bg-gray-50 ${selectedIds.has(g.id) ? "bg-amber-50" : ""}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(g.id)}
                      onChange={() => toggleSelect(g.id)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-[var(--color-gold)]"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{g.name}</td>
                  <td className="px-4 py-3 text-gray-500">{g.email ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{g.phone_number ?? "—"}</td>
                  <td className="px-4 py-3">{statusBadge(g.attending)}</td>
                  <td className="px-4 py-3 text-gray-500">{g.plus_one_name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{g.group_name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{g.side ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{g.message ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(g.submitted_at)}</td>
                  <td className="px-4 py-3">
                    {g.checked_in ? (
                      <span className="text-green-600 font-medium">✅ Ya</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <SendEmailButton guest={g} />
                  </td>
                  <td className="px-4 py-3">
                    <WhatsAppButton guest={g} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingGuest(g)}
                        className="text-xs px-2 py-1 rounded border border-[var(--color-gold)]/50 text-[var(--color-gold)] hover:bg-[var(--color-cream-dark)] transition-colors whitespace-nowrap"
                      >
                        Edit
                      </button>
                      <DeleteButton guestId={g.id} guestName={g.name} onDeleted={handleDeleted} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
