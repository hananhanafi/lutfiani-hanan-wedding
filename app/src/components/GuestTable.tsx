"use client";

import { useState, useEffect } from "react";
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
  is_vip: false,
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

          {/* VIP Guest */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_vip}
                onChange={(e) => setForm((prev) => ({ ...prev, is_vip: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-[var(--color-gold)]"
              />
              <span className="text-sm font-medium text-gray-700">VIP Guest</span>
              <span className="text-xs text-gray-400">(undangan khusus)</span>
            </label>
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
    is_vip: guest.is_vip ?? false,
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

          {/* VIP Guest */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_vip}
                onChange={(e) => setForm((prev) => ({ ...prev, is_vip: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-[var(--color-gold)]"
              />
              <span className="text-sm font-medium text-gray-700">VIP Guest</span>
              <span className="text-xs text-gray-400">(undangan khusus)</span>
            </label>
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

function SendEmailButton({ guest, onSent }: { guest: Guest; onSent?: (guest: Guest) => void }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    guest.email_sent ? "sent" : "idle"
  );

  if (!guest.email || !guest.attending) return <span className="text-gray-300 text-xs">—</span>;

  const handleSend = async () => {
    setStatus("sending");
    try {
      const res = await fetch("/api/admin/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: guest.id }),
      });
      if (res.ok) {
        setStatus("sent");
        onSent?.({ ...guest, email_sent: true });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  // if (status === "sent") return <span className="text-green-600 text-xs font-medium">✅ Terkirim</span>;
  if (status === "error") return <span className="text-red-500 text-xs">Gagal</span>;

  return (
    <button
      onClick={handleSend}
      disabled={status === "sending"}
      className="text-xs px-2 py-1 rounded bg-[var(--color-gold)] text-white hover:bg-[var(--color-gold-hover)] disabled:opacity-50 transition-colors whitespace-nowrap"
    >
      {status === "sending" ? "Mengirim…" : "Kirim Email"}
    </button>
  );
}

function WhatsAppButton({ guest, coupleName, onSent }: { guest: Guest; coupleName: string; onSent?: (guest: Guest) => void }) {
  const isSent =
    guest.whatsapp_status === "sent" ||
    guest.whatsapp_status === "delivered" ||
    guest.whatsapp_status === "read";

  if (!guest.phone_number) return <span className="text-gray-300 text-xs">—</span>;
  // if (isSent) return <span className="text-green-600 text-xs font-medium">✅ Terkirim</span>;

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin).replace(/\/$/, "");
  const invitationLink = `${appUrl}/?token=${guest.token}`;
  const passLink = `${appUrl}/pass?token=${guest.token}`;

  const heart = String.fromCodePoint(0x1F90D); // 🤍
  const pray = String.fromCodePoint(0x1F64F); // 🙏

  const message = 
    `Assalamualaikum Warahmatullahi Wabarakatuh ${heart}\n\n` +
    `Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i *${guest.name}* untuk hadir dalam acara pernikahan kami.\n\n` +
    `Berikut link undangan kami, untuk info lengkap dari acara bisa kunjungi :\n${invitationLink}\n\n` +
    `*QR Masuk:*\n${passLink}\n` +
    `Tunjukkan QR code ini saat tiba di venue\n\n` +
    `Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir ${pray}\n\n` +
    `Wassalamualaikum Warahmatullahi Wabarakatuh\n\n` +
    `Hormat Kami,\n${coupleName}`;

  const rawPhone = guest.phone_number.replace(/\D/g, "");
  const phone = rawPhone.startsWith("0") ? "62" + rawPhone.slice(1) : rawPhone;

  const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

  const handleClick = async () => {
    const a = document.createElement("a");
    a.href = waUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    try {
      await fetch("/api/admin/send-whatsapp/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: guest.id }),
      });
      onSent?.({ ...guest, whatsapp_status: "sent" });
    } catch {
      // marking failure is non-critical
    }
  };

  return (
    <button
      onClick={handleClick}
      className="text-xs px-2 py-1 rounded text-white transition-colors whitespace-nowrap bg-[#25d366] hover:bg-[#1da851]"
    >
      Kirim WA
    </button>
  );
}

function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/pass?token=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — open in new tab as fallback
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy invitation link"}
      className={`text-xs px-2 py-1 rounded border transition-colors whitespace-nowrap ${
        copied
          ? "border-green-300 text-green-600 bg-green-50"
          : "border-blue-200 text-blue-500 hover:bg-blue-50 hover:text-blue-700"
      }`}
    >
      {copied ? "✓ Copied" : "🔗 Link"}
    </button>
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
function WhatsAppBatchModal({
  guests,
  coupleName,
  onClose,
  onSentAll,
}: {
  guests: Guest[];
  coupleName: string;
  onClose: () => void;
  onSentAll?: (results: { guestId: string; success: boolean }[]) => void;
}) {
  const eligible = guests.filter((g) => g.phone_number?.trim());
  const skipped  = guests.filter((g) => !g.phone_number?.trim());
  const toSend = eligible;

  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = not started
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());

  const isStarted = currentIndex >= 0;
  const isDone = currentIndex >= toSend.length;
  const currentGuest = isStarted && !isDone ? toSend[currentIndex] : null;

  const buildWaUrl = (guest: Guest) => {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin).replace(/\/$/, "");
    const invitationLink = `${appUrl}/?token=${guest.token}`;
    const passLink = `${appUrl}/pass?token=${guest.token}`;
    const heart = String.fromCodePoint(0x1F90D);
    const pray = String.fromCodePoint(0x1F64F);

    const message =
      `Assalamualaikum Warahmatullahi Wabarakatuh ${heart}\n\n` +
      `Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i *${guest.name}* untuk hadir dalam acara pernikahan kami.\n\n` +
      `Berikut link undangan kami, untuk info lengkap dari acara bisa kunjungi :\n${invitationLink}\n\n` +
      `*QR Masuk:*\n${passLink}\n` +
      `Tunjukkan QR code ini saat tiba di venue\n\n` +
      `Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir ${pray}\n\n` +
      `Wassalamualaikum Warahmatullahi Wabarakatuh\n\n` +
      `Hormat Kami,\n${coupleName}`;

    const rawPhone = (guest.phone_number ?? "").replace(/\D/g, "");
    const phone = rawPhone.startsWith("0") ? "62" + rawPhone.slice(1) : rawPhone;
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
  };

  const openCurrentAndMark = async () => {
    if (!currentGuest) return;
    const a = document.createElement("a");
    a.href = buildWaUrl(currentGuest);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();

    try {
      await fetch("/api/admin/send-whatsapp/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: currentGuest.id }),
      });
    } catch { /* non-critical */ }

    setSentIds((prev) => new Set(prev).add(currentGuest.id));
  };

  const handleStart = () => {
    setCurrentIndex(0);
  };

  const handleSendAndNext = async () => {
    await openCurrentAndMark();
    setCurrentIndex((i) => i + 1);
  };

  const handleSkip = () => {
    if (currentGuest) setSkippedIds((prev) => new Set(prev).add(currentGuest.id));
    setCurrentIndex((i) => i + 1);
  };

  const handleDone = () => {
    const results = toSend.map((g) => ({
      guestId: g.id,
      success: sentIds.has(g.id),
    }));
    onSentAll?.(results);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Kirim WhatsApp Massal</h2>
            <p className="text-xs text-gray-400 mt-0.5">via wa.me — kirim satu per satu</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {/* Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Akan dikirim</span>
              <span className="font-medium text-gray-800">{toSend.length} tamu</span>
            </div>
            {skipped.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tanpa nomor HP (dilewati)</span>
                <span className="text-amber-500 font-medium">{skipped.length} tamu</span>
              </div>
            )}
          </div>

          {/* Progress indicator */}
          {isStarted && !isDone && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{currentIndex + 1} / {toSend.length}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-[#25d366] h-2 rounded-full transition-all"
                  style={{ width: `${((currentIndex) / toSend.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Current guest card */}
          {currentGuest && (
            <div className="border border-[#25d366]/30 bg-green-50 rounded-lg p-4 space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Sedang mengirim ke:</p>
              <p className="text-base font-semibold text-gray-800">{currentGuest.name}</p>
              <p className="text-sm text-gray-500">{currentGuest.phone_number}</p>
            </div>
          )}

          {/* Guest list preview (before starting) */}
          {!isStarted && toSend.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Akan menerima pesan ({toSend.length})
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                {toSend.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="font-medium text-gray-700 flex-1 truncate">{g.name}</span>
                    <span className="text-gray-400 text-xs shrink-0">{g.phone_number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          {!isStarted && (
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 space-y-1">
              <p className="font-medium">Cara kerja:</p>
              <p>1. Klik &quot;Mulai Kirim&quot; untuk memulai</p>
              <p>2. Setiap tamu akan dibuka di tab WhatsApp baru</p>
              <p>3. Kirim pesan di WhatsApp, lalu klik &quot;Lanjut&quot; untuk tamu berikutnya</p>
            </div>
          )}

          {/* Done state */}
          {isDone && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm space-y-1">
              <p className="font-medium text-green-700">Selesai!</p>
              <p className="text-green-600">{sentIds.size} pesan dibuka di WhatsApp</p>
              {skippedIds.size > 0 && <p className="text-amber-600">{skippedIds.size} dilewati</p>}
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex items-center justify-between gap-3 shrink-0 border-t border-gray-100 pt-4">
          {!isStarted && (
            <>
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Batal
              </button>
              <button
                type="button"
                disabled={toSend.length === 0}
                onClick={handleStart}
                className="px-5 py-2 bg-[#25d366] text-white rounded-lg text-sm hover:bg-[#1ebe5d] disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.096.541 4.066 1.487 5.788L0 24l6.39-1.467A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.003-1.37l-.36-.214-3.713.853.882-3.613-.235-.371A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                Mulai Kirim ({toSend.length})
              </button>
            </>
          )}

          {isStarted && !isDone && (
            <>
              <button type="button" onClick={handleSkip} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Lewati
              </button>
              <button
                type="button"
                onClick={handleSendAndNext}
                className="px-5 py-2 bg-[#25d366] text-white rounded-lg text-sm hover:bg-[#1ebe5d] transition-colors flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.096.541 4.066 1.487 5.788L0 24l6.39-1.467A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.003-1.37l-.36-.214-3.713.853.882-3.613-.235-.371A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                Kirim & Lanjut
              </button>
            </>
          )}

          {isDone && (
            <button
              type="button"
              onClick={handleDone}
              className="ml-auto px-5 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] transition-colors"
            >
              Selesai
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GuestTable({ guests: initialGuests, coupleName = "Kami" }: { guests: Guest[]; coupleName?: string }) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showWaModal, setShowWaModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterAttending, setFilterAttending] = useState("");
  const [filterSide, setFilterSide] = useState("");
  const [filterCheckin, setFilterCheckin] = useState("");
  const [filterVip, setFilterVip] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterWa, setFilterWa] = useState("");

  // Draft state — only committed when Terapkan is clicked
  const [draft, setDraft] = useState({ attending: "", side: "", checkin: "", vip: "", email: "", wa: "" });
  useEffect(() => {
    if (showFilterModal) {
      setDraft({ attending: filterAttending, side: filterSide, checkin: filterCheckin, vip: filterVip, email: filterEmail, wa: filterWa });
    }
  }, [showFilterModal]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const headers = ["Nama", "VIP", "Email", "Telepon", "Hadir", "Plus Satu", "Grup", "Pihak", "Pesan", "Dikirim Pada", "Check-in", "Waktu Check-in", "Email Terkirim", "WA Terkirim"];
    const rows = toExport.map((g) => [
      g.name,
      g.is_vip ? "Ya" : "Tidak",
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
      g.email_sent ? "Ya" : "Tidak",
      g.whatsapp_status ?? "Belum",
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
    const matchesSearch =
      g.name.toLowerCase().includes(q) ||
      (g.email ?? "").toLowerCase().includes(q) ||
      (g.group_name ?? "").toLowerCase().includes(q) ||
      (g.side ?? "").toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (filterAttending === "true" && g.attending !== true) return false;
    if (filterAttending === "false" && g.attending !== false) return false;
    if (filterAttending === "null" && g.attending != null) return false;
    if (filterSide && g.side !== filterSide) return false;
    if (filterCheckin === "true" && !g.checked_in) return false;
    if (filterCheckin === "false" && g.checked_in) return false;
    if (filterVip === "true" && !g.is_vip) return false;
    if (filterEmail === "true" && !g.email_sent) return false;
    if (filterEmail === "false" && g.email_sent) return false;
    if (filterWa === "sent" && !(g.whatsapp_status === "sent" || g.whatsapp_status === "delivered" || g.whatsapp_status === "read")) return false;
    if (filterWa === "failed" && g.whatsapp_status !== "failed") return false;
    if (filterWa === "none" && !!g.whatsapp_status) return false;
    return true;
  });

  const hasActiveFilters = !!(filterAttending || filterSide || filterCheckin || filterVip || filterEmail || filterWa);
  const activeFilterCount = [filterAttending, filterSide, filterCheckin, filterVip, filterEmail, filterWa].filter(Boolean).length;
  const resetFilters = () => {
    setFilterAttending("");
    setFilterSide("");
    setFilterCheckin("");
    setFilterVip("");
    setFilterEmail("");
    setFilterWa("");
  };

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
          coupleName={coupleName}
          onClose={() => setShowWaModal(false)}
          onSentAll={(results) => {
            setGuests((prev) => prev.map((g) => {
              const r = results.find((r) => r.guestId === g.id);
              if (r?.success) return { ...g, whatsapp_status: "sent" as const };
              if (r && !r.success) return { ...g, whatsapp_status: "failed" as const };
              return g;
            }));
          }}
        />
      )}
      {editingGuest && (
        <EditGuestModal guest={editingGuest} onClose={() => setEditingGuest(null)} onUpdated={handleUpdated} />
      )}

      {/* Search + Add */}
      {/* Mobile: row 1 = search+filter | row 2 = 2-col button grid
          Desktop: single flex-wrap row via sm:contents */}
      <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex sm:flex-wrap sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, email, grup, atau pihak…"
          className="col-span-1 sm:flex-1 sm:min-w-0 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[var(--color-gold)] bg-white shadow-sm"
        />
        <button
          onClick={() => setShowFilterModal(true)}
          className={`shrink-0 px-4 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap shadow-sm ${
            hasActiveFilters
              ? "bg-[var(--color-gold)] text-white hover:bg-[var(--color-gold-hover)]"
              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          ♥ Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>

        {/* Action buttons: 2-col grid on mobile, inline flex on desktop */}
        <div className="col-span-2 grid grid-cols-2 gap-2 sm:contents">
          <button
            onClick={() => setShowImportModal(true)}
            className="w-full sm:w-auto sm:shrink-0 px-4 py-2.5 border border-[var(--color-gold)] text-[var(--color-gold)] rounded-lg text-sm hover:bg-[var(--color-cream-dark)] transition-colors whitespace-nowrap shadow-sm"
          >
            Import CSV ↑
          </button>
          <div className="relative w-full sm:w-auto sm:shrink-0">
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              disabled={selectedIds.size === 0}
              className="w-full px-4 py-2.5 border border-[var(--color-gold)] text-[var(--color-gold)] rounded-lg text-sm hover:bg-[var(--color-cream-dark)] transition-colors whitespace-nowrap shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
            onClick={() => setShowWaModal(true)}
            disabled={selectedIds.size === 0}
            className="w-full sm:w-auto sm:shrink-0 px-4 py-2.5 bg-[#25d366] text-white rounded-lg text-sm hover:bg-[#1ebe5d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shadow-sm"
          >
            WA{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""} 💬
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto sm:shrink-0 px-4 py-2.5 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] transition-colors whitespace-nowrap shadow-sm"
          >
            + Tambah Tamu
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Filter Tamu</h2>
              <button onClick={() => setShowFilterModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status Kehadiran</label>
                <select value={draft.attending} onChange={(e) => setDraft((p) => ({ ...p, attending: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white cursor-pointer">
                  <option value="">Semua</option>
                  <option value="true">Hadir ✓</option>
                  <option value="false">Tidak Hadir</option>
                  <option value="null">Menunggu</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pihak</label>
                <select value={draft.side} onChange={(e) => setDraft((p) => ({ ...p, side: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white cursor-pointer">
                  <option value="">Semua</option>
                  <option value="bride">Mempelai Wanita</option>
                  <option value="groom">Mempelai Pria</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">VIP</label>
                <select value={draft.vip} onChange={(e) => setDraft((p) => ({ ...p, vip: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white cursor-pointer">
                  <option value="">Semua Tamu</option>
                  <option value="true">⭐ VIP Saja</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Check-in</label>
                <select value={draft.checkin} onChange={(e) => setDraft((p) => ({ ...p, checkin: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white cursor-pointer">
                  <option value="">Semua</option>
                  <option value="true">Sudah Check-in</option>
                  <option value="false">Belum Check-in</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</label>
                <select value={draft.email} onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white cursor-pointer">
                  <option value="">Semua</option>
                  <option value="true">Email Terkirim</option>
                  <option value="false">Email Belum Kirim</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">WhatsApp</label>
                <select value={draft.wa} onChange={(e) => setDraft((p) => ({ ...p, wa: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white cursor-pointer">
                  <option value="">Semua</option>
                  <option value="sent">WA Terkirim</option>
                  <option value="failed">WA Gagal</option>
                  <option value="none">WA Belum Kirim</option>
                </select>
              </div>
            </div>
            <div className="px-6 pb-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
              <button
                onClick={() => {
                  setDraft({ attending: "", side: "", checkin: "", vip: "", email: "", wa: "" });
                  resetFilters();
                  setShowFilterModal(false);
                }}
                disabled={!Object.values(draft).some(Boolean)}
                className="text-sm text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Reset Semua
              </button>
              <button
                onClick={() => {
                  setFilterAttending(draft.attending);
                  setFilterSide(draft.side);
                  setFilterCheckin(draft.checkin);
                  setFilterVip(draft.vip);
                  setFilterEmail(draft.email);
                  setFilterWa(draft.wa);
                  setShowFilterModal(false);
                }}
                className="px-5 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] transition-colors"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      {(hasActiveFilters || search) && (
        <div className="flex items-center justify-between text-xs text-gray-400 px-0.5">
          <span>
            Menampilkan <span className="font-medium text-gray-600">{filtered.length}</span> dari {guests.length} tamu
          </span>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-red-400 hover:text-red-600 transition-colors">
              Hapus filter ×
            </button>
          )}
        </div>
      )}

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
                  {g.is_vip && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium whitespace-nowrap">⭐ VIP</span>}
                </div>
                {statusBadge(g.attending)}
              </div>
              {g.plus_one_name && <p className="text-xs text-gray-500">+1: {g.plus_one_name}</p>}
              {g.group_name && <p className="text-xs text-gray-500">Grup: {g.group_name}</p>}
              {g.side && <p className="text-xs text-gray-500 capitalize">Pihak: {g.side}</p>}
              {g.email && <p className="text-xs text-gray-400">{g.email}</p>}
              {g.phone_number && <p className="text-xs text-gray-400">{g.phone_number}</p>}
              <div className="flex items-center gap-2 flex-wrap">
                {g.email_sent && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">📧 Terkirim</span>}
                {g.whatsapp_status && g.whatsapp_status !== "failed" && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">💬 {g.whatsapp_status}</span>}
                {g.whatsapp_status === "failed" && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">💬 Gagal</span>}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-400">{formatDate(g.submitted_at)}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingGuest(g)}
                    className="text-xs px-2 py-1 rounded border border-[var(--color-gold)]/50 text-[var(--color-gold)] hover:bg-[var(--color-cream-dark)] transition-colors whitespace-nowrap"
                  >
                    Edit
                  </button>
                  <CopyLinkButton token={g.token} />
                  <SendEmailButton guest={g} onSent={handleUpdated} />
                  <WhatsAppButton guest={g} coupleName={coupleName} onSent={handleUpdated} />
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
                {["Nama", "VIP", "Email", "Telepon", "Status", "+1", "Grup", "Pihak", "Pesan", "Dikirim", "Check-in", "Email Sent", "WA Sent", "Kirim Email/WA", ""].map((h) => (
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
                  <td className="px-4 py-3">
                    {g.is_vip ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium whitespace-nowrap">⭐ VIP</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
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
                    {g.email_sent ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Terkirim</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">Belum</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {g.whatsapp_status === "sent" || g.whatsapp_status === "delivered" || g.whatsapp_status === "read" ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs capitalize">{g.whatsapp_status}</span>
                    ) : g.whatsapp_status === "failed" ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">Gagal</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">Belum</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <SendEmailButton guest={g} onSent={handleUpdated} />
                      <WhatsAppButton guest={g} coupleName={coupleName} onSent={handleUpdated} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingGuest(g)}
                        className="text-xs px-2 py-1 rounded border border-[var(--color-gold)]/50 text-[var(--color-gold)] hover:bg-[var(--color-cream-dark)] transition-colors whitespace-nowrap"
                      >
                        Edit
                      </button>
                      <CopyLinkButton token={g.token} />
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
