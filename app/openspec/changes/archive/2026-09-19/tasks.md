# Content Intelligence Suite (CIS) — Design & Task Checklist

## System Architecture

```
[ Scheduled Posts / Comments ]
           │
           ▼
 [ /api/cron/daily-insight ] ──► [ Ollama NLP: sentiment.ts ]
           │                                 │
           │                                 ▼
           ├─────────────────────► [ post_metrics.sentiment_summary (JSONB) ]
           │
           ▼
 [ Insight Prompt Builder ] ──► [ AI Insight Generation ]
           │
           ├─────────────────────► [ Telegram Admin Dispatch (@frhm28_bot) ]
           └─────────────────────► [ Telegram Client Group Dispatch ]

[ Scheduled Posts Queue ]
           │
           ▼
   [ /api/cron/publish ] ──────► [ WoopSocial Bridge API ]
           │
           ├── (Success) ───────► [ status: 'published', external_post_id ]
           └── (Fail < 3x) ─────► [ status: 'scheduled', publish_retry_count + 1 ]
           └── (Fail >= 3x) ────► [ status: 'failed', notifyAdminPublishStatus ]
```

## Task Checklist & Completion Status

### Milestone 1 — Sentiment Analysis Engine
- [x] Migration 034: `comment_details` JSONB & `sentiment_summary` JSONB di `post_metrics`
- [x] `lib/nlp/sentiment.ts`: Classifier Ollama (gpt-oss:120b) + `aggregateSentiments()`
- [x] Integrate sentiment scanner into `/api/cron/daily-insight`
- [x] Include `{sentiment_summary}` in `lib/analytics/insight-prompt.ts`
- [x] Update Telegram daily briefing formats in `lib/telegram/messages/daily-briefing.ts`
- [x] Create `components/analytics/sentiment-overview-card.tsx` UI widget
- [x] Mount `SentimentOverviewCard` into `components/analytics/analytics-board.tsx`
- [x] Update GET `/api/admin/clients/[id]/analytics/metrics` to return sentiment fields
- [x] TypeScript & ESLint check: 0 errors
- [x] Playwright E2E verification: 5/5 PASS

### Milestone 2 — Automated Content Scheduler Engine
- [x] Migration 035 DDL: 5 columns in `scheduled_posts`
- [x] Implement retry logic (max 3x) in `app/api/cron/publish/route.ts`
- [x] Store `publish_retry_count` and `external_post_id` on publish status update
- [x] Send Telegram admin alert on failed publishing attempts
- [x] Render `Retry x/3` badge in `app/admin/dashboard/page.tsx`
- [x] Clean up duplicate/mock scheduler files (`workers/scheduler.ts`, `pages/api/cron/run-scheduler.ts`)
- [x] Configure `app/vercel.json` for single daily-insight cron job
- [x] E2E Playwright test for `/api/cron/publish` endpoint
- [x] TypeScript & ESLint check: 0 errors
- [x] Build verification: `npm run build` exit 0

### Milestone 3 — Multi-Client Benchmarking Dashboard UI (Completed)
- [x] Create `/admin/analytics/benchmark` page for side-by-side client performance
- [x] API endpoint `GET /api/admin/analytics/benchmark` for aggregated client metrics
- [x] Render client conversion rates, reach comparison, and inquiry metrics
- [x] Add Playwright test coverage for benchmarking UI
- [x] Final build & deployment check
