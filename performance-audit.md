# PERFORMANCE AUDIT REPORT
# Frhm Dashboard — Next.js + Turbopack
# Date: 2026-10-08

## SUMMARY

| Metric | Value |
|--------|-------|
| Total Client JS | 4.75 MB |
| Shared Root Bundle | 600 KB |
| Chunk Count | 79 chunks |
| Heavy Imports Detected | recharts, framer-motion, @dnd-kit, date-fns, xlsx |
| Sequential Waterfalls | 1 (dashboard-prefetcher.tsx) |
| Missing Suspense | 3 pages |

---

## 🔴 HIGH SEVERITY

### 1. DashboardPrefetcher Waterfall
**File:** `components/dashboard-stitch/dashboard-prefetcher.tsx`
**Issue:** 8 sequential `await` calls without `Promise.all`
**Impact:** Each query waits for the previous one to complete. Total latency = sum of all 8 queries in series.
**Fix:** Wrap in `Promise.all([...])` for parallel execution.

---

## 🟡 MEDIUM SEVERITY

### 2. Missing Suspense Boundaries
**Files:**
- `app/admin/analytics/page.tsx`
- `app/admin/calendar/page.tsx`
- `app/admin/campaigns/page.tsx`

**Issue:** No `<Suspense>` wrapper around async components.
**Impact:** User sees blank screen during data fetch instead of skeleton/loading state.

---

## 🟠 LOW SEVERITY

### 3. Heavy Bundles (Potentially Avoidable)
| Chunk | Size | Content |
|-------|------|---------|
| 0aqri5la7ayl1.js | 1,190 KB | Large shared chunk |
| 2vans5gzmsglq.js | 382 KB | Unknown heavy lib |
| 2z5zumqm6ykxu.js | 358 KB | React + Next framework |
| 0fujejgt_nmqf.js | 346 KB | recharts (charting) |
| 27q4lxfxqr9ap.js | 259 KB | date-fns + locale |
| 1v691kk8ugoiz.js | 230 KB | Supabase client |
| 3_38c-gr6ttmw.js | 120 KB | framer-motion |
| 0zd1i5n9dlg35.js | 101 KB | xlsx (spreadsheet) |

**Note:** No wildcard imports detected (good). Chunks are properly tree-shaken.

### 4. Client-Side useEffect Fetching
**Files:**
- `app/auth/login/page.tsx`
- `app/auth/set-password/page.tsx`

**Issue:** Direct `useEffect` + `fetch` instead of React Query.
**Impact:** No caching, manual loading/error states, potential race conditions.

---

## ✅ GOOD PATTERNS

1. **No wildcard imports** — all libraries imported individually (good tree-shaking)
2. **Server Components** — most pages use `force-dynamic` correctly
3. **React Query** — used across features (prefetching, caching)
4. **Parallel Routes** — dashboard uses `@hero`, `@kpis`, `@chart`, etc.
5. **nuqs for URL state** — consistent across calendar, analytics

---

## RECOMMENDATIONS (Priority Order)

### ✅ P0: FIXED — Waterfall in DashboardPrefetcher
```tsx
// Before (sequential): 8 awaits in series
await queryClient.prefetchQuery(socialQueries.listClientsWithChannels())
await queryClient.prefetchQuery(dashboardQueries.profile(clientId))
// ... 6 more sequential awaits

// After (parallel): single round trip window
await Promise.all([
  queryClient.prefetchQuery(socialQueries.listClientsWithChannels()),
  queryClient.prefetchQuery(dashboardQueries.profile(clientId)),
  // ... all 8 queries together
])
```
Verified: every query depends only on `clientId` (or nothing), so parallel
execution is semantically safe — no query consumes another's result.

### ✅ P1: FIXED — Suspense Boundaries
Wrapped `<DashboardPrefetcher>` (the async data boundary) in `<Suspense>`
on the three affected pages, so the shell streams immediately and the user
sees a loading state instead of a blank screen:
- `app/admin/analytics/page.tsx`
- `app/admin/calendar/page.tsx`
- `app/admin/campaigns/page.tsx`

### ✅ P2: FIXED — Lazy load recharts + clean dead code
- `DashboardStitchChart` di-`dynamic()`-kan di `app/admin/dashboard/@chart/page.tsx` tanpa `ssr: false` (bukan server component).
- Chunk recharts (346 KB) divérifikasi **tidak ada** di `rootMainFiles` route manapun — hanya masuk ke chunk group `performance-chart.tsx` yang di-load secara lazy.
- Seluruh dashboard parallel slots (@hero, @kpis, @hub, @pipeline, page) tetap **nol overlap** dengan chunk recharts.
- Hapus `components/calendar/calendar-view.tsx` — dead code 555 baris, zero references.


---

## PAGE-SPECIFIC NOTES

### Calendar Page
- ✅ Good: Uses TanStack Query for data fetching
- ✅ Good: `useQueryState` for URL-synced state (view, platform filter)
- ⚠️ Watch: 8 await waterfall in shared prefetcher affects all pages using it

### Dashboard Page
- ✅ Good: Parallel routes (`@hero`, `@kpis`, `@chart`, etc.)
- ⚠️ Missing: Suspense boundaries on parallel slots
- ⚠️ Shared prefetcher affects all child routes

### Analytics Page
- Same as dashboard (uses shared prefetcher)

### Campaigns Board
- Uses recharts (346 KB) — consider lazy loading if not on critical path
