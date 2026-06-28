"use client";

import { useState, useEffect, useCallback } from "react";

interface StaffMember {
  id: string;
  name: string;
  username: string | null;
  email: string;
  role: "admin" | "sender";
  is_active: boolean;
  created_at: string;
}

const EMPTY_FORM = { name: "", username: "", email: "", password: "", role: "sender" as "admin" | "sender" };

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      setStaff(data.staff ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setFormError(""); setShowAdd(true); };
  const openEdit = (member: StaffMember) => {
    setEditingId(member.id);
    setForm({ name: member.name, username: member.username ?? "", email: member.email, password: "", role: member.role });
    setFormError("");
    setShowAdd(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editingId) {
        // Edit: only send password if a new one was typed
        const body: Record<string, unknown> = { name: form.name, email: form.email, username: form.username, role: form.role };
        if (form.password) body.password = form.password;
        const res = await fetch(`/api/admin/staff/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error ?? "Gagal menyimpan perubahan.");
        } else {
          setStaff((prev) => prev.map((s) => (s.id === editingId ? data.staff : s)));
          setShowAdd(false);
        }
      } else {
        const res = await fetch("/api/admin/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error ?? "Gagal membuat akun.");
        } else {
          setStaff((prev) => [data.staff, ...prev]);
          setShowAdd(false);
        }
      }
    } catch {
      setFormError("Koneksi error. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (member: StaffMember) => {
    const res = await fetch(`/api/admin/staff/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !member.is_active }),
    });
    if (res.ok) {
      const data = await res.json();
      setStaff((prev) => prev.map((s) => s.id === member.id ? data.staff : s));
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
      if (res.ok) {
        setStaff((prev) => prev.filter((s) => s.id !== id));
      }
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const roleBadge = (role: string) =>
    role === "admin" ? (
      <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">Admin</span>
    ) : (
      <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Pengirim</span>
    );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Manajemen Staf</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola akun staf dan hak aksesnya</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-[var(--color-gold)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-gold-hover)] transition-colors"
        >
          + Tambah Staf
        </button>
      </div>

      {/* Role info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
          <p className="text-xs font-medium text-purple-800">Admin</p>
          <p className="text-xs text-purple-600 mt-0.5">Akses penuh ke semua halaman panel</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-xs font-medium text-blue-800">Pengirim</p>
          <p className="text-xs text-blue-600 mt-0.5">Hanya akses ke WhatsApp & Kirim Undangan</p>
        </div>
      </div>

      {/* Staff list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Belum ada staf. Tambah akun staf pertama.
        </div>
      ) : (
        <div className="space-y-2">
          {staff.map((member) => (
            <div
              key={member.id}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                member.is_active ? "bg-white border-gray-200" : "bg-gray-50 border-gray-200 opacity-60"
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-[var(--color-cream-dark)] flex items-center justify-center text-[var(--color-gold)] font-semibold text-sm flex-shrink-0">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800">{member.name}</span>
                  {roleBadge(member.role)}
                  {!member.is_active && (
                    <span className="text-[10px] px-2 py-0.5 bg-gray-200 text-gray-500 rounded-full">Nonaktif</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{member.username ? `@${member.username} · ` : ""}{member.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(member)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors"
                >
                  Ubah
                </button>
                <button
                  onClick={() => toggleActive(member)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    member.is_active
                      ? "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500"
                      : "border-green-200 text-green-600 hover:bg-green-50"
                  }`}
                >
                  {member.is_active ? "Nonaktifkan" : "Aktifkan"}
                </button>
                {confirmDeleteId === member.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(member.id)}
                      disabled={deletingId === member.id}
                      className="text-xs px-2.5 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      {deletingId === member.id ? "..." : "Hapus"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(member.id)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-red-400 hover:border-red-300 hover:bg-red-50 transition-colors"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add staff modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">{editingId ? "Edit Staf" : "Tambah Staf Baru"}</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nama <span className="text-red-400">*</span></label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  maxLength={100}
                  placeholder="Nama lengkap"
                  autoFocus
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email <span className="text-red-400">*</span></label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  maxLength={254}
                  placeholder="staff@example.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Username <span className="text-gray-400 text-[10px] normal-case">(opsional)</span></label>
                <input
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  maxLength={50}
                  placeholder="cth. budi — untuk login lebih mudah"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
                />
                <p className="text-xs text-gray-400 mt-1">Bisa login dengan email atau username ini</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  {editingId ? "Kata Sandi Baru" : "Kata Sandi"} {editingId ? <span className="text-gray-400 text-[10px] normal-case">(opsional)</span> : <span className="text-red-400">*</span>}
                </label>
                <input
                  required={!editingId}
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  minLength={8}
                  placeholder={editingId ? "Kosongkan jika tidak diubah" : "Min. 8 karakter"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Peran <span className="text-red-400">*</span></label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as "admin" | "sender" }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] bg-white"
                >
                  <option value="sender">Pengirim — WhatsApp & Kirim Undangan</option>
                  <option value="admin">Admin — Akses Penuh</option>
                </select>
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Batal</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-[var(--color-gold)] text-white rounded-lg text-sm hover:bg-[var(--color-gold-hover)] disabled:opacity-50 transition-colors">
                  {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Buat Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
