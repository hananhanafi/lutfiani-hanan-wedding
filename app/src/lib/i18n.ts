export type Lang = "id" | "en";

const dict = {
  /* ── Hero ──────────────────────────────────────────────── */
  hero_rsvp: { id: "RSVP Sekarang", en: "RSVP Now" },

  /* ── Envelope ──────────────────────────────────────────── */
  env_invited:    { id: "Anda Diundang",       en: "You Are Invited" },
  env_invitation: { id: "Undangan Pernikahan", en: "Wedding Invitation" },
  env_open:       { id: "Buka Undangan",       en: "Open Invitation" },
  env_hint:       { id: "Ketuk segel untuk membuka", en: "Tap seal to open" },
  env_dear:       { id: "Kepada Yth.",         en: "Dear" },
  env_to:         { id: "Kepada",              en: "To" },

  /* ── Countdown ─────────────────────────────────────────── */
  countdown_title:   { id: "Menghitung Mundur Hari Istimewa Kita", en: "Counting Down To Our Day" },
  countdown_days:    { id: "Hari",   en: "Days" },
  countdown_hours:   { id: "Jam",    en: "Hours" },
  countdown_minutes: { id: "Menit",  en: "Minutes" },
  countdown_seconds: { id: "Detik",  en: "Seconds" },

  /* ── Event Details ──────────────────────────────────────── */
  details_eyebrow:  { id: "Waktu & Tempat",       en: "When & Where" },
  details_datetime: { id: "Tanggal & Waktu",       en: "Date & Time" },
  details_venue:    { id: "Venue",                 en: "Venue" },
  details_dress:    { id: "Kode Pakaian",           en: "Dress Code" },
  details_deadline: { id: "Konfirmasi Sebelum",    en: "RSVP Deadline" },
  details_tba:      { id: "Akan diumumkan",         en: "To be announced" },

  /* ── Event Schedule ─────────────────────────────────────── */
  schedule_eyebrow: { id: "Hari Spesial", en: "The Day" },

  /* ── Couple Profile ─────────────────────────────────────── */
  couple_eyebrow: { id: "Mempelai", en: "The Couple" },

  /* ── Our Story ──────────────────────────────────────────── */
  story_eyebrow: { id: "Kisah Kami", en: "Our Story" },

  /* ── Gift Registry ──────────────────────────────────────── */
  gift_eyebrow:     { id: "Hadiah Pernikahan",             en: "Wedding Gift" },
  gift_desc:        { id: "Kehadiranmu di pernikahan kami adalah hadiah terbesar. Jika kamu ingin memberikan hadiah, kamu dapat mengirimkannya melalui detail di bawah ini.", en: "Your presence at our wedding is the greatest gift. If you wish to give a gift, you may send it through the details below." },
  gift_scan:        { id: "Scan untuk Mengirim Hadiah",    en: "Scan to Send a Gift" },
  gift_bank:        { id: "Transfer Bank",                 en: "Bank Transfer" },
  gift_acc_num:     { id: "Nomor Rekening",                en: "Account Number" },
  gift_acc_name:    { id: "Nama Pemilik",                  en: "Account Name" },
  gift_copied:      { id: "Tersalin!",                     en: "Copied!" },
  gift_or:          { id: "atau",                          en: "or" },

  /* ── Travel ─────────────────────────────────────────────── */
  travel_eyebrow: { id: "Perjalanan & Menginap", en: "Travel & Stay" },

  /* ── FAQ ────────────────────────────────────────────────── */
  faq_eyebrow: { id: "FAQ", en: "FAQ" },

  /* ── RSVP Form ──────────────────────────────────────────── */
  rsvp_eyebrow:       { id: "Konfirmasi Kehadiran",             en: "Confirm Attendance" },
  rsvp_deadline_pre:  { id: "Harap konfirmasi sebelum",         en: "Please confirm by" },
  rsvp_name:          { id: "Nama Lengkap",                     en: "Full Name" },
  rsvp_email_label:   { id: "Email",                            en: "Email" },
  rsvp_email_hint:    { id: "untuk menerima pass QR Anda",      en: "to receive your QR pass" },
  rsvp_phone:         { id: "Nomor WhatsApp",                   en: "WhatsApp Number" },
  rsvp_attend_q:      { id: "Apakah Anda hadir?",               en: "Will you attend?" },
  rsvp_yes:           { id: "Dengan Senang Hati",               en: "Joyfully Accepts" },
  rsvp_no:            { id: "Dengan Menyesal Tidak Bisa",       en: "Regretfully Declines" },
  rsvp_plus_one:      { id: "Nama Plus One",                    en: "Plus One Name" },
  rsvp_plus_one_ph:   { id: "Nama lengkap tamu",                en: "Guest's full name" },
  rsvp_group:         { id: "Dari mana / Nama Grup",            en: "Group / From" },
  rsvp_group_ph:      { id: "mis. Keluarga Jakarta, Teman Kuliah", en: "e.g. Family Jakarta, College Friends" },
  rsvp_side:          { id: "Tamu dari",                        en: "Guest of" },
  rsvp_bride:         { id: "Mempelai Wanita",                  en: "Bride's Side" },
  rsvp_groom:         { id: "Mempelai Pria",                    en: "Groom's Side" },
  rsvp_message:       { id: "Tinggalkan Pesan",                 en: "Leave a Message" },
  rsvp_message_ph:    { id: "Ucapan selamat untuk pasangan...", en: "A congratulatory message for the couple..." },
  rsvp_optional:      { id: "opsional",                         en: "optional" },
  rsvp_required:      { id: "*",                                en: "*" },
  rsvp_submitting:    { id: "Mengirim...",                      en: "Sending..." },
  rsvp_submit:        { id: "Kirim RSVP",                       en: "Send RSVP" },

  /* ── RSVP Success ───────────────────────────────────────── */
  rsvp_success_see_you:     { id: "Sampai jumpa di sana!",      en: "See you there!" },
  rsvp_success_updated:     { id: "RSVP Diperbarui!",           en: "RSVP Updated!" },
  rsvp_success_miss:        { id: "Kami akan merindukanmu!",    en: "We'll miss you!" },
  rsvp_success_msg_attend:  { id: "Terima kasih, {name}! RSVP kamu sudah dikonfirmasi. Simpan pass masuk QR kamu di bawah ini.", en: "Thank you, {name}! Your RSVP is confirmed. Save your QR entry pass below." },
  rsvp_success_msg_updated: { id: "RSVP kamu telah diperbarui, {name}. Pass masuk QR baru telah dikirim ke emailmu.", en: "Your RSVP has been updated, {name}. A new QR pass has been sent to your email." },
  rsvp_success_msg_decline: { id: "Terima kasih sudah memberi tahu kami, {name}. Semoga kita segera bertemu!", en: "Thank you for letting us know, {name}. We hope to see you soon!" },
  rsvp_pass_label:     { id: "Pass Masuk Anda",                 en: "Your Entry Pass" },
  rsvp_screenshot:     { id: "Screenshot ini atau cek emailmu", en: "Screenshot this or check your email" },
  rsvp_save_qr:        { id: "Simpan QR Code",                  en: "Save QR Code" },
  rsvp_share_wa:       { id: "Bagikan via WhatsApp",            en: "Share via WhatsApp" },
  rsvp_wa_msg:         { id: "Halo! Pass masuk pernikahanmu sudah siap: ", en: "Hello! Your wedding entry pass is ready: " },
  rsvp_wa_msg_self:    { id: "Pass masuk pernikahanku: ",        en: "My wedding entry pass: " },

  /* ── Wishes Wall ────────────────────────────────────────── */
  wishes_eyebrow:     { id: "Doa & Harapan",                   en: "Wishes & Prayers" },
  wishes_name_ph:     { id: "Nama Anda",                       en: "Your Name" },
  wishes_msg_ph:      { id: "Tulis ucapan selamat Anda",       en: "Write your congratulations" },
  wishes_submitting:  { id: "Mengirim",                        en: "Sending" },
  wishes_submit:      { id: "Kirim Pesan",                     en: "Send Message" },
  wishes_thanks:      { id: "Terima kasih atas pesanmu!",      en: "Thank you for your message!" },
  wishes_write_again: { id: "Tulis lagi",                      en: "Write again" },
  wishes_prev:        { id: "Sebelumnya",                      en: "Previous" },
  wishes_next:        { id: "Berikutnya",                      en: "Next" },
  wishes_delete:      { id: "Hapus",                           en: "Delete" },
  wishes_required:    { id: "Nama dan pesan wajib diisi",      en: "Name and message are required" },
  wishes_error:       { id: "Gagal mengirim. Coba lagi.",      en: "Failed to send. Please try again." },
  wishes_del_error:   { id: "Gagal menghapus.",                en: "Failed to delete." },

  /* ── Footer ─────────────────────────────────────────────── */
  footer_made: { id: "Dibuat dengan cinta ♥", en: "Made with love ♥" },
} as const;

export type TKey = keyof typeof dict;

export function translate(lang: Lang, key: TKey): string {
  return dict[key][lang];
}

export default dict;
