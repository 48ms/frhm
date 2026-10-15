# 📘 FRHM SaaS — Buku Petunjuk Lengkap
## Marketing ERP untuk Agensi Digital

> Versi: 1.1.0 | Terakhir diperbarui: 2026-10-16
> Tech Stack: Next.js 14+ (App Router), TypeScript, Tailwind v4, shadcn/Nova, Supabase (PostgreSQL + RLS)
>
> **Cakupan**: 16 modul admin, semuanya deep-dive (fungsi service, alur, struktur data, wiring tombol) — diverifikasi langsung dari kode sumber.

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

### 4.1 Dashboard (`/admin/dashboard`) — DEEP DIVE

**Fungsi**: Pusat kendali utama admin. Menampilkan ringkasan semua klien secara real-time. Service: `features/dashboard/api/service.ts` (228 baris).

#### Komponen (Parallel Routes)

| Slot | Komponen | Data |
|------|----------|------|
| `@hero` | Hero card dengan greeting + ringkasan | Dashboard profile |
| `@kpis` | KPI cards (Reach, Engagement, Velocity) | Metrics dari DB |
| `@chart` | Performance chart (AreaChart Recharts) | Sparkline data |
| `@hub` | Action hub (quick actions) | - |
| `@pipeline` | Content pipeline overview | Scheduled posts |

#### Cara Kerja (4 Langkah)

```
1. Server Component app/admin/dashboard/page.tsx render
   ↓
2. DashboardPrefetcher menjalankan parallel prefetch queries
   ↓
3. Setiap @slot dirender independen dengan <Suspense>
   ↓
4. useActiveDashboard() hook ambil clientId dari URL + query profile + client list
```

#### Fungsi Service (4 fungsi)

| Fungsi | Signature | Deskripsi |
|--------|-----------|-----------|
| `getClients` | `() => Promise<{id, name, contact_email}[]>` | List klien urut `name` |
| `createNewClient` | `(input) => Promise<CreateClientResult>` | Onboarding 4-langkah (lihat §4.5) |
| `getDashboardProfile` | `(clientId) => Promise<DashboardProfile \| null>` | Profil klien, **degrade → null** |
| `getDashboardProfileWithMetrics` | `(clientId) => Promise<DashboardProfile \| null>` | Profil + serialisasi metrics |

#### Alur `getDashboardProfile` — Graceful Degrade (KRITIS)

```
1. Guard: !clientId || clientId === "undefined" || clientId === "null" → return null
   ↓  ↑ melindungi dari URL param kosong
2. supabase.from("dashboard_profiles").select("*").eq("client_id", clientId).single()
   ↓
3. IF error:
   ├─ code === 'PGRST116' → return null  ← "Not found" (belum ada row)
   └─ error lain (JWT/network) → logger.error + return null
   ↓  ↑ TIDAK PERNAH throw
```

**Alasan faktual** (komentar di kode): service ini dipanggil dari render path. Jika `throw`, React Query me-reject promise saat render → warning **"Cannot update a component (Router) while rendering"**. Karena itu **degrade gracefully → null** agar konsumen memakai fallback profile.

#### Serializer `serializeMetrics` — Fix Bug KPI "0"

```
FAKTA DB: dashboard_profiles.metrics = OBJECT mentah (bukan array):
  { total_reach: 10261, total_views: 19201, audience_size: 10261,
    engagement_rate: 3.7, total_engagement: 379 }

MASALAH LAMA: UI membaca metrics[0].value → undefined (object bukan array)
  → KPI card SELALU fallback ke "0"

SOLUSI (serializeMetrics): mapping read-only, struktur DB TIDAK diubah
  1. Guard: !raw || typeof !== "object" || Array.isArray → return []
  2. num(v, suffix) → number ? toLocaleString + suffix : "0"
  3. genSpark(val) → sparkline 7-elemen deterministik:
       base = n % 10
       [n*0.6+base, n*0.7-base, n*0.8+base, n*0.75-base, n*0.85+base, n*0.95-base, n]
  4. Return 3 metric:
     - "Total Reach"       ← m.total_reach ?? m.audience_size
     - "Engagement Rate"   ← m.engagement_rate (suffix "%")
     - "Total engagement"  ← m.total_engagement
```

#### `getDashboardProfileWithMetrics` — Dual Format Handling

```
profile = await getDashboardProfile(clientId)
   Guard: !profile → return null
   ↓
metrics = Array.isArray(profile.metrics)
   ? profile.metrics          ← sudah di-cache oleh sinkronisasi
   : serializeMetrics(...)     ← raw Ayrshare object
   ↓  ↑ DB metrics bisa OBJECT (raw) ATAU ARRAY (cached)
return { ...profile, metrics }
```

#### Struktur Data

```typescript
DashboardProfile { client_id, greeting, velocity, peak_label, peak_value, insights, metrics }
DashboardMetric  { label, value, delta, trend: "up"|"down"|"neutral", spark: number[] }
CreateClientInput  { name, contact_email?, contact_phone?, niche?, telegram_chat_id? }
CreateClientResult { id, name, seededSkills }
```

#### Wiring Tombol

| Tombol | Handler | Efek |
|--------|---------|------|
| **Pilih Klien** | `useQueryState("clientId", ...)` | Refresh semua widget |
| **Toggle Timeframe** | `useQueryState("tf", ...)` | Update chart data |

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

### 4.3 Content Calendar (`/admin/calendar`) — DEEP DIVE

**Fungsi**: Kalender berlapis untuk melihat & menjadwalkan semua postingan per channel. Komponen: `app/admin/calendar/calendar-client.tsx` (1415 baris). Service: `features/scheduled-posts/api/service.ts` (via re-export `features/calendar/api/service.ts`).

#### Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| Multi-layer | Filter by Campaign, Instagram, TikTok |
| Drag-and-drop reschedule | Geser post ke hari lain (preserve time-of-day) |
| Keyboard-accessible move | Menu "Geser 1 hari" / "Geser 7 hari" (a11y) |
| Color-coded | Per platform + status dot |
| Today's Action Center | Widget aksi hari ini |
| Export | Modal export → PDF (`calendar-export-pdf.tsx`) |

#### State & URL Params (nuqs)

| Param | Type | Fungsi |
|-------|------|--------|
| `platform` | `parseAsStringEnum` | Filter platform |
| `view` | `parseAsStringEnum` | Mode tampilan (month/week) |
| `mediaUrl` | `parseAsString` | Prefill media dari URL |
| `caption` | `parseAsString` | Prefill caption |
| `title` | `parseAsString` | Prefill judul |
| `new` | `parseAsString` | Trigger dialog post baru |
| `export` | `parseAsString` | Trigger export modal |

#### Alur Drag-and-Drop Reschedule (`applyPostMove`)

```
USER: drag post card → drop ke cell tanggal
   ↓
handlePostDragStart(post, e):
   setDraggingPostId(post.id)
   e.dataTransfer.effectAllowed = "move"
   e.dataTransfer.setData("text/plain", post.id)
   ↓
handleCellDragOver(date, e):
   Guard: !draggingPostId → return   ← abaikan drag eksternal
   e.preventDefault(); dropEffect = "move"; setDragOverDate(date)
   ↓
handleCellDrop(date, e):
   postId = e.dataTransfer.getData("text/plain") || draggingPostId
   post = posts.find(p => p.id === postId)
   applyPostMove(post, date)
   ↓
applyPostMove(post, targetDate):
   1. original = new Date(post.scheduled_at)
   2. moved = new Date(targetDate); moved.setHours(original.hours, original.minutes, 0, 0)
      ↑ PRESERVE time-of-day (hanya tanggal yang berubah)
   3. Guard: moved.getTime() === original.getTime() → return  (no-op)
   4. toast.loading("Sinkronisasi jadwal...")
   5. updatePost({ id, clientId, scheduled_at: moved.toISOString() },
        onSuccess → toast.success("Jadwal dipindahkan.", { description: `${title} → ${date}` })
        onError   → toast.error("Gagal memindahkan jadwal. Coba lagi."))
```

#### Alur Keyboard-Accessible Move (`movePostByDays`)

```
Karena keyboard/screen-reader user tidak bisa drag:
   movePostByDays(post, days):
      target = new Date(post.scheduled_at); target.setDate(target.getDate() + days)
      applyPostMove(post, target)  ← funnel ke routine yang SAMA
```

**Poin desain**: Kedua jalur (drag & keyboard) **funnel ke `applyPostMove`** — satu sumber logika, konsisten.

#### Detail Teknis `handleCellDragLeave`

```
Masalah: `dragleave` juga menyala saat pointer masuk child element
         → highlight drop-target berkedip (flicker)
Solusi:  isChild = e.currentTarget.contains(e.relatedTarget)
         if (isChild) return   ← hanya clear saat benar-benar keluar cell
```

#### Alur `handleEditMedia` — Pick Soonest Scheduled

```
post = posts
  .filter(p => p.status === "scheduled")
  .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))[0]
  ?? posts[0]
   ↑ ambil post scheduled terdekat; fallback ke post pertama
Guard: !post → toast.error("Tidak ada post untuk diedit medianya")
   ↓
setEditingPost(post); setDialogOpen(true)
```

#### Alur `handleRescheduleRelease` — Shift +1 Hari

```
post = posts.find(p => p.id === release.id)
target = new Date(post.scheduled_at); target.setDate(target.getDate() + 1)
applyPostMove(post, target)
```

#### Wiring Tombol

| Tombol | Handler | Efek |
|--------|---------|------|
| **Tambah Post** | `handleAddPost(date)` | Buka `PostDialog` dengan initialDate |
| **Pilih Post** | `handleSelectPost(post)` | Buka dialog edit |
| **Drag post** | `handlePostDragStart/Drop` | `applyPostMove` → update `scheduled_at` |
| **Geser N hari** | `movePostByDays(post, n)` | Alternatif keyboard drag |
| **Edit Media** | `handleEditMedia()` | Post scheduled terdekat → dialog |
| **Reschedule Release** | `handleRescheduleRelease()` | Shift +1 hari |
| **Export** | `?export=` param | `CalendarExportModal` → PDF |

#### Service CRUD

Calendar memakai service **Scheduled Posts (§4.13)**: `getScheduledPostsByClient`, `createScheduledPost`, `updateScheduledPost`, `deleteScheduledPost`.

---

### 4.4 Campaigns (`/admin/campaigns`) — DEEP DIVE

**Fungsi**: Kelola kampanye marketing per klien. Service: `features/campaigns/api/service.ts` (86 baris). Tabel: `content_campaigns`.

#### Fungsi Service (4 fungsi CRUD)

| Fungsi | Signature | Deskripsi |
|--------|-----------|-----------|
| `getCampaigns` | `(clientId) => Promise<Campaign[]>` | List per klien, urut `created_at DESC`, **degrade → []** |
| `createCampaign` | `(input) => Promise<Campaign>` | Insert + audit `campaign.create` |
| `updateCampaign` | `(id, patch) => Promise<Campaign>` | Update `.eq("id")` + audit `campaign.update` |
| `deleteCampaign` | `(id) => Promise<void>` | Delete `.eq("id")` + audit `campaign.delete` |

#### Alur `createCampaign`

```
1. supabase.from("content_campaigns").insert(input)
   ↓
2. .select("id, client_id, name, type, start_date, end_date, color, notes, created_at").single()
   ↓
3. Guard: error → throw new Error(error.message)  ← pesan asli, bukan generik
   ↓
4. void logAudit({ action: 'campaign.create', summary: `Created campaign "${input.name}"` })
```

#### Struktur Data

```typescript
Campaign { id, client_id, name, type, start_date, end_date, color, notes, created_at }
```

- `color` → dipakai untuk color-coding di Content Calendar (§4.3)
- `start_date` / `end_date` → rentang kampanye untuk overlay kalender

#### Wiring Tombol

| Tombol | Handler | Efek |
|--------|---------|------|
| **Tambah Campaign** | Form dialog → Zod → `createCampaign()` | Insert + toast + invalidate |
| **Edit** | Pre-fill form → `updateCampaign(id, patch)` | Update + invalidate |
| **Hapus** | ConfirmDialog → `deleteCampaign(id)` | Delete + invalidate |

**Integrasi**: Campaign muncul sebagai layer overlay di **Content Calendar** — filter `?campaign=` menyaring post dalam rentang `start_date`–`end_date`.

---

### 4.5 Clients (`/admin/clients`) — DEEP DIVE

**Fungsi**: Manajemen multi-klien (tambah, edit, hapus, switch workspace). Service: `features/dashboard/api/service.ts`.

#### Service Fungsi

| Fungsi | Deskripsi |
|--------|-----------|
| `getClients()` | List klien (urut `name`) |
| `createNewClient(input)` | Buat klien + setup profil analitik + seed brand profile + assign starter pack |

#### Alur `createNewClient` — Quick Onboarding Wizard (4 Langkah)

```
Input: CreateClientInput { name, contact_email?, contact_phone?, niche?, telegram_chat_id? }
   ↓
LANGKAH 1: INSERT clients
   { name, contact_email, contact_phone, telegram_chat_id,
     brand_profile: { who: input.name, voice: default, guardrails: default, ... } }
   ↓
   Guard: error → throw "Gagal membuat klien baru"
   ↓
   logAudit('client.create')
   ↓
LANGKAH 2: INSERT dashboard_profiles (default)
   { client_id, greeting: `Halo, ${name}!`, velocity: 0, peak_label: "Waktu Aktif", insights: [] }
   ↓
   (warning only jika error — tidak break flow)
   ↓
LANGKAH 3: SEED brand-profile.md
   content:
   # Brand Profile: <name>
   ## Who We Are
   <name> adalah brand terpercaya di industri <niche>.
   (template default profesional)
   ↓
   UPSERT client_files WHERE client_id, path = "brand-profile.md"
   (warning only jika error — tidak break flow)
   ↓
LANGKAH 4: ASSIGN starter skill pack
   await assignPackToClient(clientData.id, "starter")
   ↓
   (warning only jika error — tidak break flow)
   ↓
Return: CreateClientResult { client: { id, name }, seededSkills }
```

**Penting**: Langkah 2-4 menggunakan `warn only` strategy — jika gagal, klien tetap dibuat. Ini mencegah onboarding blocker karena masalah minor.

#### Komponen UI

| Komponen | Fungsi |
|----------|--------|
| `ClientManager` | Grid card semua klien + Quick Onboarding wizard |
| `AddClientHeaderButton` | Tombol tambah di header (panggil `openCreateClient()`) |
| `BrandBrainEditorDialog` | Edit brand profile per klien via Markdown Studio |
| `ClientPlaybooksDialog` | Assign playbooks/skill packs ke klien |

#### Wiring Tombol

| Tombol | Handler | Efek |
|--------|---------|------|
| **Tambah Client** | `useCreateClient().openCreateClient()` | Buka wizard modal |
| **Playbooks** | `setSelectedClientForPlaybooks(client)` | Buka dialog assign pack |
| **Brand Brain** | `setSelectedClientForEditor(client)` | Buka editor markdown |
| **Switch Workspace** | `useQueryState("clientId", ...)` | Update URL state → refresh dashboard |

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

### 4.8 Settings (`/admin/settings`) — DEEP DIVE

**Fungsi**: Pengaturan sentral — AI Provider management, Bridge config, User & Role, Audit logs.

#### Tab AI Providers — CRUD Full

Service: `features/ai-providers/api/service.ts` (226 baris).

**Security**: Semua operasi dilindungi `assertAdmin()` — cek session + role === 'admin'. Non-admin → throw "Forbidden: only administrators can manage AI providers".

**Key Functions**:

| Fungsi | Deskripsi |
|--------|-----------|
| `getAiProviders()` | List semua provider + mask API key (`••••••••abcd`) |
| `createAiProvider(input)` | Buat baru; jika `is_default=true` → un-set provider lain |
| `updateAiProvider(id, input)` | Partial update (Zod validate); `is_default=true` → un-set lain |
| `deleteAiProvider(id)` | Hapus; guard: tidak bisa hapus provider default terakhir |
| `setDefaultAiProvider(id)` | Set default (un-set yang lain dulu) |
| `testAiProviderConnection(id)` | Kirim ping ke model, ukur latency |

**Masking Pattern** (keamanan API key):
```typescript
function maskKey(key: string | null | undefined): { has_key: boolean; masked_key: string } {
  if (!key || key.trim() === "") return { has_key: false, masked_key: "" }
  if (key.trim().length <= 8) return { has_key: true, masked_key: "••••••••" }
  return { has_key: true, masked_key: `••••••••${clean.slice(-4)}` } // last 4 chars visible
}
```

**Alur `testAiProviderConnection`**:
```
1. assertAdmin()
   ↓
2. Ambil provider (kind, model, base_url, api_key)
   ↓
3. chat(provider, "Ping connection test. Reply with word: READY", [{ role: "user", content: "TEST_CONNECTION" }])
   ↓ (import dynamic "@/lib/ai/providers")
4. latencyMs = Date.now() - start
   ↓
5. Return:
   ├─ success: true,  latencyMs, message: "Koneksi berhasil (Xms): \"...\""
   └─ success: false, latencyMs, message: "Tes koneksi gagal: <err>"
```

**Alur Create / Update (shared)**:
```
1. assertAdmin()
   ↓
2. Zod parse (CreateAiProviderSchema / UpdateAiProviderSchema)
   ↓
3. Jika is_default=true → UNSET semua provider lain
      UPDATE ai_providers SET is_default=false WHERE id != <this_id>
   ↓
4. INSERT / UPDATE provider
   ↓
5. maskKey(data.api_key)
   ↓
6. Return AiProviderMasked { has_key, masked_key }
```

**Guard Delete**:
```
1. assertAdmin()
   ↓
2. Ambil target (is_default)
   ↓
3. Jika is_default && count(ai_providers) > 1 → throw "Tidak dapat menghapus provider default..."
   ↓
4. DELETE FROM ai_providers WHERE id = <id>
```

**Data Structure** (`AiProviderMasked`):
```typescript
{ id, label, kind, model, base_url, is_default, created_at, has_key, masked_key }
```

#### Wiring Tombol

| Tombol | Handler | Efek |
|--------|---------|------|
| **Test Connection** | `testAiProviderConnection(providerId)` | Ping model → toast success/fail + latency |
| **Set Default** | `setDefaultAiProvider(providerId)` | Un-set lain → set this as default |
| **Tambah Provider** | Form → `createAiProvider(input)` | Validate → insert → re-render list |
| **Edit Provider** | Form → `updateAiProvider(id, input)` | Validate → update → re-render list |
| **Hapus Provider** | ConfirmDialog → `deleteAiProvider(id)` | Guard default → delete |

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

### 4.11 Support (`/admin/support`) — DEEP DIVE

**Fungsi**: Ticket management untuk komunikasi dengan klien. Service: `features/support/api/service.ts` (67 baris). Tabel: `support_tickets`.

#### Fungsi Service (2 fungsi)

| Fungsi | Signature | Deskripsi |
|--------|-----------|-----------|
| `getSupportTicketsByClient` | `(clientId) => Promise<SupportTicket[]>` | List tiket per klien, urut `created_at DESC`, **degrade → []** |
| `createSupportTicket` | `(input) => Promise<SupportTicket>` | Buat tiket + **auth guard** + audit |

#### Alur `createSupportTicket`

```
1. supabase.auth.getUser()
   ↓
   Guard: !user → throw "Unauthorized"  ← WAJIB, tiket harus punya created_by
   ↓
2. INSERT support_tickets {
     client_id: input.clientId || null,   ← nullable (tiket bisa global, bukan per-klien)
     created_by: user.id,                  ← dari session, BUKAN input
     subject: input.subject.trim(),
     message: input.message.trim(),
     priority: input.priority,
     status: "open",                       ← status awal selalu "open"
   }
   ↓
3. .select().single()
   Guard: error → throw "Gagal menyimpan tiket dukungan"
   ↓
4. void logAudit({ action: "support_ticket.create", summary: `Created support ticket: ${subject}` })
```

**Poin keamanan**: `created_by` diambil dari `auth.getUser()`, **tidak pernah dari input klien** — mencegah spoofing identitas pembuat tiket.

#### Struktur Data

```typescript
SupportTicket {
  id, client_id, created_by,
  subject, message,
  priority,        // prioritas tiket
  status,          // "open" | (resolved via admin_reply)
  admin_reply,     // balasan admin
  resolved_at,     // timestamp penyelesaian
  created_at, updated_at
}
CreateSupportTicketInput { clientId?, subject, message, priority }
```

#### Wiring Tombol

| Tombol | Handler | Efek |
|--------|---------|------|
| **Create Ticket** | Form → `createSupportTicket()` | Insert + auth guard + audit |
| **Reply Ticket** | Update `admin_reply` | Balasan admin (internal/client-facing) |
| **Close Ticket** | Set `status` + `resolved_at` | Status transition ke resolved |

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

### 4.13 Scheduled Posts (`/admin/calendar`) — DEEP DIVE

**Fungsi**: Manajemen post yang dijadwalkan (CRUD). Service: `features/scheduled-posts/api/service.ts` (127 baris).

**Catatan Penting**: Modul ini memiliki **function overloading** — menerima single input ATAU array input.

#### Fungsi Service (5 fungsi)

| Fungsi | Signature | Deskripsi |
|--------|-----------|-----------|
| `getScheduledPostsByClient` | `(clientId) => Promise<ScheduledPost[]>` | List post per klien |
| `createScheduledPost` | `(input) => Promise<ScheduledPost>` | Buat 1 post |
| `createScheduledPost` | `(inputs[]) => Promise<ScheduledPost[]>` | Batch buat N posts (overload) |
| `updateScheduledPost` | `({ id, clientId }, patch) => Promise<ScheduledPost>` | Update dengan tenant guard |
| `deleteScheduledPost` | `(id, clientId?) => Promise<void>` | Hapus (opsional client_id guard) |

#### Alur `createScheduledPost` (Function Overload)

```
Input: CreateScheduledPostInput | CreateScheduledPostInput[]
   ↓
isArray = Array.isArray(input)
   ↓
safe = isArray ? input.map(i => Schema.parse(i)) : Schema.parse(input)
   ↓
rows = safe (single → wrap in [])
   ↓
query = supabase.from("scheduled_posts").insert(rows)
   ↓
data = await query.select().single() / select()  ← .single() jika 1 post
   ↓
Guard: error → throw "Gagal menjadwalkan postingan"
   ↓
logAudit:
  ├─ entity: scheduled_post.create
  ├─ summary: "Scheduled batch of N posts" / "Scheduled new post <id>"
  └─ clientId: rows[0].client_id
   ↓
return data
```

#### Alur `updateScheduledPost` — Tenant Guard

```
1. .update(patch).eq("id", id).eq("client_id", clientId)
   ↓  ↑ WAJIB kedua predicate untuk mencegah cross-tenant update
2. logAudit('scheduled_post.update')
```

#### Alur `deleteScheduledPost` — Flexible Guard

```
1. delete().eq("id", id)
   ↓
2. if (clientId) query.eq("client_id", clientId)  ← opsional
   ↓  ↑ jika client_id diberikan: tenant-safe
   ↓     jika tidak: hapus by ID saja (admin mode)
3. logAudit('scheduled_post.delete')
```

#### Wiring Tombol

| Tombol | Handler | Efek |
|--------|---------|------|
| **Buat Post** | `createScheduledPost(input)` | Insert 1 post + audit |
| **Buat Batch** | `createScheduledPost(inputs[])` | Insert N posts + audit batch |
| **Edit Post** | `updateScheduledPost({id, clientId}, patch)` | Update dengan tenant guard |
| **Hapus Post** | `deleteScheduledPost(id, clientId?)` | Hapus (opsional tenant guard) |

---

### 4.14 Skills (`/admin/ai` - Playbooks tab) — DEEP DIVE

**Fungsi**: Katalog 106 strategic skills + 17 topic packs, interview AI, output management. Service: `features/skills/api/service.ts` (580 baris).

#### Arsitektur Relasional

```
skill_packs  ──── pack_skills ──── skills
     │                                     │
     │                                     │
     └────── client_skills ────────────────┘
              (assignment + status)
                    │
                    │
              skill_outputs (final documents)
```

| Tabel | Fungsi |
|-------|--------|
| `skills` | 106 skill registry (name, description, category, job, allowed_tools) |
| `skill_packs` | 17 topic pack (sort_order) |
| `pack_skills` | many-to-many pack ↔ skill |
| `client_skills` | Assignment per klien (status: belum/dipilih/selesai) |
| `skill_files` | Markdown playbooks per skill |
| `skill_outputs` | Final dokumen hasil eksekusi |

#### Fungsi Service (9 fungsi inti)

| Fungsi | Deskripsi |
|--------|-----------|
| `getSkills(filters)` | List skills + optional filter (category, search ILIKE, packId) |
| `getSkillPacks()` | 17 packs + skill_count via parallel query + Map |
| `getSkillDetail(skillId)` | Skill + its markdown files (parallel) |
| `getClientSkills(clientId)` | Assigned skills for client (JOIN with skills) |
| `assignPackToClient(clientId, packId)` | Upsert all skills from pack to client |
| `updateClientSkillStatus(clientId, skillId, status)` | Update assignment status |
| `saveSkillOutput(input)` | Save final document + auto-update status to 'selesai' |
| `getClientSkillOutputs(clientId)` | History of all outputs for client |
| `executeSkillChat(input)` | AI-guided interview session |

#### Alur `getSkillPacks` — Parallel + Map Lookup

```
Promise.all([
  skill_packs ORDER BY sort_order,
  pack_skills (pack_id, skill_id),
])
   ↓
Build Map: packSkillMap (pack_id → skill_ids[])
   ↓
packs.map(pack => ({ ...pack, skill_count: map.get(pack.id)?.length ?? 0 }))
```

#### Alur `assignPackToClient` (Quick Onboarding & Manual Assign)

```
1. Guard: !clientId || !packId → error
   ↓
2. GET pack_skills WHERE pack_id
   ↓ (guard: empty → "Tidak ada skill dalam pack ini")
   ↓
3. Build rows: [{ client_id, skill_id, status: "belum", updated_at }]
   ↓
4. UPSERT client_skills ON CONFLICT (client_id, skill_id)
   ↓
5. Return { success: true, count: rows.length }
```

**Digunakan di**:
- Quick Onboarding wizard (Clients §4.5) — assign "starter" pack
- ClientManager → Playbooks dialog — manual assign

#### Alur `saveSkillOutput` — Auto-Status Update

```
1. INSERT skill_outputs { client_id, skill_id, title, content, status, stage }
   ↓
2. await updateClientSkillStatus(clientId, skillId, "selesai")
   ↓  ↑ otomatis ubah status dari "belum"/"dipilih" → "selesai"
3. Return { success: true, id }
```

#### Alur `executeSkillChat` — AI Interview Session

```
1. resolveProvider(supabase) → fail jika tidak ada
   ↓
2. Promise.all([
     loadSkillBundle(supabase, skillId),  ← playbook markdown
     loadClientFiles(supabase, clientId),  ← brand context
     clients.name,                          ← client name
   ])
   ↓
3. System prompt (faktual dari kode):
   [ROLE & EXPERTISE]
   You are an expert Social Media & Marketing Consultant acting on behalf of {clientName}.
   You are executing the specialized playbook "{skillId}".
   You conduct an interactive interview step-by-step in INDONESIAN.

   [BRAND CONTEXT]
   Adhere strictly to the brand voice, tone, and guardrails.

   [INTERVIEW SPEC]
   - Ask 1-2 questions per turn
   - Provide cumulative draft in "preview"
   - Set done=true when complete, emit final in "output"
   - Return valid JSON: { reply, done, preview?, output? }
   ↓
4. chatJsonDetailed(provider, systemPrompt, messages)
   ↓
5. Auto-update: updateClientSkillStatus(clientId, skillId, "jalan")
   ↓
6. logAiUsage({ route: "skill.chat", model, tokens, latency })
   ↓
7. Return { reply, done, error? }
```

**System prompt** memaksa AI untuk:
- Interaksi dalam Bahasa Indonesia profesional
- Tidak bertanya 10 pertanyaan sekaligus (1-2 per giliran)
- Selalu emit draft real-time di `preview`
- Output valid JSON only (tanpa markdown codeblocks)

#### Struktur Data

```typescript
Skill          { id, name, description, category, job, allowed_tools }
SkillPack      { id, name, sort_order, skill_count }
ClientSkill    { id, client_id, skill_id, status, notes, created_at, updated_at, skill }
SkillOutput    { id, client_id, skill_id, title, content, status, stage, created_at }
SkillFile      { skill_id, path, content }
ClientSkillStatus = "belum" | "dipilih" | "selesai"
```

#### Wiring Tombol

| Tombol | Handler | Efek |
|--------|---------|------|
| **Interview Skill** | `handleStartBrandInterview(skillId)` | Buka SkillInterviewModal → executeSkillChat |
| **Assign to Client** | `assignPackToClient(packId, clientId)` | Upsert all skills → status "belum" |
| **Save Output** | `saveSkillOutput(input)` | Insert output → auto status "selesai" |
| **Update Status** | `updateClientSkillStatus(clientId, skillId, status)` | Toggle status |

---

### 4.15 Notifications (`/admin/settings` - notification tab) — DEEP DIVE

**Fungsi**: Pengiriman notifikasi review multi-channel (WhatsApp + Telegram) + test dispatch. Service: `features/notifications/api/service.ts` (277 baris).

#### Fungsi Service (3 fungsi)

| Fungsi | Signature | Deskripsi |
|--------|-----------|-----------|
| `getNotificationTargetForDeliverable` | `(deliverableId) => Promise<NotificationTargetInfo \| null>` | Resolve deliverable + klien → build pesan siap kirim |
| `dispatchReviewNotification` | `(input) => Promise<DispatchReviewNotificationResponse>` | Kirim ke kanal terpilih (WA + Telegram) |
| `testNotificationDispatch` | `(input) => Promise<TestNotificationResult>` | Ping test ke satu kanal |

#### Alur `getNotificationTargetForDeliverable` — Resolve Context

```
1. GET deliverables WHERE id (maybeSingle)
   Guard: !deliverable → warn + return null
   ↓
2. GET clients WHERE id = deliverable.client_id
   (select: id, name, contact_phone, telegram_chat_id, telegram_notif_enabled)
   Guard: !client → warn + return null
   ↓
3. appUrl = env.server.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
   reviewUrl = `${appUrl}/review/${deliverable.id}`
   ↓
4. Build suggested messages:
   ├─ WhatsApp: formatReviewNotificationMessage({ clientName, title, reviewUrl, previewUrl })
   └─ Telegram: HTML template (bold title, portal link)
   ↓
5. return { deliverableId, title, type, status, previewUrl, client, reviewUrl,
            suggestedWhatsAppMessage, suggestedTelegramMessage }
```

#### Alur `dispatchReviewNotification` — Multi-Channel Fan-out

```
1. Zod parse: dispatchReviewNotificationSchema.parse(rawInput)
   ↓
2. target = await getNotificationTargetForDeliverable(deliverableId)
   Guard: !target → throw "Deliverable atau klien tidak ditemukan."
   ↓
3. results: DispatchChannelResult[] = []
   ↓
4. IF channels.includes("whatsapp"):
   ├─ Guard: !target.client.contactPhone
   │     → push { channel: "whatsapp", success: false, status: "failed",
   │              error: "Nomor WhatsApp klien belum dikonfigurasi." }
   └─ ELSE:
       messageText = customNote ? `${suggested}\n\n💬 *Catatan:* ${customNote}` : suggested
       waRes = await sendWhatsAppNotification({ phone, text, recipientType: "client",
                                                deliverableId, eventType: "deliverable.review_requested" })
       push { channel, success: waRes.success, status, clickUrl, messageId, error }
   ↓
5. IF channels.includes("telegram"):
   ├─ Guard: !target.client.telegramChatId
   │     → push { channel: "telegram", success: false, status: "skipped",
   │              error: "Akun Telegram klien belum terhubung." }
   └─ ELSE:
       tgText = customNote ? `${suggested}\n\n<b>Catatan:</b> ${customNote}` : suggested
       buttons = [[{ text: "Buka Portal Review", url: reviewUrl }]]
       IF previewUrl → buttons[0].push({ text: "File Media", url: previewUrl })
       tgRes = await sendTelegramMessage({ chatId, text: tgText, parseMode: "HTML",
                                           buttons, eventType: "deliverable.review_requested" })
       push { channel, success, status: success ? "sent" : "failed", messageId, error }
   ↓
6. logAudit({ action: "notification.review_dispatched", metadata: { channels, results } })
   ↓
7. return { deliverableId, clientName, reviewUrl, results }
```

**Poin penting**:
- WhatsApp gagal → `status: "failed"`; Telegram tanpa chatId → `status: "skipped"` (perbedaan semantik)
- Setiap kanal dieksekusi **independen** — kegagalan satu kanal tidak menghentikan kanal lain
- `customNote` opsional di-append dengan format berbeda (WhatsApp `*bold*`, Telegram `<b>`)

#### Alur `testNotificationDispatch` — Ping Test

```
IF channel === "telegram":
   text = "🧪 Uji Coba Notifikasi Frhm\n\nKoneksi Telegram berhasil...\nWaktu uji: {locale id-ID}"
   res = await sendTelegramMessage({ chatId: destination, text, parseMode: "HTML",
                                     eventType: "test_ping" })
   return { ...res }
```

#### Struktur Data

```typescript
NotificationTargetInfo {
  deliverableId, title, type, status, previewUrl,
  client: { id, name, contactPhone, telegramChatId, telegramEnabled },
  reviewUrl, suggestedWhatsAppMessage, suggestedTelegramMessage
}
DispatchChannelResult { channel, success, status, clickUrl?, messageId?, error? }
DispatchReviewNotificationInput { deliverableId, channels: ("whatsapp"|"telegram")[], customNote? }
```

#### Wiring Tombol

| Tombol | Handler | Efek |
|--------|---------|------|
| **Test Notification** | `testNotificationDispatch({ channel, destination })` | Ping test ke kanal |
| **Dispatch Review** | `dispatchReviewNotification({ deliverableId, channels, customNote? })` | Fan-out ke WA + Telegram |

#### API Routes Terkait

| Endpoint | Fungsi |
|----------|--------|
| `POST /api/telegram/webhook` | Incoming webhook handler |
| `POST /api/telegram/test` | Test notification |
| `POST /api/telegram/preferences` | Set user preferences |
| `POST /api/telegram/disconnect` | Disconnect Telegram |

---

### 4.16 Content Production (`/admin/erp`) — DEEP DIVE

**Fungsi**: Papan produksi konten (kanban) dengan tenggat. Service: `features/content-production/api/service.ts` (81 baris). Tabel: `content_productions`.

#### Fungsi Service (4 fungsi CRUD)

| Fungsi | Signature | Deskripsi |
|--------|-----------|-----------|
| `getContentProductions` | `(clientId) => Promise<ContentProduction[]>` | List per klien, urut `due_date ASC`, **degrade → []** |
| `createContentProduction` | `(input) => Promise<ContentProduction>` | Insert + audit |
| `updateContentProduction` | `(id, patch) => Promise<ContentProduction>` | Update `.eq("id")` + audit |
| `deleteContentProduction` | `(id) => Promise<void>` | Delete `.eq("id")` + audit |

#### Pola Konsisten dengan Modul Lain

```
getX       → .eq("client_id", clientId).order(...) → error → return []
createX    → .insert(input).select().single() → error → throw → logAudit('x.create')
updateX    → .update(patch).eq("id", id).select().single() → error → throw → logAudit('x.update')
deleteX    → .delete().eq("id", id) → error → throw → logAudit('x.delete')
```

**Catatan arsitektural**: `getContentProductions` mengurutkan berdasarkan **`due_date ASC`** (bukan `created_at`) — karena ini papan produksi yang diorganisir berdasarkan tenggat, bukan kronologi pembuatan.

#### Struktur Data

```typescript
ContentProduction { id, client_id, ..., due_date, created_at }
```

#### Wiring Tombol

| Tombol | Handler | Efek |
|--------|---------|------|
| **Tambah Produksi** | `createContentProduction(input)` | Insert + audit |
| **Update Status/Kanban** | `updateContentProduction(id, patch)` | Update + audit |
| **Hapus** | `deleteContentProduction(id)` | Delete + audit |

**Integrasi**: Modul ini adalah sub-bagian dari **ERP Dashboard (§4.7)** — muncul di papan `/admin/erp` bersama Deliverables (§4.12).

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

> Semua informasi di section ini **diverifikasi langsung dari**:
> - `app/supabase/migrations/001_initial_schema.sql` (skema tabel)
> - `app/supabase/migrations/002_rls_policies.sql` (RLS policies)
> - `app/features/*/api/service.ts` (nama tabel `.from()` yang dipakai di runtime)

### Mekanisme Isolasi Tenant (SECURITY DEFINER Helpers)

RLS **TIDAK** menggunakan subquery langsung (cegah "infinite recursion detected"). 
Gunakan **3 helper functions** `SECURITY DEFINER` + `row_security = off`:

```sql
-- Di migration 002_rls_policies.sql (faktual)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text LANGUAGE sql SECURITY DEFINER
SET search_path = public SET row_security = off STABLE
AS $$ SELECT role FROM public.users WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.current_user_client_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER
SET search_path = public SET row_security = off STABLE
AS $$ SELECT client_id FROM public.users WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER
SET search_path = public SET row_security = off STABLE
AS $$ SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') $$;
```

Policies RLS pakai helpers ini, **BUKAN** subquery langsung:

```sql
-- Contoh faktual dari migration 002:
CREATE POLICY client_own_deliverables ON deliverables
  FOR SELECT USING (client_id = public.current_user_client_id());

CREATE POLICY client_own_clients ON clients
  FOR SELECT USING (id = public.current_user_client_id());
```

**Rule Mutlak**: Service layer WAJIB scope by `client_id` (bukan `tenant_id`).
- Admin: semua `client_id` (policy `admin_all_*` pakai `is_admin()`)
- Client: hanya `client_id` dari `current_user_client_id()`

### Tabel Utama (16 tabel aktif di runtime)

Sumber: `grep -rhoP '\.from("\K[a-z_]+' app/features app/lib` + migrations.

| Tabel | Service Path | RLS Policy |
|-------|--------------|------------|
| `clients` | `dashboard/api/service.ts` | `admin_all_clients` / `client_own_client` |
| `users` | `auth/` (Supabase Auth) | `admin_all_users` / `user_own_profile` |
| `deliverables` | `deliverables/api/service.ts` | `admin_all_deliverables` / `client_own_deliverables` |
| `comments` | (status_history.view) | `admin_all_comments` / `client_own_comments` |
| `status_history` | `deliverables/api/service.ts` | `admin_all_status_history` / `client_own_status_history` |
| `scheduled_posts` | `scheduled-posts/api/service.ts` | `client_id` isolation |
| `content_campaigns` | `campaigns/api/service.ts` | `client_id` isolation |
| `client_budgets` | `erp/api/service.ts` | `client_id` isolation |
| `expenses` | `erp/api/service.ts` | `client_id` isolation |
| `ad_spend_logs` | `erp/api/service.ts` | `client_id` isolation |
| `kols` | `erp/api/service.ts` | `client_id` isolation |
| `support_tickets` | `support/api/service.ts` | `client_id` isolation |
| `dashboard_profiles` | `dashboard/api/service.ts` | `client_id` isolation |
| `client_files` | `skills/api/service.ts`, `dashboard/api/service.ts` | `client_id` isolation |
| `skills` | `skills/api/service.ts` | Global (tidak ada client_id) |
| `client_skills` | `skills/api/service.ts` | `client_id` isolation |
| `skill_packs` | `skills/api/service.ts` | Global (tidak ada client_id) |
| `pack_skills` | `skills/api/service.ts` | Global |
| `skill_outputs` | `skills/api/service.ts` | `client_id` isolation |
| `ai_providers` | `ai-providers/api/service.ts` | Admin only |
| `ai_usage_logs` | `analytics/api/service.ts` | Admin only |
| `analytics_summaries` | `analytics/api/service.ts` | `client_id` isolation |
| `analytics_predictions` | `analytics/api/service.ts` | `client_id` isolation |
| `client_channels` | `social-accounts/api/service.ts` | `client_id` isolation |
| `content_productions` | `content-production/api/service.ts` | `client_id` isolation |
| `skill_files` | `skills/api/service.ts` | Global |
| `post_metrics` | — (view/derived) | — |
| `feedback` | — (view/derived) | — |
| `brand_assets` | — | — |
| `content_items` | — | — |
| `events` | — | — |
| `event_tasks` | — | — |
| `event_vendors` | — | — |
| `content_assets` | — | — |
| `competitor_benchmarks` | — | — |
| `platform_posts` | — | — |
| `pipeline_stages` | — | — |
| `deliverable_templates` | — | — |
| `reminder_settings` | — | — |
| `seasonal_periods` | — | — |
| `feature_flags` | — | — |
| `telegram_notification_logs` | — | — |
| `whatsapp_notification_logs` | — | — |

### Pola Query di Service Layer

Semua service mengikuti pola konsisten yang diverifikasi dari kode:

```typescript
// GET: client-scoped, degrade → []
const { data, error } = await supabase
  .from("table_name")
  .select("...")
  .eq("client_id", clientId)
  .order("created_at", { ascending: false })
if (error) { logger.error(...); return [] }
return data ?? []

// CREATE: insert + audit
const { data, error } = await supabase
  .from("table_name")
  .insert({...input})
  .select().single()
if (error) throw new Error(error.message)
void logAudit({ action: "entity.create", ... })
return data

// UPDATE: .eq("id", id) + audit
// DELETE: .eq("id", id) + audit
```

### Migrasi Schema (20 file)

Urutan aplikasi migration di `app/supabase/migrations/`:
- `001` Initial schema (clients, users, deliverables, comments)
- `002` RLS policies + SECURITY DEFINER helpers
- `003` Triggers & functions
- `004–006` Deliverable views, realtime, brand profile
- `007–018` Skills, packs, allowed tools, outputs, audit log
- `009` Client files
- `019–020` Scheduled posts, reserved slots

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

### Layer 1: Authentication (Supabase Auth)

| Route | Path |
|-------|------|
| Login | `app/auth/login/page.tsx` |
| Callback | `app/auth/callback/route.ts` |
| Forgot Password | `app/auth/forgot-password/` |
| Set Password | `app/auth/set-password/` |

- **100% Supabase Auth** — tidak ada Clerk atau auth custom
- **Rate limiting**: `lib/middleware/rate-limit.ts` — 5 attempts/60s per IP pada callback
- **Audit**: `logAudit({ action: 'auth.rate_limited', ... })` di callback route

### Layer 2: Session Middleware

File: `lib/supabase/middleware.ts` — **bukan root `middleware.ts`**

**Fungsi `updateSession(request)`**:
```typescript
// Menggunakan @supabase/ssr createServerClient dengan cookie handling
const supabase = createServerClient(
  env.server.NEXT_PUBLIC_SUPABASE_URL,
  env.server.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { cookies: { getAll, setAll } }
)
```

**Optimasi performa** (komentar di kode):
- Sebelumnya: setiap `/admin` request 4 round-trip Sequestial (getUser + SELECT users × 2)
- Sekarang: middleware resolve identity sekali, forward ke request headers
- Layout component membaca dari headers, bukan query ulang

**Keamanan headers**: Strip semua `USER_HEADERS` dari client-supplied headers sebelum set baru — mencegah spoofing identitas.

### Layer 3: Authorization Helpers

File: `lib/auth/guard.ts`, `lib/auth/use-current-user.ts`

- `guardAdmin()` → throw 403 jika bukan admin
- `useCurrentUser()` → hook untuk client component read role/client_id

### Layer 4: Row-Level Security (RLS)

Semua query backend mem-filter by `client_id`. RLS policies di PostgreSQL memastikan data tidak bocor antar tenant.

Policies pakai **SECURITY DEFINER helpers** (bukan subquery langsung, cegah infinite recursion):
- `current_user_role()` → role user
- `current_user_client_id()` → client_id user
- `is_admin()` → boolean admin check

### Layer 5: Preview Guard

File: `lib/preview-guard.ts`

```typescript
export function assertPreviewAllowed(): void {
  const env = process.env.NODE_ENV
  if (env === 'production') {
    notFound()  // 404 di production
  }
}
```

- Preview routes (`/preview-*`) adalah UI fixtures untuk Playwright E2E
- Di production: `notFound()` → 404
- Di dev/test: tetap accessible

### Layer 6: Environment Security

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
2. Cek `package-lock.yaml` consistency
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
