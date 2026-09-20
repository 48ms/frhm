# Change Proposal Supplement: Area 3 Deep-Dive (P10-P18)

## NEW Findings Beyond P1-P9

### Issue P10: Missing Security Headers (HIGH)

**Problem:** `next.config.mjs` has no `headers()` function with security headers. Missing: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, `Content-Security-Policy`.

**Impact:** Clickjacking, MIME sniffing, XSS vulnerabilities open.

### Issue P11: No Image Optimization Configuration (HIGH)

**Problem:** `next.config.mjs` has no `images.remotePatterns` to allow CDN domains (e.g. Supabase Storage, Imgur). `unoptimized: false` means all images processed by Next.js Image component, but remote URLs fail.

**Impact:** External images (from client uploads via Supabase CDN) not render.

### Issue P12: Missing Segment Config on Pages (MEDIUM)

**Problem:** 35/50 API routes + pages have `export const dynamic = 'force-dynamic'`. Remaining 15 routes (e.g. `export/route.ts`, `send/route.ts`) default to static rendering — may serve stale content for mutations.

**Impact:** User clicks "Send email" → page refresh shows old list.

### Issue P13: No Loading/State Fallbacks (HIGH)

**Problem:** Only `app/not-found.tsx` exists. No `loading.tsx` or `error.tsx` on most routes. Dashboard, analytics, deliverables show blank/white screen while fetching.

**Impact:** Users think app is broken during loading.

### Issue P14: No Stale-While-Revalidate Cache Headers (HIGH)

**Problem:** Analytics routes (e.g. `metrics/route.ts`) don't send `Cache-Control: stale-while-revalidate`. Every page refresh re-fetches from DB.

**Impact:** Analytics dashboard slow; DB load unnecessary.

### Issue P15: Missing Database Views (MEDIUM)

**Problem:** Only 3 views exist (`campaigns`, `content_metrics`). No `dashboard_summary`, `metrics_by_client`, or `tenant_isolation_views` that could simplify queries.

**Impact:** Routes still do multiple `.from()` calls instead of single view query.

### Issue P16: Table Virtualization Missing (MEDIUM)

**Problem:** `data-table.tsx` (84KB) has no `react-window` or `@tanstack/react-virtual` — renders ALL rows at once.

**Impact:** 1000-row table freezes browser; large bundle size.

### Issue P17: Next 15 `params` Not Awaited Everywhere (MEDIUM)

**Problem:** Next.js 15 changes `params` to `Promise<{id:string}>`. Only 2/6 dynamic pages await correctly (`skills/[id]`, `crm/[id]`). Others (`deliverables/[id]`) still treat as plain object.

**Impact:** Build warnings; potential runtime errors after deploy.

### Issue P18: No React Compiler (MEDIUM)

**Problem:** `react-compiler` not in `package.json`. Compiler auto-optimizes React components, removes manual `useMemo`/`useCallback`.

**Impact:** Suboptimal re-rendering; bundle bloat from manual memoization.
