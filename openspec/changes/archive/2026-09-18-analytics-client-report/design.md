# Design: Operator Client Report (Analytics & Reporting)

## Context

Current state (see proposal.md — Why):
- `/admin/analytics` page queries non-existent tables `campaigns` + `content_metrics` → renders empty
- `AnalyticsBoard` uses `prompt()` for metrics input — primitive, not audit-able
- No CSV/paste import, no structured AI prompt, no export
- Naming drift: `campaigns` vs `content_campaigns`, `content_metrics` vs `post_metrics`, status `sent` labeled "Review" in telegram spec
- `database.types.ts` stale (pre-rename)

Constraints:
- Stack: Next.js 14 App Router, Supabase (Postgres + Auth), Vercel
- No custom backend — Supabase only
- WoopSocial bridge unchanged (publish only, no analytics)
- Telegram service unchanged (existing notification types cover new alerts)
- Skill repo `analytics-and-reporting` (METER framework) = UX reference, not code

## Goals / Non-Goals

**Goals:**
1. Fix analytics page + board: real data, inline edit, CSV import, structured AI, export
2. Canonical naming enforced in code + migration + regenerated types
3. Weekly briefing widget on admin dashboard (extend existing "Jadwal Tayang Hari Ini")
4. Telegram alerts enriched with campaign_tag + metrics context + 24h zero-metric escalation

**Non-Goals:**
- Native IG/TikTok API sync (manual import only — METER principle: native analytics = platform truth)
- Real-time dashboard charts (static tables + export sufficient for monthly report)
- Client-facing analytics portal (owner sees PDF/MD report only)
- Billing/usage tracking

## Decisions

### 1. Inline Metrics Editor — Optimistic UI + Server Action

**Choice:** Cell click → `<input type="number" min="0" />` → `onBlur` → Server Action `updatePostMetric(postId, field, value)` → revalidate path.

**Why not:** Modal dialog (extra click), client-side only (no audit), full row form (overkill for single metric).

**Alternative considered:** TanStack Table editable cells — rejected: adds 15kb bundle for one board. Native input + Server Action is 0 deps.

**Implementation:**
- `app/components/analytics/analytics-board.tsx`: replace `prompt()` with inline `<td>` edit mode
- `app/api/admin/clients/[id]/analytics/metrics/route.ts`: add `PATCH` for single-field update (or new `PUT /api/admin/clients/[id]/analytics/metrics/[postId]`)
- Validation: `zod.number().int().min(0)` per field

### 2. CSV / Paste Import — Client-Side Parse → Bulk Upsert

**Choice:** `PapaParse` (3kb gz) for CSV; `navigator.clipboard.readText()` + tab/CSV split for paste. Parse in browser → validate rows → single `POST /api/admin/clients/[id]/analytics/metrics/bulk` with array.

**Why not:** Server-side parse (uploads whole file, slower UX), Excel/Google Sheets API (auth complexity, overkill).

**Validation rules per row:**
- `post_id` must exist in `scheduled_posts` for this client
- `platform` must match post's platform
- All metric fields: non-negative int
- Unknown columns → ignored with warning count

**Response:** `{ updated: 42, skipped: 3, errors: [{ row: 5, reason: "post_id not found" }] }`

### 3. Structured AI Insight Prompt — Template + Server-Side Construction

**Choice:** Prompt template stored in `lib/analytics/insight-prompt.ts` (not DB). Server constructs context from `post_metrics` + `content_campaigns`, injects into template, calls provider.

**Template structure:**
```
Kamu adalah analis social media untuk agency Frhm. Client: {client_name}.
Periode: {period_start} – {period_end}. Campaign filter: {campaign_tag || "Semua"}.

DATA:
- Total posts: {n}
- Total reach: {sum_reach}
- Total engagement: {sum_engagement}
- Engagement rate: {er}%
- Campaign breakdown: {per_campaign_table}
- Top 3 posts by ER: {top3}
- Bottom 3 posts by ER: {bottom3}
- Week-over-week delta: {wow}

INSTRUKSI:
Berikan 3 temuan ACTIONABLE untuk owner (Pak Adit / Bunda):
1. Apa yang WORK (buat lagi / perbanyak)
2. Apa yang TIDAK WORK (hentikan / perbaiki)
3. Apa yang HARUS DIUBAH minggu depan (konkret: format, jam, hook, platform)

Format: Markdown, bahasa Indonesia, tone professional tapi jujur. Maks 300 kata.
```

**Why not:** Free-form prompt (inconsistent output), client-side construction (exposes data, prompt injection risk).

**Provider:** Existing `lib/ai/providers.ts` — `chatJson` with `agnes-2.5-flash` default, fallback to `9router COMBO2`.

### 4. Export — PDF via `@react-pdf/renderer` (Server) + Markdown Template

**Choice:** `@react-pdf/renderer` (22kb) for PDF — runs in Node (API route), no headless Chrome. Markdown = string template.

**Why not:** `puppeteer` (heavy, cold start), `jsPDF` (client-only, font issues), `html2canvas` (flaky).

**PDF Structure:**
- Cover: Frhm logo, "Laporan Bulanan", client name, period
- Executive Summary: AI insight (from `analytics_summaries` latest)
- Campaign Performance: table from `content_campaigns` + aggregated `post_metrics`
- Top/Bottom Posts: 3 each with metrics
- Operator Notes: free-text field in export dialog (saved to `analytics_summaries.operator_notes` new column)

**Markdown:** Same sections, GitHub-flavored, ready for WhatsApp/Notion.

### 5. Canonical Naming Migration — Single Atomic Migration

**Choice:** One migration `028_canonical_naming_fix.sql` that:
1. Creates view `campaigns` → `content_campaigns` (for any legacy code still querying old name — temporary compat)
2. Creates view `content_metrics` → `post_metrics` (same)
3. Adds `campaign_tag` to `deliverables` (nullable, FK to `content_campaigns.name`)
4. Adds `operator_notes` to `analytics_summaries`
5. Updates RLS policies to reference canonical tables
6. Adds comment on `deliverables.status` clarifying `sent` = "Terkirim ke Client"

**Why not:** Multiple migrations (harder to rollback), code-first rename (breaks running app).

**Rollback:** `DROP VIEW campaigns, content_metrics; ALTER TABLE deliverables DROP COLUMN campaign_tag; ALTER TABLE analytics_summaries DROP COLUMN operator_notes;`

### 6. Weekly Briefing Widget — Extend Existing Dashboard Card

**Choice:** Reuse `AdminDashboard` query for `scheduled_posts` (today) → add parallel query for last 7 days `post_metrics` aggregation per client.

**Query pattern (single query per client):**
```sql
SELECT
  COUNT(*) FILTER (WHERE scheduled_at >= week_start AND status = 'published') AS posts_this_week,
  SUM(reach) AS total_reach,
  SUM(likes+comments+shares+saves) / NULLIF(SUM(reach),0) * 100 AS engagement_rate,
  MAX(reach) KEEP (DENSE_RANK FIRST ORDER BY (likes+comments+shares+saves)/reach DESC) AS top_post_reach,
  (SELECT title FROM scheduled_posts WHERE ...) AS top_post_title,
  COUNT(*) FILTER (WHERE scheduled_at BETWEEN next_week_start AND next_week_end AND status = 'scheduled') AS scheduled_next_week
FROM scheduled_posts sp
JOIN post_metrics pm ON pm.post_id = sp.id
WHERE sp.client_id = $1 AND sp.scheduled_at >= week_start - interval '7 days'
```

**UI:** Add below "Jadwal Tayang Hari Ini" card, collapsible per client.

### 7. Telegram Alert Enrichment — Minimal Service Change

**Choice:** Modify `lib/telegram/service.ts` functions `notifyAdminPublishStatus` and add `notifyZeroMetricsEscalation`.

**Message format (Markdown):**
```
🚨 *Publish Gagal* — [Judul] (Taraju)
Platform: Instagram
Campaign: #Ramadan2026
Jadwal: 19:00 WIB
Error: API timeout
—
Metrik akan 0 untuk slot ini. Butuh keputusan: [Tunda 1 hari] [Posting ulang manual]
```

**Why not:** New notification type (over-engineering), webhook payload change (breaking for any external consumer).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Migration on production tables breaks running app | Run migration in Supabase dashboard during low traffic; verify `database.types.ts` regenerates clean; feature flag new analytics behind `NEXT_PUBLIC_ANALYTICS_V2=true` |
| `PapaParse` adds bundle size | Lazy-load: `const Papa = await import('papaparse')` only when Import dialog opens |
| AI insight quality varies | Template is deterministic; operator can edit before export; log prompt + response for debugging |
| PDF generation timeout on Vercel (10s limit) | `@react-pdf/renderer` is synchronous Node; keep report <5 pages; if timeout, fallback to Markdown-only with "PDF generation failed, downloaded Markdown instead" toast |
| Weekly briefing query N+1 for many clients | Materialized view `weekly_client_briefing` refreshed by `pg_cron` hourly (or compute on-demand with `Promise.all` — max 10 clients) |
| Drift reintroduction | ESLint rule `no-restricted-imports` blocking `from("campaigns")` / `from("content_metrics")`; add to `eslint.config.js` |

## Migration Plan

1. **Migration 028** — canonical naming + new columns (run in Supabase dashboard)
2. **Regenerate types** — `npx supabase gen types typescript --project-id <id> > app/lib/supabase/database.types.ts`
3. **Feature flag** — add `NEXT_PUBLIC_ANALYTICS_V2=true` to Vercel env
4. **Deploy code** — analytics board rewrite, API routes, dashboard widget, telegram enrichment
5. **Smoke test** — Taraju + Pawon Sengon: import CSV, generate insight, export PDF/MD, verify Telegram alerts
6. **Remove flag** — after 1 week stable, remove flag and legacy analytics page code

## Open Questions

1. **PDF font licensing** — Geist is local in project; `@react-pdf/renderer` needs TTF path. Confirm `public/fonts/GeistVF.ttf` works or bundle font.
2. **Weekly briefing materialized view vs on-demand** — decide after measuring client count (current: 2, projected: <20).
3. **Operator notes field in `analytics_summaries`** — single text column OK, or need versioning? (Start simple, version later if requested.)
4. **CSV import idempotency key** — `post_id` + `platform` composite unique? (Currently `post_metrics.post_id` is UNIQUE. Keep; upsert on `post_id`.)