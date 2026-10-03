# Panduan Lengkap Deploy GOC Team Management di Hostinger Node.js & Multi-Komputer

Dokumen ini menjelaskan cara menjalankan aplikasi **GOC Team Management (Galaxy Orthodontic Center)** di Hostinger Node.js, bagaimana database bekerja secara mandiri, dan cara menghubungkan banyak komputer (Komputer 1, Komputer 2, HP/Tablet) agar datanya selalu sinkron dan sama.

---

## 1. Bagaimana Multi-Komputer & Database Bekerja?

Aplikasi ini menggunakan arsitektur **Client-Server Terpusat**:
* **Database Pusat**: Disimpan di server Hostinger pada file `data/goc_database.json`.
* **Komputer 1 (Kasir / Resepsionis)**: Membuka browser ke `https://domain-anda.com` lalu login.
* **Komputer 2 (Dokter di Ruang Praktik)**: Membuka browser ke `https://domain-anda.com` lalu login.
* **Komputer 3 (Pimpinan / Manajemen)**: Membuka alamat yang sama.

### Mengapa datanya selalu sama?
Karena data **TIDAK DISIMPAN DI HARD DISK KOMPUTER MASING-MASING**, melainkan di **Database Pusat Server Hostinger**.
- Ketika Komputer 1 menambahkan jadwal cuti, menginput tugas baru, atau mengirim pesan forum, server Hostinger langsung menyimpannya.
- Ketika Komputer 2 membuka menu Tugas atau Cuti, aplikasi langsung membaca data terbaru dari server Hostinger.
- Semua staf dapat bekerja bersamaan dari komputer manapun yang memiliki koneksi internet.

---

## 2. Persiapan Sebelum Upload ke Hostinger

Di komputer lokal Anda, pastikan Anda telah menjalankan:
```bash
npm install
npm run build
```
Perintah `npm run build` akan menghasilkan dua hal:
1. Folder `dist/` (Tampilan web frontend siap produksi).
2. File `server.js` (Server backend Node.js mandiri yang siap dijalankan langsung di Hostinger).

---

## 3. Langkah Deploy di Hostinger (Menu "Setup Node.js App")

### Langkah 1: Upload File ke Hostinger
1. Masuk ke **hPanel Hostinger** -> **File Manager** (atau gunakan FTP/Git).
2. Upload seluruh file proyek ke folder domain Anda (biasanya `public_html` atau folder khusus seperti `domains/domainanda.com/public_html`).
3. Pastikan file berikut ada di folder tersebut:
   - `server.js`
   - `package.json`
   - `dist/` (folder hasil build)
   - `.htaccess`
   - `data/` (folder ini akan otomatis dibuat oleh server jika belum ada)

### Langkah 2: Buka Menu "Setup Node.js App"
1. Di panel hosting Hostinger, cari dan klik menu **"Setup Node.js App"** (atau Node.js Selector).
2. Klik tombol **"Create Application"** (atau Tambah Aplikasi).
3. Isi konfigurasi sebagai berikut:
   - **Node.js version**: Pilih `18.x` atau `20.x` (disarankan v20.x).
   - **Application mode**: Pilih `Production`.
   - **Application root**: Masukkan path folder tempat Anda mengupload file (contoh: `public_html`).
   - **Application URL**: Pilih nama domain atau subdomain Anda (contoh: `klinikgoc.com` atau `app.klinikgoc.com`).
   - **Application startup file**: Ketik `server.js` (⚠️ PENTING: tulis **server.js**, BUKAN server.ts).

### Langkah 3: Install Dependensi & Start
1. Setelah aplikasi dibuat, klik tombol **"Run NPM Install"** pada dashboard Node.js Hostinger.
2. Tunggu beberapa detik hingga dependensi selesai diinstal.
3. Klik tombol **"Start Application"** atau **"Restart"**.

---

## 4. Konfigurasi Alternatif: VPS Hostinger / Docker (Jika Memakai VPS)

Jika Anda menggunakan **Hostinger VPS** dengan akses SSH:
```bash
# 1. Masuk ke direktori aplikasi
cd /var/www/goc-team

# 2. Install dependensi & build
npm install
npm run build

# 3. Jalankan aplikasi menggunakan PM2 (agar otomatis jalan terus di latar belakang)
npm install -g pm2
pm2 start server.js --name "goc-management"
pm2 save
pm2 startup
```

---

## 5. Fitur Database & Backup Mandiri di Aplikasi

Anda tidak perlu menginstal software database rumit seperti MySQL/PostgreSQL tambahan jika tidak diinginkan, karena sistem telah dilengkapi **Embedded JSON Relational Database**:
1. Buka menu **Pengaturan** di aplikasi.
2. Klik tab **"Database & Koneksi Multi-Komputer"**.
3. Anda dapat melihat:
   - Status koneksi database pusat.
   - Total jumlah akun, tugas, shift jadwal, slip gaji, dan pesan forum.
   - Tombol **"Unduh Backup Database (.json)"** untuk mencadangkan database ke laptop Anda sewaktu-waktu.
   - Tombol **"Pulihkan dari File Backup (.json)"** untuk merestore data jika berpindah server hosting.

---

## 6. Akun Default untuk Pengujian di Berbagai Komputer

Anda dapat langsung mencoba login di Komputer 1 dan Komputer 2 dengan akun berikut:

| Nama Pengguna | Username | Role / Jabatan | Password Default |
| :--- | :--- | :--- | :--- |
| **Hendri Kurniawan** | `hendri.kurniawan` | Owner / Super Admin | `AdminGOC@2026` |
| **drg. Ervina Dewiyanti** | `drg.ervina` | Penanggung Jawab Klinik | `StaffGOC@2026` |
| **Mareta Ismi** | `mareta.ismi` | Koordinator Front Office & Pasien | `StaffGOC@2026` |
| **Adelia Suci** | `adelia.suci` | Perawat Gigi & Asistensi Ortho | `StaffGOC@2026` |
| **Weli Apriyani** | `weli.apriyani` | Finance & Verifikasi Payroll | `StaffGOC@2026` |

*Setelah login pertama kali, setiap staf dapat mengganti password mereka sendiri di menu profil.*
