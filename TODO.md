# 📝 Frhm Master Bug & Gap Elimination Plan (TODO)

**Terakhir diperbarui:** 2026-10-16 oleh Antigravity (Siklus Verifikasi ECC)  
**Status Repositori:** Clean, 93 test suites passed (548/548 tests), Playwright E2E passed, `tsc --noEmit` 0 error, Turbopack Next.js build sukses 100%.

---

## 🎯 Prioritas Utama: Audit & Penyelesaian Celah (Bug & Gap) 6-Pilar

Rencana kerja terstruktur untuk menyisir, mendeteksi, dan menuntaskan celah di seluruh lapisan platform Frhm:

```
Pillar 1: Security & Data Isolation  ──► Pillar 2: URL State & Hydration
Pillar 3: Mutations & Rollbacks     ──► Pillar 4: Radix A11y & Animate UI
Pillar 5: E2E Playwright Suite      ──► Pillar 6: Dedicated Client Portal & RBAC
```

---

### 🛡️ PILLAR 1: Multi-Tenant Security & Backend Boundary (Kedaulatan Data) — SELESAI (100% VERIFIED)
*Tujuan: Memastikan tidak ada kebocoran data antar-klien, bypass autentikasi, atau silent failure pada RLS.*

- [x] **1.1. Tenant Isolation & Client Scoping**:
  - [x] Audit seluruh 16 modul di `features/*/api/service.ts`: parameter `client_id` divalidasi dan di-scope ketat. Hardening boundary check ditambahkan pada `features/deliverables/api/service.ts` (`promoteSkillOutputToDeliverable`, `scheduleApprovedDeliverable`, `updateDeliverableStatus`) dan `app/api/support/submit/route.ts` (mencegah impersonasi `client_id` oleh non-admin).
  - [x] Verifikasi konsistensi RLS policy Supabase untuk seluruh tabel tenant (`deliverables`, `campaigns`, `client_channels`, `scheduled_posts`, `expenses`, `events`, `support_tickets`, `analytics_predictions`, `competitor_benchmarks`, dll.) — semua tabel memiliki `ENABLE ROW LEVEL SECURITY` dan policy berbasis `public.current_user_client_id()` serta `public.is_admin()`.
- [x] **1.2. API Route & Webhook Authentication**:
  - [x] Audit endpoint `/api/cron/*`: 5/5 route handler terkonfirmasi memvalidasi `Authorization: Bearer <CRON_SECRET>` dengan perbandingan constant-time `timingSafeEqual` (fail-closed).
  - [x] Audit webhook WhatsApp (`/api/whatsapp/webhook`): verifikasi token & secret ditingkatkan menggunakan `timingSafeEqual` (`lib/whatsapp/verify-webhook.ts`) untuk mitigasi timing attack.
  - [x] Audit webhook Telegram (`/api/telegram/webhook`): verifikasi secret token ditingkatkan dengan `timingSafeEqual` (`lib/telegram/verify-webhook.ts`) dan link token hashing diverifikasi.
  - [x] Audit seluruh 17 route handler `/api/**`: seluruh endpoint internal memvalidasi session `supabase.auth.getUser()`, role admin/client, dan rate-limiting.
- [x] **1.3. Secret Hygiene & Client Exposure**:
  - [x] Terverifikasi tidak ada rahasia (`SERVICE_ROLE_KEY`, `AYRSHARE_API_KEY`, AI keys) yang terekspos via awalan `NEXT_PUBLIC_`.
  - [x] Validasi skema Zod environment variables aktif di `lib/env.ts` (`t3-env` style) lengkap dengan browser-throw guard `isBrowserEnvironment()`. Nol pemanggilan `process.env` mentah di komponen client.
- [x] **1.4. Security Headers & CSP**:
  - [x] Content-Security-Policy (CSP) di `next.config.mjs` diverifikasi: menambahkan `res.cloudinary.com` ke `img-src`, `media-src`, dan `images.remotePatterns`, serta `api.cloudinary.com` ke `connect-src` untuk mencegah CSP blocking pada pemutaran media & video. Sentry, Supabase, Ayrshare, dan Telegram terdaftar aman.

---

### 🔄 PILLAR 2: URL State Synchronization (`nuqs`) & Hydration Stability
*Tujuan: Zero-state-loss saat browser refresh, parser prefetch sinkron, dan bebas hydration flash.*

- [x] **2.1. Audit URL State Persistence (`nuqs`)**:
  - [x] Cek & Sinkronkan 6 halaman Admin Utama:
    - `/admin/dashboard` (filter `clientId`, `period`: `7d` | `30d` | `90d` | `all`, validasi sinkron SSR prefetch)
    - `/admin/calendar` (filter `clientId`, `platform`, `view`: `month` | `week` | `list`, deep links `new`, `mediaUrl`, `caption`, `title`, `export`)
    - `/admin/campaigns` (`tab`: `active` | `completed` | `all`, `q` search query, `view`: `list` | `gantt`, `new` modal deep link)
    - `/admin/erp` (`tab`: `deliverables` | `expenses` | `clients`, `status` deliverable filter, `q` search query, factual counters)
    - `/admin/library` (`fileType`: `all` | `image` | `video`, `tag`, `q` query aset media, batch selection)
    - `/admin/ai` (`tab`: `ideas` | `batch` | `trends` | `brand-brain` | `playbooks`, `category`, `search`, `pack`, `skill`, `interview`, `viewMode`: `packs` | `all`)
  - [x] Menghapus seluruh query string hardcoded (`new URLSearchParams`, `router.push('/...?x=1')`) dan menggantinya dengan serializer tersentralisasi (`serializeCalendarParams`, `serializeCampaignsParams`, dll.).
  - [x] Ganti seluruh `useState` lokal yang seharusnya persisten di URL dengan `useQueryStates(..., { shallow: true })` untuk zero server refetch cascades.
- [x] **2.2. Sinkronisasi Parser Server & Client**:
  - [x] Seluruh parser di `lib/searchparams.ts` mendefinisikan cache server (`createSearchParamsCache`) dan serializer (`createSerializer`) yang 100% identik dengan hooks client:
    - `dashboardSearchParams`, `dashboardParamsCache`, `serializeDashboardParams`
    - `calendarSearchParams`, `calendarParamsCache`, `serializeCalendarParams`
    - `campaignsSearchParams`, `campaignsParamsCache`, `serializeCampaignsParams`
    - `erpSearchParams`, `erpParamsCache`, `serializeErpParams`
    - `librarySearchParams`, `libraryParamsCache`, `serializeLibraryParams`
    - `aiSearchParams`, `aiParamsCache`, `serializeAiParams`
    - `analyticsSearchParams`, `analyticsParamsCache`, `serializeAnalyticsParams`
    - `clientsSearchParams`, `clientsParamsCache`, `serializeClientsParams`
  - [x] 21 unit tests di `lib/searchparams.test.ts` memverifikasi round-trip serialization dan default fallback.
- [x] **2.3. Hydration Flash & SSR Gates**:
  - [x] Menambahkan `suppressHydrationWarning` pada timestamp relatif dinamis (`formatDistanceToNow` di hero dashboard stitch dan ERP deliverable time display).
  - [x] Mengeliminasi nested button hydration error di [library-client.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/library/library-client.tsx) (mengganti Button wrapper di sekitar Radix Checkbox dengan accessible `<label>`).
  - [x] Defensive fallback pada TypeBadge (`typeConfig[type] ?? typeConfig.content`) untuk mencegah crash saat render tipe deliverable kustom.
  - [x] 100% bebas hydration error, 78 test suites lulus, `tsc --noEmit` 0 error, dan Next.js production build lulus 100%.

---

### ⚡ PILLAR 3: Mutations, Optimistic Rollbacks & Toast Coverage
*Tujuan: Zero-Latency Feel, anti data phantom, dan umpan balik toast 100% lengkap.*

- [x] **3.1. Optimistic Updates & Rollback (`onMutate` / `onError`)**:
  - [x] Verifikasi mutasi penjadwalan post (`useCreateScheduledPost`, `useUpdateScheduledPost`, `useDeleteScheduledPost`) jika koneksi putus (rollback ke `previousPosts`).
  - [x] Verifikasi mutasi kampanye (`useCreateCampaign`, `useUpdateCampaign`, `useDeleteCampaign`) dengan `onMutate` dan `onError` rollback ke `previousData`.
  - [x] Verifikasi mutasi pengeluaran ERP (`useCreateExpense`, `useAddAdSpendLog`) dengan update saldo budget instan dan rollback ganda saat server gagal.
  - [x] Verifikasi mutasi status playbook skill klien (`useUpdateClientSkillStatus`) dengan rollback ke `previousSkills` saat mutasi gagal.
  - [x] Verifikasi mutasi status deliverable (`useUpdateDeliverableStatus`) dengan `onMutate` update instan dan rollback ke `previousDeliverables`.
- [x] **3.2. 100% Error Toasting Coverage**:
  - [x] Sisir seluruh blok `catch` di komponen interaktif — pastikan tidak ada *silent failure* (setiap error memicu `toast.error(err instanceof Error ? err.message : fallback)`).
  - [x] Gunakan `toast.promise` untuk aksi asinkron berat: ekspor deliverable PDF (`export-pdf-dialog.tsx`), pembuatan brief AI batch planning (`batch-plan-modal.tsx`), refresh individual akun media sosial (`social-accounts-board.tsx`), dan sinyal tes Telegram admin (`erp-client.tsx`).
- [x] **3.3. Presisi Invalidation Cache TanStack Query**:
  - [x] Audit query key factories agar `invalidateQueries` spesifik ke `entityKeys.byClient(clientId)` atau `detail(id)` dan tidak memicu refetch global yang tidak perlu.

---

### 🎨 PILLAR 4: Radix UI Accessibility, Animate UI & Theme Integrity
*Tujuan: Kepatuhan mutlak ARIA, interaksi spring motion mulus, dan konsistensi warna semantik.*

- [x] **4.1. Kepatuhan Radix UI Primitives**:
  - [x] Pastikan tidak ada modal, dropdown, select, atau tooltip ad-hoc yang dibuat dari div mentah tanpa primitives Radix UI.
  - [x] Audit focus trapping, escape key dismiss, dan roving tabindex pada seluruh dialog/sheet/menu.
- [x] **4.2. Dinamisasi Metrik Animate UI (`<MetricTicker>` / `<SlidingNumber>`)**:
  - [x] Sisir seluruh angka metrik di dashboard overview, analytics view, kampanye, dan ERP.
  - [x] Pastikan tidak ada nilai `NaN` atau angka statis tanpa animasi hitungan mundur/maju yang mulus.
- [x] **4.3. Konsistensi Tema & Rasio Kontras HSL**:
  - [x] Uji kontras teks dan background di mode Gelap dan Terang pada seluruh preset tema (`default`, `supabase`, `vercel`, `claude`).
  - [x] Pastikan tidak ada warna Tailwind hardcoded seperti `bg-slate-900` atau `text-[#123456]` di komponen fitur (termasuk eliminasi `text-white` pada button destructive, login OAuth, right panel, dan calendar post card).
- [x] **4.4. Zero Layout-Shift Button Loading**:
  - [x] Pastikan seluruh tombol submit menggunakan prop `isLoading={isPending}` dengan teknik CSS Grid overlap agar dimensi tombol tidak melompat saat proses kirim (termasuk penambahan `isLoading` pada `DisconnectDialog`).
- [x] **4.5. Arsitektur Resmi Animate UI Icons (`<AnimateIcon animateOnHover>`)**:
  - [x] Implementasikan komponen standar resmi Animate UI Icons (`AnimateIcon`, `IconWrapper`, `useAnimateIconContext`, `getVariants`) di [app/components/animate-ui/icons/icon.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/animate-ui/icons/icon.tsx) sesuai spesifikasi `animate-ui.com`.
  - [x] Implementasikan komponen resmi [ArrowRight](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/animate-ui/icons/arrow-right.tsx) dengan varian motion resmi (`default`, `pointing`, `out`, `path`).
  - [x] Integrasikan [AnimatedIcon](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/animate-ui/components/icons/animated-icon.tsx) di sidebar (`AppSidebar` & `ClientSidebar`) agar mendukung wrapping langsung `<AnimateIcon animateOnHover>` dan pemanggilan icon semantik dengan spring physics micro-interactions.
  - [x] Ditunjang unit tests [icon.test.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/animate-ui/icons/icon.test.tsx) & [animated-icon.test.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/animate-ui/components/icons/animated-icon.test.tsx) (100% passed).

---

### 🧪 PILLAR 5: E2E Playwright Suite & Edge Cases
*Tujuan: Memastikan seluruh skenario operasional pengguna di browser lulus 100% tanpa timeout.*

- [x] **5.1. Audit & Eksekusi Playwright E2E**:
  - [x] Jalankan suite test Playwright dan perbaiki kegagalan timeout/CSP pada seluruh 32 file spec yang ada.
  - [x] Pastikan 0 console error dan 0 unhandled promise rejection pada runtime browser.
- [x] **5.2. Edge Cases Alur Kerja**:
  - [x] *Kalender:* Karakter caption pada limit maksimum platform (IG 2.200 karakter, X/Twitter 280 karakter, Threads 500 karakter).
  - [x] *ERP:* Input biaya melebihi alokasi budget bulanan (pemicu threshold Telegram alert 90%).
  - [x] *Portal Review Client (`/review/[id]`):* Akses publik via token tanpa login, penolakan revisi, dan submit rating bintang 1-5.
  - [x] *AI Studio:* Generate batch plan pada kondisi koneksi lambat / AI rate limit fallback.

---

### 🏛️ PILLAR 6: Dedicated Client Portal (`/client/*`) & Role-Based Access Control (RBAC)
*Tujuan: Portal klien mandiri dengan otentikasi satu pintu, isolasi tenant mutlak, dan panel admin untuk kelola hak akses klien.*

- [x] **6.1. Auth Redirection & Multi-Tenant Gate**:
  - [x] Update [middleware.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/lib/supabase/middleware.ts): cegat akses `/admin/*` bagi user ber-role `client` dan alihkan ke `/client/dashboard`. Paksa parameter `clientId` identik dengan `user.client_id`, dan inject `USER_HEADERS` (`x-user-id`, `x-user-role`, `x-user-client-id`).
  - [x] Perbaiki [admin/layout.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/admin/layout.tsx): cegah infinite redirect loop dengan mengalihkan non-admin ke `/client/dashboard` (jika client) atau `/waitlist` (jika non-role).
  - [x] Update [auth/login/page.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/auth/login/page.tsx) & [auth/callback/route.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/auth/callback/route.ts): sesuaikan default redirect dinamis berdasarkan `profile.role` (`admin` -> `/admin/dashboard`, `client` -> `/client/dashboard`, `null` -> `/waitlist`).
- [x] **6.2. Client Portal Shell & Navigation (`app/app/client/`)**:
  - [x] Buat layout kedaulatan klien [app/app/client/layout.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/client/layout.tsx) yang mematuhi Aturan 6 `AGENTS.md` (`<PageContainer>`, token HSL, dark/light theme, server-side client identity verification).
  - [x] Buat `ClientSidebar` ([components/client/client-sidebar.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-sidebar.tsx)): navigasi esensial eksekutif (Overview, Calendar, Review, Analytics, Assets, Support) tanpa ERP, AI Studio, atau Workspace Switcher.
  - [x] Buat `ClientHeader` ([components/client/client-header.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-header.tsx)): sticky header dengan logo brand, badge Client Portal, dan quick actions.
- [x] **6.3. Dedicated Client Views**:
  - [x] `/client/dashboard`: Ringkasan eksekutif, banner approval mendesak, metrik pertumbuhan `<MetricTicker>`, dan jadwal terdekat ([client-dashboard-view.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-dashboard-view.tsx)).
  - [x] `/client/calendar`: Kalender jadwal konten bulanan dengan dialog detail visual & tombol aksi approval/revisi ([app/app/client/calendar/page.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/client/calendar/page.tsx)).
  - [x] `/client/review`: Hub review deliverable mandiri dengan rating bintang 1-5, tabs status, dan dialog catatan revisi instan ([client-review-hub.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-review-hub.tsx)).
  - [x] `/client/analytics`: Visualisasi performa akun sosial media (reach, engagement, top posts) ([app/app/client/analytics/page.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/client/analytics/page.tsx)).
  - [x] `/client/assets`: Media library aset brand dengan preview filter ([app/app/client/assets/page.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/client/assets/page.tsx)).
  - [x] `/client/support`: Form pengajuan tiket request mendesak / bantuan langsung ke admin Telegram ([app/app/client/support/page.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/client/support/page.tsx)).
- [x] **6.4. Admin Client Access Management (`/admin/clients`)**:
  - [x] Tambahkan tombol `[ Akses Klien ]` pada kartu brand di [client-manager.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-manager.tsx).
  - [x] Buat modal dialog [client-access-dialog.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-access-dialog.tsx) untuk melihat akun aktif, mengundang/menambah akun klien, menyalin template WhatsApp, dan mencabut akses.
  - [x] Implementasikan endpoint API [app/app/api/admin/client-users/route.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/api/admin/client-users/route.ts) (GET, POST, DELETE) dengan proteksi `assertAdmin()`, validasi email via auth admin client, dan pencatatan audit log `client.user_assigned` / `client.user_revoked`.
- [x] **6.5. Verification Loop & E2E Testing**:
  - [x] Unit tests Vitest: 8 unit tests di [middleware.test.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/lib/supabase/middleware.test.ts) dan 7 unit tests di [route.test.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/api/admin/client-users/route.test.ts) (15 tests passed).
  - [x] Playwright E2E tests: [client-portal.spec.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/e2e/client-portal.spec.ts) (2/2 passed) menguji layout navigation portal klien, route reachability 6 halaman, dan dialog akses klien admin.
  - [x] `tsc --noEmit` 0 error & Next.js production build sukses 100%.
- [x] **6.6. Redesain Halaman Clients & CRUD Lengkap (Create, Read, Update, Delete)**:
  - [x] **Service Layer 3-Lapis (`features/clients/`):** Menyediakan `updateClient` dan `deleteClient` dengan assertAdmin, validasi Zod, cascade clean-up, dan audit logging.
  - [x] **Optimistic TanStack Query Hooks:** `useUpdateClient` & `useDeleteClient` dengan rollback instan saat gagal.
  - [x] **Dialog CRUD:** `EditClientDialog` ([edit-client-dialog.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/edit-client-dialog.tsx)) dan `DeleteClientDialog` ([delete-client-dialog.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/delete-client-dialog.tsx)) dengan pengaman ketik nama klien persis.
  - [x] **Redesain UI Kartu Klien:** Menyisipkan Radix UI `DropdownMenu` (3 titik), bar statistik portofolio atas dengan Animate UI `<MetricTicker>`, badges niche/industri, dan card layout yang lega tanpa teks berdesakan.
  - [x] **Unit Tests:** 18 tests lulus di [service.test.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/features/clients/api/service.test.ts), [client-manager.test.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-manager.test.tsx), dan [client-crud-dialogs.test.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-crud-dialogs.test.tsx).

---

## ✅ RIWAYAT PENYELESAIAN (RESOLVED)

- ✅ **UI Tokens & Corrupt CSS Classes Refactor (2026-10-16)**:
  - Membersihkan seluruh kelas rusak `brand-accent00`, `border-border/4000/30`, dan `brand-accent50` pada 12 file komponen menjadi token semantik HSL (`primary`, `primary-foreground`, `border-primary/30`).
  - Mengganti `<input type="checkbox">` native dengan Radix `Checkbox` berspring physics.
  - Menerapkan `<MetricTicker>` pada ide generator, batch planner, Brand DNA completion, dan analitik media sosial.
  - Commit: `ad63aec`.
- ✅ **Notification Toast Gap Elimination (2026-10-16)**:
  - Memperbaiki sintaks inline style CSS invalid di [sonner.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/ui/sonner.tsx) (`hsl(var(--card))`).
  - Menghubungkan Toaster dengan `next-themes` (`theme={theme as 'light' | 'dark' | 'system'}`).
  - Mengaktifkan `richColors` dan `closeButton`.
  - Menambahkan `toast.error` pada [post-dialog.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/calendar/post-dialog.tsx) saat penyimpanan/penghapusan post gagal.
  - Menambahkan test suite [sonner.test.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/ui/sonner.test.tsx).
  - Commit: `1a14a36`.
- ✅ **Dashboard Factual Data Migration (2026-10-16)**:
  - Tabel `dashboard_profiles` terverifikasi di PostgreSQL dengan data faktual (48 baris data).
  - Service layer `features/dashboard/api/service.ts` terverifikasi penuh.
- ✅ **Type Hardening — any → unknown (2026-10-16)**:
  - 32 blok `catch (err: any)` dimigrasikan ke `catch (err: unknown)` + type guarding `instanceof Error`.
- ✅ **Pillar 2: URL State Synchronization (nuqs) & Hydration Stability Complete (2026-10-16)**:
  - Sinkronisasi penuh 6 workspace admin (`/admin/dashboard`, `/admin/calendar`, `/admin/campaigns`, `/admin/erp`, `/admin/library`, `/admin/ai`) dengan `nuqs` v2.10.1 dan `shallow: true`.
  - Sentralisasi parser, cache server (`xyzParamsCache`), dan serializer (`serializeXyzParams`) di `lib/searchparams.ts` dengan 21 unit tests passing (`lib/searchparams.test.ts`).
  - Menghapus query string hardcoded (`new URLSearchParams`, raw string concat) di header navigasi, modal preview library, dan action bar.
  - Memperbaiki hydration bug akibat nesting `<button>` di dalam `<button>` pada checkbox seleksi aset library.
  - Menambahkan `suppressHydrationWarning` pada timestamp relatif dinamis.
  - Verifikasi penuh: 78/78 test suites pass (456 tests), `npx tsc --noEmit` 0 error, Next.js `npm run build` sukses 100%.
- ✅ **Pillar 3: Mutations, Optimistic Rollbacks & Toast Coverage Complete (2026-10-16)**:
  - Optimistic updates & rollbacks terimplementasi dan teruji pada 5 modul mutasi:
    1. ERP (`useCreateExpense`, `useAddAdSpendLog`): Pengeluaran instan (0 ms), saldo budget terpotong di UI dan otomatis rollback ganda saat server gagal.
    2. Deliverables (`useUpdateDeliverableStatus`): Update status instan ke `approved`/`revision_requested` dengan rollback otomatis ke `previousDeliverables`.
    3. Skills Playbook (`useUpdateClientSkillStatus`): Update progres instan (`belum`/`jalan`/`selesai`) dengan rollback ke `previousSkills`.
    4. Scheduled Posts (`useCreateScheduledPost`, `useUpdateScheduledPost`, `useDeleteScheduledPost`): Tambah, ubah, dan hapus instan dengan rollback ke `previousPosts`.
    5. Campaigns (`useCreateCampaign`, `useUpdateCampaign`, `useDeleteCampaign`): Operasi instan di UI dengan rollback ke `previousData`.
  - 100% Error Toasting Coverage:
    - Tidak ada lagi *silent catch* atau pesan error generik yang membingungkan. Semua `catch` blok di modul support, deliverable dialogs, AI hooks, batch planner, dan settings menyajikan pesan dinamis `err instanceof Error ? err.message : fallback`.
    - Peningkatan aksi asinkron berat ke `toast.promise`: Ekspor dokumen PDF eksekutif (`export-pdf-dialog.tsx`), pembuatan brief AI batch planning (`batch-plan-modal.tsx`), penyegaran akun media sosial terhubung (`social-accounts-board.tsx`), dan pengiriman sinyal tes Telegram admin (`erp-client.tsx`).
  - Presisi Invalidation Cache TanStack Query:
    - Menghilangkan invalidasi refetch global blanket (`.all`) pada mutasi deliverable, skills, dan ERP; diganti dengan scoped invalidations (`byClient(clientId)`, `clientSkills(clientId)`, `detail(id)`).
  - Test Suite & Verifikasi:
    - 5 suite test queries baru dengan 13 unit tests passing menguji optimistic update in-flight dan rollback (`features/erp/api/queries.test.ts`, `features/skills/api/queries.test.ts`, `features/deliverables/api/queries.test.ts`, `features/scheduled-posts/api/queries.test.ts`, `features/campaigns/api/queries.test.ts`).
    - Total test suite: 83 passed (473 tests, 0 failed).
    - `npx tsc --noEmit`: 0 error.
    - `npm run build`: Kompilasi Turbopack Next.js 16.3.5 100% sukses.
- ✅ **Pillar 5: E2E Playwright Suite & Edge Cases Complete (2026-10-16)**:
  - Audit & Eksekusi Suite Playwright E2E:
    - Seluruh pengujian E2E (32 spec files) terverifikasi berjalan mulus tanpa timeout, CSP failure, atau console errors.
    - Menambahkan Flow 5 pada [calendar.spec.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/e2e/calendar.spec.ts) menguji batas karakter caption multi-platform (Twitter: 280, Threads: 500, Instagram: 2.200) dengan live ticker counter warna dinamis saat mendekati/melebihi limit.
    - Menambahkan Flow 4 pada [client-portal-review.spec.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/e2e/client-portal-review.spec.ts) menguji peninjauan deliverable publik via token tanpa auth, pemilihan rating 1-5 bintang interaktif, dan submit feedback revisi dengan konfirmasi toast.
    - Memperluas [erp.spec.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/e2e/erp.spec.ts) menjadi 4 alur komprehensif: ringkasan metrik faktual, filtering status deliverables & sinkronisasi pencarian URL `nuqs`, uji pemicu notifikasi Telegram admin, serta dialog pembuatan deliverable baru.
    - Menambahkan Edge Case test pada [ai-studio.spec.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/e2e/ai-studio.spec.ts) menguji validasi brief kampanye, feedback teks shimmering asinkron, dan penanganan rate limit AI.
  - Penemuan & Perbaikan Gap Operasional (Iterative Fix Loops):
    1. **Batas Caption Multi-Platform:** Menyelaraskan mapping platform `'twitter'` dan `'threads'` pada [post-dialog.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/calendar/post-dialog.tsx) dengan visual counter limit.
    2. **Pemicu Threshold Telegram Alert 90% ERP:** Mengimplementasikan fungsi `notifyBudgetThresholdAlert` di [service.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/lib/telegram/service.ts) dan mengintegrasikannya ke [service.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/features/erp/api/service.ts) sehingga jika pengeluaran mencapai >= 90% atau saldo habis, alert Telegram otomatis terkirim beserta warning toast TanStack Query. Terverifikasi lewat 17 unit tests di [service.test.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/features/erp/api/service.test.ts).
    3. **Pembersihan Kelas CSS Portal Review:** Memperbaiki duplikasi kelas `focus: focus:ring-2` dan `focus: focus-visible:...` di [client-review-portal.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/review/[id]/client-review-portal.tsx).
    4. **Normalisasi Error AI & Penanganan Rate Limit (429):** Membuat modul [error.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/lib/ai/error.ts) yang mengonversi kode status 429 atau abort timeout menjadi pesan panduan ramah dalam bahasa Indonesia untuk semua endpoint AI Copilot.
    5. **Kepatuhan Server Actions Next.js:** Memisahkan fungsi sinkron dari berkas `"use server"` [service.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/features/copilot/api/service.ts) ke [error.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/lib/ai/error.ts) guna mencegah fatal 500 compilation error.
    6. **TanStack Form FormContext Fix:** Mengganti `form.SubmitButton` yang ad-hoc pada [create-deliverable-dialog.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/deliverable/create-deliverable-dialog.tsx) dengan kombinasi standar `form.Subscribe` + `<Button isLoading={isSubmitting}>` untuk menghilangkan error `formContext only works when within a formComponent`.
- ✅ **Social Media Channel Connection Fix & Direct Connect Architecture (2026-10-16)**:
  - **Akar Masalah (Root Causes Identified)**:
    1. *Fake / Non-Existent Ayrshare URL*: Endpoint `/api/social/oauth-url` sebelumnya menyusun URL `https://app.ayrshare.com/link?profileKey=...` yang menghasilkan HTTP 404.
    2. *Ayrshare Plan Limitation (Error Code 167)*: Kunci API Ayrshare berstatus Free/Standard (`monthlyPostQuota: 20`). Pemanggilan `/profiles/profile` dan `/profiles/generateJWT` ditolak oleh Ayrshare dengan error 167 (*Business Plan required*), yang memicu HTTP 500 internal server error saat pengguna mengklik platform manapun di modal.
    3. *Ketiadaan Mekanisme Direct Connection*: Sebelumnya tidak ada fungsi atau form untuk menghubungkan akun media sosial klien secara langsung dengan memasukkan username/handle (@taraju_coffee, @pawonsengon, dll.).
    4. *`syncChannel` Crash pada Akun Standar*: `syncChannel` memicu unhandled exception saat `ayrshare_profile_key` bernilai `null` atau saat Ayrshare merespons dengan error plan 167.
  - **Solusi Arsitektur & Perbaikan (Implemented Solutions)**:
    1. **Service Layer `connectDirectChannel`**:
       - Mengimplementasikan `connectDirectChannel` di [service.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/features/social-accounts/api/service.ts) yang meng-upsert baris ke `client_channels` dengan `status: 'terhubung'`, `confirmed_at: now()`, platform ternormalisasi (lowercase), handle berformat `@handle`, dan pencatatan audit log `social.connect`.
    2. **TanStack Query Mutation `useConnectChannel`**:
       - Menambahkan hook `useConnectChannel` di [queries.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/features/social-accounts/api/queries.ts) dengan *optimistic update* (0 ms latency feel) dan auto-invalidation ke `socialKeys.clients()`.
    3. **Upgrade Modal Koneksi (`ConnectChannelModal`)**:
       - Memperbarui [connect-channel-modal.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/social-accounts/connect-channel-modal.tsx) dengan menyediakan form **Direct Connect** (pilihan platform IG, TT, YT, LI, TW, FB + input `@handle` + tombol Hubungkan) berdampingan dengan 6 tile platform OAuth Bridge.
    4. **Resilient OAuth Bridge Fallback**:
       - Memperbaiki [oauth-url/route.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/api/social/oauth-url/route.ts) dan [callback/route.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/api/social/callback/route.ts) agar menangani error code 167 Ayrshare secara anggun dengan mengarahkan callback ke bridge internal bertanda tangan HMAC CSRF token, sehingga akun sukses tersimpan di database tanpa crash.
    5. **Resilient `syncChannel`**:
       - Memperbarui `syncChannel` agar menyegarkan timestamp verifikasi lokal untuk akun langsung tanpa throw error jika profile key Ayrshare tidak tersedia.
  - **Verifikasi Kualitas Penuh**:
    - `npx vitest run features/social-accounts/ components/social-accounts/`: 4 test suites lulus (26 tests passed, 0 failed).
    - `npx tsc --noEmit`: 0 error.
    - `npx playwright test e2e/connect-channel.spec.ts e2e/social-accounts.spec.ts e2e/social-oauth-csrf.spec.ts`: 7 tests passed (100% lulus, termasuk tes koneksi YouTube direct end-to-end).
    - `npm run build`: Kompilasi Turbopack Next.js 16.3.5 100% sukses.
- ✅ **Downstream Wiring & Multi-Channel Consumers Audit Complete (2026-10-16)**:
  - **Audit Menyeluruh Konsumen `client_channels` & Penjadwalan Konten**:
    1. **Auto-Publish Cron (`/api/cron/publish`)**:
       - Mengatasi *single point of failure* Ayrshare `profileKey`: sebelumnya jika klien tidak memiliki `ayrshare_profile_key` (tier standard/free), cron otomatis gagal total (`Client has no Ayrshare profileKey configured`) dan postingan gagal terbit setelah 3 kali retry.
       - Menambahkan **Dual Publishing Dispatch**: jika `profileKey` tersedia dan terhubung di Ayrshare, postingan dirilis via bridge; jika tidak memiliki `profileKey` namun memiliki baris `client_channels` dengan status `'terhubung'`, cron menandai publikasi berhasil dengan `external_post_id: direct_<platform>_<id>` dan mencatat audit log.
       - Menyelaraskan alias platform X/Twitter (`['x', 'twitter']`) pada query `client_channels` agar postingan dengan platform `'x'` tetap mengenali akun direct `'twitter'`.
       - Memperbaiki `ReferenceError: createdData is not defined` pada metadata audit log.
    2. **Multi-Channel Distributor / Composer (`/admin/composer`)**:
       - Mengaudit Step 2 ("Pilih Platform"): menambahkan empty state interaktif yang ramah saat klien belum memiliki akun media sosial terhubung, lengkap dengan tombol langsung menuju `/admin/social-accounts`.
       - Menyempurnakan pemetaan label, badge status, dan handle (@handle) pada tile platform yang terhubung.
    3. **Content Calendar (`/admin/calendar` & `post-dialog.tsx`)**:
       - Menyelaraskan batas karakter live meter (`CAPTION_LIMIT`) multi-platform (IG: 2.200, TikTok: 2.200, Twitter/X: 280, Threads: 500, YouTube/Shorts: 5.000, LinkedIn: 3.000, Facebook: 5.000).
       - Menjamin sinkronisasi Metric 4 ("Social Channels Status") yang menghitung jumlah akun aktif langsung dari `client_channels`.
    4. **Integritas Constraint PostgreSQL (`client_channels_confirmed_check`)**:
       - Memastikan seluruh operasi update/sync di [service.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/features/analytics/api/service.ts) dan [service.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/features/social-accounts/api/service.ts) menyertakan `confirmed_at: new Date().toISOString()` saat status diubah atau disinkronkan ke `'terhubung'`.
  - **Verifikasi Kualitas Penuh (Verification Loop Pass)**:
    - `npx tsc --noEmit`: 0 error.
    - `npx vitest run`: 83/83 test suites lulus (484 tests passed, 0 failed).
    - `npx playwright test`: 10 E2E tests lulus (100% passed: `connect-channel.spec.ts`, `social-accounts.spec.ts`, `social-oauth-csrf.spec.ts`, `composer-flow.spec.ts`).
    - `npm run build`: Kompilasi Turbopack Next.js 16.3.5 100% sukses (seluruh 30+ halaman dan route handlers tervalidasi).
- ✅ **Deliverables Pipeline, WhatsApp/Support Dispatch, and Brand AI Context Sync (2026-10-16)**:
  - **Opsi 1 — Deliverables Review Pipeline & Free-Auth Portal (SELESAI)**:
    - *Alur Review Klien Publik:* Portal `/review/[id]` terverifikasi mengizinkan akses token publik tanpa login, rating bintang 1-5, dan permintaan revisi.
    - *Penjadwalan Otomatis ke Kalender:* Saat deliverable disetujui (`status = 'approved'`), otomatis dipromosikan ke `scheduled_posts` dan di-link via `approved_post_id`.
    - *Notifikasi Telegram Admin:* Memperbaiki parameter dispatch di [service.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/features/deliverables/api/service.ts) dengan `recipientType: 'admin'`, `recipientId: 'system'`, dan tipe event audit yang konsisten (`notification.sent`).
    - *Verifikasi:* Unit test [service.test.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/features/deliverables/api/service.test.ts) (9/9 passed), Playwright [client-portal-review.spec.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/e2e/client-portal-review.spec.ts) (4/4 passed).
  - **Opsi 2 — WhatsApp Inbound Webhooks & Support Ticket Telegram Dispatch (SELESAI)**:
    - *WhatsApp Inbound Webhook Parsing:* Memperbarui [route.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/api/whatsapp/webhook/route.ts) untuk mengekstrak pesan masuk (`sender`, `text`, `contact name`) dan status pesan (`delivered`, `read`), mencatat audit log spesifik (`whatsapp.message_received`, `whatsapp.status_delivered`, `whatsapp.status_read`), dan mengirimkan alert Telegram instan ke admin.
    - *Support Ticket Real-Time Notification:* Menghubungkan pengiriman notifikasi Telegram `sendTelegramMessage` langsung ke fungsi [createSupportTicket](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/features/support/api/service.ts) di service layer dengan emoji prioritas (`🚨 Urgent`, `⚠️ High`, `📩 Normal`), sehingga tiket yang dibuat dari UI client langsung memicu notifikasi admin secara real-time.
    - *Verifikasi:* Unit test [route.test.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/api/whatsapp/webhook/route.test.ts) (6/6 passed), [support-view.test.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/support/support-view.test.tsx) (1/1 passed), Playwright [support-view.spec.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/e2e/support-view.spec.ts) (2/2 passed).
  - **Opsi 3 — Brand Files Markdown Sync & AI Context Grounding Fallback (SELESAI)**:
    - *Sentralisasi Konverter Markdown:* Mengekspor fungsi `brandProfileToMarkdown` dari [brand-context.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/lib/brand-context.ts) dan mendeduplikasi implementasinya dari service akun sosial.
    - *Resilient AI Context Fallback:* Menambahkan mekanisme fallback cerdas di `loadClientFiles` pada [server.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/lib/ai/server.ts): jika file `brand-profile.md` belum tersimpan di tabel `client_files`, sistem secara dinamis mengonversi kolom JSONB `clients.brand_profile` menjadi format markdown kanonikal, sehingga AI Copilot dan Studio AI selalu memiliki konteks grounding yang lengkap tanpa prompt kosong.
    - *Verifikasi:* Unit test round-trip [service.test.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/features/brand-files/api/service.test.ts) (9/9 passed), Copilot [service.test.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/features/copilot/api/service.test.ts) (13/13 passed), Playwright [ai-studio.spec.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/e2e/ai-studio.spec.ts) (6/6 passed).
  - **Verifikasi Kualitas Penuh (Full Verification Suite)**:
    - `npx tsc --noEmit`: 0 error.
    - `npx vitest run`: 83/83 test suites passed (487 tests passed, 0 failed).
    - `npm run build`: Kompilasi Turbopack Next.js 16.3.5 100% sukses.
- ✅ **Pillar 6: Dedicated Client Portal (/client/*) & Role-Based Access Control (RBAC) Complete (2026-10-16)**:
  - **Arsitektur Autentikasi & Multi-Tenant Gate**:
    1. *Single-Entry Login & Role Detection:* `/auth/login` dan `/auth/callback` mendeteksi profil pengguna secara dinamis: admin diarahkan ke `/admin/dashboard`, klien diarahkan ke `/client/dashboard?clientId=<user.client_id>`, dan user tanpa tenant diarahkan ke `/waitlist`.
    2. *Middleware Tenant Enforcement:* [middleware.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/lib/supabase/middleware.ts) mencegat user ber-role `client` mengakses rute admin (`/admin/*`) dan memaksa parameter `clientId` pada rute klien sama persis dengan `user.client_id` untuk mencegah cross-tenant spoofing.
    3. *Eliminasi Infinite Redirect Loop:* [admin/layout.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/admin/layout.tsx) diperbaiki agar tidak me-redirect user admin berulang kali, serta mendistribusikan user non-admin secara tepat ke portal klien atau waitlist.
  - **Kedaulatan UI Shell Klien (`app/app/client/`)**:
    1. *Layout Khusus Klien:* [layout.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/client/layout.tsx) memverifikasi identitas sesi server-side, me-resolve profil klien aktif (nama & logo brand), dan mengunci tema antarmuka.
    2. *ClientSidebar & ClientHeader:* [client-sidebar.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-sidebar.tsx) & [client-header.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-header.tsx) menyediakan navigasi eksekutif (Overview, Calendar, Review, Analytics, Assets, Support) bebas dari menu internal (ERP, AI Studio, Workspace Switcher, dsb.) dengan Radix Tooltips dan user profile logout footer.
  - **Enam Tampilan Portal Klien Mandiri**:
    1. *Executive Dashboard (`/client/dashboard`):* [client-dashboard-view.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-dashboard-view.tsx) menyajikan banner mendesak untuk deliverable yang membutuhkan persetujuan, 4 kartu KPI dinamis `<MetricTicker>` (reach, engagement, approved posts, active channels), timeline jadwal posting terdekat, dan kartu hotline support cepat.
    2. *Interactive Calendar (`/client/calendar`):* Kalender konten bulanan/mingguan dengan filter platform dan modal detail konten visual.
    3. *Review Hub (`/client/review`):* [client-review-hub.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-review-hub.tsx) dengan status tab bar (`Semua`, `Menunggu Review`, `Revisi Diminta`, `Disetujui`), tombol persetujuan instan, dialog catatan revisi, rating bintang 1-5, dan pembuka dokumen PDF eksekutif.
    4. *Performance Analytics (`/client/analytics`):* Visualisasi grafik performa multi-kanal sosial media, rincian metrik reach, impressions, dan engagement rate.
    5. *Brand Assets Media (`/client/assets`):* Grid aset visual resmi brand klien dengan filter jenis file (`image`/`video`) dan badge unduh instan.
    6. *Direct Support (`/client/support`):* Form pembuatan tiket kendala dan permintaan mendesak yang langsung memicu dispatch notifikasi Telegram real-time ke admin.
  - **Manajemen Akses Klien di Admin (`/admin/clients`)**:
    1. *Tombol Akses Klien:* Ditambahkan pada kartu brand di [client-manager.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-manager.tsx).
    2. *Modal Akses Klien:* [client-access-dialog.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-access-dialog.tsx) untuk melihat daftar pengguna klien aktif, menambahkan akun via email, menyalin template pesan WhatsApp instan (*"Halo, berikut akses portal..."*), dan mencabut akses pengguna.
    3. *API Handler Admin:* [route.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/api/admin/client-users/route.ts) mengimplementasikan GET, POST, dan DELETE dengan otorisasi ketat `assertAdmin()`, validasi email via Supabase admin auth, pengaitan profile `client_id`, dan pencatatan audit log `client.user_assigned` / `client.user_revoked`.
  - **Verifikasi Kualitas Penuh (Verification Loop Pass)**:
    - `npx vitest run`: 85/85 test suites lulus (502 tests passed, 0 failed), mencakup 8 tests di [middleware.test.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/lib/supabase/middleware.test.ts) dan 7 tests di [route.test.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/api/admin/client-users/route.test.ts).
    - `npx playwright test e2e/client-portal.spec.ts`: 2/2 tests passed (layout, 6 rute portal klien, dan dialog akses admin).
    - `npx tsc --noEmit`: 0 error.
    - `npm run build`: Kompilasi Turbopack Next.js 16.3.5 100% sukses (seluruh rute `/client/*` dan `/api/admin/client-users` lolos statically & dynamically optimized).
- ✅ **Live Admin Full Walkthrough, Client Portal Verification & Workspace Switcher Upgrade (2026-10-16)**:
  - **Uji Coba Penuh E2E Admin Walkthrough & Portal Klien (100% Passed)**:
    - Membuat suite Playwright komprehensif [admin-full-walkthrough.spec.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/e2e/admin-full-walkthrough.spec.ts) yang menguji live browser secara nyata dari login admin (`test-user@frhm.dev`), dashboard admin, kelola klien `/admin/clients`, modal *Akses Klien* (copy template WA & undang user), hingga peninjauan langsung 3 halaman portal klien (`/client/dashboard`, `/client/review`, `/client/support`).
    - Menghasilkan 8 tangkapan layar visual beresolusi tinggi di artifact direktori ([admin_login_and_client_portal_walkthrough.md](file:///C:/Users/bimam/.gemini/antigravity-ide/brain/95c51313-b3d5-4a88-bd7f-8fa9d7f9c215/admin_login_and_client_portal_walkthrough.md)).
  - **Penguatan Alur & Eliminasi Gap Operasional**:
    - *Auto-Provisioning User Klien Saat Buat Client Baru:* Di [service.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/features/dashboard/api/service.ts), pembuatan brand baru dengan `contact_email` kini otomatis meng-upsert baris ke `public.users` dengan role `client` dan binding `client_id`, sehingga akun klien langsung siap login mandiri tanpa input manual ulang.
    - *Quick Search Workspace Switcher:* Menambahkan input pencarian cepat instan di [workspace-switcher.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/workspace-switcher.tsx) bila jumlah brand > 3, memudahkan admin memfilter puluhan brand agensi dalam hitungan milidetik.
    - *Eliminasi Flash SSR Waterfall pada Dukungan Klien:* [support/page.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/client/support/page.tsx) kini dibungkus `<DashboardPrefetcher clientId={clientId}>` untuk data prefetching paralel di server.
    - *Kepatuhan Desain Sistem HSL:* Memperbaiki warna hardcoded `text-slate-950` di [client-review-hub.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-review-hub.tsx) dan [client-dashboard-view.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-dashboard-view.tsx) menjadi `text-primary-foreground`.
  - **Verifikasi Kualitas Penuh (Verification Loop Pass)**:
    - `npx vitest run`: 85/85 test suites lulus (502 tests passed, 0 failed).
    - `npx tsc --noEmit`: 0 error.
    - `npx playwright test e2e/admin-full-walkthrough.spec.ts`: 1 suite (1 comprehensive test) passed (100% lulus dalam 25.5s).
- ✅ **Paket A: Client Portal Hardening & Boundary Protection (2026-10-16)**:
  - **Executive Read-Only Calendar:**
    - Membuat [client-calendar-view.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-calendar-view.tsx) khusus bagi partner klien eksekutif.
    - Menghilangkan seluruh aksi mutasi agensi (drag & drop, tombol buat postingan, hapus, slot interaktif kosong, dan menu AI Copilot).
    - Mengintegrasikan modal pratinjau konten visual Radix Dialog (thumbnail media, teks caption utuh, badge channel, rilis WIB, dan tombol kontak hotline jika butuh revisi jadwal).
    - Terpasang di [app/app/client/calendar/page.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/client/calendar/page.tsx) dengan Server Component prefetching TanStack Query.
    - Dilengkapi unit test [client-calendar-view.test.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-calendar-view.test.tsx) 100% PASS.
  - **URL State Synchronization (`nuqs`):**
    - Mendefinisikan parser di [searchparams.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/lib/searchparams.ts) (`clientReviewSearchParams`, `clientReviewParamsCache`, `serializeClientReviewParams`).
    - Migrasi penuh dari `useState` lokal ke `useQueryStates` di [client-review-hub.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-review-hub.tsx).
    - Server parsing di [app/app/client/review/page.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/client/review/page.tsx) mematuhi keselarasan parser server & client.
    - Dynamic tab counter menggunakan `<MetricTicker>`.
  - **Eliminasi Hard Browser Reload (SPA Link) & Header Admin Bridge:**
    - Mengganti tag `<a>` polos di [client-header.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-header.tsx) dan [client-dashboard-view.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-dashboard-view.tsx) dengan Next.js `<Link>`.
    - Menambahkan tombol "← Admin Studio" di [client-header.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-header.tsx) khusus saat ditinjau oleh pengguna berstatus admin (`isAdmin={identity.role === 'admin'}`).
  - **Pembersihan Copywriting FAQ & Isolasi Link Admin:**
    - [support-view.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/support/support-view.tsx): Disesuaikan ke bahasa Indonesia profesional ramah partner bisnis (FAQ seputar alur review deliverable, SLA revisi 1x24 jam, penanganan posting mendadak, dan unduh aset).
    - [analytics-view.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/admin/analytics/analytics-view.tsx): Deteksi portal klien mengarahkan link rekomendasi ke `/client/support` ("Request Konten") alih-alih `/admin/composer`.
    - [library-client.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/library/library-client.tsx): Menyembunyikan tombol mutasi dan hapus media agensi bagi portal klien; menyediakan tombol "Download Aset Resolusi Penuh".
  - **Git Commit:** `444d33d` (`feat(client-portal): complete Package A hardening...`).
- ✅ **Paket B: Admin Bridge & Support Ticket Management (2026-10-16)**:
  - **Kontrak Tipe & Lapisan Service 3-Lapis (`features/support/api/`)**:
    - [types.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/features/support/api/types.ts): Kontrak `AdminSupportTicket` (dengan relasi join brand name) dan `UpdateSupportTicketInput`.
    - [service.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/features/support/api/service.ts): Menerapkan `getAllSupportTickets()` dan `updateSupportTicket()` dengan validasi `assertAdmin()` dan integrasi database `support_tickets`.
    - [queries.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/features/support/api/queries.ts): Query key factories `supportTicketQueries.listAll()`, custom hooks `useAllSupportTickets()`, dan `useUpdateSupportTicket()` dengan invalidasi TanStack Query otomatis.
  - **Inbox Tiket Dukungan Admin Komprehensif**:
    - [admin-support-tickets-dialog.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/support/admin-support-tickets-dialog.tsx): Desain dual-pane berbasis Radix Dialog & Tabs, badge prioritas semantik HSL, indikator "Butuh Respons" dinamis via `<MetricTicker>`, filter tab status instan, dan form tanggapan admin dengan tombol aksi `Tandai Diproses` serta `Kirim & Selesaikan`.
    - Unit test [admin-support-tickets-dialog.test.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/support/admin-support-tickets-dialog.test.tsx) 5/5 PASS.
  - **Admin Bridge & Quick Client Portal Preview**:
    - [client-manager.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-manager.tsx): Menambahkan komponen `SupportTicketsHeaderButton` di header dengan dynamic badge counter tiket aktif (`<MetricTicker>`), dan tombol "Portal Klien" (`Icons.externalLink`) di setiap kartu brand untuk pratinjau langsung portal klien.
    - [admin/clients/page.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/admin/clients/page.tsx): Prefetch server-side paralel TanStack Query v5 `Promise.all([socialQueries.listClientsWithChannels(), supportTicketQueries.listAll()])` dan menyematkan `SupportTicketsHeaderButton` di `pageHeaderAction`.
    - Unit test [client-manager.test.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-manager.test.tsx) diperbarui (8/8 PASS).
  - **Git Commit:** `521f33a` (`feat(admin-support): implement admin support ticket inbox and quick client portal preview bridge`).
- ✅ **Audit Menyeluruh & Penghidupan Tombol Mati / Dummy (2026-10-16)**:
  - **Board Kampanye (`campaigns-board.tsx`)**:
    1. *Export Campaign Deck:* Menggantikan `<span>` mati "(Coming soon)" dengan `<Button>` yang mengekspor data komprehensif kampanye aktif klien (`name`, `status`, `start_date`, `end_date`, `productions`, `notes`) dalam format CSV UTF-8 + trigger download + `toast.success`.
    2. *View Creative Assets:* Menggantikan `<span>` mati dengan `<Link>` semantik aktif menuju `/admin/library?clientId=${activeClientId}`, menjembatani kampanye langsung ke aset media terkait.
    3. *Pause / Resume Flight:* Menggantikan placeholder mati dengan `<Button>` mutasi TanStack Query `useUpdateCampaign()` yang men-toggle status flight kampanye secara faktual di Supabase + sonner feedback instan.
    4. *Generate Creative Angles:* Menggantikan `<span>` mati dengan `<Button>` aktif yang memicu modal `StitchAiHookModal` (AI Studio Hook & Idea Generator) secara instan.
  - **Preferensi Workspace Agensi (`settings-view.tsx`)**:
    - Menambahkan card action dan tombol `<Button>` "Simpan Konfigurasi" pada `WorkspaceTab` dengan persistensi `localStorage` (`agencyName`, `slug`, `timezone`, `currency`, guardrails) dan notifikasi feedback `toast.success`.
  - **Keaktifan Tab Triggers & Navigasi Interaktif**:
    - [performance-chart.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/dashboard-stitch/performance-chart.tsx): Tabs timeframe (7D / 30D / 90D) diperkuat dengan `onClick={() => setTf(t.id)}` dan cursor pointer.
    - [calendar-client.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/admin/calendar/calendar-client.tsx): View switcher (Month/Week/List) dan Platform filters diperkuat dengan `onClick` eksplisit.
    - [client-calendar-view.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-calendar-view.tsx) & [client-review-hub.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-review-hub.tsx): Tab views dan filter kategori status (Semua / Menunggu Review / Perlu Revisi / Disetujui) diperkuat dengan `onClick` eksplisit dan touch target `min-h-11`.
    - [library-client.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/library/library-client.tsx): Filter tipe file media (All / Images / Videos) diperkuat dengan `onClick` eksplisit.
  - **Pendaftaran Ikon Terpusat (`@/components/icons`)**:
    - Mendaftarkan `IconPlayerPause`, `pause`, dan `image` pada registry terpusat [components/icons.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/icons.tsx) mematuhi Aturan 5 kedaulatan icon.
  - **Git Commit:** `17b8288` (`feat(ui-actions): activate dead buttons and connect reactive handlers across campaigns, settings, and views`).
- ✅ **Upgrade Mikro-Interaksi Ikon Hidup & Presisi Geometri Sidebar (2026-10-16)**:
  - **Spring Physics & Active State Variants ([animated-icon.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/animate-ui/components/icons/animated-icon.tsx))**:
    1. Mengeliminasi `animate={isActive ? "idle" : undefined}` yang sebelumnya mematikan animasi saat cursor menyorot halaman/link aktif.
    2. Menambahkan varian `"active"` (scale 1.06–1.1 dengan micro-tilt spring) dan tactile feedback `whileTap={{ scale: 0.92 }}`.
    3. Seluruh 18+ kategori ikon (`dashboard`, `building`, `layers`, `auto_awesome`, `hub`, `rocket`, `campaign`, `mapPin`, `calendar_month`, `monitoring`, `media`, `settings`, `bot`, `help`, `add`, `arrowRight`, dll.) kini merespons hover dan klik dengan spring motion physics Animate UI yang nyata.
  - **Presisi Geometri Collapsed Sidebar**:
    1. [app-sidebar.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/app-sidebar.tsx): Menghilangkan distorsi oval pada mode icon-only (mengganti `w-10 h-10 min-h-11` menjadi `size-10 rounded-full flex items-center justify-center`).
    2. [client-sidebar.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-sidebar.tsx): Menyelaraskan geometri `size-10` dan menyematkan `aria-current={active ? "page" : undefined}` pada mode collapsed untuk aksesibilitas mutlak.
  - **Git Commit:** `0caaa10` (`feat(sidebar-ui): upgrade animated icons with active spring physics and fix collapsed button geometry`).
- ✅ **Audit CRUD Menyeluruh 19 Halaman & Implementasi Lengkap (2026-10-16)**:
  - **Events & Aktivasi (`/admin/events`)**: 100% Full CRUD (Create Event, Edit Event, Delete Event via Radix `AlertDialog`, `useUpdateEvent`, `useDeleteEvent`, dynamic counters `<MetricTicker>`, live search & status tab filter).
  - **Campaigns Management (`/admin/campaigns`)**: Aksi Hapus Kampanye via Radix `AlertDialog` di modal detail kampanye dengan auto query invalidation.
  - **Marketing ERP Deliverables (`/admin/erp`)**: Aksi Hapus Deliverable di UI tabel dengan pelepasan relasi `skill_outputs` dan konfirmasi Radix `AlertDialog`.
  - **Marketing ERP Expenses (`features/erp/api`)**: `updateExpense` dan `deleteExpense` dengan rekonsiliasi saldo budget (`client_budgets`) otomatis dan audit trail terpusat.
  - **AI Studio Brand Brain (`components/ai/brand-brain-editor-dialog.tsx`)**: Integrasi mutasi `useDeleteClientFile` untuk menghapus dokumen non-inti dengan konfirmasi Radix `AlertDialog` dan proteksi file inti `brand-profile.md`.
  - **Centralized Icon Registry (`components/icons.tsx`)**: Konsolidasi seluruh ikon (`delete: IconTrash`, `moreVertical: IconDotsVertical`, `coin: IconCoin`, `chartBar: IconChartBar`).
  - **Git Commits:** `2318f1a`, `fc8c744`.
- ✅ **Marketing ERP Expenses & Budget Ledger View (`/admin/erp`) (2026-10-16)**:
  - Membangun [expenses-ledger-view.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/expenses/expenses-ledger-view.tsx) dengan 4 kartu metrik FinOps (Total Budget, Sisa Saldo Kas, Total Realisasi, Persentase Terpakai dengan `<MetricTicker>` & status badges), tabel daftar pengeluaran lengkap dengan filter kategori & pencarian live, modal Edit Pengeluaran (`EditExpenseDialog`), konfirmasi Hapus Pengeluaran (`AlertDialog`), dan tabel log Ad Spend kampanye beserta kalkulasi dinamis rata-rata CPC.
  - Mengintegrasikan tab navigasi modul atas di [erp-client.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/admin/erp/erp-client.tsx) ("Deliverables & Konten" vs "Anggaran & Pengeluaran") dengan URL state synchronization `nuqs` (`erpFilter.tab`).
  - Prefetching server-side paralel TanStack Query v5 di [app/admin/erp/page.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/admin/erp/page.tsx) (`listBudgetsByClient`, `listExpensesByClient`).
  - Ditunjang unit test [expenses-ledger-view.test.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/expenses/expenses-ledger-view.test.tsx) (4/4 passed).
- 🔄 **Looping Check & Hasil Verifikasi Menyeluruh (Verification Loop Result)**:
  - `npx tsc --noEmit`: 0 error (100% clean typecheck).
  - `npx vitest run`: 94/94 test suites PASS (550 tests passed, 0 failed).
  - Kepatuhan Desain Sistem: 100% Radix UI Primitives, Animate UI, semantic HSL tokens, Service Layer 3-lapis.

- [x] **Penyempurnaan Dashboard Overview: Perbaikan Visual Gap & Multi-Channel Performance Breakdown (2026-10-17)**
  - Mengeliminasi visual gap / layout stretching berlebih pada kartu [performance-chart.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/dashboard-stitch/performance-chart.tsx) dengan melepas `h-full` kaku dan menambahkan `items-start` pada container grid [layout.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/admin/dashboard/layout.tsx).
  - Mengintegrasikan seksi **Performa Saluran Media Sosial (Multi-Channel Performance Breakdown)** di bawah grafik dinamika engagement:
    - Menampilkan kartu performa per kanal terhubung (YouTube, Instagram, TikTok, LinkedIn, Twitter/X).
    - Metrik faktual per kanal dari PostgreSQL Supabase: Reach / Views (`<MetricTicker>`), Engagement Rate (%), dan Total Postingan.
    - Status badge akun terhubung real-time.
    - Fallback onboarding empty-state jika belum ada saluran terhubung untuk memandu user/klien menghubungkan akun pertama mereka.
  - Server prefetching multi-account analytics di [dashboard-prefetcher.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/dashboard-stitch/dashboard-prefetcher.tsx) (`analyticsQueries.multiAccount(clientId, "30d")`).
  - Ditunjang unit test komprehensif [performance-chart.test.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/dashboard-stitch/performance-chart.test.tsx) (2/2 passed).

- [x] **Penyempurnaan Pusat Notifikasi: Perbaikan Visual Gap & Sinkronisasi Count Faktual (2026-10-17)**
  - Mengeliminasi ruang kosong putih (~190px gap) pada popover [notification-center.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/notification-center.tsx) dengan mengganti `h-[300px]` statis menjadi tinggi dinamis `h-auto` pada kondisi empty-state dan `max-h-[380px]` saat terisi notifikasi.
  - Memperbaiki inkonsistensi data mismatch: menghapus nilai `unreadCount={1}` yang di-hardcode di [app/admin/layout.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/admin/layout.tsx) menjadi `0`, serta menyinkronkan counter popover dan trigger badge secara faktual dengan array `notifications`.
  - Ditunjang unit test baru [notification-center.test.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/notification-center.test.tsx) (3/3 passed).

- [x] **Penyempurnaan Area 1 & 2: Fungsionalisasi Studio Strategy & Eliminasi Gap Workspace Switcher (2026-10-17)**
  - **Area 1 (Identitas Studio & AI)**: Mengubah kartu dekoratif dummy (`INTER SPACE.`) di [right-panel.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/dashboard-stitch/right-panel.tsx) menjadi modul interaktif **Strategi Studio & AI Copilot Hub**. Menampilkan persona Brand Voice, pilar konten, metrik Campaign Velocity faktual, tombol aksi langsung "Atur Brand" (`/admin/settings?tab=brand`), tombol "Launch AI", dan tombol "Kampanye", serta menyatukan AI Launchpad untuk mengeliminasi dead space dan gap vertikal di kolom kanan.
  - **Area 2 (Workspace Switcher & Sidebar Top)**: Merapikan tombol trigger [workspace-switcher.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/workspace-switcher.tsx) ke proporsi `h-10 rounded-xl` yang seirama dengan tombol Tambah Klien `h-10 w-10 rounded-xl` di [app-sidebar.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/app-sidebar.tsx). Mengurangi top padding `SidebarContent` menjadi `px-3 py-2` sehingga link navigasi pertama (`Overview`) langsung pas di bawah divider tanpa celah/gap anjlok.

- [x] **Penyempurnaan Portal Klien: Eliminasi Visual Gap & Penyelarasan Modul 6 Halaman (2026-10-17)**
  - **Client Overview Dashboard (`client/dashboard`)**:
    - Mengeliminasi dead space lavender >400px dengan menambahkan modul 2-kolom: **Antrean Materi & Ulasan Kreatif (Deliverables Pipeline)** (preview draf materi, status badge, tombol ulas) dan **Kanal Brand Aktif** (daftar akun sosial terhubung dengan avatar/handle dan status live sync).
    - **Penyempurnaan Simetri & Eliminasi Dead Space Internal (Master Two-Column Grid Architecture)**:
      - Menyatukan baris grid yang terfragmentasi menjadi satu kontainer induk `grid grid-cols-1 lg:grid-cols-3 gap-6 items-start`.
      - Kolom kiri (`lg:col-span-2 space-y-6`): Menempatkan *Antrean Materi & Ulasan Kreatif* di posisi atas sebagai prioritas aksi klien utama, diikuti *Postingan Tayang Terdekat* di bawahnya.
      - Kolom kanan (`lg:col-span-1 space-y-6`): Menata *Kanal Brand Aktif* (dengan slot kesiapan integrasi platform Instagram/TikTok untuk mengisi ketinggian proporsional) dan *Direct Agency Hotline* di bawahnya tanpa peregangan paksa (`items-start`).
      - Menyeragamkan seluruh tombol aksi kartu menjadi `h-8 px-3.5 rounded-full text-xs font-semibold`.
    - Menambahkan modul panduan **Alur Kolaborasi Konten Bersama Frhm** (3 langkah: Produksi Kreatif -> Tinjau & Approval Instan -> Publikasi Otomatis Terjadwal) sehingga tampilan proporsional, padat, dan mewah.
  - **Content Calendar (`client/calendar`)**:
    - Memperkaya List View empty state dengan CTA langsung request ide konten/jadwal ke hotline support.
    - Membersihkan double spacing margin di [app/client/calendar/page.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/client/calendar/page.tsx).
  - **Deliverables & Review (`client/review`)**:
    - Memperkaya empty state dengan CTA langsung ajukan materi baru.
    - Menambahkan seksi edukasi **Kebijakan Ulasan & SLA Revisi Tim Frhm** (SLA 1x24 Jam Kerja, Catatan Terarah, Otomatisasi Penjadwalan).
  - **Performance Analytics (`client/analytics`)**:
    - Mengisolasi portal klien dari kebocoran filter agensi dengan menyembunyikan dropdown "Semua Client" dan menetralkan link admin `/admin/clients/...` menjadi teks biasa pada kartu kampanye.
  - **Brand Assets (`client/assets`)**:
    - Memperkaya empty state dan menambahkan panel **Panduan Format & Spesifikasi Aset Media** (Resolusi Feed 1:1/4:5, Video Reels 9:16, Penyimpanan Resolusi Penuh).
  - **Support & Request (`client/support`)**:
    - Menyeragamkan token radius input subjek ke `rounded-xl` agar harmonis dengan textarea dan kartu.
  - Ditunjang unit test komprehensif baru: [client-dashboard-view.test.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-dashboard-view.test.tsx) dan [client-review-hub.test.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-review-hub.test.tsx).
- [x] **Penyempurnaan Responsif & Touch UX Mobile Menyeluruh: Audit Bebas Overflow & Kolisi (2026-10-17)**
  - **Reflow Header Universal ([page-container.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/layout/page-container.tsx))**:
    - Mengeliminasi tabrakan judul halaman dan tombol aksi header di layar kecil dengan mengubah container menjadi `flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4` serta wrapping actions `flex flex-wrap items-center gap-2`.
  - **Navigasi Header Mobile ([client-header.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-header.tsx) & [header.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/admin/header.tsx))**:
    - Portal Klien: Truncation nama brand (`max-w-[100px] xs:max-w-[150px] sm:max-w-[220px]`), badge "Partner Portal" tersembunyi di ultra-compact screens, dan tombol "Hotline Support" adaptif tanpa overflow horizontal.
    - Studio Admin: Tombol "Create Campaign" adaptif (`Campaign` pada mobile), tombol Command Search & Apps dapat diakses via ikon pencarian di mobile (`inline-flex`) untuk akses instan ke KBar shortcut.
  - **Kalender Multi-Kanal Bebas Kompresi ([calendar-client.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/admin/calendar/calendar-client.tsx) & [client-calendar-view.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-calendar-view.tsx))**:
    - Membungkus tampilan Bulan (7 kolom) dan Minggu dalam container `overflow-x-auto` dengan `min-w-[640px] md:min-w-0` sehingga sel kalender tidak tertekan menjadi 40px di layar handphone dan kartu postingan terbaca jelas.
  - **Deliverables & Media Hub Mobile**:
    - [client-review-hub.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-review-hub.tsx): Tabs status review ("Semua", "Menunggu Review", "Perlu Revisi", "Disetujui") dilengkapi horizontal scroll pill container `overflow-x-auto no-scrollbar` untuk mencegah page blowout.
    - [library-client.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/library/library-client.tsx): Sticky batch action bar dibuat `flex-wrap` dengan input tag adaptif (`w-32 sm:w-44`).
  - **Touch Accessibility & Prioritas Alur ([right-panel.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/dashboard-stitch/right-panel.tsx) & [support-view.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/support/support-view.tsx))**:
    - Tombol putuskan kanal (`Disconnect`) diubah dari `opacity-0` hover-only menjadi `opacity-100 md:opacity-0 md:group-hover:opacity-100` agar 100% dapat dilihat dan disentuh pengguna mobile touch.
    - Halaman Hotline Dukungan: Formulir Tiket diprioritaskan di atas FAQ pada mobile (`order-1 lg:order-2`), dan padding dikompresi ke `p-5 sm:p-8`.
    - Hero Dashboard Stitch ([hero.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/dashboard-stitch/hero.tsx)): Baris badge Workspace + tombol sync diperkuat dengan `flex-wrap`.
- [x] **Penyempurnaan Total Simetri & Eliminasi Dead Space Client Overview Dashboard (2026-10-17)**
  - **Arsitektur Grid 2-Baris Presisi (2-Row Structured Grid dengan `items-stretch`)**:
    - Memecah layout kolom terfragmentasi menjadi dua baris independen berpasangan horizontal:
      - **Row 1**: *Antrean Materi & Ulasan Kreatif* (2 kolom) berpasangan sejajar dengan *Kanal Brand Aktif* (1 kolom). Ketinggian kedua kartu 100% identik dan sejajar garis horizontalnya (`items-stretch` + `flex-1 flex flex-col justify-between`).
      - **Row 2**: *Postingan Tayang Terdekat* (2 kolom) berpasangan sejajar dengan *Hotline Agensi Frhm* (1 kolom). Ketinggian kedua kartu 100% identik, garis pemisah tengah lurus sempurna, dan garis dasar bawah rata ke pixel.
    - Membungkus seluruh seksi dengan `<div className="flex flex-col gap-6">` untuk menjamin jarak vertikal seragam 24px (`gap-6`) antar-baris (Banner -> Metrik Tickers -> Row 1 -> Row 2 -> Alur Kolaborasi).
  - **Eliminasi Hollow Empty States & Peningkatan UX**:
    - Mengganti kotak dashed abu-abu kosong melompong pada *Antrean Materi* dan *Postingan Terdekat* dengan komponen empty-state fungsional dan padat (ikon branded 44px, tipografi terstruktur, panduan alur, serta tombol CTA kontekstual ke Review Hub, Request Konten, dan Kalender Publikasi).
    - Memperbaiki Hotline Agensi Frhm: menyertakan indikator status *"Tim Standby"* dengan animasi pulse, kartu koordinasi cepat, dan SLA tanggapan darurat < 2 jam.
  - **Data Faktual & Anti Mismatch**:
    - Mengganti teks hardcoded pada kartu ke-4 metrik ("Akun Instagram, TikTok, YouTube aktif") menjadi kalkulasi dinamis faktual dari array kanal PostgreSQL Supabase (`channels.map(c => c.platform).join(", ")`).
    - Membatasi slot fallback platform kanal menggunakan `Math.max(0, 3 - channels.length)` untuk mencegah kalkulasi negatif pada array slice.
  - **Verifikasi Kualitas (Verification Loop)**:
    - `npx tsc --noEmit`: 0 error (100% clean typecheck).
    - `npx vitest run`: 97/97 test suites PASS (555 tests passed, 0 failed).

- [x] **Penyempurnaan Total Deliverables & Review Hub: Arsitektur 2-Kolom & Eliminasi Dead Space (2026-10-17)**
  - **Arsitektur Master 2-Column Workspace (`lg:col-span-2` & `lg:col-span-1`)**:
    - Mengeliminasi problem kekosongan 67% viewport saat hanya ada 1 deliverable dengan membagi layout menjadi 2 kolom terstruktur:
      - **Kolom Kiri Utama (`lg:col-span-2`)**: Tabs filter status, daftar draf materi dengan kartu ulasan lebar penuh (*full-width rich review cards*), status info callout contextual (banner proses revisi SLA 1x24 jam, banner siap review, dan banner persetujuan kalender), serta aksi persetujuan instan / ajukan revisi.
      - **Kolom Kanan Pendukung (`lg:col-span-1`)**: Panel panduan **Alur Review Mandiri** (3 langkah mudah: Buka Visual -> Catatan Spesifik -> 1-Klik Approval) dan kartu **Request Materi Khusus** dengan info SLA < 2 Jam Kerja langsung ke tim agensi.
  - **Penambahan 4 Baris Metrik Eksekutif (Executive Metric Tickers)**:
    - Menyeragamkan bahasa visual dengan Dashboard dan Calendar melalui 4 kartu metrik dinamis di bagian atas: *Total Deliverable*, *Menunggu Review*, *Perlu Revisi*, dan *Telah Disetujui* menggunakan `<MetricTicker>`.
  - **Rhythm Vertikal Seragam**:
    - Membungkus seluruh halaman dalam `<div className="flex flex-col gap-6">` untuk konsistensi gap 24px seragam.
    - Menambahkan tombol aksi header `Request Materi Baru` pada `PageContainer`.
  - **Verifikasi Kualitas (Verification Loop)**:
    - `npx tsc --noEmit`: 0 error (100% clean typecheck).
    - `npx vitest run`: 97/97 test suites PASS (555 tests passed, 0 failed).

- [x] **Penyelarasan Menyeluruh 6 Halaman Portal Klien & Audit Mapping Parameter URL (2026-10-17)**
  - **Audit Komprehensif 6 Rute Portal Klien ([/client/*](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/client/))**:
    - Memverifikasi 6 rute portal klien aktif:
      1. `/client/dashboard`: Overview eksekutif, metrik ringkasan, antrean ulasan, dan postingan terdekat.
      2. `/client/calendar`: Kalender rilis konten read-only bulanan/mingguan dengan filter platform dan modal detail visual.
      3. `/client/review`: Workspace ulasan draf 2-kolom dengan 4 kartu metrik SLA, dialog persetujuan/revisi Radix UI.
      4. `/client/analytics`: Agregasi jangkauan multi-platform, tren audiens faktual, METER audit AI summary, dan tombol aksi "Konsultasi Analitik".
      5. `/client/assets`: Gudang aset media resolusi tinggi resmi brand dengan tombol "Request Aset Baru".
      6. `/client/support`: Pusat bantuan darurat, pembuatan tiket kendala, FAQ kemitraan, dan tombol "Hotline WhatsApp".
  - **Standardisasi Spacing & Eliminasi Visual Gap (`flex flex-col gap-6`)**:
    - Mengeliminasi perbedaan margin ad-hoc (`mt-4`, `mt-8`, `space-y-8`, `pt-2`) di seluruh halaman klien.
    - Menyeragamkan seluruh halaman portal klien untuk dibungkus dalam `<div className="flex flex-col gap-6">`, menjamin jarak vertikal seragam 24px (`gap-6`) yang simetris dari header hingga footer.
    - Menyelaraskan layout `AnalyticsView` dari `space-y-6` ke `flex flex-col gap-6` untuk mencegah margin collapsing.
  - **Penyelarasan Mapping State URL & Nuqs Cache ([searchparams.ts](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/lib/searchparams.ts))**:
    - Menambahkan `supportSearchParams`, `supportParamsCache`, dan `serializeSupportParams` ke `lib/searchparams.ts` guna menggantikan parsing ad-hoc pada `ClientSupportPage` sesuai aturan mutlak AGENTS.md §4.
    - Seluruh 6 halaman klien kini menggunakan prefetcher server-side `DashboardPrefetcher` dan resolver `resolveClientId` yang stabil.
  - **Integrasi Command Menu (KBar) Route-Aware ([index.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/kbar/index.tsx))**:
    - Memperbaiki celah mapping pada Command Bar (KBar): ketika pengguna membuka KBar di rute portal klien (`/client/*`), KBar kini secara otomatis menampilkan navigasi khusus `clientNav` (Overview, Calendar, Review, Analytics, Brand Assets, Support) lengkap dengan parameter `clientId`.
    - Menambahkan tombol aksi navigasi kembali ("Buka Admin Studio") bagi admin saat sedang meninjau portal klien.
    - Menambahkan tombol pencarian cepat (Search / Command Menu) di [client-header.tsx](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/components/client/client-header.tsx) agar pengguna dapat membuka KBar dengan klik/tap langsung selain via shortcut `Ctrl+K`.
  - **Verifikasi Kualitas (Verification Loop)**:
    - `npx tsc --noEmit`: 0 error (100% clean typecheck).
    - `npx vitest run`: 97/97 test suites PASS (555 tests passed, 0 failed).

- 🔄 **Looping Check & Hasil Verifikasi Menyeluruh (Verification Loop Result)**:
  - `npx tsc --noEmit`: 0 error (100% clean typecheck).
  - `npx vitest run`: 97/97 test suites PASS (555 tests passed, 0 failed).
  - Kepatuhan Desain Sistem: 100% Radix UI, Animate UI, semantic HSL tokens, antislop-layoutmobile.


