# Proposal: Adopsi Standar Utuh `next-shadcn-dashboard-starter` ke Frhm

## Why

Frhm telah mengadopsi struktur shell dan pilot approval untuk client, namun codebase secara keseluruhan belum mengikuti konvensi arsitektur baku dari template acuan `next-shadcn-dashboard-starter`. 
Saat ini terjadi inkonsistensi: pemanggilan ikon tersebar di banyak package eksternal, state tabel hilang saat browser di-refresh karena tidak tersinkronisasi ke URL, data fetching belum memiliki caching layer terstandarisasi (menimbulkan beban query berulang ke Supabase), formulir dibangun secara ad-hoc tanpa reusable field anatomy, upload file belum memiliki progress tracking individual, dan dashboard monolitik masih rentan crash secara cascading jika satu widget grafik gagal fetch. Adopsi penuh arsitektur ini diperlukan untuk menyempurnakan performa, UX responsif, dan ketahanan jangka panjang platform Frhm (dengan tetap mempertahankan Supabase Auth & RLS).

## What Changes

Penerapan menyeluruh pola arsitektur, UI, dan modul dari `next-shadcn-dashboard-starter`:
1. **Centralized Icon Registry**: Mengisolasi semua ikon ke `@/components/icons.tsx`. Melarang import langsung dari `@tabler/icons-react` atau `lucide-react` di komponen fitur.
2. **Mandatory PageContainer Props**: Standarisasi seluruh halaman admin dan client agar menggunakan props `<PageContainer pageTitle pageDescription pageHeaderAction infoContent>`.
3. **Feature-Driven 3-Lapis Service Layer**: Memisahkan data fetching ke dalam struktur `types.ts` → `service.ts` → `queries.ts`. Komponen dilarang memanggil `fetch()` atau database langsung.
4. **TanStack React Query SSR Hydration**: Menerapkan pola `void prefetchQuery()` di server + `HydrationBoundary` + `useSuspenseQuery` di client untuk streaming data instan.
5. **URL State Synchronization (`nuqs`)**: Menyinkronkan search params tabel (search, status filter, sort, page) ke URL dengan `shallow: true` pada seluruh data table admin.
6. **TanStack Form System & 15 Field Library**: Mengintegrasikan `@tanstack/react-form` + Zod dengan 15 reusable field anatomy (`field.TextField`, `field.SelectField`, `field.TagsField`, `field.ColorField`, `field.ComboboxField`, `field.OtpField`, `field.DatePickerField`, dll.).
7. **Zero Layout-Shift Button Loading**: Memperbarui komponen `Button` agar status loading menggunakan CSS grid overlap tanpa merusak ukuran tombol.
8. **Centralized Navigation (`nav-config.ts`)**: Memusatkan seluruh metadata menu admin dan client ke `config/nav-config.ts`.
9. **Contextual Infobar System**: Mengaktifkan panel dokumentasi/bantuan samping (`infoContent` + `info-sidebar.tsx`) di halaman-halaman kerja utama.
10. **Global Keyboard Shortcuts (`kbar`)**: Menyediakan navigasi instan via shortcut keyboard (misal `d d` untuk dashboard) dan Command+K modal.
11. **Multi-Theme OKLCH System**: Menambahkan preset tema OKLCH (Vercel, Supabase, Claude, dll.) dengan transisi wave CSS View Transition.
12. **In-App Notification Center**: Menambahkan popover notifikasi di header dengan filter All/Unread/Read dan sinkronisasi badge counter.
13. **Data Table Advanced Tooling Suite**: Menyediakan faceted filter, date range filter, slider filter, column visibility toggle, dan adaptive skeleton loader.
14. **Production File Uploader Dropzone**: Menyediakan komponen multi-file upload dengan per-file progress tracking, MIME validation, dan image/document preview.
15. **Dashboard Parallel Routes & Container Queries**: Memisahkan widget dashboard ke dalam parallel slot (`@area_stats`, `@bar_stats`, `@pie_stats`, `@sales`) dengan error boundary mandiri dan styling container query `@container/card`.
16. **Multi-Step Form Wizard Hook (`useStepper`)**: Menyediakan state management terpadu untuk alur form multi-langkah.
17. **Standardized Empty State Component (`empty.tsx`)**: Menyediakan komponen visual seragam untuk kondisi data kosong dengan call-to-action terarah.
18. **Mobile Drawer via Vaul (`drawer.tsx`)**: Menyediakan interaksi modal swipeable bottom-sheet untuk pengguna mobile/tablet.

## Capabilities

### New Capabilities
- `ui/design-system-standards`: Standar desain baku meliputi icon registry tunggal, zero-shift loading button, mandatory PageContainer, drawer mobile, dan multi-theme OKLCH.
- `data-layer/tanstack-query-ssr`: Pola fetching TanStack React Query SSR hydration dengan key factories dan cache invalidation otomatis.
- `data-layer/url-state-tables`: Sinkronisasi query param tabel (search, filter, sort, pagination) ke URL via `nuqs`.
- `ui/data-table-advanced-suite`: Sub-komponen data table meliputi faceted filter, date range filter, slider filter, column visibility toggle, dan table skeleton.
- `forms/tanstack-form-standard`: Standar formulir modular menggunakan `@tanstack/react-form` + 15 composable field library + validasi Zod.
- `forms/stepper-wizard-flow`: Hook pengelolaan alur formulir bertahap (stepper wizard) untuk onboarding dan setup campaign.
- `ui/file-uploader-suite`: Komponen upload file drag-and-drop dengan progress tracking per file dan preview thumbnail.
- `ui/dashboard-parallel-routes`: Struktur dashboard analitik berbasis Next.js parallel routes dengan error boundary mandiri dan container queries.
- `ui/empty-states`: Komponen presentasi visual seragam saat kondisi data kosong.
- `notifications/in-app-center`: Popover notifikasi header in-app dengan tab filter dan badge counter.

### Modified Capabilities
- `ui/command-palette`: Mengintegrasikan shortcut global 2-huruf dan action launcher terpadu.
- `ui/hierarchical-sidebar`: Mengalihkan definisi menu ke data terpusat `nav-config.ts`.

## Impact

- **Dependensi Baru**: `@tanstack/react-query`, `@tanstack/react-form`, `nuqs`, `kbar`, `@tabler/icons-react`, `react-dropzone`, `vaul`, `input-otp`.
- **Backend & Auth**: Tetap 100% menggunakan Supabase Auth & PostgreSQL RLS (Clerk ditolak total). Service layer menghubungkan React Query langsung ke Supabase client / Route Handlers.
- **Halaman Terdampak**: Seluruh halaman kerja admin (`/admin/clients`, `/admin/deliverables`, `/admin/crm`, `/admin/automations`, `/admin/dashboard`) dan client (`/client/*`).
