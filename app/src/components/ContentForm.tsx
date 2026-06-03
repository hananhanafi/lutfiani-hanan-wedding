"use client";

import { useState } from "react";
import type { SiteConfig, ScheduleItem, FaqItem, BankAccount } from "@/types";

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
    cover_video_url: config.cover_video_url ?? "",
    partner_one_photo_url: config.partner_one_photo_url ?? "",
    partner_two_photo_url: config.partner_two_photo_url ?? "",
    partner_one_full_name: config.partner_one_full_name ?? "",
    partner_two_full_name: config.partner_two_full_name ?? "",
    partner_one_parents: config.partner_one_parents ?? "",
    partner_two_parents: config.partner_two_parents ?? "",
    story_text: config.story_text ?? "",
    story_text_en: config.story_text_en ?? "",
    gift_qr_url: config.gift_qr_url ?? "",
    travel_info: config.travel_info ?? "",
    travel_info_en: config.travel_info_en ?? "",
    theme_color_primary: config.theme_color_primary ?? "#c9a96e",
    theme_color_secondary: config.theme_color_secondary ?? "#faedcd",
    theme_font: config.theme_font ?? "Playfair Display",
    gallery_photos_json: (() => {
      const raw = config.gallery_photos_json;
      if (Array.isArray(raw)) return JSON.stringify(raw, null, 2);
      try { return JSON.stringify(JSON.parse(raw as unknown as string ?? "[]"), null, 2); } catch { return "[]"; }
    })(),
    site_password_enabled: config.site_password_enabled ? "true" : "false",
    site_password_plain: "",
    spotify_playlist_url: config.spotify_playlist_url ?? "",
    background_music_url: config.background_music_url ?? "",
    background_music_youtube_url: config.background_music_youtube_url ?? "",
  });

  const [galleryUrls, setGalleryUrls] = useState<string[]>(() => {
    const raw = config.gallery_photos_json;
    if (Array.isArray(raw)) return raw as string[];
    try { return JSON.parse(raw as unknown as string ?? "[]"); } catch { return []; }
  });

  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>(() => config.schedule_json ?? []);
  const [faqItems, setFaqItems] = useState<FaqItem[]>(() => config.faq_json ?? []);

  const addScheduleItem = () => setScheduleItems((prev) => [...prev, { time: "", title: "", title_en: "", description: "", description_en: "" }]);
  const removeScheduleItem = (i: number) => setScheduleItems((prev) => prev.filter((_, idx) => idx !== i));
  const setScheduleField = (i: number, field: keyof ScheduleItem, value: string) =>
    setScheduleItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const addFaqItem = () => setFaqItems((prev) => [...prev, { question: "", question_en: "", answer: "", answer_en: "" }]);
  const removeFaqItem = (i: number) => setFaqItems((prev) => prev.filter((_, idx) => idx !== i));
  const setFaqField = (i: number, field: keyof FaqItem, value: string) =>
    setFaqItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  // Bank accounts (multi)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    if (config.bank_accounts_json && Array.isArray(config.bank_accounts_json) && config.bank_accounts_json.length > 0) {
      return config.bank_accounts_json;
    }
    // Migrate from single bank fields
    if (config.bank_name || config.bank_account_number || config.bank_account_name) {
      return [{ bank_name: config.bank_name ?? "", account_number: config.bank_account_number ?? "", account_name: config.bank_account_name ?? "" }];
    }
    return [];
  });
  const addBankAccount = () => setBankAccounts((prev) => [...prev, { bank_name: "", account_number: "", account_name: "" }]);
  const removeBankAccount = (i: number) => setBankAccounts((prev) => prev.filter((_, idx) => idx !== i));
  const setBankField = (i: number, field: keyof BankAccount, value: string) =>
    setBankAccounts((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingPartnerOne, setUploadingPartnerOne] = useState(false);
  const [uploadingPartnerTwo, setUploadingPartnerTwo] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
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
      const passwordEnabled = form.site_password_enabled === "true";
      if (passwordEnabled && !form.site_password_plain && !hasExistingHash) {
        throw new Error("Harap buat kata sandi saat mengaktifkan perlindungan untuk pertama kali.");
      }

      // Clean empty string fields from JSON items
      const schedule_json = scheduleItems.map((item) => ({
        time: item.time,
        title: item.title,
        ...(item.title_en?.trim() && { title_en: item.title_en }),
        ...(item.description?.trim() && { description: item.description }),
        ...(item.description_en?.trim() && { description_en: item.description_en }),
      }));
      const faq_json = faqItems.map((item) => ({
        question: item.question,
        ...(item.question_en?.trim() && { question_en: item.question_en }),
        answer: item.answer,
        ...(item.answer_en?.trim() && { answer_en: item.answer_en }),
      }));

      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          schedule_json,
          faq_json,
          bank_accounts_json: bankAccounts.filter((a) => a.bank_name || a.account_number),
          gallery_photos_json: galleryUrls,
          site_password_enabled: passwordEnabled,
          site_password_plain: form.site_password_plain || undefined,
          story_text_en: form.story_text_en || undefined,
          travel_info_en: form.travel_info_en || undefined,
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
        <h2 className="font-semibold text-gray-700">Mempelai</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nama Pasangan 1" value={form.partner_one_name} onChange={(v) => set("partner_one_name", v)} />
          <Field label="Nama Pasangan 2" value={form.partner_two_name} onChange={(v) => set("partner_two_name", v)} />
          <Field label="Nama Lengkap Pasangan 1" value={form.partner_one_full_name} onChange={(v) => set("partner_one_full_name", v)} placeholder="mis. Budi Santoso bin Ahmad" />
          <Field label="Nama Lengkap Pasangan 2" value={form.partner_two_full_name} onChange={(v) => set("partner_two_full_name", v)} placeholder="mis. Siti Rahayu binti Hasan" />
          <Field label="Nama Orang Tua Pasangan 1" value={form.partner_one_parents} onChange={(v) => set("partner_one_parents", v)} placeholder="mis. Putra dari Bapak Ahmad dan Ibu Siti" />
          <Field label="Nama Orang Tua Pasangan 2" value={form.partner_two_parents} onChange={(v) => set("partner_two_parents", v)} placeholder="mis. Putri dari Bapak Hasan dan Ibu Aminah" />
        </div>

        {/* Partner Photos */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Partner One Photo */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Foto Pasangan 1</label>
            {form.partner_one_photo_url && (
              <div className="relative mb-2 rounded-full overflow-hidden w-24 h-24 bg-gray-100 ring-2 ring-[var(--color-gold)]/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.partner_one_photo_url} alt="Pasangan 1" className="w-full h-full object-cover object-top" />
              </div>
            )}
            <div className="flex items-center gap-3">
              <label className={`cursor-pointer px-3 py-2 text-sm rounded-lg border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-white transition-colors ${uploadingPartnerOne ? "opacity-50 pointer-events-none" : ""}` }>
                {uploadingPartnerOne ? "Mengunggah…" : form.partner_one_photo_url ? "Ganti Foto" : "Unggah Foto"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingPartnerOne}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    setUploadingPartnerOne(true); setMessage(null);
                    try {
                      const fd = new FormData(); fd.append("file", file);
                      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error ?? "Gagal mengunggah");
                      set("partner_one_photo_url", data.url);
                    } catch (err: unknown) {
                      setMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal mengunggah" });
                    } finally { setUploadingPartnerOne(false); e.target.value = ""; }
                  }} />
              </label>
              {form.partner_one_photo_url && (
                <button type="button" onClick={() => set("partner_one_photo_url", "")} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Hapus</button>
              )}
            </div>
          </div>

          {/* Partner Two Photo */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Foto Pasangan 2</label>
            {form.partner_two_photo_url && (
              <div className="relative mb-2 rounded-full overflow-hidden w-24 h-24 bg-gray-100 ring-2 ring-[var(--color-gold)]/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.partner_two_photo_url} alt="Pasangan 2" className="w-full h-full object-cover object-top" />
              </div>
            )}
            <div className="flex items-center gap-3">
              <label className={`cursor-pointer px-3 py-2 text-sm rounded-lg border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-white transition-colors ${uploadingPartnerTwo ? "opacity-50 pointer-events-none" : ""}`}>
                {uploadingPartnerTwo ? "Mengunggah…" : form.partner_two_photo_url ? "Ganti Foto" : "Unggah Foto"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingPartnerTwo}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    setUploadingPartnerTwo(true); setMessage(null);
                    try {
                      const fd = new FormData(); fd.append("file", file);
                      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error ?? "Gagal mengunggah");
                      set("partner_two_photo_url", data.url);
                    } catch (err: unknown) {
                      setMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal mengunggah" });
                    } finally { setUploadingPartnerTwo(false); e.target.value = ""; }
                  }} />
              </label>
              {form.partner_two_photo_url && (
                <button type="button" onClick={() => set("partner_two_photo_url", "")} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Hapus</button>
              )}
            </div>
          </div>
        </div>
        {/* Cover Photo Upload */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Foto Sampul</label>
          {form.cover_photo_url && (
            <div className="relative mb-2 rounded-lg overflow-hidden h-100 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.cover_photo_url} alt="Pratinjau sampul" className="w-full h-full object-cover" />
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
                    if (!res.ok) throw new Error(data.error ?? "Gagal mengunggah");
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

        {/* Background Video Upload */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Video Latar (opsional)</label>
          {form.cover_video_url && (
            <div className="relative mb-2 rounded-lg overflow-hidden bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={form.cover_video_url}
                muted
                playsInline
                controls
                className="w-full max-h-48 object-cover"
              />
            </div>
          )}
          <div className="flex items-center gap-3">
            <label
              className={`cursor-pointer px-3 py-2 text-sm rounded-lg border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-white transition-colors ${
                uploadingVideo ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {uploadingVideo ? "Mengunggah…" : form.cover_video_url ? "Ganti Video" : "Unggah Video"}
              <input
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                className="hidden"
                disabled={uploadingVideo}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingVideo(true);
                  setMessage(null);
                  try {
                    const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
                    const filename = `video-${Date.now()}.${ext}`;

                    // Step 1: get a Supabase signed upload URL (video never passes through Next.js)
                    const urlRes = await fetch("/api/admin/upload-url", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ bucket: "videos", filename, contentType: file.type }),
                    });
                    const urlData = await urlRes.json();
                    if (!urlRes.ok) throw new Error(urlData.error ?? "Gagal mendapatkan URL unggah");

                    // Step 2: upload directly to Supabase Storage
                    const uploadRes = await fetch(urlData.signedUrl, {
                      method: "PUT",
                      headers: { "Content-Type": file.type || "video/mp4" },
                      body: file,
                    });
                    if (!uploadRes.ok) throw new Error("Unggah ke storage gagal");

                    set("cover_video_url", urlData.publicUrl);
                  } catch (err: unknown) {
                    setMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal mengunggah" });
                  } finally {
                    setUploadingVideo(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
            {form.cover_video_url && (
              <button
                type="button"
                onClick={() => set("cover_video_url", "")}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Hapus
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">MP4, WebM · maks 50 MB · akan diputar otomatis tanpa suara sebagai latar</p>
        </div>
      </section>

      {/* Event Details */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">Detail Acara</h2>
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

      {/* Schedule */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Jadwal Acara</h2>
          <button type="button" onClick={addScheduleItem}
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-white transition-colors">
            + Tambah
          </button>
        </div>
        {scheduleItems.length === 0 && (
          <p className="text-xs text-gray-400 italic">Belum ada jadwal. Klik “+ Tambah” untuk menambahkan.</p>
        )}
        <div className="space-y-4">
          {scheduleItems.map((item, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 relative bg-gray-50">
              <button type="button" onClick={() => removeScheduleItem(i)}
                className="absolute top-3 right-3 text-xs text-gray-300 hover:text-red-500 transition-colors">✕</button>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Waktu" value={item.time} onChange={(v) => setScheduleField(i, "time", v)} placeholder="mis. 10:00 WIB" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Judul (Indonesia)" value={item.title} onChange={(v) => setScheduleField(i, "title", v)} placeholder="mis. Akad Nikah" />
                <Field label="Judul (English — opsional)" value={item.title_en ?? ""} onChange={(v) => setScheduleField(i, "title_en", v)} placeholder="cth. Wedding Ceremony" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Deskripsi (Indonesia — opsional)" value={item.description ?? ""} onChange={(v) => setScheduleField(i, "description", v)} placeholder="mis. Prosesi ijab kabul" />
                <Field label="Deskripsi (English — opsional)" value={item.description_en ?? ""} onChange={(v) => setScheduleField(i, "description_en", v)} placeholder="cth. The vow exchange" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Story & Extras */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">Kisah Kami &amp; Lainnya</h2>
        <TextArea label="Teks Kisah Kami (Indonesia)" value={form.story_text} onChange={(v) => set("story_text", v)} rows={5} placeholder="Bagaimana kami bertemu..." />
        <TextArea label="Teks Kisah Kami (English — opsional)" value={form.story_text_en} onChange={(v) => set("story_text_en", v)} rows={5} placeholder="How we met..." />
        <TextArea label="Info Perjalanan &amp; Penginapan (Indonesia)" value={form.travel_info} onChange={(v) => set("travel_info", v)} rows={3} placeholder="Hotel terdekat..." />
        <TextArea label="Info Perjalanan &amp; Penginapan (English — opsional)" value={form.travel_info_en} onChange={(v) => set("travel_info_en", v)} rows={3} placeholder="Nearest hotels..." />
      </section>

      {/* Gift / Bank Transfer */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">Hadiah &amp; Transfer Bank</h2>

        {/* Payment QR Upload */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">QR Code Pembayaran</label>
          {form.gift_qr_url && (
            <div className="relative mb-2 rounded-lg overflow-hidden w-32 h-32 bg-gray-100 border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.gift_qr_url} alt="QR Pembayaran" className="w-full h-full object-contain" />
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
                    if (!res.ok) throw new Error(data.error ?? "Gagal mengunggah");
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

        {/* Bank Details (multiple) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Rekening Bank</label>
            <button type="button" onClick={addBankAccount}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-white transition-colors">
              + Tambah Rekening
            </button>
          </div>
          {bankAccounts.length === 0 && (
            <p className="text-xs text-gray-400">Belum ada rekening. Klik &quot;+ Tambah Rekening&quot; untuk menambahkan.</p>
          )}
          {bankAccounts.map((acc, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2 relative">
              <button type="button" onClick={() => removeBankAccount(i)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs transition-colors">✕</button>
              <Field label={`Bank ${i + 1}`} value={acc.bank_name} onChange={(v) => setBankField(i, "bank_name", v)} placeholder="mis. BCA, Mandiri, BNI" />
              <Field label="Nomor Rekening" value={acc.account_number} onChange={(v) => setBankField(i, "account_number", v)} placeholder="mis. 1234567890" />
              <Field label="Nama Pemilik" value={acc.account_name} onChange={(v) => setBankField(i, "account_name", v)} placeholder="mis. Budi Santoso" />
            </div>
          ))}
        </div>
      </section>

      {/* Spotify Playlist */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">Playlist Spotify</h2>
        <Field
          label="URL Playlist"
          value={form.spotify_playlist_url}
          onChange={(v) => set("spotify_playlist_url", v)}
          placeholder="https://open.spotify.com/playlist/..."
        />
        <p className="text-xs text-gray-400">Tempel URL playlist Spotify untuk menampilkan pemutar musik di halaman undangan.</p>
      </section>

      {/* Background Music */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">Musik Latar (Autoplay)</h2>
        <p className="text-xs text-gray-400">Musik akan otomatis diputar saat tamu membuka undangan. Jika keduanya diisi, MP3 diutamakan.</p>

        {/* MP3 Upload */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">File MP3</label>
          {form.background_music_url && (
            <div className="mb-2">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls src={form.background_music_url} className="w-full" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer px-3 py-2 text-sm rounded-lg border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-white transition-colors">
              {form.background_music_url ? "Ganti MP3" : "Unggah MP3"}
              <input
                type="file"
                accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setMessage(null);
                  try {
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("bucket", "audio");
                    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error ?? "Gagal mengunggah");
                    set("background_music_url", data.url);
                  } catch (err: unknown) {
                    setMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal mengunggah" });
                  } finally { e.target.value = ""; }
                }}
              />
            </label>
            {form.background_music_url && (
              <button type="button" onClick={() => set("background_music_url", "")} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Hapus</button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">MP3, OGG, WAV · maks 50 MB</p>
        </div>

        {/* YouTube URL */}
        <Field
          label="URL Video YouTube (alternatif)"
          value={form.background_music_youtube_url}
          onChange={(v) => set("background_music_youtube_url", v)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <p className="text-xs text-gray-400">Gunakan jika tidak mengunggah MP3. Musik akan diputar dari YouTube (mungkin ada iklan).</p>
      </section>

      {/* FAQ */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">FAQ</h2>
          <button type="button" onClick={addFaqItem}
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-white transition-colors">
            + Tambah
          </button>
        </div>
        {faqItems.length === 0 && (
          <p className="text-xs text-gray-400 italic">Belum ada FAQ. Klik “+ Tambah” untuk menambahkan.</p>
        )}
        <div className="space-y-4">
          {faqItems.map((item, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 relative bg-gray-50">
              <button type="button" onClick={() => removeFaqItem(i)}
                className="absolute top-3 right-3 text-xs text-gray-300 hover:text-red-500 transition-colors">✕</button>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Pertanyaan (Indonesia)" value={item.question} onChange={(v) => setFaqField(i, "question", v)} placeholder="mis. Apakah ada dress code?" />
                <Field label="Pertanyaan (English — opsional)" value={item.question_en ?? ""} onChange={(v) => setFaqField(i, "question_en", v)} placeholder="cth. Is there a dress code?" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Jawaban (Indonesia)</label>
                  <textarea value={item.answer} onChange={(e) => setFaqField(i, "answer", e.target.value)}
                    placeholder="mis. Ya, semi-formal..." rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] resize-y" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Jawaban (English — opsional)</label>
                  <textarea value={item.answer_en ?? ""} onChange={(e) => setFaqField(i, "answer_en", e.target.value)}
                    placeholder="cth. Yes, semi-formal..." rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-gold)] resize-y" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery Photos */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">Galeri Foto</h2>
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
                    if (!res.ok) throw new Error(data.error ?? "Gagal mengunggah");
                    urls.push(data.url);
                  }
                  setGalleryUrls((prev) => [...prev, ...urls]);
                } catch (err: unknown) {
                  setMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal mengunggah" });
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
        <h2 className="font-semibold text-gray-700">Tema</h2>
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
            <option value="Playfair Display">Playfair Display (klasik, elegan)</option>
            <option value="Cormorant Garamond">Cormorant Garamond (romantis, halus)</option>
            <option value="Cinzel">Cinzel (megah, abadi)</option>
          </select>
        </div>
      </section>

      {/* Site Password */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">Proteksi Kata Sandi</h2>
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
