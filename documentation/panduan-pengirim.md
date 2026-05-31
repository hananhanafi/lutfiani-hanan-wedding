# Panduan Pengirim Undangan WhatsApp
## Untuk Staff dengan Akses Pengirim

**Versi:** 1.0  
**Terakhir Diperbarui:** 1 Juni 2026

---

## Daftar Isi

1. [Apa itu Akun Pengirim?](#1-apa-itu-akun-pengirim)
2. [Cara Login](#2-cara-login)
3. [Halaman yang Bisa Diakses](#3-halaman-yang-bisa-diakses)
4. [Langkah 1 — Hubungkan WhatsApp](#4-langkah-1--hubungkan-whatsapp)
5. [Langkah 2 — Tambah Tamu](#5-langkah-2--tambah-tamu)
6. [Langkah 3 — Kirim Undangan](#6-langkah-3--kirim-undangan)
7. [Memahami Status Pengiriman](#7-memahami-status-pengiriman)
8. [Pertanyaan Umum (FAQ)](#8-pertanyaan-umum-faq)

---

## 1. Apa itu Akun Pengirim?

Akun **Pengirim** adalah akun staf dengan akses terbatas yang dirancang khusus untuk mengirimkan undangan pernikahan melalui WhatsApp.

### Yang bisa kamu lakukan:
- ✅ Menghubungkan nomor WhatsApp kamu ke sistem
- ✅ Menambah tamu yang akan dikirimi undangan
- ✅ Mengedit data tamu yang kamu tambahkan sendiri
- ✅ Mengirim undangan WhatsApp ke tamu-tamumu
- ✅ Melihat status pengiriman per tamu

### Yang **tidak** bisa kamu lakukan:
- ❌ Melihat tamu yang ditambahkan oleh pengirim lain atau admin
- ❌ Mengakses data RSVP, konten, atau pengaturan website
- ❌ Menggunakan sesi WhatsApp milik pengirim lain
- ❌ Menghapus atau memodifikasi data di luar tanggung jawabmu

---

## 2. Cara Login

1. Buka link panel admin yang diberikan oleh admin (contoh: `https://lutfiani.hananhanafi.com/admin`)
2. Masukkan **email** atau **username** yang sudah diberikan oleh admin
3. Masukkan **kata sandi** kamu
4. Klik **Masuk**

> **Catatan:** Setelah login, kamu akan langsung diarahkan ke halaman **Kirim Undangan**. Jika admin sudah memberikan username (misal: `budi`), kamu bisa login menggunakan username tersebut tanpa perlu mengetikkan email panjang.

---

## 3. Halaman yang Bisa Diakses

Setelah login, kamu hanya akan melihat dua menu di sidebar:

| Menu | Alamat | Fungsi |
|---|---|---|
| **WhatsApp** | `/admin/whatsapp` | Hubungkan nomor WhatsApp kamu sebagai pengirim |
| **Kirim Undangan** | `/admin/kirim` | Tambah tamu dan kirim undangan |

Header panel akan menampilkan badge **"Pengirim"** untuk menandakan jenis akunmu.

---

## 4. Langkah 1 — Hubungkan WhatsApp

Sebelum bisa mengirim undangan, kamu harus menghubungkan nomor WhatsApp kamu terlebih dahulu.

### Cara Membuat Sesi WhatsApp Baru

1. Buka menu **WhatsApp** di sidebar
2. Klik tombol **+ Tambah Sesi**
3. Isi nama sesi (contoh: nama kamu atau "WA Hanan") lalu klik **Buat**
4. Pilih metode koneksi:

---

#### Metode A — Scan QR Code (Direkomendasikan)

1. Pilih **"Scan QR Code"**
2. Buka WhatsApp di HP kamu → **Pengaturan → Perangkat Tertaut → Tautkan Perangkat**
3. Arahkan kamera HP ke QR code yang muncul di layar
4. Tunggu hingga status berubah menjadi **"Terhubung ✅"**

> QR code berlaku **60 detik**. Jika kedaluwarsa, klik **Refresh** untuk mendapatkan QR baru.

---

#### Metode B — Kode Pairing (Nomor Telepon)

1. Pilih **"Masukkan Nomor Telepon"**
2. Ketik nomor WhatsApp kamu (format: `08xxxxxxxxxx` atau `628xxxxxxxxxx`)
3. Klik **Minta Kode**
4. Buka WhatsApp di HP → **Pengaturan → Perangkat Tertaut → Tautkan dengan Nomor Telepon**
5. Masukkan kode **8 karakter** yang muncul di HP ke dalam kolom di panel
6. Tunggu hingga status **"Terhubung ✅"**

---

### Status Sesi WhatsApp

| Status | Artinya |
|---|---|
| 🟢 **Terhubung** | Siap digunakan untuk mengirim |
| 🟡 **Menghubungkan** | Sedang dalam proses, tunggu sebentar |
| 🔴 **Terputus** | Perlu dihubungkan ulang — klik **Reconnect** |

> **Penting:** Jangan logout dari WhatsApp di HP selama proses pengiriman berlangsung. Jika terputus, klik tombol **Reconnect** pada sesi di halaman WhatsApp.

---

## 5. Langkah 2 — Tambah Tamu

Buka halaman **Kirim Undangan** (`/admin/kirim`).

### Menambah Tamu Satu per Satu

1. Klik tombol **+ Tambah Tamu**
2. Isi form yang muncul:

| Field | Keterangan | Wajib? |
|---|---|---|
| **Nama** | Nama lengkap tamu (akan muncul di pesan WA) | ✅ Ya |
| **Nomor HP** | Format: `08xxx` atau `628xxx` — digunakan untuk kirim WA | ✅ Ya |
| **Email** | Alamat email tamu (opsional) | Tidak |
| **Grup** | Kelompok tamu, misal: "Keluarga Ibu" | Tidak |
| **Pihak** | Pilih: Mempelai Pria / Wanita | Tidak |
| **VIP** | Centang jika tamu adalah tamu VIP | Tidak |

3. Klik **Simpan**

### Mengimpor Tamu dari CSV

Jika kamu punya daftar tamu dalam file spreadsheet (Excel/Google Sheets), hubungi admin untuk melakukan bulk import melalui halaman Tamu.

### Mengedit Data Tamu

Klik tombol **Edit** pada kartu tamu untuk mengubah data. Kamu hanya bisa mengedit tamu yang **kamu sendiri tambahkan**.

---

## 6. Langkah 3 — Kirim Undangan

### A. Pilih Pengirim (Sesi WhatsApp)

Di bagian atas halaman Kirim Undangan, pilih sesi WhatsApp kamu:

- Kartu sesi akan muncul dengan status koneksi
- Klik kartu sesi yang ingin digunakan (status harus **Terhubung**)
- Jika tidak ada sesi terhubung, akan muncul banner kuning → klik **"Hubungkan →"** untuk ke halaman WhatsApp

> ⚠️ **Pastikan memilih pengirim terlebih dahulu sebelum memilih tamu.**

---

### B. Pilih Tamu

Gunakan filter tab untuk memudahkan pemilihan:

| Tab | Isi |
|---|---|
| **Semua** | Semua tamu yang kamu tambahkan |
| **Belum Terkirim** | Tamu yang belum mendapat undangan WA |
| **Terkirim** | Tamu yang sudah berhasil dikirim |

**Cara memilih tamu:**
- Centang kotak di pojok kiri kartu tamu untuk memilih satu per satu
- Klik **"Pilih Semua yang Belum Terkirim"** untuk memilih semua sekaligus
- Gunakan kotak pencarian di atas untuk mencari nama tamu tertentu

---

### C. Kirim Undangan

1. Setelah memilih tamu, klik tombol **Kirim WA** di bar bawah layar
2. **Verifikasi OTP** — sistem akan mengirim kode OTP ke nomor WhatsApp pengirim (nomor kamu sendiri):
   - Buka WhatsApp di HP kamu
   - Cari pesan dari nomor kamu sendiri berisi kode 6 angka
   - Masukkan kode tersebut ke kolom yang muncul
   - Klik **Verifikasi & Kirim**

   > Kode OTP berlaku **10 menit**. Verifikasi berlaku **1 jam** — jika kamu kirim lagi dalam 1 jam, tidak perlu OTP ulang.

3. Sistem akan mengirim undangan ke semua tamu yang dipilih secara berurutan
4. Progress bar akan menampilkan kemajuan pengiriman secara real-time
5. Setelah selesai, akan muncul ringkasan: berapa berhasil dan berapa gagal

---

### Isi Pesan yang Dikirim

Setiap tamu akan menerima **2 pesan berurutan**:

**Pesan 1 — Teks Undangan:**
```
Assalamualaikum Warahmatullahi Wabarakatuh 🤍

Tanpa mengurangi rasa hormat, perkenankan kami mengundang 
Bapak/Ibu/Saudara/i *[Nama Tamu]* untuk hadir dalam acara 
pernikahan kami.

Berikut link undangan kami:
https://[domain]/?token=...

Merupakan suatu kebahagiaan bagi kami apabila 
Bapak/Ibu/Saudara/i berkenan untuk hadir 🙏

Wassalamualaikum Warahmatullahi Wabarakatuh

Hormat Kami,
[Nama Pengantin]
```

**Pesan 2 — QR Code:**
Gambar QR code yang bisa ditunjukkan saat tiba di venue sebagai tanda masuk.

---

### Kirim Ulang ke Tamu Tertentu

Jika kamu perlu mengirim ulang ke satu tamu saja:
1. Klik tab **Terkirim** atau cari nama tamu
2. Klik tombol **Kirim WA** di kartu tamu tersebut
3. Ikuti proses OTP dan konfirmasi seperti biasa

---

## 7. Memahami Status Pengiriman

Setiap kartu tamu menampilkan badge status WhatsApp:

| Badge | Artinya |
|---|---|
| **Belum** (abu-abu) | Undangan belum pernah dikirim |
| **✓ Terkirim** (hijau) | Undangan berhasil dikirim, disertai nomor pengirim |
| **✗ Gagal** (merah) | Pengiriman gagal — cek nomor HP tamu, lalu coba kirim ulang |

Di bawah badge "Terkirim", akan muncul nomor HP yang digunakan untuk mengirim (📱 628xxx...).

---

## 8. Pertanyaan Umum (FAQ)

**Q: Saya tidak melihat tamu yang seharusnya ada di daftar saya.**  
A: Pastikan tamu tersebut ditambahkan oleh akun kamu. Tamu yang ditambahkan pengirim lain atau admin tidak terlihat di akunmu.

---

**Q: Sesi WhatsApp saya tiba-tiba terputus saat sedang mengirim.**  
A: Buka halaman WhatsApp, klik **Reconnect** pada sesimu, lalu kembali ke Kirim Undangan dan kirim ulang tamu yang gagal (tab **Belum Terkirim**).

---

**Q: Saya tidak menerima OTP di WhatsApp.**  
A: Pastikan sesi WhatsApp kamu dalam status **Terhubung**. Tunggu 1–2 menit lalu klik **Kirim Ulang OTP**. Jika masih tidak muncul, coba reconnect sesi dan ulangi.

---

**Q: Berapa banyak tamu yang bisa saya kirim sekaligus?**  
A: Maksimal **50 tamu per batch** pengiriman. Jika lebih dari itu, ulangi proses pengiriman untuk tamu berikutnya setelah batch pertama selesai.

---

**Q: Apakah ada jeda antar pengiriman pesan?**  
A: Ya, sistem secara otomatis memberi jeda sekitar **1,5–2,5 detik** antar tamu untuk menghindari pemblokiran oleh WhatsApp. Ini normal dan tidak bisa dipercepat.

---

**Q: Tamu mengatakan tidak menerima pesan, tapi statusnya "Terkirim".**  
A: Status "Terkirim" berarti pesan berhasil dikirim dari sistem ke server WhatsApp. Kemungkinan penyebab tamu tidak menerima:
- Nomor HP tamu salah atau tidak aktif
- Tamu memblokir nomor pengirim
- Pesan masuk ke folder spam/arsip WhatsApp tamu

---

**Q: Saya lupa kata sandi.**  
A: Hubungi admin untuk mereset kata sandi akunmu.

---

**Q: Apakah saya bisa menggunakan nomor WhatsApp yang sama dengan pengirim lain?**  
A: Tidak. Setiap pengirim harus menggunakan nomor WhatsApp yang berbeda. Satu nomor hanya bisa terhubung ke satu sesi.

---

*Untuk bantuan lebih lanjut, hubungi admin.*
