# 📝 Frhm Master Bug & Gap Elimination Plan (TODO)

**Terakhir diperbarui:** 2026-10-16 oleh Antigravity (Siklus Verifikasi ECC)  
**Status Repositori:** Clean, 85 test suites passed (502/502 tests), Playwright E2E passed (client-portal.spec.ts), `tsc --noEmit` 0 error, Turbopack Next.js build sukses 100%.

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

