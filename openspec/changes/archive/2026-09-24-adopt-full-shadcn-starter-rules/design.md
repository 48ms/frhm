# Design: Implementasi Penuh 12 Aturan & Modul Pendukung `next-shadcn-dashboard-starter`

## Context

Frhm telah menyelesaikan implementasi pilot pada antarmuka klien (Taraju) dengan sukses. Namun, untuk membawa ke tingkat *production-grade* yang setara dengan template referensi `next-shadcn-dashboard-starter`, seluruh 12 aturan dan modul pendukung tingkat lanjut perlu diterapkan secara menyeluruh ke seluruh sistem Frhm.

Lihat [proposal.md](file:///c:/Users/bimam/Downloads/Tools%20Frahma/openspec/changes/adopt-full-shadcn-starter-rules/proposal.md) untuk motivasi dan latar belakang kebutuhan.

## Goals / Non-Goals

**Goals:**
- Menerapkan arsitektur lengkap dari `next-shadcn-dashboard-starter`:
  1. Centralized Icon Registry di `@/components/icons.tsx`
  2. Mandatory `<PageContainer>` dengan standard header props di semua rute kerja
  3. 3-Lapis Service Layer (`types.ts` → `service.ts` → `queries.ts`)
  4. TanStack React Query SSR Hydration (`prefetchQuery` + `useSuspenseQuery`)
  5. URL State Management untuk data table menggunakan `nuqs`
  6. Data Table Tooling Suite (faceted filter, date range filter, slider, column toggle, skeleton)
  7. TanStack Form modular field anatomy (15 field components terintegrasi Zod)
  8. Multi-Step Form Stepper Hook (`useStepper`) untuk alur bertahap
  9. Zero layout-shift `<Button isLoading={...}>`
  10. Centralized navigation metadata di `config/nav-config.ts`
  11. Contextual infobar system via `infoContent`
  12. Global Command Bar & shortcuts via `kbar`
  13. 10 Tema OKLCH dengan animasi View Transition wave
  14. In-App Notification Center popover di header
  15. Production File Uploader dengan drag-and-drop dan per-file progress tracking
  16. Dashboard Parallel Routes (`@slot`) dengan isolasi error boundary dan container queries
  17. Standardized Empty State Component (`empty.tsx`)
  18. Mobile Drawer / Bottom-sheet via Vaul
- Menjaga 100% kompatibilitas dengan Supabase Auth, PostgreSQL schema, dan RLS security.

**Non-Goals:**
- Mengadopsi `@clerk/nextjs`, Clerk Organizations, atau Clerk Billing (Frhm tetap mengandalkan Supabase multi-tenant RLS).
- Big-bang rewrite yang mematahkan endpoint mutasi database yang sudah aktif.

## Decisions

### 1. Centralized Icon Registry via Tabler & Lucide
* **Keputusan**: Seluruh ikon dipusatkan di `@/components/icons.tsx`. Mengekspor objek `Icons` tunggal.
* **Alternatif Dipertimbangkan**: Mengimpor ikon langsung dari `lucide-react` di setiap komponen. Ditolak karena menciptakan fragmentasi visual dan ketergantungan erat pada pustaka pihak ketiga di puluhan file.

### 2. Standardisasi Data Layer: Supabase + TanStack React Query SSR
* **Keputusan**: Mengadopsi pola TanStack Query:
  - `service.ts` mengeksekusi query Supabase (baik via client Supabase maupun Route Handler).
  - `queries.ts` mendefinisikan key factories terstruktur (`['deliverables', 'list', filters]`).
  - Halaman Server Component melakukan `void queryClient.prefetchQuery()` dan membungkus client component dalam `<HydrationBoundary>`.
* **Alternatif Dipertimbangkan**: Mempertahankan `useEffect` + `fetch()` manual. Ditolak karena menimbulkan waterfalls, tidak ada caching otomatis antar halaman, dan memicu query berulang ke Supabase.

### 3. URL State via `nuqs` & Data Table Tooling Suite
* **Keputusan**: Memasang `nuqs` dan menggunakan `DataTableFacetedFilter`, `DataTableDateFilter`, dan `DataTableViewOptions` yang mengikat state filter ke URL (`shallow: true`).
* **Alternatif Dipertimbangkan**: Local React state. Ditolak karena state hilang saat refresh atau back-button browser.

### 4. File Uploader Multi-File dengan Individual Progress
* **Keputusan**: Mengintegrasikan `react-dropzone` ke komponen `file-uploader.tsx` yang memantau proses unggah berkas kreatif per entitas ke Supabase Storage bucket (`deliverables`, `brand-assets`) dengan progress percentage.

### 5. Dashboard Parallel Routes dengan Error Boundary Mandiri
* **Keputusan**: Membagi dashboard overview menjadi parallel routes (`@area_stats`, `@bar_stats`, `@pie_stats`, `@sales`). Setiap widget memiliki `error.tsx` lokal sehingga kegagalan satu metrik tidak menggagalkan seluruh tampilan dashboard.

### 6. Zero Layout-Shift Button Loading
* **Keputusan**: Mengadopsi teknik CSS Grid overlay pada `components/ui/button.tsx` agar spinner dan teks berada dalam satu koordinat grid cell.

## Risks / Trade-offs

- **[Risk]** Penambahan dependensi baru (`@tanstack/react-query`, `nuqs`, `kbar`, `react-dropzone`, `vaul`).
  → **Mitigasi**: Seluruh dependensi bersifat modular dan teroptimasi untuk Turbopack / tree-shaking Next.js 16.
- **[Risk]** Kompleksitas migrasi form lama ke `@tanstack/react-form`.
  → **Mitigasi**: Pustaka 15 field dibuat independen sehingga form lama berbasis `react-hook-form` tetap berjalan normal sembari dimigrasi secara bertahap.

## Migration Plan

1. **Fase 1: Tooling, Primitives & Icon Registry**:
   - Install dependensi: `@tanstack/react-query`, `@tanstack/react-form`, `nuqs`, `kbar`, `@tabler/icons-react`, `react-dropzone`, `vaul`, `input-otp`.
   - Setup Icon registry di `components/icons.tsx`.
   - Update `button.tsx` dengan zero-shift loading.
   - Buat `components/ui/empty.tsx` dan `components/ui/drawer.tsx`.
2. **Fase 2: Navigasi, Command Bar & Shell**:
   - Buat `config/nav-config.ts`.
   - Pasang `kbar` global shortcut provider.
   - Pasang `NotificationCenter` popover di header.
   - Pasang 10 tema OKLCH di `styles/themes/` dan `ThemeSelector`.
3. **Fase 3: Data Table Suite & URL State**:
   - Pasang sub-komponen data table (`DataTableFacetedFilter`, `DataTableDateFilter`, dll.).
   - Refactor Deliverables dan Clients ke struktur 3-lapis (`types.ts`, `service.ts`, `queries.ts`) dengan sinkronisasi `nuqs`.
4. **Fase 4: Form Fields & File Uploader**:
   - Pasang 15 field components di `components/forms/fields/`.
   - Pasang `file-uploader.tsx` terintegrasi Supabase Storage.
   - Pasang hook `useStepper` untuk alur multi-step wizard.
5. **Fase 5: Dashboard Parallel Routes & PageContainer Rollout**:
   - Refactor dashboard overview ke parallel slots (`@area_stats`, `@bar_stats`, `@pie_stats`, `@sales`).
   - Bungkus seluruh halaman admin ke `<PageContainer>` dengan contextual infobar.
