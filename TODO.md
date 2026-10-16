# 📝 Frhm Master Bug & Gap Elimination Plan (TODO)

**Terakhir diperbarui:** 2026-10-16 oleh Antigravity (Siklus Verifikasi ECC)  
**Status Repositori:** Clean, 75 test files passed (423/423 tests), `tsc --noEmit` 0 error, Next.js build sukses.

---

## 🎯 Prioritas Utama: Audit & Penyelesaian Celah (Bug & Gap) 5-Pilar

Rencana kerja terstruktur untuk menyisir, mendeteksi, dan menuntaskan celah di seluruh lapisan platform Frhm:

```
Pillar 1: Security & Data Isolation  ──► Pillar 2: URL State & Hydration
Pillar 3: Mutations & Rollbacks     ──► Pillar 4: Radix A11y & Animate UI
Pillar 5: E2E Playwright & Edge Cases
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

- [ ] **3.1. Optimistic Updates & Rollback (`onMutate` / `onError`)**:
  - [ ] Verifikasi mutasi penjadwalan post (`useCreateScheduledPost`, `useUpdateScheduledPost`, `useDeleteScheduledPost`) jika koneksi putus.
  - [ ] Verifikasi mutasi kampanye (`useCreateCampaign`, `useUpdateCampaign`, `useDeleteCampaign`).
  - [ ] Verifikasi mutasi pengeluaran ERP (`useCreateExpense`, `useDeleteExpense`).
  - [ ] Verifikasi mutasi delegasi skill playbook klien (`useAssignClientSkill`, `useUpdateClientSkillStatus`).
- [ ] **3.2. 100% Error Toasting Coverage**:
  - [ ] Sisir seluruh blok `catch` di komponen interaktif — pastikan tidak ada *silent failure* (setiap error wajib memicu `toast.error(msg)`).
  - [ ] Gunakan `toast.promise` untuk aksi asinkron berat (seperti export deliverable PDF, AI batch planning, dan sinkronisasi akun).
- [ ] **3.3. Presisi Invalidation Cache TanStack Query**:
  - [ ] Audit query key factories agar `invalidateQueries` spesifik ke `entityKeys.byClient(clientId)` dan tidak memicu refetch global yang tidak perlu.

---

### 🎨 PILLAR 4: Radix UI Accessibility, Animate UI & Theme Integrity
*Tujuan: Kepatuhan mutlak ARIA, interaksi spring motion mulus, dan konsistensi warna semantik.*

- [ ] **4.1. Kepatuhan Radix UI Primitives**:
  - [ ] Pastikan tidak ada modal, dropdown, select, atau tooltip ad-hoc yang dibuat dari div mentah tanpa primitives Radix UI.
  - [ ] Audit focus trapping, escape key dismiss, dan roving tabindex pada seluruh dialog/sheet/menu.
- [ ] **4.2. Dinamisasi Metrik Animate UI (`<MetricTicker>` / `<SlidingNumber>`)**:
  - [ ] Sisir seluruh angka metrik di dashboard overview, analytics view, kampanye, dan ERP.
  - [ ] Pastikan tidak ada nilai `NaN` atau angka statis tanpa animasi hitungan mundur/maju yang mulus.
- [ ] **4.3. Konsistensi Tema & Rasio Kontras HSL**:
  - [ ] Uji kontras teks dan background di mode Gelap dan Terang pada seluruh preset tema (`default`, `supabase`, `vercel`, `claude`).
  - [ ] Pastikan tidak ada warna Tailwind hardcoded seperti `bg-slate-900` atau `text-[#123456]` di komponen fitur.
- [ ] **4.4. Zero Layout-Shift Button Loading**:
  - [ ] Pastikan seluruh tombol submit menggunakan prop `isLoading={isPending}` dengan teknik CSS Grid overlap agar dimensi tombol tidak melompat saat proses kirim.

---

### 🧪 PILLAR 5: E2E Playwright Suite & Edge Cases
*Tujuan: Memastikan seluruh skenario operasional pengguna di browser lulus 100% tanpa timeout.*

- [ ] **5.1. Audit & Eksekusi Playwright E2E**:
  - [ ] Jalankan suite test Playwright dan perbaiki kegagalan timeout/CSP pada tes yang ada.
  - [ ] Pastikan 0 console error dan 0 unhandled promise rejection pada runtime browser.
- [ ] **5.2. Edge Cases Alur Kerja**:
  - [ ] *Kalender:* Karakter caption pada limit maksimum platform (IG 2.200 karakter, X 280 karakter).
  - [ ] *ERP:* Input biaya melebihi alokasi budget bulanan (pemicu threshold Telegram alert 90%).
  - [ ] *Portal Review Client (`/review/[id]`):* Akses publik via token tanpa login, penolakan revisi, dan submit rating bintang 1-5.
  - [ ] *AI Studio:* Generate batch plan pada kondisi koneksi lambat / AI rate limit fallback.

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
