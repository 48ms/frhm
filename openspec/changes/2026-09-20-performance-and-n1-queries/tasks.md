# Tasks: Performance & N+1 Query Resolution

## Phase 1: Parallelize generate-insight — 2 hrs
- [x] Refactor `generate-insight/route.ts`: wrap all independent `.from()` calls in `Promise.all`
- [x] Identify queries that can be JOINed into a single `.select('*, relation(*)')`
- [x] Move `users` + `ai_providers` into a separate parallel batch
- [x] Verify: `npx tsc --noEmit` passes

## Phase 2: Batch metrics/bulk — 2 hrs
- [ ] Pre-validate all `post_id`s with single `.in('id', postIds)` query
- [ ] Replace for-loop upsert with single `.upsert(rowsArray)` batch
- [ ] Handle platform mismatch errors with indexed map
- [ ] Verify: bulk import of 100 rows = 3 DB calls total

## Phase 3: Parallelize skills/bulk-run — 3 hrs
- [ ] Pre-fetch all `skill_files` with `.in('skill_id', skillIds).eq('path', 'SKILL.md')`
- [ ] Pre-fetch all skill names
- [ ] Replace sequential `for` loop with `Promise.allSettled(skillIds.map(...))`
- [ ] Cap concurrency at 3 to respect AI provider rate limits
- [ ] Verify: 5 skills run in parallel, ~10s total instead of 50s

## Phase 4: Pagination — 2 hrs
- [ ] Add `?page` & `?limit` params to `/api/admin/clients/route.ts`
- [ ] Add to `/api/admin/deliverables/route.ts`
- [ ] Add to `/api/admin/scheduled-posts/route.ts`
- [ ] Default limit 50, max 100; return `total` count in response
- [ ] Verify: `/api/clients?limit=10` returns 10

## Phase 5: Remove framer-motion — 2 hrs
- [ ] Run `npx codemod` or manual: replace `from "framer-motion"` with `from "motion/react"` in all 301 files
- [ ] Remove `framer-motion` from `package.json`
- [ ] Run `npm install` to prune
- [ ] Verify: `npx tsc --noEmit` + build passes

## Phase 6: Singleton supabase client — 0.5 hrs
- [ ] Refactor `lib/supabase/client.ts` to cache the instance
- [ ] Verify: repeated imports return same instance

## Phase 7: useEffect cleanup — 1 hr
- [ ] Add cleanup to `hasil.tsx`, `setup.tsx`, `workspace.tsx` (setTimeout)
- [ ] Add cleanup to `hero-asset-card.tsx`, `expandable-action-bar.tsx`, `ripple-button.tsx` (listeners)
- [ ] Verify with React dev tools: no leaks on tab switch

## Phase 8: Lazy-load recharts — 1 hr
- [ ] Wrap `ads-tracker-board.tsx` + `roi-dashboard-board.tsx` in `next/dynamic`
- [ ] Add loading skeleton fallback
- [ ] Verify: JS bundle for marketing tab loads on-demand

## Phase 9: Security headers — 0.5 hrs
- [ ] Add `headers()` function to `next.config.mjs`
- [ ] Add `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, `Content-Security-Policy`
- [ ] Verify: `curl -I` shows security headers

## Phase 10: Image optimization — 0.5 hrs
- [ ] Add `images.remotePatterns` to `next.config.mjs`
- [ ] Allow Supabase Storage URLs (https://*.supabase.co)
- [ ] Verify: external images from CDN render

## Phase 11: Add force-dynamic to mutations — 1 hr
- [ ] Add `export const dynamic = 'force-dynamic'` to `/api/admin/clients/[id]/export/route.ts`
- [ ] Add to `/api/admin/clients/[id]/outputs/route.ts`, `send/route.ts`, `reset-password/route.ts`
- [ ] Add to `/api/admin/clients/route.ts`, `/api/admin/deliverables/route.ts`, `[id]/route.ts`
- [ ] Add to `/api/client/deliverables/.../approve/route.ts`, `export/route.ts`, `revision/route.ts`, `export/route.ts`
- [ ] Verify: mutations show dynamic in build output

## Phase 12: Add loading.tsx and error.tsx — 2 hrs
- [ ] Add `loading.tsx` to `app/admin/dashboard`, `/analytics`, `/clients`, `/deliverables`
- [ ] Add `error.tsx` to `app/admin/dashboard`, `/analytics`, `/clients`, `/deliverables`
- [ ] Add to `app/client/dashboard`, `/deliverables`, `/pipeline`
- [ ] Verify: show spinner/error during fetch

## Phase 13: Cache-Control on analytics — 1 hr
- [ ] Add `Cache-Control: public, max-age=60, stale-while-revalidate=300` to `metrics/route.ts`
- [ ] Add to `analytics/summaries/route.ts`, `/predictions/route.ts`
- [ ] Verify: `curl -I` shows Cache-Control header

## Phase 14: Database views — 2 hrs
- [ ] Create `dashboard_summary` view with JOINs of clients, client_skills, deliverables
- [ ] Create `metrics_by_client` view with pre-aggregated metrics
- [ ] Verify routes: use views instead of multiple `.from()`

## Phase 15: Table virtualization — 2 hrs
- [ ] Install `react-window` or `@tanstack/react-virtual`
- [ ] Wrap table rows in virtualized container
- [ ] Add sticky header
- [ ] Verify: 1000-row table renders instantly

## Phase 16: Await params in Next 15 — 1 hr
- [ ] Add `const { id } = await params` to `deliverables/[id]/page.tsx`
- [ ] Add to `/api/client/deliverables/[id]/approve/route.ts`, `export/route.ts`, `revision/route.ts`
- [ ] Verify: `npx tsc --noEmit` passes

## Phase 17: React compiler — 1 hr
- [ ] Install `@react-compiler/runtime`
- [ ] Add Babel plugin to `.babelrc`
- [ ] Verify: build uses compiler

## Phase 18: Verification — 2 hrs
- [ ] `npx tsc --noEmit` passes
- [ ] `npx eslint .` passes
- [ ] `npm run build` succeeds
- [ ] E2E: dashboard + analytics load < 2s
- [ ] E2E: security headers present
- [ ] E2E: analytics Cache-Control header present
- [ ] E2E: 1000-row table doesn't freeze