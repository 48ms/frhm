# Tasks: Analytics Deep Dive Phase 1 & 2

## Phase 1 (High ROI Attribution & Automation)
- [x] Task 1.1: Database Migration `030_analytics_deep_dive.sql` (schema update) — applied live
- [x] Task 1.2: Extend TypeScript Types & API endpoints (`post_metrics` & `scheduled_posts`) — database.types.ts patched, routes updated
- [x] Task 2.1: Extend `buildInsightPrompt` dengan Content Mix & Inquiry Attribution + Strict Antislop Rules — prompt + context injected
- [x] Task 2.2: Implement Daily Cron API Route (`/api/cron/daily-insight`) + Telegram Notification Dispatcher — done
- [x] Task 3.1: Update `AnalyticsBoard` UI — inline edit WA/DM inquiries + badge format/type — done
- [x] Task 3.2: Update Bulk Import CSV/Paste Parser untuk kolom baru — done
- [x] Task 4.1: Update PDF & Markdown Export Route dengan data WA/DM & Content Mix — markdown patched, PDF attribution funnel section added
- [x] Task 5.1: Create & Run Playwright E2E Test Suite (`AnalyticsDeepDive.test.ts`)
- [x] Task 5.2: Codebase Verification (`tsc`, `eslint`, `npm run build`)

## Phase 2 (Competitor Benchmark & Seasonal Intelligence)
- [x] Task 6.1: Database Migration `031_competitor_seasonal.sql` (`competitor_benchmarks` & `seasonal_periods`) — applied live + seeded
- [x] Task 6.2: Extend TypeScript Types (`database.types.ts`) & Create API Endpoints for Competitors & Seasonal
- [x] Task 7.1: Inject Competitor Gap Analysis & Seasonal Context ke `insight-prompt.ts` & `generate-insight/route.ts` & `daily-insight/route.ts`
- [x] Task 7.2: Create UI Component `CompetitorBenchmarkCard` & `SeasonalCalendarBadge` di `AnalyticsBoard`
- [x] Task 8.1: Update PDF & Markdown Export untuk sertakan Seksi Benchmark Kompetitor & Musiman
- [x] Task 9.1: Playwright E2E Test Suite Extension (`AnalyticsPhase2.test.ts`) — 4/4 PASS. Codebase Verification (`tsc` 0 errors, `npm run build` exit 0)

## Phase 3 (Predictive Performance & ROI Forecasting)
- [x] Task 10.1: Database Migration `032_predictive_roi.sql` tabel `analytics_predictions` — applied live
- [x] Task 10.2: Extend TypeScript Types (`AnalyticsPrediction`) & Create API Endpoint (`GET/POST predictions`)
- [x] Task 11.1: Inject Predictive Forecast ke `insight-prompt.ts` (Prompt #6), `generate-insight/route.ts`, & `daily-insight/route.ts`
- [x] Task 11.2: Create UI Component `ROIAnalyticalForecastCard` di `AnalyticsBoard`
- [x] Task 12.1: Update PDF & Markdown Export dengan seksi Proyeksi Forecasting ROI
- [x] Task 13.1: Playwright E2E Test Suite Extension (`AnalyticsPhase3.test.ts`) — 4/4 PASS. Codebase Verification (`tsc` 0 errors, `npm run build` exit 0)
