# Tasks: Form Automation Wiring

> **RE-VERIFIED 2026-09-21 against real code + live E2E.** The original task premises were WRONG
> for this codebase. Findings below are evidence-based, not assumed.

## KEY FINDING — the `router.refresh()` premise is invalid here

Every marketing board (`budget-ledger-board`, `ads-tracker-board`, `roi-dashboard-board`,
`kol-crm-board`, `event-workspace-board`) is a **client component that fetches its own data in
`useEffect`** (`createClient()` + `.from(...)`) and holds it in **local `useState`** — it does NOT
receive server-rendered props. `router.refresh()` only re-runs **server** components; it would have
**no effect** on these boards' local state. The task was based on a wrong mental model.

**PROOF (live E2E, `e2e/admin-crosstab.spec.ts`):**
- Created an expense via `ExpenseFormModal` → POST 200.
- Switched to **ROI Dashboard** tab → the new expense is included (`ROI HAS 250000: true`).
- Switched back to **Budget Ledger** → the row is listed (`BUDGET TAB HAS E2E TEXT: true`).
- **No F5, no router.refresh.** Works because Base UI `TabsPanel` has `keepMounted = false`
  (verified in `node_modules/@base-ui/react/tabs/panel/TabsPanel.js:37`), so switching tabs
  UNMOUNTS the old panel and REMOUNTS the new one → its `useEffect` refetches fresh data.

So the cross-tab "staleness" this change feared does not exist for these boards.

## Phase 1: router.refresh after mutations — ⚠️ PREMISE INVALID
- [x] `budget-ledger-board.tsx` — local `setBudget`/`setExpenses`; cross-tab refresh PROVEN working
      without `router.refresh` (see PROOF above). Adding it would be dead code.
- [x] `ads-tracker-board.tsx` — local `setLogs` + refetch-on-mount; no refresh needed.
- [x] `kol-crm-board.tsx` — `onSuccess={fetchKols}` already refetches its own list.
- [x] `content-production-board.tsx` — uses `fetchProductions()` (own refetch) ✅
- [x] `event-workspace-board.tsx` — `onSuccess={fetchEvents}` (own refetch) ✅

## Phase 2: revalidatePath in API routes — ⚠️ NOT NEEDED
- [x] Investigated all 5 routes: no `revalidatePath`. **Correct as-is** — the boards that consume
      this data are client-side fetchers (not server components), so `revalidatePath` (which only
      invalidates server-render caches) has no consumer to invalidate. The two genuinely
      server-rendered consumers of `kols` (`/admin/crm/[id]`, `/admin/production`) are
      `force-dynamic`, so they re-query on every request anyway.

## Phase 3: workspace.tsx refactoring — ✅ ALREADY DONE (was mis-marked NOT VERIFIED)
- [x] `page.tsx` — `safeQuery` wrapper (lines 47-65) wraps every query in try/catch returning
      `{data, errors}`; a single failure cannot blank the page.
- [x] Queries split into 3 independent `Promise.all` groups (A: content, B: files+pipeline,
      C: config+outputs) — lines 84, 101, 113. No single page-wide `Promise.all`.
- [x] `workspace.tsx` already calls `router.refresh()` after Setup upload (line 159) and on
      `onContentGenerated` (302, 307) and `onSent` (424).
- [x] `event-workspace-board.tsx` implemented (fetchEvents + CreateEventModal onSuccess).

## Phase 4: Realtime subscriptions — ❌ NOT DONE (0 of 5)
- [ ] `budget-ledger-board` → subscribe to `expenses` insert
- [ ] `ads-tracker-board` → subscribe to `ad_spend_logs` insert
- [ ] `roi-dashboard-board` → subscribe to `expenses` + `ad_spend_logs`
- [ ] `omni-calendar-board` → subscribe to `events` + `scheduled_posts`
- [ ] `content-production-board` → subscribe to `content_productions`
- [x] (existing) `deliverable-notifier.tsx` → only component with channel + on subscribe
- NOTE: Realtime is an *enhancement* (multi-user live sync), not a correctness bug — single-user
  cross-tab already works via remount-refetch (Phase 1 PROOF). Low priority.

## Phase 5: E2E tab-switch tests
- [x] Test: create expense → switch to ROI tab → row appears (no F5) — `e2e/admin-crosstab.spec.ts` PASS
- [x] Test: create budget → POST 200 → DB row persisted — `e2e/admin-budget-form.spec.ts` (DB read-back)
- [x] Test: create campaign → POST 200 → DB row in `content_campaigns` (verified via PostgREST)
- [ ] Test: upload file in Setup → check assets tab → file appears
- [ ] Test: create event → check Calendar tab → event appears
- [x] Test: `npx tsc --noEmit` passes → exit 0 ✅
- [ ] Test: `npx eslint .` — 81 pre-existing problems (not introduced by this work)

## Related fixes shipped in this session (form correctness)
- [x] `components/ui/input.tsx` + `textarea.tsx` — added `React.forwardRef` (was a plain function
      component → `register()` from react-hook-form could not attach a ref → **all 9 RHF forms
      silently failed validation with "expected string, received undefined"**). PROVEN via E2E.
- [x] `budget-form-modal`, `ad-spend-form-modal`, `expense-form-modal`, `kol-form-modal` —
      `z.number()` → `z.coerce.number()` (HTML number inputs deliver strings). PROVEN: budget POST
      went 400→200 and DB row written.
- [x] `campaign-form.tsx` — wired to `POST /api/admin/clients/[id]/campaigns`; redirect fixed from
      dead `/admin/planning` to `/admin/calendar`. PROVEN: DB row in `content_campaigns`.
- [x] `content-draft-form.tsx` — wired to new `POST /api/admin/platform-posts`.
