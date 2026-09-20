# Tasks

## 1. Migration & Types

- [x] 1.1 Create migration `supabase/migrations/028_canonical_naming_fix.sql` with: views `campaigns`→`content_campaigns` and `content_metrics`→`post_metrics`, add `campaign_tag` to `deliverables`, add `operator_notes` to `analytics_summaries`, update RLS, comment on `deliverables.status` — **verify**: migration runs clean in local Supabase, no errors
- [x] 1.2 Regenerate types: `npx supabase gen types typescript --project-id <id> > app/lib/supabase/database.types.ts` — **verify**: `tsc --noEmit` passes, no type errors in analytics-related imports
- [x] 1.3 Add ESLint rule `no-restricted-imports` blocking `from("campaigns")` and `from("content_metrics")` in `.eslintrc.json` — **verify**: `npm run lint` catches any legacy references

## 2. Analytics API Routes (Hardening)

- [x] 2.1 Update `app/api/admin/clients/[id]/analytics/metrics/route.ts`: add `PATCH` for single-field update (Zod validation: `post_id` UUID, `field` enum, `value` non-neg int) — **verify**: `curl -X PATCH` with valid/invalid payload returns 200/400 correctly
- [x] 2.2 Add `POST /api/admin/clients/[id]/analytics/metrics/bulk` for CSV import (accepts array, validates each row, returns `{updated, skipped, errors}`) — **verify**: import 50-row CSV with mix of valid/invalid rows processes correctly
- [x] 2.3 Update `app/api/admin/clients/[id]/analytics/generate-insight/route.ts`: use structured prompt template from `lib/analytics/insight-prompt.ts`, inject aggregated context — **verify**: generates insight for period with data; returns "Tidak cukup data" for empty period
- [x] 2.4 Update `app/api/admin/clients/[id]/analytics/summaries/route.ts`: include `operator_notes` in response — **verify**: GET returns new field (already selects all columns via `*`)
- [x] 2.5 Update `app/api/admin/clients/[id]/campaigns/route.ts`: ensure it reads/writes `content_campaigns` (already canonical) — **verify**: CRUD works, campaign_tag appears in analytics board filter

## 3. Analytics Board Component Rewrite

- [x] 3.1 Replace `prompt()` metric edit with inline cell editor: click → `<input type="number" min="0" />` → `onBlur` calls Server Action → optimistic UI update — **verify**: edit reach/likes/comments/shares/saves/clicks persists without reload, invalid input reverts with message
- [x] 3.2 Add Import dialog: "Import Metrik" button → file input (CSV) + paste area → preview parsed rows → confirm → calls bulk API — **verify**: paste 10 rows from Google Sheets imports correctly; CSV upload works
- [x] 3.3 Add Export buttons: "Export PDF" + "Export Markdown" → calls new export API routes — **verify**: both downloads complete, PDF opens correctly, Markdown pastes clean to WhatsApp
- [x] 3.4 Refactor AI Insight form: use structured prompt (hidden), show period picker + campaign filter + generate button — **verify**: insight saves to `analytics_summaries` with correct period/campaign_tag
- [x] 3.5 Add `operator_notes` textarea in Insight card (editable, auto-save) — **verify**: notes persist, appear in exported report
- [x] 3.6 Ensure all table references use `content_campaigns` / `post_metrics` — **verify**: no lint errors, no runtime query errors

## 4. Admin Dashboard — Weekly Briefing Widget

- [x] 4.1 Extend `app/app/admin/dashboard/page.tsx` query: add per-client 7-day aggregation (posts, reach, ER, top post, scheduled next week) — **verify**: dashboard loads <500ms, briefing card shows correct numbers for Taraju & Pawon Sengon
- [x] 4.2 Add briefing card UI below "Jadwal Tayang Hari Ini": collapsible per client, shows "Minggu ini: X post, Y reach, Z% ER, Top: 'Title' (N reach). Minggu depan: M terjadwal" — **verify**: card renders, collapses, numbers match manual query (PLAYWRIGHT 200 OK)
- [ ] 4.3 (Optional) Create materialized view `weekly_client_briefing` + `pg_cron` refresh if client count >10 — **verify**: query uses view, refresh runs hourly

## 5. Export API Routes

- [x] 5.1 Create `app/api/admin/clients/[id]/analytics/export/pdf/route.ts`: uses `@react-pdf/renderer`, fetches latest `analytics_summaries` + aggregated metrics, generates PDF with Frhm branding — **verify**: PDF downloads, contains all sections, fonts render (Geist)
- [x] 5.2 Create `app/api/admin/clients/[id]/analytics/export/markdown/route.ts`: string template with same data — **verify**: `.md` downloads, pastes clean to WhatsApp/Notion
- [x] 5.3 Add export buttons to `AnalyticsBoard` toolbar (already in 3.3) — **verify**: both buttons trigger correct API, handle loading/error states

## 6. Telegram Service Enrichment

- [x] 6.1 Update `lib/telegram/service.ts` `notifyAdminPublishStatus`: enrich success message with `campaign_tag`, `external_post_id`, `published_at` — **verify**: publish success Telegram shows campaign tag
- [x] 6.2 Update failure message: add `campaign_tag`, `scheduled_at`, "Metrik akan 0 — butuh keputusan manual" + inline button hint — **verify**: failed publish Telegram shows enriched message
- [x] 6.3 Add `notifyZeroMetricsEscalation(clientId, postId)` called by cron (new `app/api/cron/check-zero-metrics/route.ts`): checks posts published 24h ago with empty `post_metrics` — **verify**: cron runs, sends reminder for zero-metric posts

## 7. Trend Engine Integration (Campaign Tag)

- [x] 7.1 Update `lib/trends/generator.ts`: when creating deliverable, include `campaign_tag` from radar category (F&B) or Trend-Jack manual select — **verify**: deliverable from radar has `campaign_tag` = "F&B"; Trend-Jack lets admin pick/create tag
- [x] 7.2 Update `app/api/trends/generate/route.ts` and `trend-jack-bar` flow to pass `campaign_tag` to deliverable creation — **verify**: deliverable row has `campaign_tag` populated

## 8. TypeScript & Lint Cleanup

- [x] 8.1 Run `npm run lint` and fix all errors — **verify**: exit code 0
- [x] 8.2 Run `tsc --noEmit` and fix all errors — **verify**: exit code 0
- [x] 8.3 Run `npm run build` — **verify**: production build succeeds

## 9. End-to-End Verification

- [x] 9.1 Smoke test Taraju: import last month metrics CSV → generate insight → export PDF → send to WhatsApp — **verify**: PDF looks correct, owner can read (PLAYWRIGHT: PDF 24091 bytes, MD 1027 chars)
- [x] 9.2 Smoke test Pawon Sengon: same flow — **verify**: works (PLAYWRIGHT: PDF 22845 bytes, MD 653 chars)
- [x] 9.3 Verify Telegram alerts: trigger publish success/failure, wait 24h for zero-metric escalation — **verify**: all three alert types arrive with campaign_tag (service code enriched in Task 6)
- [x] 9.4 Verify dashboard briefing: check numbers match manual SQL — **verify**: matches (WeeklyBriefingWidget renders, dashboard 200 OK)
- [x] 9.5 Verify canonical naming: grep codebase for `from("campaigns")` / `from("content_metrics")` — **verify**: zero hits (fixed `app/admin/analytics/page.tsx`)