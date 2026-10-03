# Panduan Deploy GitHub ke Hostinger, Pendaftaran Akun & Login Google

Dokumen ini memandu Anda menghubungkan repositori **GitHub ke Hostinger**, cara menggunakan fitur **Daftar Akun Baru (Register)**, dan integrasi **Login dengan Google (Google Sign-In)**.

---

## BAGIAN 1: Menghubungkan GitHub ke Hostinger (Deploy Otomatis)

Ada dua metode mudah untuk menghubungkan GitHub ke Hostinger:

### Metode 1: Menggunakan Fitur Git Bawaan Hostinger hPanel (Sangat Mudah & Direkomendasikan)
1. Buka dashboard **Hostinger hPanel**.
2. Di menu pencarian samping, ketik **"Git"** (berada di bagian *Advanced / Tingkat Lanjut* -> *Git*).
3. Klik **"Create a new repository" / "Buat Repository Baru"**:
   - **Repository**: Masukkan URL GitHub Anda (contoh: `https://github.com/username/goc-team-management.git`).
   - **Branch**: `main` (atau `master`).
   - **Install directory**: `public_html` (atau folder aplikasi domain Anda).
4. Klik tombol **"Create"**. Hostinger akan meng-clone repository Anda.
5. **Setup Webhook Otomatis**:
   - Hostinger akan menampilkan **Auto Deployment Webhook URL**. Salin URL tersebut.
   - Buka repository Anda di **GitHub.com** -> Buka tab **Settings** -> **Webhooks** -> **Add webhook**.
   - Tempel URL Hostinger tadi ke kolom **Payload URL**, pilih Content type `application/json`, lalu klik **Add Webhook**.
   - **Hasil**: Setiap kali Anda melakukan `git push` di komputer, Hostinger otomatis menarik perubahan kode terbaru!

---

### Metode 2: Menggunakan GitHub Actions (CI/CD Otomatis)
File workflow sudah disiapkan di `.github/workflows/deploy.yml`:
1. Buka repositori GitHub Anda -> Klik tab **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
2. Tambahkan 3 variabel secret dari detail FTP Hostinger Anda (dapat dilihat di hPanel -> *Akses FTP*):
   - `HOSTINGER_FTP_SERVER` : (misal: `ftp.domainanda.com` atau IP server Hostinger)
   - `HOSTINGER_FTP_USERNAME` : (username FTP Hostinger Anda)
   - `HOSTINGER_FTP_PASSWORD` : (password FTP Hostinger Anda)
3. Sekarang, setiap kali Anda push ke branch `main`, GitHub Actions akan otomatis:
   - Menjalankan `npm install`
   - Mengompilasi frontend dan backend (`server.js`)
   - Mengunggah file produksi langsung ke server Hostinger Anda!

---

## BAGIAN 2: Cara Setup Node.js App di Hostinger

Setelah file terunggah dari GitHub ke folder `public_html`:
1. Di hPanel Hostinger, buka menu **"Setup Node.js App"**.
2. Masukkan konfigurasi:
   - **Node.js version**: `18.x` atau `20.x`
   - **Application mode**: `Production`
   - **Application root**: `public_html`
   - **Application startup file**: `server.js` (⚠️ **Wajib** ketik `server.js`)
3. Klik **"Run NPM Install"** lalu klik **"Start Application"**.
4. Selesai! Web aplikasi Anda langsung aktif di domain Anda.

---

## BAGIAN 3: Fitur Pendaftaran Akun Baru (Register)

User baru kini tidak perlu menunggu dibuatkan akun oleh admin:
1. Di halaman login, klik tab **"Daftar Akun Baru"**.
2. Isi formulir:
   - **Nama Lengkap** (contoh: *drg. Ahmad Fauzi*)
   - **Email** (contoh: *ahmad.fauzi@gmail.com*)
   - **Username** (contoh: *ahmad.fauzi*)
   - **Nomor WhatsApp / HP**
   - **Pilihan Divisi / Unit Kerja** (Administrasi, Perawat Gigi, Finance, Marketing, atau Penunjang)
   - **Password** (minimal 6 karakter)
3. Klik **"Daftar Akun Sekarang"**.
4. Sistem otomatis:
   - Mengenkripsi password dengan keamanan PBKDF2 hash & salt.
   - Memberikan nomor induk karyawan baru (`GOC-xxx`).
   - Mendaftarkan user ke channel diskusi tim (*All Team Forum*).
   - Mengirim notifikasi ke Owner/Admin bahwa ada pendaftaran anggota tim baru.
   - Langsung membuat sesi dan mengarahkan pengguna masuk ke sistem.

---

## BAGIAN 4: Fitur Login & Daftar dengan Akun Google (Google SSO)

Pengguna dapat masuk atau mendaftar hanya dengan satu klik:
1. Di halaman login, klik tombol **"Masuk dengan Akun Google"** (atau "Daftar dengan Akun Google").
2. Masukkan alamat email Google Anda atau pilih akun Google yang tersedia.
3. **Jika email Google sudah terdaftar sebelumnya**: Sistem langsung mengautentikasi dan login ke akun yang sesuai.
4. **Jika email Google baru pertama kali digunakan**: Sistem otomatis mendaftarkan profil Google tersebut sebagai anggota tim baru, membuatkan akun, dan langsung mengizinkan masuk tanpa perlu mengisi formulir panjang.
