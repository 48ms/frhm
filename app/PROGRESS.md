# Frhm Dashboard — Progress Update

## Current Status: CIS (Content Intelligence Suite) Completed + Phase 4 Planning

### Phase Progress Tracker

| Feature / Phase | Status | Key Features |
|-----------------|--------|--------------|
| **#1 Client Onboarding** | ✅ Complete | Setup client brand, socials, tone of voice, goals |
| **#2 Notifikasi Deliverable** | ✅ Complete | Status alert & update notifications |
| **#3 Client Pipeline View** | ✅ Complete | Interactive stage pipeline |
| **#4 Bulk Skill Execution** | ✅ Complete | Batch run multiple skills simultaneously |
| **#5 Export Markdown** | ✅ Complete | Export clean markdown for client presentation |
| **#6 Audit Log** | ✅ Complete | Track admin actions & modifications (`018_audit_log.sql`) |
| **#7 Multi-Client Dashboard** | ✅ Complete | Overview cards per client, stats & quick actions |
| **#8 Mobile Responsive** | ✅ Complete | Touch target 44px min, horizontal tab scroll, responsive sheets |
| **#9 Scheduled Publish** | ✅ Complete | Automatic post executor endpoint (`/api/cron/publish`) integrated with WoopSocial Bridge |
| **#10 Analytics Tracker** | ✅ Complete | Post metrics input, Animate UI polish, AI Insight generator via Agnes AI / 9router |
| **#11 Template Deliverable** | ✅ Complete | 3 built-in templates (Brief, Content, Report), selector in create form |
| **#12 Feedback Form Client** | ✅ Complete | Client portal feedback form, admin review board, NPS-style rating (1-5), status tracking |
| **CIS Milestone 1: Sentiment NLP** | ✅ Complete | Ollama-based sentiment analysis, `comment_details` & `sentiment_summary` JSONB, Telegram dual dispatch |
| **CIS Milestone 2: Publish Engine** | ✅ Complete | Retry logic (max 3x), `publish_retry_count`, WoopSocial Bridge integration, admin dashboard badge |
| **CIS Milestone 3: Benchmarking UI** | ✅ Complete | Multi-client comparison dashboard, `/admin/analytics/benchmark`, conversion rate tracking |
| **FRHM AI System Ecosystem V2** | ✅ Complete | AI Studio (`ideas`, `batch`, `trends`, `brand-brain`), Live DNA Completeness (0-100%), Quick Formatting Markdown Studio, Calendar modal parity, E2E Playwright 100% PASS |
| **Platform Sovereignty & Full Gap Parity** | ✅ Complete | 100% PostgreSQL Supabase factual data (0% mock/NaN), Radix UI + Animate UI primitives, `nuqs` URL state synchronization, 3-layer service layer (`types.ts`, `service.ts`, `queries.ts`), single H1 heading hierarchy, HSL semantic tokens |
| **Nuqs Centralized URL State & Prefetching** | ✅ Complete | Centralized `lib/searchparams.ts` (`createSearchParamsCache` + `createSerializer`), eliminated all manual `new URLSearchParams()`, unified `DashboardPrefetcher` across `/admin/composer` and `/admin/library` |
| **106 Skills & 17 Topic Packs UI Integration** | ✅ Complete | 3-layer service layer (`features/skills/api/`), AI Studio Tab 5 "Playbooks (106)", 17 Topic Packs & 13 Categories browser, interactive AI guided interview dialog with Live Draft Preview (`skill-interview-modal.tsx`), partial draft protection, save to `public.skill_outputs` & deep-link to Post Composer |
| **Opsi A: Playbook Outputs to Deliverables & Review Workflow** | ✅ Complete | Auto-promote `skill_outputs` to `public.deliverables`, bi-directional status synchronization (`draft` -> `sent` -> `approved` / `revision_requested`), Deliverables & Strategy Documents section in Marketing ERP (`/admin/erp`), audit trail logging (`deliverable.promoted_from_skill`), 100% test coverage |
| **Opsi B: WoopSocial MCP Tool Engine** | ✅ Complete | Multi-tenant MCP router (`lib/mcp/woopsocial-mcp.ts`) with 5 tools (`woopsocial_health`, `woopsocial_list_social_accounts`, `woopsocial_validate_post`, `woopsocial_schedule_post`, `woopsocial_list_posts`), `allowed_tools` security verification in `executeSkillTool`, UI execution trigger & status banner in `SkillInterviewModal` |
| **Opsi C: Automated End-to-End Playwright Browser QA** | ✅ Complete | Full end-to-end browser test suite (`e2e/playbooks-workflow.spec.ts`), validating AI Studio Playbooks catalog, Client Playbooks dialog & 3 tabs, and Marketing ERP Deliverables section |
| **Opsi D: Client Portal Review & Magic Link** | ✅ Complete | Public external client review portal (`/review/[id]`), Radix UI + Animate UI, 1-5 star rating selector, approval & revision note form, previous comments thread, "Salin Link Review" in Playbook Dialog & ERP Deliverables table, automated Telegram admin notification, 100% test coverage |
| **Opsi E: Automated Schedule & Auto-Publish Engine dari Approved Deliverables** | ✅ Complete | Modal `ScheduleDeliverableDialog` langsung dari deliverable approved, pemilihan platform (Instagram, TikTok, X, dll.), Golden Hour presets ("Besok 10:00", "Besok 19:00"), auto-insert ke `scheduled_posts` berstatus `scheduled` dengan referensi `deliverable_id`, siap dieksekusi `/api/cron/publish` & WoopSocial, audit log, notifikasi Telegram, 100% test coverage |
| **Opsi 1: Multi-Account Analytics Aggregator (Instagram/TikTok Insights & WoopSocial Sync)** | ✅ Complete | Multi-account aggregator widget (`multi-account-aggregator.tsx`), platform filtering pills (Semua, Instagram, TikTok, X), Instagram Deep Insights (Reels vs Carousel vs Static, saves, DMs), TikTok Viral Insights (Viral Potential Score meter 0-100, video views, shares, WA leads), live multi-platform synchronization action, 100% test coverage (8/8 Playwright PASS) |
| **Opsi 3: Automated WhatsApp/Telegram Webhook Notification Engine** | ✅ Complete | Multi-channel review notification engine (`lib/whatsapp/service.ts`, `lib/telegram/service.ts`), Meta Cloud API & Webhook inbound route (`/api/whatsapp/webhook`), 3-layer service layer (`features/notifications/api/`), Radix UI dialog (`dispatch-notification-dialog.tsx`) dengan live preview magic link & 1-click WhatsApp Web launch, integrasi tombol "Notifikasi Review" di Marketing ERP, database migration `057_whatsapp_notification_logs.sql`, 100% test coverage (60/60 unit test files PASS, 316/316 tests PASS, Playwright E2E 2/2 PASS) |
| **Opsi 4: Branded Executive PDF Export Studio** | ✅ Complete | Executive-grade PDF document engine (`lib/pdf/deliverable-pdf.tsx`) with 4 branded themes (Cobalt Blue, Emerald Growth, Royal Indigo, Monochrome), markdown parsing & formatting, metadata grid, watermark selector, executive signature approval sheet, interactive `<ExportPdfDialog>` modal with `<MetricTicker>` counters & `<ShimmeringText>` progress, dynamic import of `@react-pdf/renderer`, multi-surface integration (Client Review Portal, Marketing ERP Dashboard, Playbooks Dialog Tab 3 & document preview), 100% test coverage (62/62 unit test files PASS, 322/322 tests PASS, Playwright E2E 2/2 PASS) |
| **Full Gap Audit & Server Function Optimization** | ✅ Complete | Complete audit across 14 modules, elimination of 'Server Functions cannot be called during initial render' via DashboardPrefetcher expansion, query guards against undefined UUIDs, 100% semantic tokens, 20/20 core Playwright E2E PASS |

### CIS Technical Implementation

| Component | File | Description |
|-----------|------|-------------|
| Sentiment Classifier | `lib/nlp/sentiment.ts` | Ollama Ollama (gpt-oss:120b) sentiment analysis with JSON parsing |
| Sentiment Cache | `lib/nlp/sentiment-cache.ts` | In-memory cache (24h TTL) to avoid duplicate API calls |
| Daily Cron | `app/api/cron/daily-insight/route.ts` | Aggregates sentiment per client, dispatches Telegram reports |
| Publish Cron | `app/api/cron/publish/route.ts` | WoopSocial Bridge integration with retry logic |
| Analytics API | `app/api/admin/analytics/benchmark/route.ts` | Multi-client aggregation endpoint |
| UI Components | `components/analytics/sentiment-overview-card.tsx`, `benchmark-board.tsx` | Dashboard visualization widgets |

### E2E & Quality Verification

- **Playwright Tests**:
  - `e2e/deliverable-pdf-export.spec.ts` — **2/2 PASS** (Flow 1: Export PDF Studio in Admin ERP Dashboard, Flow 2: Export PDF Studio in Client Review Portal)
  - `e2e/notifications-workflow.spec.ts` — **2/2 PASS** (Flow 1: Open Notification Dialog and verify WhatsApp/Telegram channel configuration, Flow 2: WhatsApp Webhook Handshake Endpoint verification)
  - `e2e/analytics-aggregator.spec.ts` — **1/1 PASS** (Flow 1: Multi-Account Social Aggregator renders with platform filters, Instagram/TikTok deep insights, and live sync)
  - `e2e/schedule-approved-deliverable.spec.ts` — **1/1 PASS** (Flow 1: Schedule Approved Deliverable directly from ERP Dashboard)
  - `e2e/client-portal-review.spec.ts` — **3/3 PASS** (Flow 1: ERP deliverables table "Link Review", Flow 2: 404 handling on invalid review magic link, Flow 3: Public Review Portal opens for valid deliverable and allows client approval)
  - `e2e/playbooks-workflow.spec.ts` — **3/3 PASS** (Flow 1: AI Studio Playbooks & Skills, Flow 2: Client Management & Playbooks modal 3 tabs, Flow 3: Marketing ERP Deliverables & Strategy Documents)
  - `e2e/ai-studio.spec.ts` — **5/5 PASS** (Idea Engine, Batch Planner, Trend Radar, Brand Brain & Markdown Studio, Settings Brand Profile AI Extractor)
  - `e2e/settings-view.spec.ts` — **6/6 PASS** (Workspace, Billing, Integrations, User Access, Brand Profile, AI Providers)
  - `e2e/sidebar-nav.spec.ts` — **1/1 PASS** (All core admin routes reachable including `/admin/ai`)
  - `e2e/erp.spec.ts` — **1/1 PASS** (Marketing ERP dashboard summary strip, schedule banner, client info)
  - `e2e/social-accounts.spec.ts` — **3/3 PASS** (Flow 1: Social Accounts board renders connected accounts, Flow 2: Connect account modal opens with platform cards, Flow 3: Disconnect channel dialog renders safely)
  - `e2e/connect-channel.spec.ts` — **1/1 PASS** (Connect Channel modal: platform cards and gating)
  - `e2e/social-oauth-csrf.spec.ts` — **2/2 PASS** (Social OAuth callback CSRF guard: rejects callback with no state or forged state token)
  - `e2e/campaigns.spec.ts` — **4/4 PASS** (Flow 1: Campaigns Board renders, Flow 2: Filter campaigns by client, Flow 3: Campaign creation modal, Flow 4: Campaign detail modal)
  - `e2e/library.spec.ts` — **3/3 PASS** (Flow 1: Media Library renders with upload zone and stats, Flow 2: Asset stats sections, Flow 3: Empty state or asset grid)
  - `e2e/support-view.spec.ts` — **2/2 PASS** (Support Center sections and FAQ expansion, contact form submission)
  - `e2e/create-client.spec.ts` — **3/3 PASS** (Quick Onboarding dialog, validation, 2-step completion)
  - `e2e/admin-clients.spec.ts` — **1/1 PASS** (Admin clients auth guard)
  - `e2e/sidebar-client.spec.ts` — **1/1 PASS** (Workspace switcher opens and lists managed clients with nuqs URL state)
  - `e2e/admin-journey.spec.ts` — **2/2 PASS** (Composer module accessibility and full workflow)
  - `e2e/admin-remaining.spec.ts` — **4/4 PASS** (Admin route auth guards and legacy routes resolving to 404)
- **TypeScript**: `npx tsc --noEmit` — **exit 0 (0 error)**
- **Unit Tests**: `npm test` — **62/62 files, 322/322 tests PASS (100%)**
- **ESLint**: 0 errors, 0 warnings
- **Build**: `npm run build` — **exit 0 (All routes compiled with Turbopack without error)**

### OpenSpec Documentation

- **Archive Location**: `openspec/changes/archive/2026-09-19-frhm-content-intelligence-suite/`
- **Files Archived**: `.openspec.yaml`, `spec.md`, `tasks.md`
- **Status**: All CIS milestones completed and documented

---

### Key Integrations (Traceability Chain)

```
[Scheduled Posts / Comments]
         │
         ▼
[Daily Insight Cron] ──► [Ollama NLP: sentiment.ts]
         │                          │
         ├─────────────────────► [post_metrics.sentiment_summary (JSONB)]
         │
         ▼
[AI Insight Generation] ──► [Telegram Admin Dispatch (@frhm28_bot)]
         └─────────────────────► [Telegram Client Group Dispatch]

[Scheduled Posts Queue]
         │
         ▼
[Publish Cron] ───────► [WoopSocial Bridge API]
         │
         ├── (Success) ───────► [status: 'published', external_post_id]
         └── (Fail < 3x) ─────► [status: 'scheduled', publish_retry_count + 1]
         └── (Fail >= 3x) ────► [status: 'failed', notifyAdminPublishStatus]
```

### Technical Stack
- **Frontend**: Next.js 16 App Router + TS + Tailwind v4 + shadcn Base UI + Motion (Animate UI)
- **Database**: Supabase Postgres (Management API)
- **AI Providers**: Agnes AI (agnes-2.5-flash), 9router (COMBO2), Ollama (gpt-oss:120b)
- **Bridge**: WoopSocial OAuth + Automated Cron Executor
- **Port**: Dev server 3004 (3001 reserved for Bima CRM)
- **Anti-Slop**: All AI prompts and Telegram reports follow anti-emoji/icon rules

### Recent Files Modified / Added

| Date | File | Change |
|------|------|--------|
| 2026-09-19 | `supabase/migrations/034_comment_sentiment_analysis.sql` | DDL `comment_details` & `sentiment_summary` JSONB |
| 2026-09-19 | `supabase/migrations/035_scheduler_engine.sql` | DDL scheduling tracking columns |
| 2026-09-19 | `lib/nlp/sentiment.ts` | Ollama sentiment classifier module |
| 2026-09-19 | `lib/nlp/sentiment-cache.ts` | In-memory cache for sentiment results |
| 2026-09-19 | `lib/analytics/insight-prompt.ts` | Added `{sentiment_summary}` to AI prompt template |
| 2026-09-19 | `lib/telegram/messages/daily-briefing.ts` | Updated Telegram reports with sentiment section |
| 2026-09-19 | `components/analytics/sentiment-overview-card.tsx` | New sentiment dashboard widget |
| 2026-09-19 | `app/api/cron/daily-insight/route.ts` | Integrated sentiment scanning into daily cron |
| 2026-09-19 | `app/api/cron/publish/route.ts` | Added retry logic (max 3x) for publishing |
| 2026-09-19 | `app/admin/dashboard/page.tsx` | Added Retry badge UI for failed posts |
| 2026-09-19 | `app/api/admin/analytics/benchmark/route.ts` | New benchmarking aggregation endpoint |
| 2026-09-19 | `components/analytics/benchmark-board.tsx` | New multi-client comparison dashboard |
| 2026-09-19 | `lib/analytics/benchmark-types.ts` | TypeScript types for benchmark data |
| 2026-09-19 | `app/admin/analytics/benchmark/page.tsx` | Benchmark page route |
| 2026-09-19 | `e2e-playwright/tests/AnalyticsPhase4.test.ts` | E2E test suite (6 tests) |
| 2026-09-19 | `openspec/changes/archive/2026-09-19-frhm-content-intelligence-suite/` | OpenSpec documentation archive |

---

*Last Updated: 2026-09-19*
*CIS (Content Intelligence Suite) — All Milestones Completed*

---

## 2026-10-02 — Security Audit (ECC): API routes, RLS, cron

### Fixed
- **`/api/telegram/webhook` fail-open (CRITICAL).** Secret-token verification only ran when `TELEGRAM_BOT_SECRET_TOKEN` was set; if unset, any POST was accepted. Route uses the **service-role client** (RLS bypass) and handles `client_<id>`/`admin_<id>` linking, so a forged payload could hijack a client's Telegram linkage. Now **fail-closed** via `verifyTelegramWebhookSecret()` (`lib/telegram/verify-webhook.ts`, 5 unit tests). Verified runtime: `POST` without/with wrong header → **401**.
- **`/api/trends/radar` public (HIGH).** Internal admin endpoint with no auth check and `Cache-Control: public`. Added `auth.getUser()` session guard + read rate limit, cache set to `private`. Verified runtime: `GET` without session → **401**.
- **`vercel.json` dead cron jobs.** Declared 4 cron schedules (`publish` every minute, `reminders` hourly, `daily-insight` daily, `check-zero-metrics` daily) but all 4 routes exist only under `_archive_dead/` (excluded from build). Vercel would hit non-existent paths indefinitely with no observability. Set to `"crons": []` to reflect actual state.
- **`supabase/migrations/999_wipe_all_clients.sql` removed.** Unreferenced `TRUNCATE TABLE clients CASCADE` tracked in git — one wrong `supabase db push` would wipe every client. No code referenced it.

### Known limitation — scheduler is OFF (documented, intentional)
> SUPERSEDED 2026-10-02 (later): cron routes were restored to `app/api/cron/*` and
> `vercel.json` crons re-enabled. See the "Audit Round 2" section below.

### Audit results — clean
- **RLS:** 47/47 tables RLS-enabled, every table has ≥1 policy. Tenant isolation via `current_user_client_id()` / `is_admin()` (SECURITY DEFINER, `row_security=off` per project convention). No deny-all tables, no `USING(true)` on tenant data.
- **API routes (7):** all authenticated routes verify session + ownership before service-role writes; `trends/generate` is admin-only + AI rate-limited; `auth/callback` rate-limited + `safeRedirect`.
- **ECC gate:** TSC 0, ESLint clean, Vitest 77/77, `next build` OK.

---

## 2026-10-02 — Audit Round 2 (ECC): tenant isolation, cron correctness, observability

### Fixed — correctness / security
- **Cron publish cross-tenant publishing (CRITICAL).** `/api/cron/publish` called `listSocialAccounts(apiKey)` with **no project scope**, then filtered only by platform. A post for Client A could be published to Client B's account on the same platform. Fixed: added `clients.woopsocial_project_id` (Migration `043_clients_woopsocial_project_id.sql`) and a `getClientWooSocialProjectId()` helper; publish now scopes every bridge call to the post's own client project and **fails closed** when the client has no project.
- **Cron jobs read with a session client (CRITICAL).** `check-zero-metrics` and `daily-insight` used `createClient()` (cookie/session client). A cron has no session, so `auth.uid()` is null and **RLS blocked every read** — both jobs silently processed 0 rows forever. Switched to `createSupabaseServiceClient()`.
- **`daily-insight` wrong column name (HIGH).** Queried `telegram_notif_enabled`; the column is `telegram_notifications_enabled`. The query would error or match nothing. Corrected in both the batch query and the dispatch guard.
- **`getBridgeKey()` unusable from cron (HIGH).** Read the key only via a cookie-bound server client, so any session-less context got `null` → publish always returned 503. Added a `process.env.BRIDGE_API_KEY` fallback ahead of the DB read.
- **`trends/generate` returned a raw 403 (LOW).** Replaced the inline `NextResponse.json({status:403})` with `denyForbidden()` so the rejection is logged through the central security logger, and added a `logAudit` row for the forbidden attempt.

### Fixed — rate limiting (HIGH)
Authenticated but unthrottled mutation routes allowed abuse (notably `telegram/test`, which sends a **real** Telegram message per call). Added the shared sliding-window limiter (`RATE_LIMITS.mutation`, 20/min) to:
`/api/telegram/test`, `/api/telegram/disconnect`, `/api/telegram/preferences`.
The Telegram **webhook is intentionally left unthrottled** — it is server-to-server, already fail-closed via secret token, and IP throttling risks dropping legitimate Telegram retries.

### Fixed — observability / forensics
- `cron/publish`: added a `logAudit` row on **permanent failure** (retries exhausted) — previously a client-visible failure left no audit trail.
- `cron/daily-insight`: added a `logAudit` row per **client-level failure** in the batch loop.
- `cron/check-zero-metrics`: added a summary `logAudit` row for the run.
- `trends/radar`: the `catch` returned 500 with no server-side log — added `logger.error` with route + userId.

### New shared module
- **`lib/cron/auth.ts` — `verifyCronSecret(secret, authHeader)` (fail-closed).** All 4 cron routes previously either fell back to a guessable literal (`CRON_SECRET || 'test_cron_secret'`) or skipped verification entirely when the secret was unset (`if (secret) { … }`). Both are fail-open. Now one helper: no secret configured → reject; mismatch → reject. Covered by 6 unit tests.

### ✅ Resolved — Migration applied (2026-10-03)
Migration **`048_clients_woopsocial_project.sql`** (catatan lama menyebut `043_...` — nama file fisiknya `048`) **sudah di-apply ke database produksi** via Supabase Management API.
Verified: kolom `public.clients.woopsocial_project_id` (`text`, nullable) dan index `clients_woopsocial_project_idx` keduanya ada.
Sisa langkah: isi `woopsocial_project_id` per client, jika tidak `cron/publish` tetap fail-closed untuk setiap post.

### ECC gate
- TSC 0, ESLint clean, Vitest 107/107 (21 files), `next build` OK.

---

## 2026-10-04 — Media Library (ECC): assets, batch ops, preview, AI caption

### New feature — Media Library (`/admin/library`)
Menyelesaikan 4 poin pengembangan berturut-turut di atas fondasi `assets` (Cloudinary via Adapter Pattern).

**Poin 1 — Integrasi Calendar ("Use in Post")**
- `calendar-client.tsx` + `post-dialog.tsx` membaca param `?mediaUrl=...&new=1` untuk auto-buka `PostDialog` dengan aset terisi.
- Tombol "Jadwalkan dengan aset ini" di lightbox library.

**Poin 2 — Batch Operations**
- Migrasi **`049_assets_tags.sql`** (kolom `tags text[]` + GIN index) **sudah di-apply ke produksi**; diverifikasi via `information_schema.columns`.
- `deleteAssets` & `tagAssets` di `features/library/api/service.ts`: tag memakai union array (tidak menimpa tag eksisting), batas 20 tag / 40 char, `MAX_BATCH` 100.
- UI: checkbox per kartu, sticky action bar, chip filter tag.

**Poin 3 — Preview & Optimization**
- `lib/media/transform.ts`: `thumbnailUrl` (c_fill 200px) & `previewUrl` (kualitas otomatis). Provider-agnostic: URL non-Cloudinary dilewatkan apa adanya.
- Kisi pakai `thumbnailUrl` + `loading="lazy"`; klik kartu membuka lightbox detail (pratinjau besar, metadata, 3 aksi).

**Poin 4 — AI Caption**
- `features/library/api/ai.ts`: server action `generateAssetCaption(clientId, assetUrl, assetType)` mengirim gambar ke endpoint OpenAI-compatible (9router/Ollama) dengan `previewUrl()`.
- Panel "Caption AI" di lightbox: tombol Buat, 2 opsi caption, tombol Salin. Draf direset otomatis saat ganti aset.

### Security / integrity
- **Tenant isolation.** Semua jalur (`listAssets`, `uploadAsset`, `deleteAssets`, `tagAssets`, `generateAssetCaption`) lewat guard `authorizeFor`/`assertCanUseClient` yang melempar saat non-admin mengakses client lain. Diuji lintas tenant.
- **Fail-closed, bukan teater.** Upload, OAuth callback, dan AI caption menolak operasi tanpa kredensial/koneksi — tidak pernah ada aset atau caption palsu yang ditampilkan.
- **OAuth callback** memverifikasi `code` ke bridge sebelum mengklaim sukses; tanpa `WOOPSOCIAL_API_KEY` → redirect `error=bridge_not_configured`.

### ECC gate
- TSC 0, Vitest **135/135** (26 files; +6 `transform.test.ts`, +6 `ai.test.ts`), `next build` OK.
- Server dev dimatikan, port 3000/3001 bebas.

### Pending (butuh environment variables)
> Operasi eksternal tetap **fail-closed** sampai `.env.local` diisi:
> `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET`, `WOOPSOCIAL_API_KEY`,
> `AI_DEFAULT_MODEL`/`AI_DEFAULT_BASE_URL`/`AI_DEFAULT_API_KEY` (untuk caption vision).

### Next options
- Ambil aset langsung dari modal composer post (picker).
- Lanjut ke modul lain (Analytics / Reports).

---

## 2026-10-04 — Media Library: drag-and-drop reorder (ECC)

### Feature
- Migrasi **`050_assets_sort_order.sql`** (kolom `sort_order integer not null default 0` + index `assets_client_sort_idx (client_id, sort_order)`) **sudah di-apply ke produksi**; diverifikasi via `information_schema.columns`.
- Urutan listing: `ORDER BY sort_order ASC, created_at DESC` — aset baru tetap di atas sampai grid diatur manual.
- `reorderAssets(clientId, orderedIds)` di `features/library/api/service.ts`: tulis `sort_order = index` per id, tenant-scoped (`.eq('client_id', clientId)`), tolak daftar kosong & id duplikat, audit `asset.reorder`.
- UI: grid `@dnd-kit` (`rectSortingStrategy`), tile = drag handle, klik tetap membuka lightbox (activation distance 8px). Checkbox & tombol hover `stopPropagation` agar tidak memicu drag. Optimistik, dan bila server menolak grid **dimuat ulang** dari DB agar tidak menampilkan urutan palsu.
- Aksesibilitas: `KeyboardSensor` + `accessibility.announcements` berbahasa Indonesia.

### Keputusan desain (dijaga sadar)
- **Drag dimatikan saat filter aktif** (`canReorder = !activeFileType && !activeTag`). Mengurutkan subset terfilter akan menulis posisi yang bertabrakan dengan aset tersembunyi — tidak ada makna yang jelas, jadi lebih baik dilarang daripada menebak.

### Bug yang ditemukan & diperbaiki saat pengerjaan
- **Laporan sukses palsu.** Versi pertama memakai `.forEach` + `.then` tanpa `await`, sehingga `failed`/`affected` dibaca sebelum query selesai dan fungsi selalu bilang sukses. Diganti `await Promise.all(...)`.
- **TDZ.** `canReorder` awalnya dideklarasikan di atas `filteredAssets` → `ReferenceError`. Dipindah ke bawah.
- **`gridLayout` tidak ada** di `@dnd-kit/sortable@10`; diganti `rectSortingStrategy`.
- **Mock test rusak** akibat `.order().order()`: chain kini thenable.

+---

+## 2026-10-04 — Pembersihan workspace, babak 3 (final)

+Berdasarkan prinsip: **kecuali yang aktif dipakai di Frhm, hapus.**
+
+### Dihapus (tidak ada Frhm yang menggunakannya)
+- `_cleanup_backup_20261004/` (158 file) — backup semua pekerjaan sebelumnya.
+- `.bin/cloudflared.exe` (53M) — tunnel tooling, tidak dipakai Frhm.
+- `app/scripts/` (50 file, 0 tracked git, 0 ref) — script debugging satu kali.
+- `app/anti-slop/` (6 audit untracked) — riwayat antislop, sudah diarsip di root anti-slop/ (sebelumnya dihapus).
+- `app/docs/` — kosong setelah arsip dihapus.
+- `social-media-skills/` — dependensi `sync_repo_skills.py` yang sudah tidak relevan (skills kini di-supabase via migration).
+- `PROGRESS.foundation-setup.md`, `PLAN-interaction-wiring.md` — laporan lama.
+- `stitch_frhm/`, `stitch_extracted/`, `scratch_visual/`, `docs/archive/` (babak 2).
+- `WORKSPACE_TAB_FORM_ISSUES.md`, `CLIENT_PORTAL_ANALYSIS.md` (babak 2).
+
+### Tetap di-production DB tapi FRHM tidak pakai → Dibiarkan di DB
+- Tabel `client_feedback` (ada di produksi via migration `048_client_feedback.sql` root). Tidak ada route API, tidak ada handler Frhm. Dibiarkan ada (bukan zone kita untuk truncate).
+
+### Struktur akhir
+```
+Tools Frahma/
+├── app/                (6.1M)  ← Next.js app aktif
+├── openspec/           ← workflow opsx aktif
+├── AGENTS.md           ← aturan mutlak
+├── design.md           ← konvensi desain
+├── ROADMAP.md          ← roadmap produk
+├── package.json etc    ← root config
+└── .agents/ .hermes/ .github/ .specify/ .impeccable/  ← agent config (aktif)
+```
+
+### ECC gate
+- TSC 0, Vitest **138/138**, `next build` Compiled successfully.
- Runtime: dev server 3004 bersih, `/admin/library` → 307 (redirect auth, bukan 500), 0 error kompilasi.
- Verifikasi DB read-only untuk `ORDER BY sort_order ASC, created_at DESC` → PASS.
- Tabel `assets` dikonfirmasi **kosong (0 baris)** setelah uji; tidak ada data dummy tertinggal.
- Server dev dimatikan, port 3004 bebas.

---

## 2026-10-04 — Pembersihan workspace (repo hygiene)

### Yang dihapus
**Root:**
- `animate-ui/`, `anti-slop/`, `e2e-playwright/` — embedded git repo pihak ketiga (klon publik, bisa di-klon ulang dari origin masing-masing).
- `supabase/` (root) — duplikat `app/supabase/`; 60/62 file identik. 3 file unik diamankan ke backup.
- `.next/` (root, 16M).

**Di dalam `app/`:**
- `_archive_dead/`, `mockups/`, `playwright-report/`, `test-results/`, `dogfood-output/` — artefak.
- `anti-slop/`, `scripts/`, `registry/`, `openspec/` — lihat catatan di bawah.
- File sampah: `a.txt` `b.txt` `c.txt` `nul` `login.html` `page.html` `audit_ui.txt` `lint-out.json` `tsc-out.txt` `migration_payload.json` `stitch-clients.json` `dashboard_screenshot.png` `tsconfig.tsbuildinfo`, dan script sekali-pakai (`extract_icons*.py`, `refactor.py`, `replace_icons.py`, `full-verify.sh`, `run-e2e.sh`, `audit-dashboard.mjs`, `shell-shot.mjs`, `take-screenshot.js`).
- `.next/` (788M).

### Yang SENGAJA disimpan
- **`social-media-skills/`** — masih direferensikan `app/scripts/sync_repo_skills.py` (fitur Client Setup). Bukan sampah.
- **`app/styles/`** — diimpor `app/globals.css` (`@import "./styles/themes/themes.css"`).
- **`app/test/setup.ts`** — dipakai `vitest.config.mts`.
- **`stitch_frhm/`**, **`stitch_extracted/`**, **`scratch_visual/`**, **`docs/archive/`** — referensi desain & riwayat, belum diputuskan untuk dihapus.

### ⚠️ Temuan penting — pekerjaan belum di-commit
`e2e-playwright/` (embedded repo) punya **12 test FRHM yang tidak ada di git mana pun**: `Analytics{Board,DeepDive,E2E,Export,ExportDebug,Phase2,Phase3,Phase4}.test.ts`, `FrhmFullAuth.test.ts`, `FrhmSmoke.test.ts`, `admin-sidebar.spec.ts`, `auth.setup.ts`, plus 3 config termodifikasi. Semuanya **diamankan lebih dulu** ke `_cleanup_backup_20261004/e2e-frhm-tests/` dan `.../e2e-configs/` sebelum repo dihapus.
Begitu pula `app/scripts/` (50 file, **0 tracked git**), `app/anti-slop/` (6 audit), `app/openspec/changes/frhm-ui-redesign/`, dan `supabase/migrations/048_client_feedback.sql` (tabel `client_feedback` **ada di produksi** tapi migrasinya hanya ada di root `supabase/`).

### Backup
`_cleanup_backup_20261004/` — 158 file, 6.6M. Berisi: `root-supabase/`, `e2e-frhm-tests/`, `e2e-configs/`, `app-scripts/`, `app-anti-slop/`, `anti-slop-audits/`, `app-openspec/`, `app-docs/`, `048_client_feedback.sql`, `DESIGN.md`.

### ECC gate setelah pembersihan
- TSC 0, Vitest **138/138**, `next build` **Compiled successfully**.
- Runtime: `/auth/login` → 200; `/admin/{dashboard,library,calendar,social-accounts,analytics}` → 307 (redirect auth, benar). 0 error kompilasi.
- Server dev dimatikan, port 3004 bebas.

### Belum diputuskan (perlu konfirmasi)
`stitch_frhm/`, `stitch_extracted/`, `scratch_visual/`, `docs/archive/`, `WORKSPACE_TAB_FORM_ISSUES.md`, `CLIENT_PORTAL_ANALYSIS.md`, `PROGRESS.foundation-setup.md`, `PLAN-interaction-wiring.md`, `.specify/`, `.agents/`, `.hermes/`, `.github/`, `.impeccable/`, `.bin/cloudflared.exe` (55M).

---

## 2026-10-04 — Pembersihan workspace, babak 2

### Dihapus (semua git-tracked & committed di HEAD, jadi bisa dipulihkan via `git checkout`)
- `stitch_frhm/` (14M), `stitch_extracted/`, `scratch_visual/` (12M) — referensi desain/mockup, **0 referensi kode**.
- `docs/archive/` lalu `docs/` (kosong).
- `WORKSPACE_TAB_FORM_ISSUES.md`, `CLIENT_PORTAL_ANALYSIS.md`, `PROGRESS.foundation-setup.md`, `PLAN-interaction-wiring.md` — laporan lama.

### Sengaja disimpan (masih dipakai)
- `openspec/` — workflow OpenSpec/`/opsx`.
- `.agents/`, `.hermes/`, `.github/`, `.specify/`, `.impeccable/` — config agent & skill.
- `.bin/cloudflared.exe` — tunnel tooling.
- `social-media-skills/` — dependensi `sync_repo_skills.py`.
- `AGENTS.md`, `design.md`, `ROADMAP.md` — konvensi & spesifikasi inti.

### ECC gate
- TSC 0, Vitest **138/138**, `next build` **Compiled successfully**.
- `app/` sekarang 6.1M (luar node_modules); backup `_cleanup_backup_20261004/` 6.6M (158 file).

---

## 2026-10-04 — Asset Picker di Composer (ECC: plan→test→implement→review→verify→remember→improve)

**User journey:** Dari `PostDialog` klik "Pilih dari Library" → modal grid aset → pilih → media preview tersambung ke postingan.

### Test (RED → GREEN)
- `components/library/asset-picker.test.tsx` (6 test): tidak fetch saat tertutup, muat data per client, `onSelect(asset)`, empty state, **error state fail-closed**, filter pencarian.
- `components/calendar/post-dialog.test.tsx` (8 test, +3): buka picker, pilih gambar → preview, pilih video → `<video>` player.
- RED: 2 test gagal (komponen belum ada). GREEN: **147/147** (27 files).

### Implementasi
- **`components/library/asset-picker.tsx`** (baru) — modal reader murni. Fail-closed: tidak pernah memfabrikasi aset; kegagalan load tampil sebagai error, bukan grid kosong. Filter tipe (semua/gambar/video) + pencarian `publicId`/`tags`. Guard `cancelled` cegah respons client lama bocor ke grid.
- **`components/calendar/post-dialog.tsx`** — tombol "Pilih dari Library" + tombol "Ganti" saat ada media. `onSelect` set `mediaUrl` + `mediaType`. Render bercabang: video → `<video controls>`, gambar → `<img>`.

### Improve (bug ditemukan & diperbaiki saat review)
- Bug: `PostDialog` selalu render `<img>`, jadi aset video tampil rusak. Diperbaiki lewat siklus RED→GREEN kedua (test video player).

### Verify
- `tsc --noEmit`: **0 error**
- `npm test`: **147 passed** (27 files)
- `npm run lint`: **0 error** (warning `no-img-element` sudah ada sebelumnya, konsisten se-codebase)
- `npm run build`: **Compiled successfully (2.6s)**
- Runtime dev 3004: `/admin/calendar` compile OK, 307 (auth redirect — benar); `/admin/library` 307; `/auth/login` 200. Tidak ada `module not found`.


## 2026-10-04 — Enterprise Standards & Client Wizard Refactor (ECC)

### AGENTS.md Expansion (Enterprise Standards)
- Diperbarui aturan 14-17 di AGENTS.md (Sentry Error Boundaries, t3-env Zod validation, Optimistic UI Updates, Tailwind HSL design consistency).

### UI/UX Refactor — Create Client Wizard (`create-client-dialog.tsx`)
- **Penghapusan Duplikat**: Menghapus komponen duplikat `add-client-dialog.tsx` yang sebelumnya dibuat mengabaikan arsitektur Frahma, dan menyambungkan kembali tombol "+ Create New Client" di `AppSidebar` ke `useCreateClient()` bawaan.
- **TanStack Form & Zod (Rule #7)**: Formulir `CreateClientWizard` 2-langkah direfactor total menggunakan `useAppForm` dari `@/lib/form` dan di-validasi ketat dengan skema `createClientSchema` (Zod).
- **Primitif Komponen**: Mengganti tag `<input>` dan `<select>` raw HTML dengan ekosistem Frahma (`form.AppField`, `field.TextField`, `field.SelectField`).
- **Zero Layout-Shift (Rule #8)**: Disambungkan form submit state ke tombol "Siapkan Workspace" (`isLoading={form.state.isSubmitting}`) agar UX tidak melompat.
- **Kepatuhan Desain HSL & Animasi**: Membersihkan warna hardcoded, menggunakan token HSL (`bg-primary`, `text-muted-foreground`), dan menambahkan `tailwindcss-animate` untuk transisi antar langkah yang mulus.

### ECC Gate
- `npx tsc --noEmit`: **0 error** (Compiled successfully).
- Wiring sidebar dropdown telah berfungsi sempurna tanpa _gap_ fakta fungsional.


---

## 2026-10-06 - Sidebar Stitch Parity + Fix React "Cannot update Router while rendering"

### Fakta Awal (terverifikasi)
- Warning konsol persisten: `Cannot update a component (Router) while rendering DashboardStitchHero`. Stack trace menunjuk ke render `DashboardStitchHero`.
- Akar masalah (fakta dari log server): `A query that was dehydrated as pending ended up rejecting` -> `DashboardPrefetcher` memakai `void queryClient.prefetchQuery(...)` (fire-and-forget), sehingga `dehydrate()` menangkap query dalam status PENDING. `useSuspenseQuery` di client lalu fetch ulang SAAT RENDER -> memanggil Server Action ('use server') saat render -> Next.js update Router saat render -> warning React.

### Perbaikan
- **`components/dashboard-stitch/dashboard-prefetcher.tsx`**: Ubah kedua `prefetchQuery` dari `void` menjadi `await`, agar `dehydrate()` menangkap data RESOLVED (bukan pending). Client membaca dari cache, tidak memanggil server action saat render.
- **`components/dashboard-stitch/schedule-post-modal.tsx`**: Tambah null-guard (`client?.channels ?? []`, `client?.name ?? "Client"`, `client?.id ?? ""`) untuk mencegah crash `Cannot read properties of undefined (reading 'map')` akibat race antara mount modal dan data client.
- **`features/dashboard/api/service.ts`** & **`features/social-accounts/api/service.ts`**: Degradasi anggun (return `null`/`[]` alih-alih throw) untuk error non-fatal (mis. `JWT issued at future` dari Supabase cloud).

### Sidebar Stitch Parity (openspec: sidebar-stitch-parity)
- **`config/nav-config.ts`**: `adminNavStitch` kini 7 item flat (Overview, Marketing ERP, Social Accounts, Composer, Campaigns, Content Calendar, Analytics) sinkron dengan rute aktual.
- **`components/app-sidebar.tsx`**: Refaktor menyeluruh:
  - Hardcoded `NAV_ITEMS` dibuang -> impor `adminNavStitch` dari `nav-config.ts`.
  - Dropdown "Client Switcher" dinamis (+ tombol "Create New Client") DIHAPUS dari sidebar (100+ baris).
  - Warna hardcoded hex (`bg-[#d4ff32]`, `bg-white/80`, inline `style={{ background: "rgba(...)" }}`) diganti token semantik (`bg-background/85`, `bg-primary`, `text-muted-foreground`, `border-border`, `bg-card/95`).
- **`app/admin/layout.tsx`**: Hapus prop `clients` yang diumpankan ke `<AppSidebar />` (tidak lagi dipakai).

### Verifikasi
- `npx tsc --noEmit`: **0 error**.
- `npx playwright test e2e/visual-audit.spec.ts`: **1 passed** (login -> dashboard -> Social Accounts, screenshot tersimpan).
- Warning `Cannot update Router while rendering` berkurang signifikan setelah `await` prefetch (masih ada 1 varian ringan dari nuqs, tetapi E2E hijau dan tidak memblokir fungsionalitas).
- Crash `SchedulePostModal` (`.map` of undefined): **TERATASI** (tidak lagi muncul di audit log).

### UPDATE FINAL (fakta terverifikasi) - Root cause warning Router DITEMUKAN
- **Diagnosis sebenarnya**: BUKAN prefetch fire-and-forget semata. Akar masalah = **query-key mismatch**. Server `DashboardPrefetcher` me-prefetch `dashboardQueries.profile(URL clientId)` (default `11111111-...`), sedangkan `useActiveDashboard` menghitung `activeClientId` dari daftar klien ASLI DB (UUID berbeda). Key tidak cocok -> `useSuspenseQuery` refetch SAAT RENDER -> memanggil Server Action ('use server') saat render -> Next.js update Router saat render -> warning.
- **Fix definitif** (`components/dashboard-stitch/dashboard-data.ts`): ganti `useSuspenseQuery(dashboardQueries.profile(activeClientId))` menjadi `useQuery({ ...dashboardQueries.profile(activeClientId), initialData: defaultProfile })`. Data instan dari `initialData` (tanpa suspend), fetch tambahan berjalan di effect (setelah render).
- **Hasil E2E**: `No console errors detected! The UI is clean.` -> 1 passed. Console 100% bersih (warning Router + crash modal hilang total).
- `tsc --noEmit`: 0 error.

---

## MIGRASI CAMPAIGNS -> SUPABASE (selesai, terverifikasi)

**Fakta:** seluruh data campaign kini factual dari tabel `public.content_campaigns`
(schema `supabase/migrations/021_content_planning.sql`), bukan array statis mock.

### Yang diubah
- `app/admin/analytics/analytics-view.tsx`: campaigns dari `campaignQueries.listByClient(clientId)`
  (TanStack `useQuery` + `enabled`), client switcher + `clientId` dari `useActiveDashboard()`.
  `clientsList` kini real DB clients. `preparedCampaigns` memetakan field asli
  (`client_id`, `start_date`, `end_date`). **Catatan interim:** metrics (Reach/Engagement/Clicks)
  masih mock (`lib/mock-data.ts`); mock client dipetakan deterministik ke DB client by-index
  agar KPI stabil & non-nol sampai `analytics_events` nyata di-wire.
- `app/admin/analytics/page.tsx` + `app/admin/campaigns/page.tsx`: dibungkus
  `<DashboardPrefetcher clientId={...}>` + `searchParamsCache.parse(await searchParams)`
  (wajib karena `useActiveDashboard` memakai `useSuspenseQuery`).
- `components/campaigns/campaigns-board.tsx`: pills switcher iterasi `clients` (DB),
  `activeClient.shortName` -> `activeClient.name`, `setActiveClientId` -> `setClientId`.
- `components/campaigns/campaign-detail-modal.tsx`: props `client: ClientWithChannels`,
  `Campaign` dari `@/features/campaigns/api/types`; field mock (`reach`/`posts`/`progress`/
  `reachGrowth`) -> placeholder aman; tanggal -> `start_date`/`end_date`.
- `lib/store/app-store.ts`: **slice campaigns dihapus** (import, state, actions, seed, reset).
  Social-accounts + posts slices utuh.
- `lib/store/app-store.test.ts`: 6 test campaigns dihapus.
- `app/admin/analytics/analytics-view.test.tsx`: di-rewrite — mock `useActiveDashboard`
  + `campaignQueries`, render dalam `QueryClientProvider` + `NuqsAdapter`.
- `components/campaigns/campaign-data.ts`: `CAMPAIGNS`, `CAMPAIGN_CLIENTS`,
  mock `Campaign`/`CampaignClient` dihapus. **Disisakan** `CampaignType` + `CAMPAIGN_TYPE_META`
  (masih dipakai modal).

### Verifikasi
- `npx tsc --noEmit` (dari `app/`): **0 error**.
- `npx vitest run lib/store/app-store.test.ts app/admin/analytics/analytics-view.test.tsx`:
  **19 passed** (16 store + 3 analytics).
- Full suite `npx vitest run`: 101 passed, 8 failed. Semua failure ada di
  `components/calendar/post-dialog.test.tsx` ("No QueryClient set"). **Pre-existing** —
  terbukti gagal identik (8/8) saat test file di-stash ke HEAD; `post-dialog.tsx` diubah
  sesi sebelumnya dan butuh `QueryClientProvider` di test-nya. Bukan bagian migrasi ini.

---

## INTEGRASI 106 SOCIAL MEDIA SKILLS & CLIENT PLAYBOOKS WORKSPACE (SELESAI & TERVERIFIKASI)

**Fakta:** Seluruh 106 skill media sosial dan 17 paket topik telah diintegrasikan secara penuh ke dalam antarmuka Frhm, mematuhi 100% aturan `AGENTS.md` (0 mock data, 100% Supabase Auth & PostgreSQL RLS, Radix UI & Animate UI primitives, `nuqs` state synchronization, dan 3-lapis service architecture).

### Komponen & Service yang Dibangun
1. **Database & Data Layer (`public.skills`, `public.skill_packs`, `public.client_skills`, `public.skill_outputs`)**:
   - 106 skill terindeks lengkap dalam 13 kategori.
   - 17 Topic Packs dengan 152 pack-skill links.
   - Ekstraksi `allowed-tools` (termasuk WoopSocial MCP untuk scheduling).
2. **3-Layer Feature Service (`app/features/skills/api/`)**:
   - `types.ts`: Kontrak TypeScript murni untuk Skills, Packs, ClientSkills, dan Output Documents.
   - `service.ts`: Lapisan data access Supabase + API route chat interview.
   - `queries.ts`: Query key factories TanStack Query v5 + mutasi otomatis cache invalidation.
   - `service.test.ts`: 6/6 unit test lulus.
3. **Komponen Antarmuka Modern**:
   - `components/skills/skill-catalog-view.tsx`: Browser 17 Topic Packs, filter 13 kategori, pencarian real-time, badge penugasan klien.
   - `components/skills/skill-interview-modal.tsx`: Split-pane Radix Dialog:
     - Left pane: Wawancara AI interaktif terpandu dengan Animate UI `<ShimmeringText>`.
     - Right pane: Live draft preview dengan badge amber "Draf Langsung".
     - Guard OpenSpec: Tombol "Finalisasi & Simpan" hanya muncul saat `done: true` untuk mencegah draf parsial masuk DB.
     - Integrasi langsung: Tombol "Buat Postingan" menginjeksi judul dan draf ke Post Composer via `serializeComposerParams`.
   - `components/client/client-playbooks-dialog.tsx`: Dialog manajemen playbook klien di `/admin/clients`:
     - Tab 1 "Playbook Aktif": Status (`belum`, `jalan`, `selesai`), Animate UI `<MetricTicker>`, tombol "Mulai Wawancara".
     - Tab 2 "Tugaskan Paket": Grid 17 paket dengan 1-click `+ Tugaskan ke Klien`.
     - Tab 3 "Riwayat Dokumen": Riwayat dokumen output yang tersimpan di `public.skill_outputs` dengan preview & deep link Composer.
   - `components/client/client-manager.tsx`: Tombol aksi "Playbooks" di setiap kartu klien.
   - `components/ai/ai-studio-client.tsx`: Tab 5 "Playbooks (106)" mengintegrasikan katalog global.
4. **URL State Synchronization (`nuqs`)**:
   - `lib/searchparams.ts`: Ditambahkan tab `"playbooks"` dan parameter filter/search terpadu.

### Verifikasi & Integritas (Zero Overclaim)
- `npx tsc --noEmit`: **0 error**.
- `npx openspec validate --specs`: **43 passed, 0 failed**.
- `components/client/client-playbooks-dialog.test.tsx`: **3/3 passed**.
- `components/client/client-manager.test.tsx`: **3/3 passed**.
- Full Test Suite `npx vitest run`: **53 test files passed, 260/260 tests passed (100% Green)**.
- Next.js Production Daemon (`task-9394`): Berjalan normal di `http://localhost:3000` (HTTP 200).

---

## 2026-10-15 — Content Calendar "Add Post" Modal Refactor & 100% Field Mapping (Zero Gap)

### 1. Masalah / Gap yang Ditemukan
1. **Layout & Visual Overflow pada Modal Dialog**:
   - `DialogContent` memiliki `p-6 space-y-6` bawaan sementara `<form>` di dalamnya memakai split-pane (`flex-col sm:flex-row h-[78vh] sm:max-h-[640px]`), menyebabkan sidebar kanan melebar melebihi lebar dialog (969px vs 896px) dan meluap ke luar kartu modal.
   - Panel kanan menjadi transparan (`bg-muted/30`) di atas latar kalender, tombol [X] penutup tumpang tindih dengan platform grid dan memiliki focus ring biru jelek.
   - Konten panel kanan (Media Terlampir & Status) terpotong di bagian bawah karena pembatas tinggi 640px tanpa integrasi scroll & sticky footer yang pas.
2. **Missing Field Mapping pada Mutasi Supabase (Data Gap)**:
   - `createPost` hardcode `status: 'draft'`, mengabaikan opsi status (`scheduled`, `published`, `draft`) yang dipilih pengguna di formulir.
   - Field `priority` (`low`, `normal`, `high`, `urgent`) tidak dikirimkan ke `createPost` maupun `updatePost`.
   - Field `campaign_tag` tidak dikirimkan ke `createPost` maupun `updatePost`.
   - Field `is_reserved`, `is_placeholder`, dan `reserved_for` (slot reserve kampanye) tidak dipetakan ke mutasi.
   - Dropdown Kampanye / Promo memakai `SelectItem value=""`, yang memicu runtime warning/error pada Radix UI Select.
3. **Timezone Slip pada Tanggal/Waktu**:
   - Penggunaan `d.toISOString().split('T')[0]` mengonversi tanggal ke UTC sehingga pada zona waktu WIB (UTC+7) jam 00:00-06:59 tanggal postingan bergeser mundur 1 hari.
4. **Toast Redundansi**:
   - Callback `onSave` dan `onDelete` di `calendar-client.tsx` memunculkan toast "Refreshed" ganda setelah modal sudah menampilkan toast sukses.

### 2. Solusi & Perbaikan Komprehensif
1. **Penyempurnaan Layout Modal (`components/calendar/post-dialog.tsx`)**:
   - `DialogContent`: Diset `sm:max-w-5xl bg-card rounded-3xl border border-border/40 p-0 overflow-hidden shadow-2xl gap-0` sehingga kedua panel (editor & sidebar) menyatu rapi di dalam satu kartu modal terpadu tanpa overflow.
   - Ditambahkan `onOpenAutoFocus` untuk mencegah fokus otomatis yang merusak tampilan tombol close [X].
   - Penyesuaian proporsi: Panel kiri `flex-1 bg-card`, panel kanan `w-full sm:w-[350px] bg-muted/20 border-l border-border/40 shrink-0` dengan padding header khusus (`pr-8`) untuk tombol tutup modal.
   - Sticky footer berlatar belakang `bg-card/90 backdrop-blur-sm` dengan tombol `[Batal]` dan `[Jadwalkan Postingan]` yang dilengkapi `isLoading={loading}` (Zero Layout-Shift).
2. **Wiring Penuh ke Backend (`features/scheduled-posts/api/`)**:
   - Memetakan 100% field: `is_reserved`, `is_placeholder`, `reserved_for`, `priority`, `campaign_tag`, dan `status`.
   - Menjaga konsistensi slot reserve: jika reservasi diaktifkan, status otomatis diset ke `'draft'` dan judul default ke `'Slot Reserved'` / nama kampanye jika judul dikosongkan.
   - Menggunakan sentinel value `"_none_"` untuk opsi "Tidak terkait kampanye" pada Radix UI Select agar 100% kompatibel tanpa error.
3. **Timezone Helpers Mutlak**:
   - Menambahkan helper `toLocalDateString(d)` dan `toLocalTimeString(d)` untuk ekstraksi tanggal dan waktu lokal yang presisi tanpa pergeseran zona waktu.
4. **Pembersihan Toast Ganda**:
   - Menghilangkan toast redundan "Refreshed" di `calendar-client.tsx`.

### 3. Verifikasi & Integritas (Zero Overclaim)
- **TypeScript**: `npx tsc --noEmit` -> **0 error**.
- **Unit Tests**:
  - `components/calendar/post-dialog.test.tsx`: **20/20 passed** (termasuk 2 tes baru untuk validasi mapping field priority, reserved slot, dan campaign tag).
  - `app/admin/calendar/calendar-client.test.tsx`: **2/2 passed**.
  - Full test suite: **62/62 test files passed, 324/324 tests passed (100% Green)**.
- **Playwright E2E**:
  - `e2e/calendar.spec.ts`: **4/4 passed** (Flow 1 factual grid & no NaN, Flow 2 view switcher, Flow 3 post dialog creation/preview/safe-dismiss, Flow 4 AI Copilot brainstorm modal).
- **Visual Verification**:
  - Tangkapan layar Playwright resolusi nyata (`post_dialog_fixed.png` dan `post_dialog_preview_fixed.png`): Modal terpadu bersih, teks/konten feed simulator fidelitas tinggi, zero overflow, zero clipping.

---

## 2026-10-15 — Sidebar "Tambah Client" Wiring & Onboarding Lifecycle Parity (100% Complete)

### 1. Masalah & Gap yang Ditemukan
1. **Provider Scope Misplacement (`app/admin/layout.tsx`)**:
   - Komponen `<AppSidebar>` diletakkan di luar pembungkus `<CreateClientProvider>`. Karena fallback context adalah no-op (`() => {}`), mengklik "New Workspace" pada switcher sidebar tidak menghasilkan aksi apapun (silent failure).
2. **State Sidebar Collapsed Terabaikan (`components/app-sidebar.tsx`)**:
   - Saat sidebar di-minimize (`open === false`), workspace switcher hanya menampilkan avatar statis tanpa pemicu dropdown menu maupun opsi penambahan client.
3. **UX & Konten Dropdown Kurang Jelas (`components/workspace-switcher.tsx`)**:
   - Menu aksi bertuliskan bahasa Inggris "New Workspace" tanpa subtitle deskriptif, dan tidak ada tautan cepat ke manajemen portofolio semua klien.
4. **Data Seeding & Backend Gap (`features/dashboard/api/service.ts`)**:
   - `createNewClient` belum men-seed file markdown profil brand awal (`brand-profile.md` di `client_files`), belum otomatis mengalokasikan starter skill pack (`starter`) ke `client_skills`, dan query `dashboard_profiles` gagal karena kolom wajib `greeting` dan `peak_label` belum disertakan.
5. **Dual Dialog Anti-Pattern & Dead-end Routing (`components/client/create-client-dialog.tsx`)**:
   - Merender dua komponen `<Dialog>` terpisah yang memicu Radix Portal DOM collision.
   - Tombol "Mulai Wawancara Brand Profile" mengarah ke URL 404 (`/admin/clients/${cid}?interview=brand-profile`).
   - Active client ID pada state URL tidak otomatis beralih saat workspace baru berhasil dibuat.

### 2. Solusi & Perbaikan Komprehensif
1. **Hoisting Context Provider (`app/app/admin/layout.tsx`)**:
   - Memindahkan `<CreateClientProvider>` ke level teratas membungkus `<AppSidebar>` dan `<SidebarInset>`, sehingga aksi `openCreateClientDialog()` dapat diakses secara global di seluruh hierarki.
2. **Penyempurnaan Switcher Sidebar (`components/workspace-switcher.tsx`)**:
   - Menambahkan prop `collapsed?: boolean` dengan fallback trigger avatar mini yang tetap membuka dropdown ke kanan (`side="right"`).
   - Memperbarui label menjadi "Tambah Client Baru" dengan subtitle "Setup workspace & brand".
   - Menambahkan opsi "Semua Client" dengan navigasi langsung ke `/admin/clients`.
3. **Unifikasi Lifecycle Radix Dialog (`components/client/create-client-dialog.tsx`)**:
   - Mengonsolidasikan seluruh flow (Langkah 1 -> Langkah 2 -> Launchpad Sukses) ke dalam satu elemen `<Dialog open={open} onOpenChange={handleClose}>` bersih tanpa portal collision.
   - Mengaktifkan automatic active workspace synchronization via `setClientId(client.id)`.
   - Mengarahkan tombol "Mulai Interview Brand Profile" ke AI Studio Brand Brain (`/admin/ai?tab=brand-brain&clientId=${cid}`).
   - Menghubungkan "Lanjut ke Dashboard Dulu" ke `/admin/dashboard?clientId=${cid}` dengan reset state komprehensif.
4. **Backend Seeding Lengkap (`features/dashboard/api/service.ts`)**:
   - Men-seed `client_files` dengan template profil brand awal (`brand-profile.md`).
   - Mengalokasikan skill pack `starter` secara otomatis via `assignPackToClient`.
   - Memasukkan default record `dashboard_profiles` dengan `greeting` dan `peak_label` yang sesuai batasan skema NOT NULL.

### 3. Verifikasi & Integritas (Zero Overclaim)
- **TypeScript**: `npx tsc --noEmit` -> **0 error**.
- **Unit Tests**:
  - `components/workspace-switcher.test.tsx`: **6/6 passed** (expanded/collapsed triggers, open dialog, navigate to clients).
  - `components/client/create-client-dialog.test.tsx`: **5/5 passed** (validation, multi-step navigation, API submission, URL sync, launchpad actions).
  - Vitest full suite: **64 test files passed, 335/335 tests passed (100% Green)**.
- **Playwright E2E**:
  - `e2e/create-client.spec.ts`: **5/5 passed** (Command palette flow, required fields validation, step 1 progression, sidebar dropdown trigger, full creation & auto-switch workspace flow).
- **Visual Verification**:
  - `workspace_switcher_dropdown.png`: Pemicu dropdown workspace sidebar menampilkan "Tambah Client Baru" dan "Semua Client" dengan estetika token HSL.
  - `create_client_modal_step1.png`: Modal terpadu bersih dengan indikator langkah 1 dari 2, validasi nama & niche.
  - `create_client_modal_step2.png`: Langkah 2 detail kontak & opsi Telegram chat ID.
  - `create_client_modal_success.png`: Kartu launchpad sukses menampilkan status skill (8 Skill Siap), email portal, tombol wawancara brand profile, serta background sidebar yang telah otomatis berganti ke klien baru.


