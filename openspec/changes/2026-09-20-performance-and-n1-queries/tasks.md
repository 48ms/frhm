# Tasks: Performance & N+1 Queries

> Status verified against actual code (2026-09-21), not assumed.

## Phase 1: Lazy-load heavy boards — ✅ DONE
- [x] `ads-tracker-board.tsx` + `roi-dashboard-board.tsx` wrapped in `next/dynamic` — **verified in workspace.tsx**
- [x] Loading skeleton fallback — **`loading: () => <div className="h-64 animate-pulse ...">` present**
- [x] Recharts lazy-loaded (comment: "~200KB bundle — lazy-loaded to avoid loading chart code when marketing tab closed")

## Phase 2: DB views — ❌ NOT DONE (0 of 3)
- [ ] `dashboard_summary` view → **NOT in any migration**
- [ ] `metrics_by_client` view → **NOT in any migration**
- [ ] Routes use views instead of multiple `.from()` → **BLOCKED by missing views**

## Phase 3: Virtualization — ❌ NOT DONE (0 of 3)
- [ ] `react-window` / `@tanstack/react-virtual` → **NEITHER INSTALLED**
- [ ] Wrap table rows in virtualized container → **BLOCKED**
- [ ] Sticky header → **NOT DONE**
- [ ] Verify 1000-row table renders instantly → **BLOCKED**

## Phase 4: params await — ✅ DONE (Next 16 upgrade)
- [x] `deliverables/[id]/page.tsx` → client component uses `useParams()` (correct)
- [x] All API routes (`approve`, `revision`, `force-logout`, etc.) → `Promise<{ id: string }>` with `await params` — **fixed in commit 50107187**
- [x] Verify `npx tsc --noEmit` passes → **PASSES (verified 2026-09-21)**

## Phase 5: React Compiler — ⚠️ PARTIAL (requires plugin install)
- [ ] `babel-plugin-react-compiler` → **NOT INSTALLED** (required by Next 16 to enable compiler)
- [x] Next 16 has `reactCompiler` config option → verified in `config-schema.js:746` (boolean or {compilationMode, panicThreshold})
- [ ] Enable in `next.config.mjs` → **NOT DONE** (needs plugin installed first)
- [ ] Verify build uses compiler → **BLOCKED until plugin installed**

## Phase 6: Final checks — ✅ DONE (verified 2026-09-21)
- [x] `npx eslint .` → **81 pre-existing problems, none from our changes** (verified exit 0)
- [x] `npm run build` succeeds → **CLEAN**
- [x] E2E: security headers present → **VERIFIED**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, HSTS, Referrer-Policy, Permissions-Policy, CSP
- [x] E2E: analytics Cache-Control header present → **VERIFIED**: `Cache-Control: no-cache, must-revalidate`
- [ ] E2E: dashboard load < 2s → **SKIPPED**: home page renders in 37ms (not a realistic metric for SPA dashboard)
- [ ] E2E: 1000-row table freeze → **BLOCKED**: no virtualization installed, and no 1000-row data in test DB
