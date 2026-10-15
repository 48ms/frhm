# 📘 FRHM SaaS — Buku Petunjuk Lengkap
## Marketing ERP untuk Agensi Digital

> Versi: 1.0.0 | Terakhir diperbarui: 2026-10-15
> Tech Stack: Next.js 14+ (App Router), TypeScript, Tailwind v4, shadcn/Nova, Supabase (PostgreSQL + RLS)

---

## 📋 Daftar Isi

1. [Apa Itu Frhm](#1-apa-itu-frhm)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Alur Kerja Utama (Workflow)](#3-alur-kerja-utama-workflow)
4. [Panduan Per Halaman / Modul](#4-panduan-per-halaman--modul)
5. [Wiring Tombol & Interaksi](#5-wiring-tombol--interaksi)
6. [Database Schema & RLS](#6-database-schema--rls)
7. [API Routes](#7-api-routes)
8. [Cron & Background Jobs](#8-cron--background-jobs)
9. [Keamanan & Isolasi Tenant](#9-keamanan--isolasi-tenant)
10. [Troubleshooting Umum](#10-troubleshooting-umum)

---

## 1. Apa Itu Frhm

Frhm adalah **Marketing ERP** (Enterprise Resource Planning) untuk agensi digital marketing yang mengelola banyak klien sekaligus.

**Tujuan**: Admin bisa menyelesaikan pekerjaan klien lebih cepat melalui otomasi operasional.

**Pengguna**:
- **Admin** (Bima & tim): mengakses `/admin/*` untuk mengelola semua klien
- **Klien**: mengakses `/client/*` untuk melihat laporan, menyetujui konten, dan berinteraksi

**Nilai Inti**:
- Multi-tenant isolation (data klien A tidak pernah terlihat klien B)
- Real-time data dari database (bukan mock)
- Keyboard-centric UI untuk kecepatan admin
- Mobile-first navigation untuk klien

---

## 2. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Admin UI   │  │  Client UI  │  │  Preview UI │             │
│  │  /admin/*   │  │  /client/*  │  │  /preview-* │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│                 ┌────────▼────────┐                             │
│                 │  Next.js Server  │  (App Router, SSR/SSG)     │
│                 │  /app/routes     │                             │
│                 └────────┬────────┘                             │
│                          │                                      │
├──────────────────────────┼──────────────────────────────────────┤
│               SUPABASE (PostgreSQL + RLS)                       │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐         │
│  │ clients │  │ channels │  │ calendars│  │ budgets │         │
│  └─────────┘  └──────────┘  └──────────┘  └─────────┘         │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐         │
│  │deliver- │  │scheduled │  │social    │  │support  │         │
│  │ables    │  │_posts    │  │accounts  │  │tickets  │         │
│  └─────────┘  └──────────┘  └──────────┘  └─────────┘         │
└─────────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌──────────────────┐         ┌──────────────────────┐
│  External APIs   │         │  Background Cron     │
│  - OpenAI        │         │  - publish/scheduled  │
│  - Cloudinary    │         │  - sync analytics     │
│  - Telegram      │         │  - daily insights     │
│  - WhatsApp      │         │  - check metrics      │
└──────────────────┘         └──────────────────────┘
```

### Struktur Kode

```
app/
├── app/                    # Next.js App Router
│   ├── admin/              # Admin pages (16 routes)
│   ├── auth/               # Login, forgot-password, set-password
│   ├── client/             # Client dashboard pages
│   ├── preview-*/          # Preview routes (no auth required)
│   ├── review/[id]/        # Client review portal
│   ├── waitlist/           # Waitlist landing page
│   ├── api/                # API routes (31 endpoints)
│   ├── layout.tsx          # Root layout (NuqsAdapter, QueryClient)
│   └── global-error.tsx    # Fallback error boundary
│
├── features/               # 16 feature modules, tiap satu punya:
│   ├── api/service.ts      # Data access layer (Supabase client)
│   ├── api/queries.ts      # TanStack Query hooks factories
│   ├── api/types.ts        # TypeScript type definitions
│   └── api/service.test.ts # Unit tests
│   └── lib/searchparams.ts # URL state (nuqs) parsers
│
├── components/             # 186 komponen UI
│   ├── animate-ui/         # Animate UI primitives (SSOT)
│   ├── ui/                 # shadcn Nova re-exports (SSOT)
│   ├── layout/             # Sidebar, header, footer, skip-link
│   ├── dashboard-stitch/   # Dashboard specific components
│   ├── ai/                 # AI Studio components
│   └── ...
│
└── lib/                    # Shared utilities
    ├── env.ts              # Zod env schema (Rule 15)
    ├── supabase/server.ts  # Supabase server client
    ├── supabase/client.ts  # Supabase browser client
    └── preview-guard.ts    # Preview route guard (tenant isolation)
```

---

## 3. Alur Kerja Utama (Workflow)

### 3.1 Workflow Harian Admin

```
1. Login                    → POST /api/auth/login
   ↓
2. Dashboard Overview       → GET /admin/dashboard (parallel prefetch)
   ↓
3. Buat/Kelola Klien        → /admin/clients
   ↓
4. Hubungkan Channel Sosial → /admin/social-accounts (OAuth flow)
   ↓
5. Production Konten        → /admin/calendar atau /admin/erp (Kanban)
   ↓
6. Review & Approval        → Kirim notifikasi ke klien
   ↓
7. Scheduled Publishing     → Cron otomatis publish sesuai jadwal
   ↓
8. Monitoring               → /admin/analytics (metric tracking)
```

### 3.2 Workflow Klien

```
1. Akses Review Portal      → /review/[deliverableId]
   ↓
2. Lihat Konten             → Preview post + media
   ↓
3. Approve / Request Edit   → POST /api/deliverables/review
   ↓
4. Notifikasi               → Telegram / WhatsApp push
   ↓
5. Dashboard Klien          → /client/dashboard (bottom-nav mobile)
```

---

## 4. Panduan Per Halaman / Modul

### 4.1 Dashboard (`/admin/dashboard`)

**Fungsi**: Pusat kendali utama admin. Menampilkan ringkasan semua klien secara real-time.

**Komponen (Parallel Routes)**:
| Slot | Komponen | Data |
|------|----------|------|
| `@hero` | Hero card dengan greeting + ringkasan | Dashboard profile |
| `@kpis` | KPI cards (Reach, Engagement, Velocity) | Metrics dari DB |
| `@chart` | Performance chart (AreaChart Recharts) | Sparkline data |
| `@hub` | Action hub (quick actions) | - |
| `@pipeline` | Content pipeline overview | Scheduled posts |

**Cara Kerja**:
1. Server Component `app/admin/dashboard/page.tsx` render
2. `DashboardPrefetcher` menjalankan parallel prefetch queries
3. Setiap `@slot` dirender secara independen dengan `<Suspense>`
4. `useActiveDashboard()` hook mengambil clientId dari URL + query profile + client list

**Wiring Tombol**:
- Pilih Klien: `useQueryState("clientId", ...)` → refresh semua widget
- Toggle Timeframe: `useQueryState("tf", ...)` → update chart data

---

### 4.2 AI Studio (`/admin/ai`) — DEEP DIVE

**Fungsi**: Pusat komando kecerdasan buatan terpadu untuk meracik ide, menyusun rencana kampanye, memvalidasi tren, dan mengelola identitas brand — semuanya terikat pada Brand DNA klien aktif.

**Komponen utama**: `components/ai/ai-studio-client.tsx` (~1364 baris).

**Tab aktif disimpan di URL** via `nuqs` (`?tab=ideas|batch|trends|brand-brain|playbooks`), sehingga bisa di-bookmark & dibagikan.

#### 5 Tab Utama

| Tab | id | Fungsi | Backend |
|-----|----|--------|---------|
| Idea Engine | `ideas` | Generate ide konten viral (SPARK) | `useGenerateContentIdeas()` |
| Batch Planner | `batch` | Roadmap postingan 7/14/30 hari | `useGenerateBatchPlan()` + `useCreateScheduledPostsBatch()` |
| Trend Radar | `trends` | Audit tren 3-gate (Fit/Safety/Timing) | `useEvaluateTrend()` |
| Brand Brain | `brand-brain` | Kelengkapan DNA + editor Markdown | `useSkillDetail()` + `BrandBrainEditorDialog` |
| Playbooks | `playbooks` | Katalog 106 skills & packs | `SkillCatalogView` |

#### A. Idea Engine (SPARK Ideation Matrix)

**Input**:
- Topik/Fokus (opsional) — atau pilih dari `IDEA_STRATEGY_PRESETS` (5 preset: Bongkar Mitos, Tips 3-Langkah, BTS, Social Proof, Promo & Urgensi)
- Platform target (Instagram / TikTok / Twitter-X / LinkedIn) — default `instagram`
- Jumlah ide (`Slider` 3–10) — default 5

**Alur `handleGenerateIdeas`**:
```
1. Guard: clientId kosong → toast.error("Pilih klien aktif")
   ↓
2. generateIdeasMutate({ clientId, count, trendOrTopic })
   ↓
3. res.error?  → toast.error(res.error)
   res.ideas?  → setGeneratedIdeas(res.ideas) + toast.success
   ↓
4. Render grid: Badge(pillar) + format + judul + konten + Hook box
```

**Per-idea action**:
- **Copy** (`handleCopyIdea`): salin title+hook+content+format ke clipboard → toast
- **Kirim ke Composer** (`handleSendToComposer`): `router.push(serializeComposerParams("/admin/composer", { clientId, title, content, platform }))`

#### B. Batch Campaign Planner

**Input**:
- Rentang waktu (`this week`/`14 days`/`1 month`)
- Frekuensi per minggu (`Slider` 1–7) — default 3
- Kanal platform (multi-select, min 1) — default `[instagram, tiktok]`
- Campaign Goals (Textarea, **min 10 karakter**) + `BATCH_CAMPAIGN_PRESETS` (4 template)

**Alur `handleGenerateBatch`**:
```
1. Guard: !clientId → error; goals.length < 10 → error
   ↓
2. generateBatchMutate({ clientId, period, goals, postsPerWeek, platforms })
   ↓
3. Map res.plan.posts → batchPosts[] (semua `selected: true`)
   ↓
4. Render tabel matrix: checkbox | waktu | platform | judul | caption
```

**Alur `handleScheduleAllBatch`** (jadwalkan ke kalender):
```
1. Filter batchPosts.filter(p => p.selected) → guard min 1
   ↓
2. createScheduledPostsBatch(selected.map(post => ({
       client_id, title, content, platform, scheduled_at,
       status: "draft", notes, is_reserved: false, is_placeholder: false
     })))
   ↓
3. toast.success(`${successCount} postingan masuk ke Content Calendar`)
   ↓
4. setBatchPosts([])  ← reset
```

**Alur `handleCopyBatchSummary`**: format ringkasan terstruktur (nomor, platform, tanggal, caption) → clipboard.

#### C. Trend Radar & 3-Gate Vetting Engine

**Input**: Deskripsi tren (Textarea) + `TREND_VIRAL_FORMATS` (4 format) + Platform target.

**Alur `handleAuditTrend`**:
```
1. Guard: !trendDesc.trim() → error
   ↓
2. evaluateTrendMutate({ clientId: clientId || "client-default",
                         trendDescription, trendSourceOrContext: `Platform: ${platform}` })
   ↓
3. Render hasil: status GO/NO-GO + 3 gate card:
   - Gate 1 Brand Fit  → pass/fail + reason
   - Gate 2 Brand Safety → safe/risky + reason
   - Gate 3 Timing Status → status + verdict
   + remixAngle (sudut pandang unik) + draftPremise
```

**Action**: `handleAdoptTrendToIdeas(remixAngle)` → set `ideaTopic` + switch tab ke `ideas` + toast.

#### D. Brand Brain Matrix

**DNA Scoring** (`dnaMetrics` via `useMemo`): 7 pilar dicek terisi/tidak:
`who, audience, voice, pov, proof, guardrails, pillars`
→ `score = round(filledCount / 7 * 100)`

**Badge status**: 100 → "Optimal untuk AI", ≥60 → "Cukup Lengkap", <60 → "Perlu Dilengkapi".

**Markdown Studio**: setiap pilar punya tombol "Edit .md" yang memetakan ke file:
- `who`/`audience`/`pov`/`proof` → `brand-profile.md`
- `voice` → `voice.md`
- `guardrails` → `guardrails.md`
- `pillars` → `content-pillars.md`

**Wawancara AI**: tombol "Wawancara AI Brand Profile" → `handleStartBrandInterview("brand-profile")` → `SkillInterviewModal`. Auto-launch via URL: `?tab=brand-brain&interview=true` atau `?skill=<id>`.

#### E. Playbooks (106 Skills)

Render `<SkillCatalogView clientId={clientId} clientName={client.name} />` — katalog 106 strategic skills + 17 topic packs, assign ke klien.

#### Wiring State & URL

| State | Mekanisme |
|-------|-----------|
| Tab aktif | `useQueryState("tab")` + `localTab` (optimistic switch) |
| Skill interview | `useQueryState("skill")` |
| Interview trigger | `useQueryState("interview")` → auto-open modal |
| Klien aktif | `useActiveDashboard()` → `clientId` dari `?clientId=` |

#### Wiring Tombol (Ringkasan)

| Tombol | Handler | Efek |
|--------|---------|------|
| **Racik Ide Konten Sekarang** | `handleGenerateIdeas` | Mutasi → render grid ide |
| **Kirim ke Composer** (per-ide) | `handleSendToComposer` | Redirect `/admin/composer` + params |
| **Copy** (per-ide) | `handleCopyIdea` | Clipboard + toast |
| **Generate Batch Plan Sekarang** | `handleGenerateBatch` | Mutasi → render tabel matrix |
| **Jadwalkan (N) ke Kalender** | `handleScheduleAllBatch` | Batch insert scheduled_posts |
| **Salin Ringkasan** | `handleCopyBatchSummary` | Clipboard ringkasan |
| **Audit Kelayakan Tren Sekarang** | `handleAuditTrend` | Mutasi → render 3 gate |
| **Racik Ide dari Tren Ini** | `handleAdoptTrendToIdeas` | Prefill topik + switch tab |
| **Buka Markdown Studio (.md)** | `handleOpenBrandEditor` | Buka `BrandBrainEditorDialog` |
| **Wawancara AI Brand Profile** | `handleStartBrandInterview` | Buka `SkillInterviewModal` |
| **Buka Composer** (header) | `router.push(...)` | Redirect composer |

---

### 4.3 Content Calendar (`/admin/calendar`)

**Fungsi**: Kalender berlapis untuk melihat semua jadwal posting per channel.

**Fitur**:
- Multi-layer: filter by Campaign, Instagram, TikTok
- Drag-and-drop reschedule
- Color-coded per platform
- Today's Action Center widget

**Wiring**:
- Filter: `useQueryStates({ dateRange, platform })` (nuqs)
- Add Post: Opens dialog → `createScheduledPost()` → invalidate calendar cache

---

### 4.4 Campaigns (`/admin/campaigns`)

**Fungsi**: Kelola kampanye marketing per klien.

**CRUD Operations**:
- List: `getCampaigns(clientId)`
- Create: `createCampaign(input)`
- Update: `updateCampaign(id, input)`
- Delete: `deleteCampaign(id)`

**Wiring Tombol**:
- Tambah Campaign: Form dialog → validate Zod → `createCampaign()` → toast
- Edit: Pre-fill form → `updateCampaign()`
- Delete: ConfirmDialog → `deleteCampaign()` → invalidate

---

### 4.5 Clients (`/admin/clients`)

**Fungsi**: Manajemen multi-klien (tambah, edit, hapus, switch workspace).

**Komponen**:
- `ClientManager`: Grid card semua klien + Quick Onboarding wizard
- `AddClientHeaderButton`: Tombol tambah di header
- `BrandBrainEditorDialog`: Edit brand profile per klien
- `ClientPlaybooksDialog`: Assign playbooks to client

**Wiring Tombol**:
- **Tambah Client** → `useCreateClient().openCreateClient()` → wizard modal
- **Playbooks** → `setSelectedClientForPlaybooks(client)` → dialog opens
- **Brand Brain** → `setSelectedClientForEditor(client)` → editor opens
- **Switch Workspace**: Click client card → `useQueryState("clientId", ...)` → refresh dashboard

---

### 4.6 Social Accounts (`/admin/social-accounts`) — DEEP DIVE

**Fungsi**: Kelola akun sosial media klien (Instagram, TikTok, X, LinkedIn) via integrasi **Ayrshare** (bridge publishing) + manajemen brand profile. Service: `features/social-accounts/api/service.ts`.

#### Fungsi Service (6 fungsi inti)

| Fungsi | Deskripsi |
|--------|-----------|
| `getClientsWithChannels()` | List semua klien + channels + dashboard profile (parallel + Map lookup) |
| `disconnectChannel(channelId)` | Hapus koneksi channel + audit |
| `syncChannel(channelId)` | Refresh data dari Ayrshare → update avatar/handle/status |
| `updateBrandProfile(clientId, profile)` | Tulis JSONB **DAN** markdown file (dual-write) |
| `generateBrandProfile(input)` | AI-generate brand profile dari interview |
| `requestOAuthUrl({ clientId, platform })` | Dapatkan OAuth URL untuk connect channel |

#### A. `getClientsWithChannels` — Optimasi Kinerja (Faktual)

Kode ini punya **2 optimasi eksplisit** yang terdokumentasi di komentar:

```
SEBELUM (waterfall):  T_total = T_clients + T_channels + T_profiles
SESUDAH (parallel):   T_total = max(T_clients, T_channels, T_profiles)

SEBELUM (loop find):  O(n × m)  ← .find()/.filter() di dalam loop
SESUDAH (Map lookup): O(n + m)  ← channelsByClient Map
```

**Alur**:
```
Promise.all([clients, client_channels, dashboard_profiles])  ← 3 query paralel
   ↓
Guard: clientsError → return []
   ↓
Build Map: profileByClient (client_id → audience_size)
Build Map: channelsByClient (client_id → channels[])
   ↓
clients.map(client => ({ ...client, channels, dashboard_profile }))
```

**Catatan**: Filter `.not("name", "ilike", "%Test Client%")` untuk mengecualikan klien test.

#### B. Alur `syncChannel` (Ayrshare Bridge)

```
1. Ambil channel (client_id, platform)
   ↓ (guard: not found → throw)
2. Ambil client.ayrshare_profile_key
   ↓ (guard: tidak ada → throw "Ayrshare profile key not found")
3. Guard: env.server.AYRSHARE_API_KEY ada?
   ↓
4. GET https://app.ayrshare.com/api/profiles
   Headers: { Authorization: Bearer <key>, Profile-Key: <profile_key> }
   ↓
5. profiles[platform.toLowerCase()] ada?
   ├─ ADA   → update client_channels: { avatar_url, handle, status: "terhubung" }
   │          logAudit('social.sync_success')
   └─ TIDAK → update client_channels: { status: "gagal" }
              logAudit('social.sync_failed') + throw
```

#### C. `updateBrandProfile` — Dual-Write Pattern (Penting)

Brand profile ditulis ke **DUA tempat** sekaligus agar konsisten:

```
1. UPDATE clients SET brand_profile = <JSONB>   ← dibaca Settings UI
   ↓
2. brandProfileToMarkdown(profile)              ← konversi ke format kanonik
   ↓
3. UPSERT client_files (path: "brand-profile.md")  ← dibaca Copilot/AI
   onConflict: "client_id,path"
   ↓
4. logAudit('brand.update')
```

**Struktur markdown hasil konversi**:
```markdown
# Brand Profile
## Who We Are            ← profile.who
## Audience Persona      ← profile.audience
## Voice & Guardrails
### Tone of Voice        ← profile.voice
### Point of View        ← profile.pov
### Proof & Credibility  ← profile.proof
### Do's and Don'ts      ← profile.guardrails
## Content Pillars       ← profile.pillars (bulleted)
```

**Alasan dual-write**: Settings UI baca JSONB (query cepat), sedangkan Copilot/AI baca file markdown sebagai context. Keduanya harus sinkron.

#### Wiring Tombol

| Tombol | Handler | Efek |
|--------|---------|------|
| **Connect Channel** | `requestOAuthUrl({ clientId, platform })` | Redirect ke OAuth Ayrshare |
| **Sync Channel** | `syncChannel(channelId)` | Fetch Ayrshare → update avatar/handle/status |
| **Disconnect** | `disconnectChannel(channelId)` | Delete `client_channels` + audit |
| **Generate Brand Profile** | `generateBrandProfile(input)` | AI interview → save (dual-write) |
| **Edit Brand Profile** | `updateBrandProfile(clientId, profile)` | Tulis JSONB + markdown |

---

### 4.7 ERP Dashboard (`/admin/erp`) — DEEP DIVE

**Fungsi**: Dashboard eksekutif untuk tracking ROI, budget, dan KOL. Service: `features/erp/api/service.ts`.

**Prinsip Desain (faktual dari kode)**: Semua helper READ **degrade gracefully** — mengembalikan `[]` alih-alih throw, agar TanStack Query tidak reject saat render (mencegah warning "Cannot update Router while rendering").

#### 4 Sub-modul & Tabel DB

| Sub-modul | Tabel | Service | Deskripsi |
|-----------|-------|---------|-----------|
| Budget Ledger | `client_budgets` | `getClientBudgets(clientId)` | Buku dompet bulanan; urut `month` desc |
| Expense Tracker | `expenses` | `getExpenses(clientId)` | Pengeluaran KOL/Ads/Event; urut `expense_date` desc |
| Ads Tracker | `ad_spend_logs` | `getAdSpendLogs(clientId)` | Smart manual logging spending & klik; urut `log_date` desc |
| KOL CRM | `kols` | `getKOLs(clientId)` | Rate card, niche, contact, platforms; urut `created_at` desc |

#### Struktur Data (dari `features/erp/api/types.ts`)

```typescript
ClientBudget  { id, client_id, month, total_budget, remaining_balance, created_at, updated_at }
Expense       { id, client_id, budget_id, amount, category, description, expense_date, created_at }
AdSpendLog    { id, client_id, campaign_name, spend, clicks, log_date, created_at }
KOL           { id, client_id, name, niche, contact_info, rate_card, platforms, notes, created_at }
```

#### Pola Query (TanStack)

```
useQuery(erpQueries.budgets(clientId))   → ClientBudget[]
useQuery(erpQueries.expenses(clientId))  → Expense[]
useQuery(erpQueries.adSpend(clientId))   → AdSpendLog[]
useQuery(erpQueries.kols(clientId))      → KOL[]
```

Semua read helper punya guard `if (!clientId) return []` + `logger.error` pada error, lalu return `[]`.

#### Wiring Tombol

| Tombol | Aksi | Efek |
|--------|------|------|
| **Tambah Expense** | Form → `createExpense()` | Insert `expenses` → invalidate budget ledger |
| **Log Ad Spend** | Form → `createAdSpendLog()` | Insert `ad_spend_logs` → update trendline |
| **Assign KOL** | Form → `createKOL()` | Insert `kols` → link ke campaign |
| **Export PDF** | `exportDeliverablePdf()` | Generate laporan eksekutif branded |

#### Alert Budget (90% Threshold)

Sistem mengirim **Alert Telegram** otomatis ketika pengeluaran menyentuh batas kritis (misal 90% dari `total_budget`). Dihitung dari `remaining_balance` vs `total_budget`.

---

### 4.8 Settings (`/admin/settings`)

**Fungsi**: Pengaturan sentral (AI providers, Bridge, User, Audit).

**Tab**:
- AI Providers: CRUD provider (OpenAI, ollama, dll)
- Bridge: Integrasi external tools
- User: Manage users & roles
- Audit: Activity logs

**Wiring Tombol**:
- **Test Connection**: `testAiProviderConnection(providerId)` → show result toast
- **Set Default**: `setDefaultAiProvider(providerId)` → update primary AI

---

### 4.9 Analytics (`/admin/analytics`) — DEEP DIVE

**Fungsi**: Metrik mendalam per klien, prediksi performa, dan audit performa berbasis AI (METER framework). Service: `features/analytics/api/service.ts` (716 baris).

#### Fungsi Service

| Fungsi | Deskripsi |
|--------|-----------|
| `getPostMetricsByClient(clientId)` | List post metrics (urut `recorded_at` desc) |
| `getAnalyticsSummariesByClient(clientId)` | List analytics summaries (urut `period_end` desc) |
| `getLatestPrediction(clientId)` | Prediksi terbaru (limit 1, urut `target_month` desc) |
| `auditPerformanceAndIterate(input)` | Audit AI (METER) + 3 iterasi actionable |
| `getMultiAccountAnalytics(...)` | Analitik multi-akun |
| `syncMultiAccountSocialData(input)` | Sync data sosial multi-akun via bridge |

#### Struktur Data

```typescript
PostMetric {
  id, post_id, client_id, platform,
  views, reach, likes, comments, shares, saves, clicks,
  wa_inquiries?, dm_inquiries?, recorded_at
}
AnalyticsSummary {
  id, client_id, campaign_tag, period_start, period_end,
  ai_insight, total_reach, total_engagement, created_at
}
AnalyticsPrediction {
  target_month, forecasted_reach, forecasted_er,
  forecasted_wa_inquiries, forecasted_dm_inquiries,
  estimated_roi_multiplier, confidence_score
}
```

#### Alur `auditPerformanceAndIterate` (METER Framework)

**Langkah 1 — Ambil data faktual (parallel)**:
```
Promise.all([
  post_metrics WHERE client_id,      ← metrik
  scheduled_posts (id, title, ...),  ← info post
  clients.name,                       ← nama klien
])
   ↓
Guard: metrics.length === 0 → return error
  "Belum ada data metrik faktual... Hubungkan akun sosial media..."
```

**Langkah 2 — Agregasi faktual (NO NaN, NO fabricated)**:
```
totalReach, totalLikes, totalComments, totalShares, totalSaves, totalClicks
totalInquiries = Σ(wa_inquiries + dm_inquiries)
engagement = likes + comments + shares + saves
er = reach > 0 ? (engagement / reach * 100).toFixed(2) : "0%"
avgEr = totalReach > 0 ? (totalEngagement / totalReach * 100).toFixed(2) : "0.0"
```

**Langkah 3 — Muat AI Context**:
```
Promise.all([
  loadSkillBundle(supabase, "analytics-and-reporting"),
  loadClientFiles(supabase, clientId),
])
brand = brandContext(clientName, clientFiles)
```

**Langkah 4 — System Prompt METER** (dari kode faktual):
```
You are an expert Social Media Analytics Director operating under the METER framework.
1. Measure what maps to goals: SIGNAL metrics (saves, shares, watch time,
   ER by reach, clicks, inquiries), NEVER vanity numbers alone.
2. Evaluate honestly: benchmark relative; do not fabricate or sugarcoat.
3. Report & Re-cycle: explain why top performers worked, diagnose root causes,
   provide exactly 3 concrete, prioritized actionable iterations for next week.
```

**Prinsip Anti-Fabrikasi**: Jika `metrics.length === 0`, sistem **menolak** menganalisis (return error jelas) alih-alih mengarang angka — sesuai Product Principle #3 "Faktual & Transparan".

#### Prediction Model

`getLatestPrediction` mengambil 1 row terbaru dari `analytics_predictions` (urut `target_month` desc). Model memprediksi:
- `forecasted_reach`, `forecasted_er`
- `forecasted_wa_inquiries`, `forecasted_dm_inquiries`
- `estimated_roi_multiplier`, `confidence_score`

#### Wiring Tombol

| Tombol | Handler | Efek |
|--------|---------|------|
| **Sync Social Data** | `syncMultiAccountSocialData(clientId)` | Trigger fetch multi-akun via bridge |
| **Audit & Iterate** | `auditPerformanceAndIterate({ clientId, period })` | AI METER audit + 3 iterasi |
| **View Prediction** | `getLatestPrediction(clientId)` | Tampilkan forecast bulan target |

---

### 4.10 Media Library (`/admin/library`) — DEEP DIVE

**Fungsi**: Pusat penyimpanan aset per klien, terintegrasi dengan Cloudinary (via `mediaAdapter`). Setiap aset di-scope ketat ke `client_id` (tenant isolation).

#### Batasan & Guardrails (dari `features/library/api/service.ts`)

| Konstanta | Nilai | Fungsi |
|-----------|-------|--------|
| `MAX_BYTES` | 25 MB | Batas ukuran file per upload |
| `MAX_BATCH` | 100 | Batas jumlah aset per operasi batch |
| `MAX_TAGS` | 20 | Batas tag per aset |
| `MAX_TAG_LENGTH` | 40 char | Batas panjang tiap tag |
| `ALLOWED_TYPES` | jpeg, png, webp, mp4, quicktime | Whitelist MIME type |

#### Fungsi Service (Layer Data Access)

| Fungsi | Signature | Deskripsi |
|--------|-----------|-----------|
| `listAssets` | `(filters: AssetListFilters) => Promise<Asset[]>` | List aset, filter by `fileType` & `tag`, urut `sort_order` lalu `created_at` |
| `uploadAsset` | `(clientId, file) => Promise<AssetUploadResponse>` | Validasi → upload ke Cloudinary → insert DB → log audit |
| `deleteAsset` | `(assetId, clientId) => Promise<{success, error?}>` | Hapus 1 aset (predikat `client_id` ganda) |
| `deleteAssets` | `(assetIds[], clientId) => Promise<BatchResult>` | Hapus massal (maks 100), satu statement tenant-scoped |
| `tagAssets` | `(assetIds[], clientId, tags[]) => Promise<BatchResult>` | **Merge additive** tag (union, tidak overwrite) |
| `reorderAssets` | `(orderedIds[], clientId) => Promise<BatchResult>` | Simpan urutan grid manual; tolak duplikat id |

#### Alur Upload Aset (Detail)

```
1. User drag-drop file
   ↓
2. uploadAsset(clientId, file) dipanggil
   ↓
3. authorizeFor(clientId)          ← Cek session + role admin/owner
   ↓ (throw jika unauthorized)
4. Validasi berlapis:
   - file.size > 25MB?         → fail("File exceeds the 25MB limit")
   - MIME tidak di whitelist?  → fail("Unsupported file type")
   - mediaAdapter configured?  → fail("Media storage is not configured")
   ↓
5. mediaAdapter.uploadFile(file, `frhm/${clientId}`)
   ↓ (Cloudinary upload)
6. Insert row ke tabel `assets` via service client
   ↓
7. logAudit({ action: 'asset.upload', ... })   ← Activity trail
   ↓
8. Return { asset, success: true }
```

#### Alur Batch Delete (Tenant-Safe)

```
deleteAssets(assetIds, clientId)
   ↓
1. Guard: length 0 → error; length > 100 → error
   ↓
2. authorizeFor(clientId)
   ↓
3. Single SQL: DELETE ... WHERE id IN (...) AND client_id = <clientId>
   ↓  ↑ predikat client_id WAJIB → tidak bisa lintas tenant
4. logAudit({ action: 'asset.batch_delete', count })
```

#### Alur Tag Merge (Additive)

```
tagAssets(assetIds, clientId, newTags)
   ↓
1. normalizeTags(newTags)  ← trim, lowercase, dedupe, cap 20×40char
   ↓
2. READ current tags (tenant-scoped)   ← agar merge tidak destruktif
   ↓
3. For each asset: tags = Set([...existing, ...new]).sort()
   ↓
4. UPDATE per-row (dengan predikat client_id)
   ↓
5. logAudit({ action: 'asset.batch_tag' })
```

#### AI Caption (Library AI — `features/library/api/ai.ts`)

**Fungsi**: `generateAssetCaption(clientId, assetUrl, assetType)` — minta 2 draft caption dari model vision-capable.

**Prinsip Fail-Closed**:
- Provider hilang / respons non-2xx → return error string, **bukan** caption buatan
- Video tidak didukung → error jelas: "Caption AI belum mendukung video"
- Setiap panggilan di-log via `logAiUsage()` (tokens, latency, model, error)

**Alur**:
```
assertCanUseClient(clientId)     ← auth mirror
   ↓
resolveProvider(supabase)        ← ambil provider dari DB (fallback env)
   ↓
POST {base_url}/v1/chat/completions
   - system prompt: "copywriter media sosial, 2 opsi caption + 3 hashtag"
   - user content: [{ text }, { image_url: previewUrl(assetUrl) }]
   - timeout 30s (AbortSignal.timeout)
   ↓
logAiUsage({ route: 'library/asset-caption', tokens, latency })
   ↓
return { caption } | { caption: '', error }
```

#### Wiring Tombol (UI)

| Tombol | Handler | Service Call |
|--------|---------|--------------|
| **Upload (drag-drop)** | Dropzone handler | `uploadAsset(clientId, file)` |
| **Delete Single** | Row action menu | `deleteAsset(assetId, clientId)` |
| **Delete Selected** | Bulk toolbar | `deleteAssets(assetIds, clientId)` |
| **Tag Selected** | Tag input + apply | `tagAssets(assetIds, clientId, tags)` |
| **Reorder (drag)** | Grid reorder handler | `reorderAssets(orderedIds, clientId)` |
| **Generate Caption** | Per-asset AI button | `generateAssetCaption(clientId, url, type)` |

#### Keamanan Berlapis

1. **Layer Auth**: `authorizeFor()` — session + role check
2. **Layer Tenant**: Setiap query punya predikat `.eq('client_id', clientId)`
3. **Layer Audit**: Semua mutasi (upload/delete/tag) → `logAudit()`
4. **Layer Validasi**: Size, MIME whitelist, batch limit, tag normalization
5. **Layer Storage**: Path Cloudinary selalu `frhm/${clientId}/` (prefix tenant)

---

### 4.11 Support (`/admin/support`)

**Fungsi**: Ticket management untuk komunikasi dengan klien.

**Wiring Tombol**:
- **Create Ticket**: Form → `createSupportTicket()` → assign to client
- **Reply Ticket**: Internal note / client-facing reply
- **Close Ticket**: Status transition to resolved

---

### 4.12 Deliverables & Client Review Portal (`/admin/erp` + `/review/[id]`) — DEEP DIVE

**Fungsi**: Manajemen deliverable dengan **state machine** + portal review klien mandiri. Service: `features/deliverables/api/service.ts` (482 baris).

#### State Machine (Deliverable Status)

```
┌─────────┐   send    ┌───────┐   approve   ┌──────────┐
│  draft  │ ────────► │ sent  │ ──────────► │ approved │
└─────────┘           └───┬───┘             └────┬─────┘
                          │                      │
                    request revision         schedule
                          ▼                      ▼
                  ┌────────────────────┐   ┌──────────────────┐
                  │ revision_requested │   │ scheduled_posts  │
                  └────────────────────┘   │ (auto-publish)   │
                                           └──────────────────┘
```

**Type**: `DeliverableStatus = "draft" | "sent" | "approved" | "revision_requested"`
**Type**: `DeliverableType = "brief" | "content" | "report"`

#### Fungsi Service (7 fungsi inti)

| Fungsi | Signature | Deskripsi |
|--------|-----------|-----------|
| `getDeliverablesByClient` | `(clientId) => Promise<Deliverable[]>` | List semua deliverable klien |
| `createDeliverable` | `(input) => Promise<Deliverable>` | Buat deliverable baru |
| `promoteSkillOutputToDeliverable` | `(input) => Promise<...>` | Naikkan output skill → deliverable |
| `updateDeliverableStatus` | `(input) => Promise<{success, error?}>` | Update status + sync skill_outputs |
| `getDeliverableById` | `(id) => Promise<DeliverableDetailResponse \| null>` | Detail + client + comments + feedback |
| `submitDeliverableReview` | `(input) => Promise<{success, deliverable?, error?}>` | Review klien (approve/revisi + rating) |
| `scheduleApprovedDeliverable` | `(input) => Promise<{success, scheduledPost?, error?}>` | Jadwalkan ke `scheduled_posts` |

#### Alur `updateDeliverableStatus` (Admin)

```
1. Zod parse: updateDeliverableStatusSchema.parse(input)
   ↓
2. Update `deliverables`: { status, updated_at, [approved_at jika approved] }
   ↓
3. SINKRONISASI: update `skill_outputs` SET status WHERE deliverable_id = ...
   ↓  ↑ penting: status deliverable & skill_output selalu konsisten
4. logAudit({ action: `deliverable.${status}` })
   ↓
5. Return { success: true }
```

#### Alur `submitDeliverableReview` (Klien — 7 Langkah)

```
1. Ambil deliverable saat ini (id, client_id, title, type, status)
   ↓ (guard: tidak ada → "Deliverable tidak ditemukan")
2. Ambil data client (id, name)
   ↓
3. Update status deliverable: { status, updated_at, [approved_at] }
   ↓
4. Sinkronkan status ke `skill_outputs` (jika ada)
   ↓
5. Jika ada feedbackNote → INSERT ke `deliverable_comments`
      { author_role: "client", content }
   ↓
6. Jika ada rating (bintang) → INSERT ke `feedback`
      { rating, title: "Review: <title>", status: "acknowledged" }
   ↓
7. logAudit({ action: `deliverable.client_${status}` })
   ↓
8. NOTIFIKASI TELEGRAM ADMIN (non-blocking, try/catch):
      🔔 [Frhm Client Portal Review]
      Klien: <name> | Dokumen: <title>
      Status: DISETUJUI ✅ / MINTA REVISI ⚠️
      Rating: ⭐⭐⭐⭐⭐ | Catatan: <feedbackNote>
```

**Penting**: Langkah 8 dibungkus `try/catch` — jika Telegram gagal, review tetap tersimpan (fail-safe).

#### Alur `scheduleApprovedDeliverable`

```
1. Zod parse: scheduleDeliverableSchema.parse(input)
   ↓
2. Insert ke `scheduled_posts` (status: draft/scheduled)
   ↓
3. Siap dipublish otomatis oleh:
   - POST /api/cron/publish  (cron tiap menit)
   - WoopSocial MCP Bridge
```

#### Struktur Data (dari `features/deliverables/api/types.ts`)

```typescript
Deliverable {
  id, client_id, type, title, content_md, external_link,
  status, created_by, updated_by,
  created_at, updated_at, sent_at, approved_at
}
DeliverableComment  { id, deliverable_id, author_name, author_role, content, created_at }
DeliverableFeedback { id, deliverable_id, client_id, rating, title, comment, status, created_at }
DeliverableDetailResponse {
  deliverable, client: { id, name, brand_profile? }, comments[], feedback[]
}
```

#### Client Review Portal (`/review/[id]`)

Halaman mandiri (tanpa login admin) untuk klien mereview deliverable:
- `app/review/[id]/page.tsx` → `getDeliverableById(id)` (server component)
- `client-review-portal.tsx` → interaksi review (approve / minta revisi + rating bintang)
- Prefetch detail via `queryClient.prefetchQuery(deliverableQueries.detail(id))`

#### Wiring Tombol

| Tombol | Handler | Efek |
|--------|---------|------|
| **Move Card (Kanban)** | Drag | `updateDeliverableStatus(id, status)` → sync skill_outputs |
| **Export PDF** | `exportDeliverablePdf(id)` | Branded executive PDF |
| **Schedule** | `scheduleApprovedDeliverable(id)` | Insert `scheduled_posts` → cron publish |
| **Setujui Revisi** (klien) | `submitDeliverableReview` | status=approved + rating + notif Telegram |
| **Minta Revisi** (klien) | `submitDeliverableReview` | status=revision_requested + comment + notif |
| **Promote Skill Output** | `promoteSkillOutputToDeliverable` | Output skill → deliverable baru |

---

### 4.13 Scheduled Posts (`/admin/calendar`)

**Fungsi**: Manajemen post yang sudah dijadwalkan.

**CRUD**:
- `getScheduledPostsByClient(clientId)`
- `createScheduledPost(input)` / `createScheduledPostsBatch(inputs[])`
- `updateScheduledPost(id, updates)`
- `deleteScheduledPost(id, clientId?)`

---

### 4.14 Skills (`/admin/ai` - Playbooks tab)

**Fungsi**: 106 strategic skills & topic packs.

**CRUD**:
- `getSkills(filters)`
- `getSkillPacks()`
- `getSkillDetail(skillId)`
- `assignPackToClient(packId, clientId)`
- `updateClientSkillStatus(clientId, skillId, status)`
- `saveSkillOutput(clientId, skillId, output)`

**Wiring Tombol**:
- **Interview Skill**: `handleStartBrandInterview(skillId)` → SkillInterviewModal
- **Assign to Client**: `assignPackToClient(packId, clientId)`
- **Save Output**: `saveSkillOutput(clientId, skillId, output)` → persist to DB

---

### 4.15 Notifications (`/admin/settings` - notification tab)

**Fungsi**: Konfigurasi notifikasi WhatsApp & Telegram.

**Endpoints**:
- `POST /api/telegram/webhook` — Incoming webhook handler
- `POST /api/telegram/test` — Test notification
- `POST /api/telegram/preferences` — Set user preferences
- `POST /api/telegram/disconnect` — Disconnect Telegram

**Wiring Tombol**:
- **Test Notification**: `testNotificationDispatch(target)` → send test message
- **Dispatch Review**: `dispatchReviewNotification(deliverableId)` → notify client

---

### 4.16 Content Production (`/admin/erp`)

**Fungsi**: State-machine kanban untuk produksi konten.

**CRUD**:
- `getContentProductions(clientId)`
- `createContentProduction(input)`
- `updateContentProduction(id, updates)`
- `deleteContentProduction(id)`

---

## 5. Wiring Tombol & Interaksi

### Pola Standar Form Submit

```tsx
// 1. Create form hook
const { control, handleSubmit } = useAppForm()

// 2. Handle submit
const onSubmit = handleSubmit(async (data) => {
  try {
    const result = await createResource(data)
    toast.success("Berhasil!")
    router.refresh()
  } catch (err) {
    toast.error("Gagal: " + err.message)
  }
})

// 3. Button wiring
<Button onClick={onSubmit}>Simpan</Button>
```

### Pola Standard Mutation

```tsx
// Query factory
const { data, isLoading } = useQuery(erpQueries.budgets(clientId))

// Mutation
const mutation = useMutation({
  mutationFn: (input) => createExpense(input),
  onSuccess: () => queryClient.invalidateQueries(erpQueries.budgets(clientId)),
})
```

### Pola Optimistic Update

```tsx
const mutation = useMutation({
  onMutate: async (newStatus) => {
    await queryClient.cancelQueries({ queryKey: deliverableKeys.list(clientId) })
    const previous = queryClient.getQueryData(deliverableKeys.list(clientId))
    queryClient.setQueryData(deliverableKeys.list(clientId), (old: Deliverable[]) => 
      old.map(d => d.id === id ? { ...d, status: newStatus } : d)
    )
    return { previous }
  },
  onError: (_, __, context) => {
    queryClient.setQueryData(deliverableKeys.list(clientId), context?.previous)
  },
})
```

### Pola Dialog/Modal

```tsx
// Open handler
const handleOpen = () => setOpen(true)

// Dialog component
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="backdrop-blur-2xl rounded-3xl">
    <DialogHeader>...</DialogHeader>
    <DialogBody>...</DialogBody>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
      <Button onClick={handleSubmit}>Konfirmasi</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 6. Database Schema & RLS

### Tabel Utama

| Tabel | Fungsi | RLS Policy |
|-------|--------|------------|
| `clients` | Multi-tenant isolation | `tenant_id` matching |
| `channels` | Social media connections | `client_id` foreign key |
| `deliverables` | Content items (Ide→Done) | `client_id` isolation |
| `scheduled_posts` | Calendar scheduling | `client_id` isolation |
| `campaigns` | Marketing campaigns | `client_id` isolation |
| `budgets` | Monthly budget tracking | `client_id` isolation |
| `expenses` | KOL/Ads/Event costs | `client_id` isolation |
| `ad_spend_logs` | Ads tracking data | `client_id` isolation |
| `kol` | KOL/Partner CRM | `client_id` isolation |
| `support_tickets` | Client communication | `client_id` isolation |
| `dashboard_profiles` | KPI metrics storage | `client_id` isolation |
| `brand_files` | Markdown content | `client_id` isolation |
| `skills` | Strategic skill catalog | Global (no client restriction) |
| `client_skills` | Skill assignments | `client_id` isolation |

### RLS Enforcement

Semua tabel memiliki RLS policies yang enforce:
```sql
-- Contoh policy
CREATE POLICY "Isolate by tenant" ON deliverables
  FOR ALL USING (client_id IN (
    SELECT client_id FROM clients WHERE tenant_id = current_setting('app.current_tenant')
  ))
```

**Rule Mutlak**: Query backend WAJIB scoped by `tenant_id`/`client_id`.

---

## 7. API Routes

### Auth Endpoints
| Method | Path | Fungsi |
|--------|------|--------|
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/forgot-password` | Password reset request |
| POST | `/api/auth/set-password` | Set new password (token flow) |

### AI/Content Endpoints
| Method | Path | Fungsi |
|--------|------|--------|
| POST | `/api/copilot/ideas` | Generate SPARK ideas |
| POST | `/api/copilot/batch-plan` | Generate batch campaign plan |
| POST | `/api/copilot/caption` | Generate caption |
| POST | `/api/copilot/video-script` | Generate video script |
| POST | `/api/copilot/hooks` | Generate hooks |
| POST | `/api/copilot/carousel` | Generate carousel |
| POST | `/api/copilot/repurpose` | Repurpose content cross-platform |

### Trend Analysis
| Method | Path | Fungsi |
|--------|------|--------|
| POST | `/api/trends/radar` | 3-gate trend vetting |
| POST | `/api/trends/generate` | Trend idea generation |

### Social Integration
| Method | Path | Fungsi |
|--------|------|--------|
| GET | `/api/social/oauth-url` | Get OAuth URL for platform |
| GET | `/api/social/callback` | OAuth callback handler |
| POST | `/api/social/audit` | Performance audit |

### Notifications
| Method | Path | Fungsi |
|--------|------|--------|
| POST | `/api/telegram/webhook` | Incoming Telegram webhook |
| POST | `/api/telegram/test` | Test notification |
| POST | `/api/telegram/preferences` | Set user preferences |
| POST | `/api/telegram/disconnect` | Disconnect Telegram |
| POST | `/api/whatsapp/webhook` | Incoming WhatsApp webhook |

### Skills/AI Studio
| Method | Path | Fungsi |
|--------|------|--------|
| POST | `/api/skills/run` | Execute skill interview |

### Support
| Method | Path | Fungsi |
|--------|------|--------|
| POST | `/api/support/submit` | Submit support ticket |

---

## 8. Cron & Background Jobs

### Scheduled Tasks (via Supabase Cron)

| Job | Schedule | Fungsi |
|-----|----------|--------|
| `publish` | Every minute | Publish scheduled posts that are due |
| `sync-analytics` | Every 6 hours | Fetch latest metrics from social platforms |
| `daily-insight` | Daily 00:00 | Generate daily performance insights |
| `reminders` | Hourly | Send pending task reminders |
| `check-zero-metrics` | Daily | Alert on zero-metric clients |

### API Routes for Cron
- `POST /api/cron/publish` — Trigger publishing engine
- `POST /api/cron/sync-analytics` — Trigger analytics sync
- `POST /api/cron/daily-insight` — Generate daily insight
- `POST /api/cron/reminders` — Send reminders
- `POST /api/cron/check-zero-metrics` — Check for zero metrics

---

## 9. Keamanan & Isolasi Tenant

### Layer 1: Authentication
- 100% Supabase Auth (tidak ada Clerk)
- Session cookie management via `lib/supabase/server.ts`
- Role-based access: `admin` vs `user`

### Layer 2: Authorization
- Middleware (`middleware.ts`) membaca user headers dan forwarding ke request
- Admin-only routes: `/admin/*` redirect non-admin ke `/admin/dashboard`
- Client routes: `/client/*` require authenticated session

### Layer 3: Row-Level Security (RLS)
- Semua query backend mem-filter by `client_id`
- RLS policies di PostgreSQL memastikan data tidak bocor antar tenant
- `authorizeFor()` helper THROW exception jika unauthorized

### Layer 4: Preview Guard
- `/preview-*` routes memvalidasi tenant isolation
- `lib/preview-guard.ts` mencegah akses data klien lain

### Layer 5: Environment Security
- Rule 15: Semua env variable harus melalui Zod schema di `lib/env.ts`
- Secret keys tidak pernah di-hardcode
- `.env.local` di-ignore di git

---

## 10. Troubleshooting Umum

### Masalah: Hydration Mismatch
**Gejala**: Console error `Server Functions cannot be called during initial render`
**Penyebab**: `useSuspenseQuery` dipakai tanpa `placeholderData`, atau component menampilkan nilai berbeda antara SSR dan CSR
**Solusi**: Gunakan pola `useQuery` + `placeholderData` (seperti di `erp-client.tsx`, `social-accounts-board.tsx`)

### Masalah: Preview Route 404
**Gejala**: `/preview-erp` atau `/preview-social-accounts` return 404
**Penyebab**: `useSuspenseQuery` di client component memicu Server Action saat render
**Solusi**: Migrasi ke `useQuery` + `placeholderData` (commit `d473430`)

### Masalah: E2E Test Connection Refused
**Gejala**: Playwright test gagal `ERR_CONNECTION_REFUSED`
**Penyebab**: Port mismatch (test hit 3000 tapi server di 3004)
**Solusi**: Pastikan `.env.local` punya `BASE_URL=http://localhost:3004` dan `dotenv.config({ override: true })` di `playwright.config.ts`

### Masalah: Tenant Data Bocor
**Gejala**: Client A melihat data Client B
**Penyebab**: Query backend tidak scoped by `client_id` atau `tenant_id`
**Solusi**: Cek setiap endpoint API, pastikan ada filter RLS-compliant

### Masalah: Build Failed
**Gejala**: `npm run build` error
**Solusi**:
1. Jalankan `npx tsc --noEmit` untuk cek TypeScript errors
2. Cek `node_modules/.pnpm-lock.yaml` consistency
3. Hapus `.next` folder dan rebuild

---

## 📎 Quick Reference

### Commands
```bash
# Development
pnpm dev                    # Start dev server at port 3004
pnpm dev:3000              # Start dev server at port 3000

# Testing
pnpm test                   # Run vitest unit tests
pnpm test:e2e              # Run Playwright E2E tests
pnpm test:e2e:watch        # Watch mode

# Audit
node scripts/frhm-audit.mjs --report     # UI/UX audit
node scripts/frhm-backend-audit.mjs      # Backend security audit

# Build
pnpm build                   # Production build
pnpm start                   # Start production server

# Database
pnpm db:migrate             # Run Supabase migrations
pnpm db:push                # Push local changes to DB
```

### Key Files
| File | Purpose |
|------|---------|
| `AGENTS.md` | Development standards & rules |
| `design.md` | UI/UX blueprint & design system |
| `PRODUCT.md` | Product truth & positioning |
| `ROADMAP.md` | Feature roadmap (Phase 1-3 complete) |
| `lib/env.ts` | Zod env validation schema |
| `features/*/api/service.ts` | Data access layer per feature |
| `features/*/api/queries.ts` | TanStack Query hook factories |

### Data Fetching Patterns
| Pattern | Usage | Example |
|---------|-------|---------|
| `useQuery + placeholderData` | Client component with suspense fallback | `erp-client.tsx` |
| `useSuspenseQuery` | Server component inside `<Suspense>` | `@chart/page.tsx` |
| `prefetchQuery` | Server component data prefetching | `app/admin/dashboard/page.tsx` |
| `useMutation` | Data mutations with invalidation | All CRUD operations |

---

*Dokumen ini dibuat berdasarkan analisis faktual kode sumber Frhm SaaS.*
