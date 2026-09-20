# Change Proposal: Performance & N+1 Query Resolution

## Problem
API routes and client components have sequential database calls (N+1 patterns), redundant animation packages doubling bundle size, no pagination on list endpoints, missing security headers, and suboptimal Next.js configuration — causing slow page loads, large bundles, memory leaks, and security vulnerabilities.

## Root Causes
1. **Sequential awaits in API routes**: `generate-insight` makes 12 sequential `.from()` calls instead of `Promise.all` or JOINs.
2. **Row-by-row DB writes**: `metrics/bulk` calls `.upsert()` inside a for-loop (1 query per row) instead of batch.
3. **N+1 AI + DB in bulk-run**: `skills/bulk-run` loops through skill IDs, making 1 AI call + 2 DB queries per skill — sequentially.
4. **Dual animation packages**: `framer-motion` (301 files) AND `motion` (271 files) both installed at `^13.2.0` — same package twice.
5. **No pagination**: `clients`, `deliverables`, `scheduled-posts` list APIs fetch ALL rows with no `limit()`.
6. **Supabase client re-instantiation**: `lib/supabase/client.ts` creates a new `createBrowserClient()` on every call.
7. **Missing security headers**: `next.config.mjs` has no `headers()` function with CSP, X-Frame-Options.
8. **Missing image optimization config**: No `images.remotePatterns` for CDN URLs.
9. **Missing segment config**: 15/50 routes default to static rendering.

## Findings

### P1: generate-insight — 12 Sequential DB Queries (HIGH)
**File**: `app/api/admin/clients/[id]/analytics/generate-insight/route.ts`  
**Issue**: 12 sequential `await supabase.from(...)` calls. Queried tables: `clients`, `scheduled_posts`, `competitor_benchmarks`, `ai_providers`, `seasonal_periods`, `analytics_summaries`, `analytics_predictions`, `users`.  
**Impact**: Total latency = sum of all queries.  
**Fix**: Wrap independent queries in `Promise.all()`. Use database views or JOINs.

### P2: metrics/bulk — Row-by-Row Upsert (HIGH)
**File**: `app/api/admin/clients/[id]/analytics/metrics/bulk/route.ts`  
**Issue**: `for (let i = 0; i < rows.length; i++) { await supabase.upsert(row) }` — sequential, one DB call per row. Also validates each `post_id` with a separate `.select().eq().single()`.  
**Impact**: 100-row bulk = 200 DB round-trips.  
**Fix**: Batch validate with `.in('id', postIds)`. Batch upsert.

### P3: skills/bulk-run — N Sequential AI Calls (CRITICAL)
**File**: `app/api/admin/clients/[id]/skills/bulk-run/route.ts`  
**Issue**: `for (const skillId of skillIds) { await chat(provider, ...) }` — AI calls run sequentially. Each iteration also queries `skill_files` and `skills` tables (N+1).  
**Impact**: 5 skills × 10s = 50s total. Vercel 30s timeout.  
**Fix**: Parallelize with `Promise.allSettled()`. Pre-fetch all `skill_files` with `.in('skill_id', skillIds)`.

### P4: No Pagination on List APIs (MEDIUM)
**Files**: `app/api/admin/clients/route.ts`, `app/api/admin/deliverables/route.ts`, `app/api/admin/scheduled-posts/route.ts`  
**Issue**: No `limit()` or `range()` — fetches ALL rows.  
**Impact**: 500+ deliverables = large response.  
**Fix**: Add `?page=` and `?limit=` query params. Default limit 50, max 100.

### P5: Dual Animation Packages (HIGH)
**Files**: `package.json` — both `framer-motion: ^13.2.0` AND `motion: ^13.2.0`  
**Issue**: `motion` is the rebranded successor of `framer-motion`. 301 files import `framer-motion`, 271 import `motion/react`.  
**Impact**: ~100KB+ wasted in bundle.  
**Fix**: Migrate all `framer-motion` imports to `motion/react`. Remove `framer-motion` from `package.json`.

### P6: Supabase Client Not Singleton (MEDIUM)
**File**: `lib/supabase/client.ts`  
**Issue**: `export function createClient() { return createBrowserClient(...) }` — new instance per call.  
**Impact**: Memory overhead; new session handshake per call.  
**Fix**: Cache with singleton pattern.

### P7: useEffect Without Cleanup (MEDIUM)
**Files**: `app/admin/clients/[id]/hasil.tsx`, `setup.tsx`, `workspace.tsx`, `components/admin/hero-asset-card.tsx`, `components/motion/expandable-action-bar.tsx`, `ripple-button.tsx`  
**Issue**: `useEffect` with `setTimeout`/`addEventListener` but no `return () =>` cleanup.  
**Impact**: Listener/timer leak on unmount.  
**Fix**: Add cleanup return in each useEffect.

### P8: recharts Bundle (LOW)
**Files**: `components/marketing/ads-tracker-board.tsx`, `roi-dashboard-board.tsx`  
**Issue**: `recharts ^3.10.1` imported by only 2 files (~200KB bundle).  
**Impact**: Loaded eagerly even when marketing tabs not open.  
**Fix**: Use `next/dynamic` to lazy-load.

### P9: Missing Security Headers (HIGH)
**File**: `next.config.mjs`  
**Issue**: No `headers()` function with security headers. Missing `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, `Content-Security-Policy`.  
**Impact**: Clickjacking, MIME sniffing, XSS vulnerabilities open.  
**Fix**: Add `headers()` function to `next.config.mjs`.

### P10: No Image Optimization Config (HIGH)
**File**: `next.config.mjs`  
**Issue**: No `images.remotePatterns` to allow CDN domains (Supabase Storage, Imgur). `unoptimized: false`.  
**Impact**: External images (Supabase CDN URLs) not render.  
**Fix**: Add `images: { remotePatterns: [...] }` to `next.config.mjs`.

### P11: Missing Segment Config (MEDIUM)
**Files**: 15/50 routes/pages default to static rendering  
**Issue**: Routes like `export/route.ts`, `send/route.ts` don't have `export const dynamic = 'force-dynamic'`.  
**Impact**: Mutations serve stale content.  
**Fix**: Add `export const dynamic = 'force-dynamic'` to mutation routes.

### P12: Missing Loading/State Fallbacks (HIGH)
**Files**: Most routes have no `loading.tsx` or `error.tsx`  
**Issue**: Only `app/not-found.tsx` exists.  
**Impact**: Blank screen while loading; users think app broken.  
**Fix**: Add `loading.tsx` and `error.tsx` to critical routes.

### P13: No Stale-While-Revalidate Cache Headers (HIGH)
**Files**: Analytics routes (e.g. `metrics/route.ts`)  
**Issue**: No `Cache-Control: stale-while-revalidate` sent.  
**Impact**: Page refresh re-fetches from DB; unnecessary load.  
**Fix**: Add `Cache-Control` headers to analytics routes.

### P14: Missing Database Views (MEDIUM)
**Files**: `supabase/migrations/`  
**Issue**: Only 3 views exist (`campaigns`, `content_metrics`). No `dashboard_summary`, `metrics_by_client`.  
**Impact**: Routes do multiple `.from()` calls instead of single view query.  
**Fix**: Create materialized views for common aggregations.

### P15: Table Virtualization Missing (MEDIUM)
**File**: `components/spectrumui/data-table.tsx` (84KB)  
**Issue**: No `react-window` or `@tanstack/react-virtual` — renders ALL rows.  
**Impact**: 1000-row table freezes browser.  
**Fix**: Add virtualization to data-table.

### P16: Next 15 `params` Not Awaited (MEDIUM)
**Files**: 4/6 dynamic pages (`deliverables/[id]`, etc.)  
**Issue**: Next.js 15 makes `params` a `Promise<{id:string}>`. Not awaited.  
**Impact**: Build warnings; potential runtime errors.  
**Fix**: Await params in all `[id]` pages.

### P17: No React Compiler (MEDIUM)
**Files**: `package.json`  
**Issue**: `react-compiler` not installed.  
**Impact**: Suboptimal re-rendering; bundle bloat.  
**Fix**: Install `@react-compiler/runtime` and configure Babel.

## Fix Strategy

| Phase | Action |
|-------|--------|
| 1 | Parallelize generate-insight queries with Promise.all |
| 2 | Batch metrics/bulk upsert and validation |
| 3 | Parallelize skills/bulk-run with pre-fetched data |
| 4 | Add pagination to 3 list API routes |
| 5 | Remove framer-motion, migrate to motion/react |
| 6 | Singleton supabase client |
| 7 | Add useEffect cleanup to 6 files |
| 8 | Lazy-load recharts components |
| 9 | Add security headers to next.config.mjs |
| 10 | Add image optimization config to next.config.mjs |
| 11 | Add force-dynamic to 15 mutation routes |
| 12 | Add loading.tsx and error.tsx to critical routes |
| 13 | Add Cache-Control headers to analytics routes |
| 14 | Create dashboard_summary and metrics_by_client views |
| 15 | Add virtualization to data-table.tsx |
| 16 | Await params in 4 dynamic pages |
| 17 | Install and configure react-compiler |
| 18 | Verification |
