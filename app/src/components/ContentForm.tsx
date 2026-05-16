"use client";

import { useState } from "react";
import type { SiteConfig, ScheduleItem, FaqItem } from "@/types";

// Defined outside ContentForm so React doesn't remount them on every keystroke
function Field({
  label, value, onChange, type = "text", placeholder = "",
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
      />
    </div>
  );
}

function TextArea({
  label, value, onChange, rows = 4, placeholder = "",
}: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] resize-y font-mono"
      />
    </div>
  );
}

export default function ContentForm({ config }: { config: SiteConfig }) {
  const [hasExistingHash] = useState(!!config.site_password_hash);
  const [form, setForm] = useState({
    partner_one_name: config.partner_one_name ?? "",
    partner_two_name: config.partner_two_name ?? "",
    wedding_date: config.wedding_date ?? "",
    wedding_time: config.wedding_time ?? "",
    venue_name: config.venue_name ?? "",
    venue_address: config.venue_address ?? "",
    venue_maps_url: config.venue_maps_url ?? "",
    dress_code: config.dress_code ?? "",
    rsvp_deadline: config.rsvp_deadline ?? "",
    cover_photo_url: config.cover_photo_url ?? "",
    story_text: config.story_text ?? "",
    gift_qr_url: config.gift_qr_url ?? "",
    bank_name: config.bank_name ?? "",
    bank_account_number: config.bank_account_number ?? "",
    bank_account_name: config.bank_account_name ?? "",
    travel_info: config.travel_info ?? "",
    theme_color_primary: config.theme_color_primary ?? "#c9a96e",
    theme_color_secondary: config.theme_color_secondary ?? "#faedcd",
    theme_font: config.theme_font ?? "Playfair Display",
    schedule_json: JSON.stringify(config.schedule_json ?? [], null, 2),
    faq_json: JSON.stringify(config.faq_json ?? [], null, 2),
    gallery_photos_json: JSON.stringify(config.gallery_photos_json ?? [], null, 2),
    site_password_enabled: config.site_password_enabled ? "true" : "false",
    site_password_plain: "",
    spotify_playlist_url: config.spotify_playlist_url ?? "",
  });

  const [galleryUrls, setGalleryUrls] = useState<string[]>(() => {
    try { return JSON.parse(config.gallery_photos_json as unknown as string ?? "[]"); } catch { return []; }
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      let schedule_json: ScheduleItem[] = [];
      let faq_json: FaqItem[] = [];
      try { schedule_json = JSON.parse(form.schedule_json); } catch { throw new Error("JSON tidak valid pada Jadwal."); }
      try { faq_json = JSON.parse(form.faq_json); } catch { throw new Error("JSON tidak valid pada FAQ."); }

      const passwordEnabled = form.site_password_enabled === "true";
      if (passwordEnabled && !form.site_password_plain && !hasExistingHash) {
        throw new Error("Harap buat kata sandi saat mengaktifkan perlindungan untuk pertama kali.");
      }

      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          schedule_json,
          faq_json,
          gallery_photos_json: galleryUrls,
          site_password_enabled: passwordEnabled,
          site_password_plain: form.site_password_plain || undefined,
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan.");
      setMessage({ type: "success", text: "Perubahan berhasil disimpan!" });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Couple */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">The Couple</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nama Pasangan 1" value={form.partner_one_name} onChange={(v) => set("partner_one_name", v)} />
          <Field label="Nama Pasangan 2" value={form.partner_two_name} onChange={(v) => set("partner_two_name", v)} />
        </div>
        {/* Cover Photo Upload */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Foto Sampul</label>
          {form.cover_photo_url && (
            <div className="relative mb-2 rounded-lg overflow-hidden h-36 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.cover_photo_url} alt="Cover preview" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <label
              className={`cursor-pointer px-3 py-2 text-sm rounded-lg border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-white transition-colors ${
                uploadingPhoto ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {uploadingPhoto ? "Mengunggah…" : form.cover_photo_url ? "Ganti Foto" : "Unggah Foto"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={uploadingPhoto}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingPhoto(true);
                  setMessage(null);
                  try {
                    const fd = new FormData();
                    fd.append("file", file);
                    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error ?? "Upload failed");
                    set("cover_photo_url", data.url);
                  } catch (err: unknown) {
                    setMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal mengunggah" });
                  } finally {
                    setUploadingPhoto(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
            {form.cover_photo_url && (
              <button
                type="button"
                onClick={() => set("cover_photo_url", "")}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Hapus
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · maks 5 MB</p>
        </div>
      </section>

      {/* Event Details */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">Event Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Tanggal Pernikahan" value={form.wedding_date} onChange={(v) => set("wedding_date", v)} type="date" />
          <Field label="Waktu Pernikahan" value={form.wedding_time} onChange={(v) => set("wedding_time", v)} placeholder="mis. 16:00 WIB" />
          <Field label="Batas RSVP" value={form.rsvp_deadline} onChange={(v) => set("rsvp_deadline", v)} type="date" />
          <Field label="Kode Pakaian" value={form.dress_code} onChange={(v) => set("dress_code", v)} placeholder="mis. Semi-Formal" />
        </div>
        <Field label="Nama Venue" value={form.venue_name} onChange={(v) => set("venue_name", v)} />
        <Field label="Alamat Venue" value={form.venue_address} onChange={(v) => set("venue_address", v)} />
        <Field label="URL Google Maps Embed" value={form.venue_maps_url} onChange={(v) => set("venue_maps_url", v)} placeholder="https://maps.google.com/maps?..." />
      </section>

      {/* Schedule (JSON) */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">Schedule <span className="text-xs text-gray-400 font-normal">(JSON array)</span></h2>
        <TextArea label='Format: [{"time":"4:00 PM","title":"Ceremony","description":"..."}]' value={form.schedule_json} onChange={(v) => set("schedule_json", v)} rows={8} />
      </section>

      {/* Story & Extras */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">Our Story &amp; Extras</h2>
        <TextArea label="Teks Kisah Kami" value={form.story_text} onChange={(v) => set("story_text", v)} rows={5} placeholder="Bagaimana kami bertemu..." />
        <TextArea label="Info Perjalanan &amp; Penginapan" value={form.travel_info} onChange={(v) => set("travel_info", v)} rows={3} placeholder="Hotel terdekat..." />
      </section>

      {/* Gift / Bank Transfer */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">Gift &amp; Bank Transfer</h2>

        {/* Payment QR Upload */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">QR Code Pembayaran</label>
          {form.gift_qr_url && (
            <div className="relative mb-2 rounded-lg overflow-hidden w-32 h-32 bg-gray-100 border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.gift_qr_url} alt="Payment QR" className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <label
              className={`cursor-pointer px-3 py-2 text-sm rounded-lg border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-white transition-colors ${
                uploadingQr ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {uploadingQr ? "Mengunggah…" : form.gift_qr_url ? "Ganti QR" : "Unggah QR"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={uploadingQr}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingQr(true);
                  setMessage(null);
                  try {
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("bucket", "covers");
                    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error ?? "Upload failed");
                    set("gift_qr_url", data.url);
                  } catch (err: unknown) {
                    setMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal mengunggah" });
                  } finally {
                    setUploadingQr(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
            {form.gift_qr_url && (
              <button type="button" onClick={() => set("gift_qr_url", "")} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Hapus</button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">GoPay, OVO, Dana, dll. · JPG atau PNG</p>
        </div>

        {/* Bank Details */}
        <Field label="Nama Bank" value={form.bank_name} onChange={(v) => set("bank_name", v)} placeholder="mis. BCA, Mandiri, BNI" />
        <Field label="Nomor Rekening" value={form.bank_account_number} onChange={(v) => set("bank_account_number", v)} placeholder="mis. 1234567890" />
        <Field label="Nama Pemilik Rekening" value={form.bank_account_name} onChange={(v) => set("bank_account_name", v)} placeholder="mis. Budi Santoso" />
      </section>

      {/* Spotify Playlist */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">Spotify Playlist</h2>
        <Field
          label="URL Playlist"
          value={form.spotify_playlist_url}
          onChange={(v) => set("spotify_playlist_url", v)}
          placeholder="https://open.spotify.com/playlist/..."
        />
        <p className="text-xs text-gray-400">Tempel URL playlist Spotify untuk menampilkan pemutar musik di halaman undangan.</p>
      </section>

      {/* FAQ (JSON) */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">FAQ <span className="text-xs text-gray-400 font-normal">(JSON array)</span></h2>
        <TextArea label='Format: [{"question":"...","answer":"..."}]' value={form.faq_json} onChange={(v) => set("faq_json", v)} rows={5} />
      </section>

      {/* Gallery Photos */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">Photo Gallery</h2>
        {galleryUrls.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {galleryUrls.map((url, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setGalleryUrls((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          <label
            className={`cursor-pointer px-3 py-2 text-sm rounded-lg border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-white transition-colors ${
              uploadingGallery ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {uploadingGallery ? "Mengunggah…" : "Tambah Foto"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              disabled={uploadingGallery}
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                if (!files.length) return;
                setUploadingGallery(true);
                setMessage(null);
                try {
                  const urls: string[] = [];
                  for (const file of files) {
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("bucket", "gallery");
                    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error ?? "Upload failed");
                    urls.push(data.url);
                  }
                  setGalleryUrls((prev) => [...prev, ...urls]);
                } catch (err: unknown) {
                  setMessage({ type: "error", text: err instanceof Error ? err.message : "Upload failed" });
                } finally {
                  setUploadingGallery(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
          {galleryUrls.length > 0 && (
            <button
              type="button"
              onClick={() => setGalleryUrls([])}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Hapus Semua
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400">JPG, PNG, WebP · maks 10 MB per file · pilih beberapa file sekaligus</p>
      </section>

      {/* Theme */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">Theme</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Warna Utama</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.theme_color_primary} onChange={(e) => set("theme_color_primary", e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
              <span className="text-sm text-gray-500">{form.theme_color_primary}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Warna Sekunder</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.theme_color_secondary} onChange={(e) => set("theme_color_secondary", e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
              <span className="text-sm text-gray-500">{form.theme_color_secondary}</span>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Font Judul</label>
          <select
            value={form.theme_font}
            onChange={(e) => set("theme_font", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
          >
            <option value="Playfair Display">Playfair Display (classic, elegant)</option>
            <option value="Cormorant Garamond">Cormorant Garamond (romantic, fine)</option>
            <option value="Cinzel">Cinzel (regal, timeless)</option>
          </select>
        </div>
      </section>

      {/* Site Password */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">Site Password Protection</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.site_password_enabled === "true"}
            onChange={(e) => set("site_password_enabled", e.target.checked ? "true" : "false")}
            className="w-4 h-4 accent-[var(--color-gold)]"
          />
          <span className="text-sm text-gray-700">Wajibkan kata sandi untuk tamu melihat undangan</span>
        </label>
        {form.site_password_enabled === "true" && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              {hasExistingHash ? "Kata Sandi Baru" : "Kata Sandi"}
              {hasExistingHash && (
                <span className="normal-case text-gray-400 ml-1">(biarkan kosong untuk mempertahankan yang ada)</span>
              )}
            </label>
            <input
              type="password"
              value={form.site_password_plain}
              onChange={(e) => set("site_password_plain", e.target.value)}
              placeholder={hasExistingHash ? "Masukkan kata sandi baru untuk mengubah" : "Buat kata sandi"}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)]"
              autoComplete="new-password"
            />
          </div>
        )}
      </section>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-3 bg-[var(--color-gold)] text-white rounded-xl text-sm hover:bg-[var(--color-gold-hover)] transition-colors disabled:opacity-50"
      >
        {saving ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </form>
  );
}
