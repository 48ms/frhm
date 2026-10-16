<div align="center">

# Frhm

**Marketing ERP untuk agensi digital** — kelola banyak klien dari satu dashboard.

[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

</div>

---

## Apa ini

Frhm menggantikan tumpukan spreadsheet + grup WhatsApp agensi dengan satu sistem: admin mengerjakan pekerjaan klien, klien punya portal sendiri untuk review dan approval. Setiap klien terisolasi ketat di level database (Supabase RLS) — data klien A tidak akan pernah muncul di klien B.

## Modul

| | |
|---|---|
| **Deliverables** | Alur `draft → sent → revision_requested \| approved`, komentar dua arah, log status otomatis |
| **Campaigns** | Papan kampanye + pipeline produksi (list & Gantt) |
| **ERP** | Anggaran klien, expenses, ad spend log, KOL CRM |
| **Calendar** | Kalender konten + brainstorming |
| **Social** | Manajemen akun + analitik multi-akun, publikasi via Ayrshare |
| **Events** | Manajemen event |
| **Copilot** | Asisten AI untuk mempercepat alur kerja |
| **Library** | Aset & brand files |

Plus: Analytics, Notifications (in-app + Telegram), Support tickets.

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind v4
 Supabase (PostgreSQL + RLS) 

## Jalan cepat

```bash
git clone https://github.com/48ms/frhm.git
cd frhm/app
npm install
cp .env.example .env.local   # isi kredensial Supabase
supabase db push             # apply migrasi
npm run dev                  # http://localhost:3000
```

Butuh **Node 20+**. Untuk login, siapkan Google OAuth di Supabase Auth.

## Struktur

```
app/
├── app/          # routes: /admin/* dan /client/*
├── components/   # UI (shadcn, animate-ui, board, form)
├── features/     # 17 modul — tiap domain punya api/ (service, queries, types)
├── lib/          # supabase client, env (Zod-validated)
├── e2e/          # Playwright specs
└── supabase/     # migrasi SQL bernomor
```

Tiap fitur adalah SSOT-nya sendiri: `features/<domain>/api/service.ts` untuk data access, `queries.ts` untuk React Query hooks. Semua akses `process.env` lewat skema Zod di `lib/env.ts`.

## Perintah

| | |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Build produksi |
| `npm run lint` | ESLint |
| `npm test` | Unit test (Vitest) |
| `npx playwright test` | E2E (dev server harus jalan) |


## Peran

- **Admin** — `/admin/*`, kelola semua klien.
- **Client** — `/client/*`, hanya datanya sendiri, bisa minta revisi / approve.
- **Unassigned** — dialihkan ke `/waitlist` sampai admin assign role.

## Lisensi

[MIT](./LICENSE) © [Bima](https://github.com/48ms)
