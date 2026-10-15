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

### 4.2 AI Studio (`/admin/ai`)

**Fungsi**: Pusat kreativitas AI untuk generate ide, batch plan, trend vetting, dan brand brain.

**5 Tab**:

| Tab | Fungsi | API |
|-----|--------|-----|
| Idea Engine | Generate SPARK ideas dari topik | `POST /api/copilot/ideas` |
| Batch Planner | Buat 7/14/30 hari content calendar | `POST /api/copilot/batch-plan` |
| Trend Radar | Audit tren viral (3-gate: Brand Fit, Safety, Timing) | `POST /api/trends/radar` |
| Brand Brain | Edit brand profile markdown | `PUT /api/brand-files/:path` |
| Playbooks | 106 strategic skills catalog | `GET /api/skills` |

**Wiring Tombol**:
- **Racik Ide Konten** → `generateIdeasMutate()` → set state → render grid ideas
- **Generate Batch Plan** → `generateBatchMutate()` → map posts → render table
- **Audit Kelayakan Tren** → `evaluateTrendMutate()` → render 3-gate result
- **Jadwalkan ke Kalender** → `createScheduledPostsBatch()` → toast success
- **Buka Markdown Studio** → `setBrandEditorOpen(true)` → BrandBrainEditorDialog

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

### 4.6 Social Accounts (`/admin/social-accounts`)

**Fungsi**: Kelola akun sosial media klien (Instagram, TikTok, X, LinkedIn).

**Fitur**:
- Channel connectivity dashboard
- Brand profile management
- Content production board (Kanban)

**Wiring Tombol**:
- **Connect Channel** → `requestOAuthUrl({ clientId, platform })` → redirect ke OAuth
- **Sync Channel** → `syncChannel(channelId)` → fetch latest metrics
- **Disconnect** → `disconnectChannel(channelId)` → remove connection
- **Generate Brand Profile** → AI interview → `generateBrandProfile()` → save

---

### 4.7 ERP Dashboard (`/admin/erp`)

**Fungsi**: Dashboard eksekutif untuk tracking ROI, budget, dan KOL.

**4 Sub-modul**:
| Sub-modul | Fungsi |
|-----------|--------|
| Budget Ledger | Buku dompet bulanan per klien, alert 90% threshold |
| Expense Tracker | Pencatatan KOL/Ads/Event expenses |
| Ads Tracker | Smart Manual Logging untuk spending & klik |
| KOL CRM | Rate card, spesialisasi, riwayat kerja sama |

**Wiring Tombol**:
- **Tambah Expense**: Form → `createExpense()` → refresh ledger
- **Log Ad Spend**: Form → `createAdSpendLog()` → update trendline
- **Assign KOL**: Form → `createKOL()` → link ke campaign

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

### 4.9 Analytics (`/admin/analytics`)

**Fungsi**: Metrik mendalam per klien dan prediksi performa.

**Fitur**:
- Post metrics timeline
- Analytics summaries
- Multi-account analytics
- Performance audit & iteration

**Wiring Tombol**:
- **Sync Social Data**: `syncMultiAccountSocialData(clientId)` → trigger cron-like fetch
- **Generate Prediction**: `getLatestPrediction(clientId)` → ML model inference

---

### 4.10 Media Library (`/admin/library`)

**Fungsi**: Pusat penyimpanan aset per klien (Cloudinary).

**Fitur**:
- Upload zones
- Batch delete
- Tag management
- Asset reorder

**Wiring Tombol**:
- **Upload**: Drag-drop → `uploadAsset(clientId, file)` → Cloudinary → insert DB
- **Delete Single**: `deleteAsset(assetId, clientId)`
- **Delete Multiple**: `deleteAssets(assetIds, clientId)`
- **Tag Assets**: `tagAssets(assetIds, tags)`

---

### 4.11 Support (`/admin/support`)

**Fungsi**: Ticket management untuk komunikasi dengan klien.

**Wiring Tombol**:
- **Create Ticket**: Form → `createSupportTicket()` → assign to client
- **Reply Ticket**: Internal note / client-facing reply
- **Close Ticket**: Status transition to resolved

---

### 4.12 Deliverables (`/admin/erp` - same module)

**Fungsi**: Manajemen deliverable dengan state machine (Ide → Script → Shoot → Edit → Done).

**Fitur**:
- Kanban production board
- PDF export studio
- Schedule & auto-publish engine
- Client review portal integration

**Wiring Tombol**:
- **Move Card**: Drag → `updateDeliverableStatus(id, newStatus)`
- **Export PDF**: `exportDeliverablePdf(id)` → branded executive PDF
- **Schedule**: `scheduleApprovedDeliverable(id)` → insert scheduled post
- **Submit Review**: `submitDeliverableReview(id, feedback)` → notify client

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
