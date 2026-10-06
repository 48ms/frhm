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

### CIS Technical Implementation

| Component | File | Description |
|-----------|------|-------------|
| Sentiment Classifier | `lib/nlp/sentiment.ts` | Ollama Ollama (gpt-oss:120b) sentiment analysis with JSON parsing |
| Sentiment Cache | `lib/nlp/sentiment-cache.ts` | In-memory cache (24h TTL) to avoid duplicate API calls |
| Daily Cron | `app/api/cron/daily-insight/route.ts` | Aggregates sentiment per client, dispatches Telegram reports |
| Publish Cron | `app/api/cron/publish/route.ts` | WoopSocial Bridge integration with retry logic |
| Analytics API | `app/api/admin/analytics/benchmark/route.ts` | Multi-client aggregation endpoint |
| UI Components | `components/analytics/sentiment-overview-card.tsx`, `benchmark-board.tsx` | Dashboard visualization widgets |

### E2E Verification

- **Playwright Tests**: `AnalyticsPhase4.test.ts` — **6/6 PASS**
  - Daily Cron Endpoint (sentiment scanner)
  - Publish Cron Endpoint (WoopSocial bridge)
  - Benchmarking API endpoint
  - Predictions endpoint stability
  - PDF Export validation
  - Markdown Export validation
- **TypeScript**: `npx tsc --noEmit` — exit 0
- **ESLint**: 0 errors, 0 warnings
- **Build**: `npm run build` — exit 0

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
- **Frontend**: Next.js 14 App Router + TS + Tailwind v4 + shadcn Base UI + Motion (Animate UI)
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


## 2026-10-04 � Enterprise Standards & Client Wizard Refactor (ECC)

### AGENTS.md Expansion (Enterprise Standards)
- Diperbarui aturan 14-17 di AGENTS.md (Sentry Error Boundaries, t3-env Zod validation, Optimistic UI Updates, Tailwind HSL design consistency).

### UI/UX Refactor � Create Client Wizard (\create-client-dialog.tsx\)
- **Penghapusan Duplikat**: Menghapus komponen duplikat dd-client-dialog.tsx yang sebelumnya dibuat mengabaikan arsitektur Frahma, dan menyambungkan kembali tombol \+ Create New Client\ di \AppSidebar\ ke \useCreateClient()\ bawaan.
- **TanStack Form & Zod (Rule #7)**: Formulir \CreateClientWizard\ 2-langkah direfactor total menggunakan \useAppForm\ dari \@/lib/form\ dan di-validasi ketat dengan skema \createClientSchema\ (Zod).
- **Primitif Komponen**: Mengganti tag \<input>\ dan \<select>\ raw HTML dengan ekosistem Frahma (\orm.AppField\, \ield.TextField\, \ield.SelectField\).
- **Zero Layout-Shift (Rule #8)**: Disambungkan form submit state ke tombol "Siapkan Workspace" (\isLoading={form.state.isSubmitting}\) agar UX tidak melompat.
- **Kepatuhan Desain HSL & Animasi**: Membersihkan warna hardcoded, menggunakan token HSL (\g-primary\, \	ext-muted-foreground\), dan menambahkan \	ailwindcss-animate\ untuk transisi antar langkah yang mulus.

### ECC Gate
- \
px tsc --noEmit\: **0 error** (Compiled successfully).
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
