# Frhm — Digital Marketing Platform

> Product: **Frhm** (SaaS milik Bima Maulana Saputra)
> Client brands: Taraju (Pak Adit), Pawon Sengon (Bunda)

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, load the antislop skill for the task:
- Core filter, always on: `antislop`
- UI / visual: `antislop-ui`
- Copy & text: `antislop-copywriting`
- People: `antislop-human`
- Mobile / responsive: `antislop-layoutmobile`
- Code comments: `antislop-code`
Mode antislop diaplikasikan: **during the work** (selama pengerjaan berlangsung).
<!-- antislop:end -->

---

# STANDAR & ATURAN UTAMA PENGEMBANGAN FRHM (MUTLAK)
Semua pengembangan Frhm ke depan **WAJIB** tunduk pada arsitektur acuan `next-shadcn-dashboard-starter` dan aturan kedaulatan platform berikut:

### 1. Kedaulatan Auth & Backend (Aturan Khusus Frhm)
- **100% Supabase Auth & PostgreSQL RLS**: Dilarang menggunakan Clerk di Frhm. Seluruh session, autentikasi, otorisasi, dan multi-tenant isolation dikelola via Supabase Auth + PostgreSQL RLS policies.
- **Faktual Data**: Metriks, analitik, dan status harus dihitung dinamis dari database PostgreSQL (tanpa hardcoded mock data, tanpa nilai `NaN`).

### 2. Service Layer 3-Lapis per Fitur (`features/<feature>/api/`)
Setiap fitur baru atau refactor wajib mematuhi pemisahan 3 lapis:
1. `types.ts`: Kontrak TypeScript untuk response data, query filter, dan payload mutasi.
2. `service.ts`: Lapisan data access murni yang memanggil Supabase client atau API route. **Hanya file ini yang menyentuh backend**.
3. `queries.ts`: Query key factories (`entityKeys.all`, `entityKeys.list(filters)`, `entityKeys.detail(id)`) dan query options TanStack Query yang stabil.
*Komponen dilarang memanggil `fetch()` atau query database langsung secara ad-hoc.*

### 3. Data Fetching & Caching (TanStack React Query v5)
- **Server Prefetching**: Server Component memanggil `void queryClient.prefetchQuery(...)` (non-blocking) + `<HydrationBoundary state={dehydrate(queryClient)}>`.
- **Client Fetching**: Client Component menggunakan `useSuspenseQuery(...)` di dalam `<Suspense fallback={<Skeleton />}>`.
- **Dilarang** menggunakan `useQuery` biasa untuk query yang di-prefetch di server guna mencegah *loading flash*.
- **Mutasi Data**: Menggunakan `useMutation` dan melakukan cache invalidation otomatis melalui query key factories (`queryClient.invalidateQueries({ queryKey: entityKeys.all })`).

### 4. URL State Synchronization (`nuqs`) — MUTLAK
**Sumber resmi:** https://github.com/47ng/nuqs (paket `nuqs`, sudah terpasang v2.10.1).

- **WAJIB pakai `nuqs`** untuk setiap state yang tercermin di URL: pencarian, tab status, filter klien, date range, sorting, paginasi, dan ID seleksi pada tabel/board. Dilarang menyimpan state ini di `useState` lokal yang hilang saat refresh.
- **`NuqsAdapter` wajib terpasang** di root `app/layout.tsx` (`import { NuqsAdapter } from "nuqs/adapters/next/app"`). Jangan hapus atau ganti dengan router bawaan.
- **Server Component**: definisikan parser di `lib/searchparams.ts` (atau `features/<feature>/lib/searchparams.ts`) memakai `createSearchParamsCache` + `createSerializer` dari `nuqs/server`, lalu baca via `searchParamsCache.parse(searchParams)`. Parser server dan client **harus identik** agar cache key prefetch tidak terbuang.
- **Client Component**: gunakan `useQueryStates` dari `nuqs` dengan `shallow: true` agar update filter tidak memicu refetch server yang tidak perlu.
- **Dilarang** menulis URL search params manual (`new URLSearchParams`, `router.replace("?...")`) untuk kebutuhan ini. Seluruh URL state lewat `nuqs`.

### 5. Centralized Icon Registry (`@/components/icons`)
- **SEMUA ikon wajib diimpor hanya dari `@/components/icons`** (`import { Icons } from '@/components/icons'`).
- Dilarang keras mengimpor ikon langsung dari `@tabler/icons-react`, `lucide-react`, atau library ikon lainnya di dalam komponen fitur atau halaman.
- Ikon baru harus didaftarkan terlebih dahulu ke dalam objek `Icons` di `components/icons.tsx`.

### 6. Standardized Page Container & Header
- Seluruh halaman kerja admin (`/admin/*`) dan client (`/client/*`) **WAJIB** dibungkus oleh `<PageContainer>` dengan props baku:
  - `pageTitle`: Judul halaman
  - `pageDescription`: Ringkasan/deskripsi halaman
  - `pageHeaderAction`: Tombol aksi header di sisi kanan (Add, Export, Filter, dll.)
  - `infoContent`: Konten dokumentasi kontekstual infobar (jika relevan)
- Dilarang mengimpor atau merender elemen `<Heading>` atau `<h1>` ad-hoc secara manual di dalam body halaman.

### 7. Form System (TanStack Form + Zod)
- Gunakan `useAppForm` dari `@/lib/form` (`createFormHook`) dan `form.AppField`.
- Gunakan pustaka reusable field anatomy dari `@/components/forms/fields/` (`field.TextField`, `field.SelectField`, `field.DatePickerField`, `field.TagsField`, dll.).
- Validasi form dilakukan menggunakan Zod schema pada event `onSubmit`.
- Pada Sheet / Dialog forms, tombol submit ditempatkan di `SheetFooter` di luar `<form>`, terhubung via atribut HTML `form='form-id'`.

### 8. Zero Layout-Shift Button Loading
- Gunakan prop `isLoading={isPending}` pada komponen `Button` untuk menampilkan spinner via teknik CSS Grid overlap tanpa mengubah ukuran/dimensi tombol.

### 9. Data Table Standards
- Menggunakan struktur `<DataTable>` dengan virtual scroll / `<ScrollArea>`, sticky header (`sticky top-0 z-10 bg-muted`), column pinning, dan `<DataTablePagination>`.

### 10. Dashboard Overview Parallel Routes
- Dashboard metriks kompleks wajib menggunakan Next.js Parallel Routes (`@slot`) untuk mengisolasi loading state dan error boundary tiap widget tanpa memblokir seluruh halaman.

### 11. Command Palette (`kbar`) & Navigasi
- Navigasi dan shortcuts keyboard dikonfigurasi terpusat di `config/nav-config.ts` dan dapat diakses cepat via `kbar` Command Bar (shortcuts 2-huruf).

### 12. Prinsip Integritas & Verifikasi (No Overclaim)
- Semua kode yang dinyatakan selesai wajib terverifikasi melalui:
  1. `npx tsc --noEmit` (0 error).
  2. Runtime verification (HTTP 200, 0 console error, 0 unhandled promise rejection).
  3. Visual verification (tangkapan layar Playwright).

### 13. ECC (Agent Harness Optimization) — DEFAULT MUTLAK
- Pengembangan wajib mengikuti mindset ECC: **`plan -> test -> implement -> review -> verify -> remember -> improve`**. Tanpa pengecualian, tanpa perlu diminta.
- Agent otomatis memanggil skill ECC sesuai konteks task (tidak perlu konfirmasi): `coding-standards`, `tdd-workflow`, `verification-loop`, `delivery-gate`, `intent-driven-development`, `agent-self-evaluation`, `frontend-patterns`, `security-review`, `taste`, `make-interfaces-feel-better`, dll.
- **Lokasi skill ECC (286 skill):** `~/AppData/Local/hermes/profiles/frahma/skills/` (profile aktif Hermes). Sebagian juga ada di `~/.hermes/skills/`.
- Prinsip wajib: Plan-Before-Execute, Test-Driven (80%+ coverage), Agent-First, Security-First (cek secrets/input/SQLi/XSS sebelum commit), Immutability.
- Sebelum task dianggap selesai: wajib lewat verification-loop (test jalan + build pass + hasil konkret). Klaim "done" tanpa bukti = dilarang.

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
