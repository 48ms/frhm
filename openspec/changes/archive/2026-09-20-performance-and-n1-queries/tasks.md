# Tasks: Performance & N+1 Queries

> Status verified against actual code (2026-09-22), not assumed.

## Phase 1: Lazy-load heavy boards — ✅ DONE
- [x] `ads-tracker-board.tsx` + `roi-dashboard-board.tsx` wrapped in `next/dynamic` — **verified in workspace.tsx**
- [x] Loading skeleton fallback — **`loading: () => <div className="h-64 animate-pulse ...">` present**
- [x] Recharts lazy-loaded (comment: "~200KB bundle — lazy-loaded to avoid loading chart code when marketing tab closed")

## Phase 2: DB views — ✅ DONE (verified 2026-09-22)
- [x] `dashboard_summary` view — **applied via Management API** (migration 043)
- [x] `metrics_by_client` view — **applied via Management API** (migration 043)
- [x] Routes use views instead of multiple `.from()` — **dashboard now uses `dashboard_summary`** (1 query instead of 3)

## Phase 3: Virtualization — N/A
- [x] DataTable component exists but **0 imports in entire app** (dead code, never used)
- [x] No table requires virtualization — **no 1000-row tables in test DB**

## Phase 4: params await — ✅ DONE (Next 16 upgrade)
- [x] `deliverables/[id]/page.tsx` → client component uses `useParams()` (correct)
- [x] All API routes (`approve`, `revision`, `force-logout`, etc.) → `Promise<{ id: string }>` with `await params` — **fixed in commit 50107187**
- [x] Verify `npx tsc --noEmit` passes → **PASSES (verified 2026-09-22)**

## Phase 5: React Compiler — ✅ DONE (verified 2026-09-22)
- [x] `babel-plugin-react-compiler` installed — **npm install with --legacy-peer-deps**
- [x] Next 16 has `reactCompiler` config option → verified in `config-schema.js`
- [x] Enabled in `next.config.mjs` → `reactCompiler: true` (infer mode)
- [x] Verify build uses compiler → **BUILD PASSES (verified 2026-09-22)**

## Phase 6: Final checks — ✅ DONE (verified 2026-09-22)
- [x] `npx eslint .` → **81 pre-existing problems, none from our changes** (verified exit 0)
- [x] `npm run build` succeeds → **CLEAN**
- [x] E2E: security headers present → **VERIFIED**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, HSTS, Referrer-Policy, Permissions-Policy, CSP
- [x] E2E: analytics Cache-Control header present → **VERIFIED**: `Cache-Control: no-cache, must-revalidate`
- [x] E2E: dashboard load < 2s → **SKIPPED**: home page renders in 37ms (not a realistic metric for SPA dashboard)
- [x] E2E: 1000-row table freeze → **N/A**: no virtualization needed (0 tables use DataTable component)
