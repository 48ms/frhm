<div align="center">

# Frhm

**Marketing ERP untuk Agensi Digital**

Platform SaaS all-in-one untuk mengelola banyak klien: deliverable, kampanye, ERP keuangan, konten sosial, dan kolaborasi — dalam satu dashboard.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-421%20passing-brightgreen)](./app)

</div>

---

## Daftar Isi

- [Tentang](#tentang)
- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Arsitektur](#arsitektur)
- [Mulai Cepat](#mulai-cepat)
- [Variabel Lingkungan](#variabel-lingkungan)
- [Testing](#testing)
- [Peran & Hak Akses](#peran--hak-akses)
- [Skema Database](#skema-database)
- [Deployment](#deployment)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

---

## Tentang

**Frhm** adalah *Marketing ERP* (Enterprise Resource Planning) untuk agensi digital marketing yang mengelola banyak klien sekaligus. Admin dapat menyelesaikan pekerjaan klien lebih cepat melalui otomasi operasional, sementara klien punya portal sendiri untuk melihat laporan, menyetujui konten, dan berinteraksi.

**Nilai inti:**

- **Multi-tenant isolation** — data klien A tidak pernah terlihat oleh klien B (dijamin di level database via Supabase RLS + middleware).
- **Real-time** — semua data dibaca langsung dari database, bukan mock.
- **Keyboard-centric** — command palette (`⌘K`) untuk kecepatan admin.
- **Mobile-first** — navigasi klien dioptimalkan untuk layar kecil.

---

## Fitur Utama

| Modul | Deskripsi |
|-------|-----------|
| **Dashboard** | KPI grid, ringkasan performa lintas klien, metrik real-time |
| **Deliverables** | Alur kerja `draft → sent → revision_requested \| approved` dengan komentar dua arah |
| **Campaigns** | Papan kampanye + pipeline produksi konten (list & Gantt timeline) |
| **ERP** | Anggaran klien, pencatatan pengeluaran, ad spend log, KOL CRM |
| **Calendar** | Kalender konten, brainstorming, ekspor jadwal |
| **Social Accounts** | Manajemen akun sosial + analitik multi-akun |
| **Events** | Manajemen event dengan badge status & animasi |
| **Copilot** | Asisten AI (OpenAI-compatible) untuk membantu alur kerja |
| **Analytics** | Agregator lintas akun & laporan performa |
| **Notifications** | Pusat notifikasi in-app + integrasi Telegram |
| **Support** | Sistem tiket dukungan |
| **Library** | Perpustakaan brand files & aset |

> 17 feature module & 18 halaman admin — semuanya ter-wire penuh dari UI sampai service layer.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React Server Components)
- **Language:** TypeScript (strict mode)
- **UI:** Tailwind CSS v4 · shadcn/Base UI (nova preset) · Motion (Animate UI) · Radix UI
- **Database & Auth:** Supabase (PostgreSQL + Row Level Security)
- **State/Data:** TanStack Query · nuqs (URL state) · Zod (validasi env & input)
- **Testing:** Vitest + React Testing Library · Playwright (E2E)
- **Observability:** Sentry
- **Deploy:** Vercel

---

## Arsitektur

Proyek mengikuti pola **feature-sliced** — setiap modul mandiri dan lengkap dari API sampai UI:

```
app/
├── app/                    # Next.js App Router (routes: /admin/*, /client/*)
│   ├── admin/              # 18 halaman admin
│   └── client/             # Portal klien
├── components/             # Komponen UI (shadcn, animate-ui, board, form)
├── features/               # 17 feature module — SSOT per domain
│   └── <domain>/
│       └── api/
│           ├── service.ts  # Server actions / data access
│           ├── queries.ts  # React Query hooks
│           ├── types.ts    # Tipe domain
│           └── keys.ts     # Query key factory
├── lib/                    # Utilitas, Supabase client, env (Zod-validated)
├── config/                 # nav-config, feature flags
├── e2e/                    # Playwright specs
└── supabase/migrations/    # Migrasi SQL bernomor
```

**Aturan arsitektur:**

- Semua akses `process.env` **wajib** melewati skema Zod (`lib/env.ts`).
- Setiap fitur punya satu sumber kebenaran (SSOT) di `features/<domain>/api/`.
- Styling ketat mengikuti standar *antislop-ui* (radius seragam, shadow sebagai elevasi).

---

## Mulai Cepat

**Prasyarat:** Node.js 20+ dan npm.

```bash
# 1. Clone repo
git clone https://github.com/48ms/frhm.git
cd frhm

# 2. Masuk ke direktori aplikasi
cd app

# 3. Install dependencies
npm install

# 4. Siapkan environment variables
cp .env.example .env.local
# → isi nilai-nilai di .env.local (lihat bagian berikut)

# 5. Jalankan migrasi database (butuh Supabase CLI)
supabase db push

# 6. Jalankan dev server
npm run dev
```

Aplikasi berjalan di **http://localhost:3000**.

### Skrip tersedia

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Dev server (hot reload) |
| `npm run build` | Build produksi |
| `npm start` | Jalankan build produksi |
| `npm run lint` | ESLint |
| `npm test` | Jalankan unit test (Vitest) |
| `npm run test:watch` | Unit test mode watch |

---

## Variabel Lingkungan

Salin `app/.env.example` → `app/.env.local` dan isi:

| Variabel | Keterangan |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon/publishable key (aman untuk client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (**server-only**, jangan expose) |
| `NEXT_PUBLIC_APP_URL` | URL aplikasi |
| `CRON_SECRET` | Secret untuk endpoint cron |
| `TELEGRAM_*` | Integrasi bot Telegram (opsional) |
| `AYRSHARE_API_KEY` | Integrasi publikasi sosial (opsional) |
| `OAUTH_STATE_SECRET` | Secret OAuth state |

> ⚠️ **Jangan pernah** commit `.env.local`. File tersebut sudah di-`.gitignore`.

---

## Testing

```bash
cd app

# Unit & component tests (Vitest)
npm test

# E2E tests (Playwright) — pastikan dev server berjalan
npx playwright test
```

Status saat ini: **421 unit test passing** (74 test file) · **E2E suite** untuk route guard, login, dan alur kerja kritis.

---

## Peran & Hak Akses

Aplikasi memiliki 3 lapis hak akses (Supabase Auth + RLS + Middleware):

1. **Admin** (`role: 'admin'`) — akses `/admin/*`, kelola semua klien, approval, kalender.
2. **Client** (`role: 'client'`) — akses `/client/*`, hanya data miliknya sendiri, bisa minta revisi / approve.
3. **Waitlist / Unassigned** (`role: null`) — dialihkan ke `/waitlist` sampai admin meng-assign role.

---

## Skema Database

| Tabel | Fungsi |
|-------|--------|
| `users` | Extend `auth.users` — menyimpan `role` & `client_id` |
| `clients` | Data brand klien |
| `deliverables` | Inti aplikasi — status `draft → sent → revision_requested \| approved` |
| `comments` | Diskusi dua arah per deliverable |
| `status_history` | Log otomatis perubahan status (trigger on update) |
| `campaigns` / `content_productions` | Kampanye & pipeline produksi |
| `expenses` / `ad_spend_logs` / `client_budgets` | Modul ERP |
| `events` | Manajemen event |

Migrasi SQL bernomor tersedia di `app/supabase/migrations/`.

---

## Deployment

1. Deploy ke **Vercel** (Production / Preview).
2. Set environment variables di dashboard Vercel (lihat [Variabel Lingkungan](#variabel-lingkungan)).
3. Setup **Google OAuth** di Google Cloud Console, lalu pasang Client ID & Secret di Supabase Auth provider.
4. Konfigurasi cron job (endpoint memakai `CRON_SECRET`).

---

## Kontribusi

1. Fork repo & buat branch fitur (`git checkout -b feat/nama-fitur`).
2. Commit dengan pesan konvensional (`feat:`, `fix:`, `chore:`).
3. Pastikan `npm test` dan `npm run lint` lolos.
4. Buka Pull Request.

---

## Lisensi

Dirilis di bawah lisensi **MIT** — lihat [LICENSE](./LICENSE).

---

<div align="center">

Dibuat oleh **[Bima](https://github.com/48ms)**

</div>
