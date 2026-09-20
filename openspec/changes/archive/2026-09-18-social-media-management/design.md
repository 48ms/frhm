# Design

## Context
Fase 1 dari transformasi Frhm menjadi Enterprise Social Media Management. Kita akan mengimplementasikan skema database baru untuk mendukung hierarki aset (Parent-Child) dan membuat antarmuka form pembuatan konten (Structured Brief) yang tegas mengatur strategi (Pillars) sesuai `social-content` skill.

## Goals / Non-Goals

**Goals:**
- Mendesain tabel Supabase untuk kampanye, *hero assets* (parent), dan *platform posts* (child).
- Membangun antarmuka form pembuatan konten berlapis menggunakan `react-hook-form` dan Zod untuk validasi terstruktur (Hook, Body, CTA).
- Mengintegrasikan interaksi dinamis menggunakan `animate-ui` (seperti *accordion* dan peringatan interaktif).

**Non-Goals:**
- Alur *approval* (Multi-tier approval) dan Analitik (*Dashboard API Ingestion*) — ini akan dikerjakan di Fase 2 dan 3.

## Decisions

- **Database Relational (Parent-Child):**
  Menggunakan tabel `content_assets` untuk menyimpan data makro (Judul, Pillar, URL aset mentah) dan tabel `platform_posts` (dengan referensi *foreign key* `asset_id`) untuk draf spesifik per platform (LinkedIn, IG, TikTok). Hal ini paling efisien untuk melacak status masing-masing draf tanpa menduplikasi file mentah.
- **Form State Management:**
  Menggunakan `react-hook-form` digabungkan dengan resolver Zod. Ini memungkinkan kita membuat aturan validasi kompleks (misalnya: "Jika platform == LinkedIn, maka kotak Body tidak boleh memuat Regex URL").
- **Optimistic Validation UI:**
  Setiap *warning* atau *error* (seperti melanggar batas pilar promo atau menaruh link di body LinkedIn) akan muncul secara instan di klien (*client-side validation*) menggunakan efek *spring* dari Framer Motion.

## Risks / Trade-offs

- **Risk:** Formulir yang dipecah-pecah (Hook, Body, CTA) mungkin terasa memperlambat pengguna yang terbiasa *copy-paste* langsung.
  - **Mitigation:** Menyediakan tombol `Magic Split` atau UI yang mulus agar navigasi antar kolom input dapat dilakukan cepat dengan tombol `Tab`, serta memberikan *live preview* gabungan *caption* di sebelah kanan.
