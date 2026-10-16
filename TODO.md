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

### 🛡️ PILLAR 1: Multi-Tenant Security & Backend Boundary (Kedaulatan Data)
*Tujuan: Memastikan tidak ada kebocoran data antar-klien, bypass autentikasi, atau silent failure pada RLS.*

- [ ] **1.1. Tenant Isolation & Client Scoping**:
  - [ ] Audit seluruh 16 modul di `features/*/api/service.ts` untuk memastikan parameter `client_id` selalu divalidasi dan tidak dapat disuntikkan ID klien lain.
  - [ ] Verifikasi konsistensi RLS policy Supabase untuk tabel `deliverables`, `campaigns`, `client_channels`, `scheduled_posts`, dan `expenses`.
- [ ] **1.2. API Route & Webhook Authentication**:
  - [ ] Audit endpoint `/api/cron/*` — pastikan validasi `Authorization: Bearer <CRON_SECRET>` aktif dan menolak request tak terotorisasi (401).
  - [ ] Audit webhook WhatsApp (`/api/whatsapp/webhook`) — verifikasi HMAC SHA-256 signature verification.
  - [ ] Audit webhook Telegram (`/api/telegram/webhook`) — verifikasi `X-Telegram-Bot-Api-Secret-Token` dan link token hashing.
- [ ] **1.3. Secret Hygiene & Client Exposure**:
  - [ ] Pastikan tidak ada kunci rahasia (`SERVICE_ROLE_KEY`, `AYRSHARE_API_KEY`, AI provider API keys) yang memakai awalan `NEXT_PUBLIC_`.
  - [ ] Validasi skema Zod environment variables di `lib/env.ts` (`t3-env` / runtime validation).
- [ ] **1.4. Security Headers & CSP**:
  - [ ] Verifikasi `next.config.mjs` Content-Security-Policy (CSP) untuk domain Sentry (`*.sentry.io`, `o*.ingest.sentry.io`), Supabase, dan Ayrshare.

---

### 🔄 PILLAR 2: URL State Synchronization (`nuqs`) & Hydration Stability
*Tujuan: Zero-state-loss saat browser refresh, parser prefetch sinkron, dan bebas hydration flash.*

- [ ] **2.1. Audit URL State Persistence (`nuqs`)**:
  - [ ] Cek halaman Admin:
    - `/admin/dashboard` (filter client, date range)
    - `/admin/calendar` (view mode: month/week/day, platform filter, client filter)
    - `/admin/campaigns` (active tab, search query, client filter)
    - `/admin/erp` (active tab: expenses/ledger/ads/events, client filter)
    - `/admin/library` (asset type, tags, search query)
    - `/admin/ai` (active studio tab: ideas/batch/trends/brand-brain/playbooks, skill id)
  - [ ] Ganti sisa `useState` lokal yang seharusnya persisten di URL dengan `useQueryStates` (shallow: true).
- [ ] **2.2. Sinkronisasi Parser Server & Client**:
  - [ ] Pastikan parser di `lib/searchparams.ts` dan client parser memiliki definisi default dan type casting yang identik agar cache prefetch tidak terbuang.
- [ ] **2.3. Hydration Flash & SSR Gates**:
  - [ ] Pastikan popover/dialog yang membaca state browser/localStorage memiliki mounted gate agar tidak memicu *hydration mismatch*.
  - [ ] Periksa formatting tanggal `date-fns` di Server Components untuk menghindari perbedaan timezone server vs client.

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
