## Why

Dashboard Frhm (khususnya workspace client Taraju dan admin Frhm) saat ini memerlukan perapihan arsitektur informasi, konsistensi hierarki visual, dan pemisahan tegas antara surface Admin vs Client. Banyak tombol aksi dan navigasi masih bercampur, memicu *cognitive load* tinggi bagi user client saat melakukan review konten atau approval.

Dengan mengadopsi pola arsitektur, tata letak, dan design system dari template referensi teruji (`next-shadcn-dashboard-starter` - Next.js 16, Tailwind CSS v4, shadcn/ui), Frhm dapat menyusun ulang *Information Architecture*, merapikan *design tokens*, dan menerapkan transisi bertahap (*incremental adoption*) tanpa merusak fungsionalitas backend Supabase dan alur bisnis yang sudah berjalan.

## What Changes

Perubahan dilakukan melalui 7 tahapan bertahap (Tahap 0 - Tahap 6):

1. **Audit & Inventarisasi (Tahap 0):** Memetakan seluruh struktur folder, halaman, komponen, serta katalog tombol/menu yang ada pada dashboard Taraju dan Admin Frhm saat ini. Mengidentifikasi aksi krusial yang wajib dipertahankan vs elemen yang perlu dieliminasi/dirapikan.
2. **Restrukturisasi Information Architecture (Tahap 1):** 
   - Memisahkan fitur secara tegas berdasarkan domain/tujuan user: Review Content, Approval, dan Report.
   - Penegasan akses & navigasi berbasis peran: Admin (Bima/internal) vs Client (Pak Adit - Taraju), di mana navigasi dan surface terpisah total (bukan sekadar disable tombol).
   - Penentuan 1 *primary action* per halaman/view.
3. **Adopsi Pola & Komponen dari Template Referensi (Tahap 2):**
   - Mengadopsi struktur folder *feature-based*, layout shell (sidebar + header responsif), style komponen dasar (Button, Card, Table, Dialog), sistem tema, serta pola query table URL-synced (`nuqs`).
   - **PENTING (Architectural Guardrail):** Menolak Clerk dari template referensi; tetap mempertahankan dan menyelaraskan dengan **Supabase Auth** & Supabase RLS yang sudah terpasang di Frhm.
4. **Grouping & Visual Hierarchy (Tahap 3):**
   - Pemisahan visual tombol aksi fungsional (misal: approval) dari kontrol navigasi.
   - Standardisasi varian tombol: Primary (Approve), Secondary (Cancel/Filter), Destructive (Reject).
   - Standardisasi spacing, typography, dan token warna di seluruh halaman.
5. **Implementasi & Adaptasi Bertahap (Tahap 4):**
   - Ekstraksi token desain (warna, font, spacing) ke `index.css` / Tailwind tokens.
   - Uji coba penerapan pertama pada 1 halaman kunci (Halaman Approval Client).
   - Validasi logika, state Supabase, dan regression test.
   - Penerapan bertahap ke halaman berikutnya: Content Review lalu Performance Report.
6. **Reduksi Cognitive Load & Standardisasi Aksi (Tahap 5):**
   - Konsistensi 1 jenis aksi = 1 gaya visual di semua halaman.
   - Fitur/menu sekunder dimasukkan ke *overflow action menu* (dropdown `...`), menjaga maksimal 1 aksi primer tampak dominan per view.
7. **Usability Verification (Tahap 6):**
   - Uji alur nyata bersama user Taraju (Pak Adit) untuk mendeteksi friksi dan bottleneck tanpa mengandalkan asumsi internal.

## Capabilities

### New Capabilities
- `ui/design-system-foundations`: Token desain terpadu, hierarki tombol (primary/secondary/destructive), standardisasi kartu/tabel/dialog, dan penataan menu overflow yang diadopsi dari `next-shadcn-dashboard-starter` dan diselaraskan ke Supabase stack Frhm.
- `ui/information-architecture`: Pemisahan total tata letak dan navigasi antara Admin dan Client, pengelompokan domain fitur (Review, Approval, Report), dan penegasan single primary action per view.

### Modified Capabilities
- `ui/hierarchical-sidebar`: Restrukturisasi navigasi sidebar dan header dengan layout shell modular feature-based serta pemisahan role Admin vs Client yang tegas.
- `client/mobile-navigation`: Penyelarasan menu bar dan bottom navigation client dengan arsitektur peran baru dan pengelompokan aksi yang lebih ringkas.

## Impact

- **Affected Surfaces:** Routing `/app/admin/*`, `/app/client/*`, komponen layout dashboard (`sidebar.tsx`, `header.tsx`, `bottom-nav.tsx`), serta komponen spesifik halaman (`approval-board.tsx`, `kanban-board.tsx`, dsb).
- **Dependencies:** Adopsi dependensi selektif yang relevan dari template (seperti `nuqs` untuk URL table query sync jika dibutuhkan).
- **Backend / Auth:** Tidak ada pergantian ke Clerk. Supabase Auth, session client/server, dan RLS policies tetap menjadi *source of truth*.
