# 🎨 Frhm: Global Design System & UI/UX Blueprint

**Status**: Visi Enterprise Marketing ERP
**Tanggal Diperbarui**: September 2026

## 🚨 HUKUM MUTLAK (THE ABSOLUTE RULE)
Seluruh fase pengimplementasian UI/UX di proyek ini **WAJIB MUTLAK** menggunakan dan mengikuti standar dari **[Animate UI](https://github.com/imskyleen/animate-ui)**. 
- **Komponen:** Dilarang membuat komponen animasi dari nol atau menggunakan library eksternal lain jika `animate-ui` sudah menyediakannya. Komponen dari repositori tersebut adalah satu-satunya sumber kebenaran (*Single Source of Truth*).
- **Tech Stack:** Wajib selaras total dengan ekosistem `animate-ui` (React, TypeScript, Tailwind CSS, dan Motion).
- **Versi Tailwind & Konfigurasi:** Wajib patuh dan mengikuti versi Tailwind beserta struktur konfigurasi yang disyaratkan oleh repo `animate-ui`.
- Segala interaksi mikro (*micro-interactions*), efek hover, menu, dan transisi wajib terasa *fluid*, bernyawa, dan premium layaknya standar library tersebut.

---

## 1. Filosofi Desain (Design Philosophy)
Pergeseran dari "Dashboard Sederhana" ke "Pusat Kendali Profesional".
* **Sisi Admin:** Kepadatan data tinggi (*high density*), navigasi instan lewat *keyboard* (*keyboard-centric*), dan tata letak yang dioptimalkan untuk kecepatan penyelesaian tugas (layar Kanban, Omni-Calendar).
* **Sisi Klien:** Kurva belajar nol (*zero-learning curve*). Visual berbasis *Card* berukuran besar yang sangat mudah disentuh. Menggunakan navigasi *Bottom-Bar* murni (*Mobile-First*).

## 2. Identitas Visual & Interaksi (Powered by Animate UI)
* **Tipografi:** Keluarga font **Geist** (Geist Sans untuk teks utama, Geist Mono untuk kode/angka mutlak).
* **Warna & Ekstraksi Logo:** Latar belakang *Neutral Gray* (`#F5F5F7`), teks *Charcoal/Nyaris Hitam* (`#1D1D1F`). **ATURAN BARU:** Warna Aksen Utama (untuk tombol CTA, *progress bar*, dan status aktif) dilarang menggunakan warna *default* bawaan *library*. Warna aksen **wajib diekstrak langsung dari palet warna logo Frhm (`logo-frhm.png`)**. Ini memastikan seluruh UI terasa menyatu dan memiliki identitas *brand* yang sangat kuat.
* **Bentuk & Transisi:** Sudut membulat (*Rounded-xl* hingga *2xl*), bayangan lembut (*soft shadow*). Interaksi wajib memiliki *spring physics* (bernyawa) saat diklik atau di-hover, menggunakan komponen Motion.

## 3. Pro-Tier UX Patterns (Standar Enterprise)
* **Global Command Palette (`Ctrl+K`):** Wajib ada untuk pencarian super cepat melintasi Klien, Konten, dan Fitur (dibangun di atas standar Animate UI).
* **Optimistic UI & Skeletal Loading:** Mengharamkan layar putih kosong saat memuat. Antarmuka harus langsung merespons aksi secara instan (mengubah warna/status) tanpa menunggu respons *backend* (memanfaatkan *motion* untuk menyamarkan *loading*).
* **Data Density Toggle:** Tabel data (CRM/KOL) harus memiliki opsi tombol "Nyaman" (berjarak lebar) vs "Padat" (rapat).
* **Activity Trails (Audit Log):** Setiap pergerakan status *deliverable* harus meninggalkan jejak kronologis (Siapa, Melakukan Apa, Kapan).

## 4. Arsitektur Tata Letak (Layout Architecture)
* **Admin Layout:** 
  - Sidebar hierarki yang dapat dilipat (*Collapsible Groups*: Overview, Marketing, AI Core, Clients, System).
  - Panel rincian (*Slide-over Sheet*) wajib muncul dari samping kanan, menghindari *pop-up modal* yang menutupi layar utama.
* **Client Layout:** 
  - Diharamkan menggunakan *Sidebar* statis di perangkat *mobile*.
  - Wajib menggunakan *Bottom Navigation Bar* di *viewport* kecil.

## 5. Aturan Ketat Komponen Dasar
* **Label vs Placeholder:** Setiap *input* wajib memiliki label di atasnya. *Placeholder* dilarang digunakan sebagai pengganti label utama.
* **Dropdown yang Diharamkan:** Dilarang keras menggunakan *dropdown menu* jika jumlah opsi di bawah 5 buah. Wajib menggunakan *Radio/Toggle Pill/Segmented Control* beranimasi.
* **Pesan Error Inline:** *Error* wajib muncul tepat di bawah *input* yang salah dengan warna merah dan instruksi yang konkrit (bukan sekadar "Format Salah").
* **Tombol Aksi Spesifik:** Dilarang menggunakan label generik ("Submit", "OK", atau "Yes"). Label tombol wajib berbunyi tindakan aktual (misal: "Kirim ke Klien", "Setujui Revisi", "Hapus Konten").
