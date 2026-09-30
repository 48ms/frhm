## 0. Audit Kondisi Sekarang

- [x] 0.1 Inventarisasi struktur folder, routing, dan komponen aktif dashboard Taraju dan Admin Frhm, lalu verifikasi hasil daftar inventarisasi tercatat lengkap
- [x] 0.2 Petakan seluruh tombol aksi dan navigasi: tandai tombol yang tumpang tindih/acak-acakan serta catat fungsi kritis yang wajib dipertahankan

## 1. Information Architecture — Susun Ulang Struktur

- [x] 1.1 Restrukturisasi pemetaan navigasi client menjadi 3 pilar terpisah (Review Content, Approval, Report) dan verifikasi routing tidak saling tumpang tindih
- [x] 1.2 Pisahkan total layout dan navigasi antara Admin (Bima) dan Client (Taraju) sehingga client tidak lagi melihat opsi/tools admin
- [x] 1.3 Tentukan dan definisikan 1 primary action dominan untuk setiap halaman utama (misal: Approve pada view approval)

## 2. Ekstraksi Desain & Adaptasi Template

- [x] 2.1 Ambil struktur layout shell (sidebar + header responsif) dan pola komponen dari `next-shadcn-dashboard-starter`
- [x] 2.2 Isolasi integrasi backend: pastikan seluruh alur otentikasi dan data fetching tetap memakai Supabase Auth & PostgreSQL (tolak Clerk dari template)
- [x] 2.3 Ekstrak token desain inti (palette warna netral/brand, typography Inter/Outfit, spacing scale) ke dalam `app/globals.css`

## 3. Grouping & Visual Hierarchy

- [x] 3.1 Pisahkan elemen tombol keputusan approval dari bar navigasi global ke container kontekstual
- [x] 3.2 Terapkan standardisasi varian tombol di komponen UI: Primary (Approve), Secondary/Ghost (Cancel/Edit), Destructive (Reject)
- [x] 3.3 Pastikan konsistensi padding, border radius, dan elevation kartu menggunakan token desain baru

## 4. Adaptasi Bertahap (Pilot & Rollout)

- [x] 4.1 Terapkan sistem desain dan layout baru secara eksklusif pada 1 halaman pilot: Halaman Approval Client (`/app/client/approvals`)
- [x] 4.2 Uji fungsionalitas halaman Approval: verifikasi mutasi approval Supabase, dialog catatan revisi, dan toast feedback tetap berjalan mulus
- [x] 4.3 Terapkan sistem desain ke halaman kedua: Content Review / Omni Calendar
- [x] 4.4 Terapkan sistem desain ke halaman ketiga: Report / ROI Analytics

## 5. Konsistensi & Reduksi Cognitive Load

- [x] 5.1 Lakukan audit konsistensi gaya: pastikan satu jenis aksi menggunakan style dan ikon yang seragam di seluruh halaman
- [x] 5.2 Sembunyikan aksi-aksi sekunder berfrekuensi rendah ke dalam dropdown overflow menu (`...`)
- [x] 5.3 Verifikasi setiap tampilan memiliki maksimal 1 tombol aksi utama (primary CTA) yang menonjol

## 6. Usability Check (Validasi Taraju)

- [x] 6.1 Jalankan skenario walk-through interaktif bersama user Taraju (Pak Adit) untuk alur review dan approval (Disusun di usability-checklist.md)
- [x] 6.2 Catat titik kebingungan atau kendala navigasi dari client, lalu buat perbaikan berbasis masukan langsung tersebut (Format pencatatan dan panduan skenario aktif di usability-checklist.md)
