# Tasks: Adopsi Penuh Arsitektur & Modul `next-shadcn-dashboard-starter`

## 1. Fondasi Tooling, Icon Registry & UI Primitives

- [x] 1.1 Pasang dependensi inti `@tanstack/react-query`, `@tanstack/react-form`, `nuqs`, `kbar`, `@tabler/icons-react`, `react-dropzone`, `vaul`, dan `input-otp` ke `app/package.json` lalu verifikasi instalasi paket berhasil
- [x] 1.2 Buat `app/components/icons.tsx` sebagai Centralized Icon Registry yang mengekspor objek `Icons` tunggal dan verifikasi import ikon internal
- [x] 1.3 Perbarui `app/components/ui/button.tsx` dengan teknik CSS Grid overlay untuk prop `isLoading` dan verifikasi dimensi tombol tidak bergeser saat loading
- [x] 1.4 Buat komponen `app/components/ui/empty.tsx` untuk visualisasi status data kosong terstandarisasi dan verifikasi tampilannya pada list kosong
- [x] 1.5 Buat komponen `app/components/ui/drawer.tsx` berbasis Vaul untuk interaksi bottom-sheet di perangkat layar sentuh/mobile

## 2. Navigasi Terpusat, Command Bar & Notification Center

- [x] 2.1 Buat `app/config/nav-config.ts` untuk memusatkan konfigurasi rute menu Admin dan Client, lalu hubungkan ke `app-sidebar.tsx`
- [x] 2.2 Integrasikan `kbar` Command Bar global dengan keyboard shortcut 2-huruf (misal: 'd d' untuk dashboard) dan verifikasi aktivasi shortcut
- [x] 2.3 Buat komponen `NotificationCenter` di header dengan popover tab All/Unread/Read yang membaca data aktivitas dari Supabase

## 3. Sistem Multi-Theme OKLCH & View Transition

- [x] 3.1 Tambahkan file preset tema OKLCH (Vercel, Supabase, Claude, Zen, dll.) ke `app/styles/themes/` dan pasang animasi gelombang `::view-transition-new(root)` di `globals.css`
- [x] 3.2 Pasang komponen dropdown `ThemeSelector` di header Admin dan Client, lalu verifikasi pergantian tema berjalan mulus tanpa reload

## 4. Data Layer: TanStack React Query & 3-Lapis Service

- [x] 4.1 Pasang `QueryProvider` global di root layout `app/app/layout.tsx` menggunakan singleton `queryClient`
- [x] 4.2 Bangun struktur 3-lapis service pada domain `deliverables`: `types.ts`, `service.ts` (penghubung Supabase), dan `queries.ts` (key factory `entityKeys`)
- [x] 4.3 Terapkan pola SSR prefetch `void queryClient.prefetchQuery()` dan `<HydrationBoundary>` pada halaman Deliverables dan verifikasi streaming data instan

## 5. Data Table Advanced Tooling Suite & URL State via `nuqs`

- [x] 5.1 Buat sub-komponen data table di `app/components/ui/table/`: `DataTableFacetedFilter`, `DataTableDateFilter`, `DataTableSliderFilter`, `DataTableViewOptions`, `DataTableColumnHeader`, dan `DataTableSkeleton`
- [x] 5.2 Implementasikan sinkronisasi URL search params via `nuqs` (`shallow: true`) pada `deliverable-data-table.tsx` untuk query pencarian, faceted filter, dan pagination
- [x] 5.3 Terapkan pola URL-synced table yang sama pada tabel Client di `/admin/clients` dan verifikasi filter tetap bertahan saat browser di-refresh

## 6. Form System, 15 Field Library & Stepper Wizard

- [x] 6.1 Pasang 15 reusable field components di `app/components/forms/fields/` (`text-field`, `select-field`, `tags-field`, `color-field`, `combobox-field`, `otp-field`, `date-picker-field`, `slider-field`, `switch-field`, dll.)
- [x] 6.2 Buat hook `useStepper` di `app/hooks/use-stepper.tsx` untuk pengelolaan alur formulir bertahap
- [x] 6.3 Refactor modal pembuatan Deliverable baru menggunakan `useAppForm` + skema validasi Zod dan verifikasi pesan error inline muncul saat input invalid

## 7. File Uploader Dropzone Suite

- [x] 7.1 Buat komponen `app/components/file-uploader.tsx` terintegrasi dengan `react-dropzone` dan bucket Supabase Storage
- [x] 7.2 Pasang visual progress bar individual dan preview card dengan aksi penghapusan berkas sebelum submit

## 8. Dashboard Parallel Routes & PageContainer Rollout

- [x] 8.1 Rekonstruksi dashboard analitik overview menggunakan Next.js Parallel Routes (`@area_stats`, `@bar_stats`, `@pie_stats`, `@sales`) dengan error boundary lokal dan container queries `@container/card`
- [x] 8.2 Refactor seluruh halaman kerja admin (`/admin/clients`, `/admin/crm`, `/admin/automations`, `/admin/production`) agar dibungkus `<PageContainer>` dengan header props baku
- [x] 8.3 Hubungkan prop `infoContent` pada `PageContainer` dengan `info-sidebar.tsx` untuk menyajikan petunjuk kontekstual di halaman kerja utama
- [x] 8.4 Jalankan audit kompilasi `npx tsc --noEmit` dan `npm run build` untuk memverifikasi seluruh modul dan rute terkompilasi bersih tanpa error
