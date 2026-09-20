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

## Phase 4: params await — ⚠️ NOT APPLICABLE
- [ ] `deliverables/[id]/page.tsx` `await params` → **Next.js 14.2.35: params NOT a promise — no await needed**
- [ ] `approve/export/revision` routes `await params` → **Next 14: not required**
- [x] Verify `npx tsc --noEmit` passes → **PASSES (verified)**

## Phase 5: React Compiler — ❌ NOT DONE (0 of 3)
- [ ] `@react-compiler/runtime` → **NOT INSTALLED**
- [ ] Babel plugin in `.babelrc` → **NO .babelrc**
- [ ] Verify build uses compiler → **BLOCKED**

## Phase 6: Final checks — ⚠️ PARTIAL
- [ ] `npx eslint .` passes → **81 pre-existing problems (not from our changes)**
- [x] `npm run build` succeeds → **CLEAN (verified)**
- [ ] E2E: dashboard + analytics load < 2s → **NOT RUN**
- [ ] E2E: security headers present → **NOT RUN**
- [ ] E2E: analytics Cache-Control header present → **NOT RUN**
- [ ] E2E: 1000-row table doesn't freeze → **BLOCKED (no virtualization)**
