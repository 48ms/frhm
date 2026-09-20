# Proposal: Fullstack Audit & Hardening

## Overview

Professional fullstack deep-dive of the client workspace revealed **22 findings** across security, data integrity, performance, architecture, and quality. The two earlier changes (`client-portal-fixes`, `backend-schema-and-forms`) covered only surface-level issues (missing tables, dead forms, UI bugs). This change captures the **deeper systemic issues** a production-ready SaaS must fix.

## Issue 1: RLS Policies Use `USING (true)` (SECURITY — CRITICAL)

**Problem:**
All tables in `20260918141819_fase_3_erp_tables.sql` use this pattern:
```sql
CREATE POLICY "Enable write access for authenticated users on events"
  ON public.events FOR ALL TO authenticated USING (true);
```
`USING (true)` means **any authenticated user** (including Client B) can read/write Client A's data. For a multi-tenant SaaS, this is a **cross-tenant data leak**.

**Affected tables:** `events`, `event_tasks`, `event_vendors`, `client_budgets`, `expenses`, `ad_spend_logs`, `kols`, `brand_assets`

**Fix:**
1. Replace `USING (true)` with tenant-scoped policies, e.g.:
```sql
CREATE POLICY tenant_isolation ON public.events
  FOR ALL TO authenticated
  USING (client_id IN (SELECT client_id FROM users WHERE id = auth.uid()))
  WITH CHECK (client_id IN (SELECT client_id FROM users WHERE id = auth.uid()));
```
2. Admin role gets `service_role`-style access via a helper function
3. Apply to all 8 tables (or write a reusable helper)

## Issue 2: 16 Components Write Directly to DB Client-Side (SECURITY — CRITICAL)

**Problem:**
`'use client'` components bypass API route authorization entirely:

| Component | Op | Table |
|-----------|-----|-------|
| `approval-board.tsx` | update | `platform_posts` |
| `brand-asset-hub.tsx` | insert/update/delete | `brand_assets` + storage |
| `create-event-modal.tsx` | insert | `events` |
| `ad-spend-form-modal.tsx` | insert | `ad_spend_logs` |
| `budget-form-modal.tsx` | insert/update | `client_budgets` |
| `expense-form-modal.tsx` | insert | `expenses` |
| `kol-form-modal.tsx` | insert/update | `kols` |
| `kol-crm-board.tsx` | delete | `kols` |
| `event-checklist.tsx` | update | `event_tasks` |
| `kanban-board.tsx` | update | `content_productions` |
| `calendar-view.tsx` | update | `scheduled_posts` |
| `action-center-widget.tsx` | update | `tasks` |
| `deliverables/new/page.tsx` | insert | `deliverables` |
| `deliverables/[id]/page.tsx` | insert | `deliverables` |
| `deliverables/page-client.tsx` | delete | `deliverables` |
| `client/deliverables/[id]/page.tsx` | insert | `deliverables` |

**Fix:**
- Move all writes behind existing/new API routes
- API routes validate role + `client_id` ownership server-side
- RLS becomes defense-in-depth (not the only barrier)

## Issue 3: Tables Without RLS (SECURITY — CRITICAL)

**Problem:**
`platform_posts`, `content_assets`, `content_items` have **no `ENABLE ROW LEVEL SECURITY`** anywhere. Without RLS, Supabase allows access via API key to any authenticated user.

**Fix:** Add `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + policies to all 3.

## Issue 4: `page.tsx` Has No Error Boundary (DATA INTEGRITY — CRITICAL)

**Problem:**
`app/admin/clients/[id]/page.tsx` executes 12+ Supabase queries via `Promise.all` without try/catch. If any query fails (table missing — which happens today for the 12 missing tables!), the **entire client workspace 500s**.

**Fix:**
1. Wrap each query group in try/catch (or use per-section error boundaries)
2. Render partial data + inline error notice per failed section
3. Add `<ErrorBoundary>` at page level

## Issue 5: `EventWorkspaceBoard` Is a Stub (DATA — CRITICAL)

**Problem:**
```tsx
const events = [] // We will fetch this
<div>Rundown content goes here</div>
```
Even after migration push, this tab shows nothing.

**Fix:** Implement fetch + render (task in `backend-schema-and-forms` already covers this — align).

## Issue 6: `CampaignForm` & `ContentDraftForm` Dead Submit (DATA — CRITICAL)

Already documented in `backend-schema-and-forms`. Referenced here for completeness.

## Issue 7: `CommandCenterView` Dead Code (ARCHITECTURE — HIGH)

**Problem:**
`setup.tsx` (38KB) exports `CommandCenterView` — a full mock dashboard (hardcoded `INITIAL_TASKS`, `INITIAL_APPROVALS`, cookie-based role switching) — **never imported anywhere**. ~500 lines shipped to the client bundle unused.

**Fix:** Remove `CommandCenterView` + `INITIAL_TASKS` + `INITIAL_APPROVALS` from `setup.tsx` (keep only `ClientSetup`).

## Issue 8: `page.tsx` Loads All File Content (PERFORMANCE — HIGH)

**Problem:**
```tsx
supabase.from('client_files').select('path, content')
```
No limit, no pagination. Client artifacts can be large markdown files; all load into memory on workspace open.

**Fix:**
- Select only `path` + `updated_at` for the list
- Load `content` lazily when a file is opened (route `/api/admin/clients/[id]/files?path=...`)

## Issue 9: useEffect Depends on `supabase` (PERFORMANCE — HIGH)

**Problem:**
5 components pass `createClient()` (new object each render) as `useEffect` dep:
- `ads-tracker-board.tsx`, `budget-ledger-board.tsx`, `expense-form-modal.tsx`, `roi-dashboard-board.tsx`, `omni-calendar-board.tsx`

**Fix:** Create client once via `useMemo` or move outside component, or omit from deps.

## Issue 10: `setup.tsx` 38KB in Client Bundle (PERFORMANCE — HIGH)

**Fix:** Split `CommandCenterView` out (fix of Issue 7 reduces this); lazy-load tab content via `React.lazy`/dynamic import.

## Issue 11: `PipelineBoard` Is Read-Only (ARCHITECTURE — HIGH)

**Problem:**
Tab Pipeline shows progress bars but has no drag-and-drop, no status change action.

**Fix:** Either implement drag-and-drop (dnd-kit) with `client_skills` status update, or document it as intentional read-only view.

## Issue 12: Duplicate Type Definitions (ARCHITECTURE — HIGH)

**Problem:**
| Type | Duplicates |
|------|-----------|
| `Client` | 4 |
| `Deliverable` | 3 |
| `Pack` | 2 |
| `Skill` | 2 |
| `Status` | 3 |
| `FormData` | 6 |
| `ClientOption` | 3 |
| `ClientSkill` | 2 |
| `NavItem` | 2 |

**Fix:** Consolidate into `lib/types.ts` (or `database.types.ts` + shared `types.ts`), re-export from components.

## Issue 13: Dead Props in `pipeline/board.tsx` (ARCHITECTURE — HIGH)

`clientId`, `providerId`, `haveFiles` accepted but never used.

**Fix:** Remove unused props.

## Issue 14: Hardcoded `provider_id: 'google'` (QUALITY — MEDIUM)

`content-production-board.tsx` & `global-automations-board.tsx` hardcode `'google'`; AI provider selection should use `defaultProvider` from page.tsx.

**Fix:** Pass `providerId` prop; fallback to DB default.

## Issue 15: `EventWorkspaceBoard` No Post-Submit Refresh (QUALITY — MEDIUM)

**Fix:** Wire `CreateEventModal.onSuccess` → `router.refresh()`.

## Issue 16: `BrandAssetHub` No try/catch (QUALITY — MEDIUM)

**Fix:** Wrap fetch/upload in try/catch, show inline error.

## Issue 17: `alert()` Used as Error UI (QUALITY — MEDIUM)

9 components use `alert()`. Replace with sonner toast or inline error state.

## Issue 18: Untyped `any` in `calendar-view.tsx` & `kanban-board.tsx` (QUALITY — MEDIUM)

**Fix:** Type from `database.types.ts`.

## Issue 19: Storage Bucket `brand_assets` Inconsistent (QUALITY — MEDIUM)

`GET /storage/v1/bucket` returns `[]` (empty) but `object/list/brand_assets` returns EXISTS. Behavior inconsistent — investigate and align.

## Issue 20: API Route `outputs/route.ts` Has NO Auth (SECURITY — CRITICAL)

**Problem:**
`app/api/admin/clients/[id]/outputs/route.ts` uses the **service_role key** (bypasses RLS entirely) — and has **zero authentication checks**. GET and POST run with full database privileges for **any anonymous caller** who knows the URL.

```ts
// NO getUser(), NO requireAdmin(), NO role check
const supabase = createClient(URL, SUPABASE_SERVICE_ROLE_KEY!)
export async function POST(req, { params }) {
  // inserts into skill_outputs with arbitrary client_id
}
export async function GET(_req, { params }) {
  // reads skill_outputs with arbitrary client_id
}
```

An attacker who knows the route URL can read any client's skill outputs and write arbitrary rows to `skill_outputs`.

**False positives verified and excluded:**
- `feedback/route.ts` — uses `createClient` (anon role, RLS-enforced)… but see Issue 21 below.
- `telegram/webhook/route.ts` — has `secret_token` + `X-Telegram` header verification. ✅ Valid.
- `trends/radar/route.ts` — intentionally public (cache 3600). ✅ Intended.
- Cron routes — use `CRON_SECRET` + `authorization` header. ✅ Valid.
- Admin/client pages — protected by layout `getUser()` + role check. ✅ Valid.

## Issue 21: API Route `feedback/route.ts` No Auth Guard (SECURITY — HIGH)

**Problem:**
`app/api/admin/feedback/route.ts` uses `createClient` (anon key, RLS-enforced) but performs **no authentication check at all**:
- `GET` accepts any `client_id` query param → reads feedback for any client (RLS may prevent cross-tenant if policies are correct, but currently feedback RLS relies on `auth.uid()` policies — need verification)
- `POST` accepts `client_id`, `rating`, `title`, `comment` → creates feedback rows for any client without validating the caller

**Success path (RLS as defense-in-depth):** RLS policies on `feedback` use `auth.uid()` checks, which would prevent anonymous writes **if** the policy is correct. But the route **should not rely on RLS alone** — it should call `getUser()` + role check like every other admin route.

## Issue 22: No `revalidatePath` After Mutations (CACHE STALENESS — MEDIUM)

**Problem:**
The Next.js App Router caches Server Components aggressively. Only **50 routes** use `export const dynamic = 'force-dynamic'` — but **0 application files** call `revalidatePath()` or `revalidateTag()` after mutations.

**Impact:**
- Client workspace components (`super admin boards`, kanban) that live in server components or query shared data won't see fresh data after updates from other tabs/API routes.
- The client portal (`/client/*`) pages rely on `force-dynamic` — this prevents full-page caching but does **not** invalidate partial router caches when mutations happen via API routes then `router.refresh()`.

**Verification:**
- `revalidatePath`/`revalidateTag`: **0 uses** in `app/` (only found in `animate-ui/` docs, unrelated).
- `export const dynamic = 'force-dynamic'`: 50 routes (so full-page caching is largely avoided — good), but mutation → cache invalidation gap remains.

**Fix:** After mutations in API routes (create/update/delete on `events`, `budgets`, `kols`, etc.), call `revalidatePath()` for the affected page paths, or use `router.refresh()` after client-side mutations (already partially done in some modals).

## Total Estimated Effort

| Issue | Hours |
|-------|-------|
| 1 (RLS) | 3-4 |
| 2 (client-side writes) | 8-12 |
| 3 (missing RLS) | 1 |
| 4 (error boundary) | 2 |
| 5 (event stub) | 3-4 |
| 7 (dead code) | 1 |
| 8 (file lazy load) | 2 |
| 9 (useEffect deps) | 1 |
| 10 (bundle split) | 2 |
| 11 (pipeline interactive) | 4-6 |
| 12 (type consolidation) | 3 |
| 13 (dead props) | 0.5 |
| 14 (provider prop) | 1 |
| 15-19 (quality) | 4 |
| 20 (outputs route auth) | 1 |
| 21 (feedback route auth) | 1 |
| 22 (revalidate) | 2 |
| **Total** | **~40-48** |

## Prioritization Suggestion

**Must fix before launch (security):** Issues 1, 2, 3, 20, 21
**Must fix for stability (data):** Issues 4, 5, 6
**Should fix (perf/arch):** Issues 7-13
**Nice to have (quality):** Issues 14-19, 22