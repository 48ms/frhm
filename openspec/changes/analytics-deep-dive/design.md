# Design: Analytics Deep Dive Phase 1

## Architectural Changes

### 1. Data Schema & Migration
- File: `supabase/migrations/030_analytics_deep_dive.sql`
- Tambah enum & kolom baru ke `scheduled_posts` dan `post_metrics`.

### 2. Daily Cron Insight & Telegram Job
- File: `app/api/cron/daily-insight/route.ts`
- Loop active clients → panggil `generateInsightInternal(clientId, periodStart, periodEnd)` → insert `analytics_summaries` → format pesan Telegram (antislop-copywriting, 0 emoji) → `sendTelegramMessage`.

### 3. Extended AI Insight Prompt
- Update `lib/analytics/insight-prompt.ts`:
  - Tambah input `content_mix_ratio`, `total_wa_inquiries`, `total_dm_inquiries`, `creative_fatigue_flags`.
  - Aturan ketat: 0 emoji, no meta-talk.

### 4. UI Board Components Update
- Update `components/analytics/analytics-board.tsx`:
  - Inline edit kolom WA & DM.
  - Tab/Badge `content_type` & `creative_format`.
  - Bulk import CSV header parser: tambah `wa_inquiries`, `dm_inquiries`, `content_type`, `creative_format`.

### 5. Automated Tests
- Playwright E2E test `AnalyticsDeepDive.test.ts`:
  - Verify inline edit WA/DM inquiries.
  - Verify bulk import CSV dengan kolom baru.
  - Verify daily cron endpoint response (200 OK + summary generated).
