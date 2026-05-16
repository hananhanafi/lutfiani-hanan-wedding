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

export default function GuestTable({ guests: initialGuests }: { guests: Guest[] }) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
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
    const headers = ["Name", "Email", "Phone", "Attending", "Plus One", "Group", "Side", "Message", "Submitted At", "Checked In", "Checked In At"];
    const rows = toExport.map((g) => [
      g.name,
      g.email ?? "",
      g.phone_number ?? "",
      g.attending === true ? "Yes" : g.attending === false ? "No" : "Pending",
      g.plus_one_name ?? "",
      g.group_name ?? "",
      g.side ?? "",
      (g.message ?? "").replace(/,/g, ";"),
      g.submitted_at,
      g.checked_in ? "Yes" : "No",
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
