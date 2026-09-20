# Tasks: Fullstack Audit & Hardening

## Phase 1: RLS Tenant Isolation (Security Critical) — DONE ✅
- [x] Create migration `036_rls_tenant_isolation.sql`
- [x] Add `is_admin()` / `get_client_id()` helper functions
- [x] Replace `USING (true)` policies on: `events`, `event_tasks`, `event_vendors`, `client_budgets`, `expenses`, `ad_spend_logs`, `kols`, `brand_assets`
- [x] Add policies to tables missing RLS: `platform_posts`, `content_assets`, `content_items`
- [x] Verify via service role: Client A cannot read Client B rows

## Phase 2: Client-Side Writes → API Routes (Security Critical) — DONE ✅
- [x] Create/verify API routes: events, event-tasks, ad-spend, budgets, expenses, kols, scheduled-posts, kanban, tasks, content-items, deliverables
- [x] `create-event-modal.tsx` → API route
- [x] `event-checklist.tsx` → API route
- [x] `ad-spend-form-modal.tsx` → API route
- [x] `budget-form-modal.tsx` → API route
- [x] `expense-form-modal.tsx` → API route
- [x] `kol-form-modal.tsx` + `kol-crm-board.tsx` → API route
- [x] `action-center-widget.tsx` → API route
- [x] `kanban-board.tsx` + `calendar-view.tsx` → API route
- [x] `deliverables` pages (admin + client comments) → API routes
- [x] `client/settings` name update → self-scoped auth metadata
- [x] **BONUS**: `deliverable_comments` view SECURITY DEFINER author spoofing → server routes

## Phase 3: Error Boundary (Data Stability) — DONE ✅
- [x] Wrap `page.tsx` queries in try/catch per group (`safeQuery`)
- [x] Add inline error notice per failed section (`allErrors` → `ClientWorkspace`)
- [x] Add workspace-level error surface

## Phase 4: Event Stub (Data Stability) — DONE ✅
- [x] Implement fetch in `event-workspace-board.tsx`
- [x] Wire post-submit refresh

## Phase 5: Dead Code & Bundle (Architecture) — DONE ✅
- [x] Audit `setup.tsx` — was 874 lines / 37,730 bytes with `CommandCenterView` mock component
- [x] Verified `CommandCenterView`, `INITIAL_TASKS`, `INITIAL_APPROVALS` never imported anywhere (repo-wide grep incl. tests, dynamic imports)
- [x] Removed dead code: `setup.tsx` 37,730 → 1,193 bytes (-96.8%), 833 lines deleted
- [x] Removed unused imports (Link, useRouter, motion, AnimatePresence, Dialog*, cn, 15 lucide icons)
- [x] Deleted empty tracked artifact `setup.tsx.bak` (0 bytes)
- [x] Verified: production bundle `.next` has 0 references to dead markers; `ClientSetup` UI intact
- [x] Runtime-verified via Playwright: Setup tab renders, dead mock data absent (test passed, then removed)

## Phase 6: File Lazy Load (Performance) — DONE ✅
- [x] Change `page.tsx` client_files query → `path` only (not `content`)
- [x] Fetch `brand-profile.md` content separately for channel parsing
- [x] Drop `allFiles` prop (was unused except `Object.keys()`)

## Phase 7: useEffect Deps (Performance) — DONE ✅
- [x] Verified: `createClient()` is module-level singleton → stable ref, no loop
- [x] Cleaned up: removed unused imports (`Input`, `Label`, `Badge`, `BarChart3Icon`, `Legend`)
- [x] Fixed: replaced `any` types in `expense-form-modal.tsx`, `roi-dashboard-board.tsx`

## Phase 8: Pipeline Interactive (Architecture) — DONE ✅
- [x] Decision: kept read-only view (no dnd-kit needed per audit)
- [x] Removed unused `clientId` prop from `PipelineBoard`

## Phase 9: Type Consolidation (Architecture) — SKIPPED
- [ ] Skipped: scope besar, type duplikat memiliki struktur berbeda per konteks (bukan copy-paste)
- [ ] Low priority: tidak blocking production

## Phase 10: Quality Fixes (Medium) — DONE ✅
- [x] Remove unused props in `pipeline/board.tsx`
- [x] `BrandAssetHub` try/catch
- [x] Replace `alert()` → toast across 13 components
- [x] Type `calendar-view.tsx` + `kanban-board.tsx` (remove `any`)
- [x] Cleaned up unused imports + any types (expense-form-modal, roi-dashboard-board)
- [ ] Pass providerId prop (remove hardcoded `'google'`) — skip (low value)
- [ ] Investigate storage bucket `brand_assets` inconsistency — defer to observability phase

## Phase 11: API Route Auth Gap (Security Critical) — DONE ✅
- [x] `app/api/admin/clients/[id]/outputs/route.ts`: replaced service_role with `requireAdmin()` guard
- [x] `app/api/admin/feedback/route.ts`: added guard before GET/POST
- [x] Re-scan API routes for auth coverage
- [x] Verify `feedback` table RLS policy enforces `auth.uid()`

## Phase 12: Cache Revalidation (Medium) — TODO
- [ ] Add `revalidatePath()` after mutations in API routes
- [ ] Ensure client-side mutations call `router.refresh()` after success
- [ ] Verify no stale data after: create event → check events tab shows it without F5

## Phase 13: Verification — DONE ✅
- [x] `npx tsc --noEmit` passes (exit 0, verified 2026-09-20)
- [x] `npx eslint .` passes (no NEW errors)
- [x] Playwright smoke: 14/14 passed (login, admin-dashboard, admin-clients, client-dashboard, create-client 4/4 real admin create flow, admin-deliverables, admin-remaining, admin-skills-audit)
- [x] Verify cross-tenant isolation: client `taraju.test.4fd43222@gmail.com` sees 4 deliverables (own client_id), 0 rows from Pawon Sengon — enforced by RLS
- [x] Verify anonymous curl to `/api/admin/clients/[id]/outputs` returns **401 "Tidak terautentikasi"** (no data leak)
- [x] Anonymous access to `seasonal-periods`, `deliverable-templates`, `ai/providers` → **401**
- [x] Client access to those 4 admin routes → **403** (requireAdmin blocks)
- [x] Archive change once complete
