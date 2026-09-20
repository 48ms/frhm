# Tasks: Fullstack Audit & Hardening

## Phase 1: RLS Tenant Isolation (Security Critical) — 3-4 hrs
- [ ] Create migration `036_rls_tenant_isolation.sql`
- [ ] Add `is_admin()` / `get_client_id()` helper functions
- [ ] Replace `USING (true)` policies on: `events`, `event_tasks`, `event_vendors`, `client_budgets`, `expenses`, `ad_spend_logs`, `kols`, `brand_assets`
- [ ] Add policies to tables missing RLS: `platform_posts`, `content_assets`, `content_items`
- [ ] Verify via service role: Client A cannot read Client B rows

## Phase 2: Client-Side Writes → API Routes (Security Critical) — 8-12 hrs
- [ ] Create/verify API routes: `/api/admin/events`, `/api/admin/ad-spend`, `/api/admin/budgets`, `/api/admin/expenses`, `/api/admin/kols`, `/api/admin/brand-assets`, `/api/admin/approvals`, `/api/admin/kanban`
- [ ] Update `create-event-modal.tsx` → API route
- [ ] Update `ad-spend-form-modal.tsx` → API route
- [ ] Update `budget-form-modal.tsx` → API route
- [ ] Update `expense-form-modal.tsx` → API route
- [ ] Update `kol-form-modal.tsx` + `kol-crm-board.tsx` → API route
- [ ] Update `approval-board.tsx` → API route
- [ ] Update `brand-asset-hub.tsx` → API route
- [ ] Update `event-checklist.tsx` → API route
- [ ] Update `kanban-board.tsx` + `calendar-view.tsx` → API route
- [ ] Update `deliverables` pages → existing API routes

## Phase 3: Error Boundary (Data Stability) — 2 hrs
- [ ] Wrap `page.tsx` queries in try/catch per group
- [ ] Add inline error notice per failed section
- [ ] Add `<ErrorBoundary>` wrapper at workspace level

## Phase 4: Event Stub (Data Stability) — 3-4 hrs
- [ ] Implement fetch in `event-workspace-board.tsx` (align w/ backend-schema-and-forms)
- [ ] Wire post-submit refresh

## Phase 5: Dead Code & Bundle (Architecture) — 2 hrs
- [ ] Remove `CommandCenterView`, `INITIAL_TASKS`, `INITIAL_APPROVALS` from `setup.tsx`
- [ ] Verify no imports reference it
- [ ] Re-check setup.tsx bundle size (38KB → target < 15KB)

## Phase 6: File Lazy Load (Performance) — 2 hrs
- [ ] Change `page.tsx` client_files query → `path, updated_at` only
- [ ] Create `/api/admin/clients/[id]/files` GET content route
- [ ] Update setup.tsx to fetch content on file-open

## Phase 7: useEffect Deps (Performance) — 1 hr
- [ ] Fix 5 components: `ads-tracker-board`, `budget-ledger-board`, `expense-form-modal`, `roi-dashboard-board`, `omni-calendar-board`
- [ ] Use `useMemo` or hoist client creation

## Phase 8: Pipeline Interactive (Architecture) — 4-6 hrs
- [ ] Decide: implement drag-and-drop (dnd-kit) OR mark read-only in docs
- [ ] If interactive: update `client_skills.status` on drop

## Phase 9: Type Consolidation (Architecture) — 3 hrs
- [ ] Create `lib/types.ts`
- [ ] Consolidate `Client`, `Deliverable`, `Pack`, `Skill`, `Status`, `FormData`, `ClientOption`, `ClientSkill`, `NavItem`
- [ ] Re-export from components to avoid breaking imports

## Phase 10: Quality Fixes (Medium) — 4 hrs
- [ ] Remove unused props in `pipeline/board.tsx`
- [ ] Pass providerId prop (remove hardcoded `'google'`)
- [ ] `BrandAssetHub` try/catch
- [ ] Replace `alert()` → toast across 9 components
- [ ] Type `calendar-view.tsx` + `kanban-board.tsx` (remove `any`)
- [ ] Investigate storage bucket `brand_assets` inconsistency

## Phase 11: API Route Auth Gap (Security Critical) — 2 hrs
- [ ] `app/api/admin/clients/[id]/outputs/route.ts`: replace service_role anon key with `requireAdmin()` guard before GET/POST (uses anon + RLS, or keep service_role but add auth)
- [ ] `app/api/admin/feedback/route.ts`: add `getUser()` + role check before GET/POST
- [ ] Re-scan all 51 API routes for auth coverage (should be 51/51 protected or intentionally public)
- [ ] Verify `feedback` table RLS policy actually enforces `auth.uid()` (defense-in-depth)

## Phase 12: Cache Revalidation (Medium) — 2 hrs
- [ ] Add `revalidatePath()` after mutations in API routes: `/api/admin/events`, `/api/admin/ad-spend`, `/api/admin/budgets`, `/api/admin/expenses`, `/api/admin/kols`
- [ ] Ensure client-side mutations call `router.refresh()` after success (verify existing modals)
- [ ] Verify no stale data after: create event → check events tab shows it without F5

## Phase 13: Verification — 2 hrs
- [ ] `npx tsc --noEmit` passes
- [ ] `npx eslint .` passes
- [ ] Playwright smoke: create event, expense, KOL via UI
- [ ] Verify cross-tenant isolation (Client A login cannot see Client B data)
- [ ] Verify anonymous curl to `/api/admin/clients/[id]/outputs` returns 401 (not data)
- [ ] Archive change once complete