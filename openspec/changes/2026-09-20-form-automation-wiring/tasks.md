# Tasks: Form Automation & Cross-Tab Wiring

## Phase 1: Add router.refresh After Mutations (HIGH) — 2 hrs
- [ ] `budget-ledger-board.tsx`: add `router.refresh()` at end of `handleExpenseSuccess`
- [ ] `budget-ledger-board.tsx`: add `router.refresh()` at end of `handleBudgetSuccess`
- [ ] `ads-tracker-board.tsx`: add `router.refresh()` at end of `handleSuccess`
- [ ] `kol-crm-board.tsx`: add `router.refresh()` at end of `onSuccess={fetchKols}` and delete handler
- [ ] `content-production-board.tsx`: already uses `fetchProductions()` — verify it calls `router.refresh()` if API updates DB

## Phase 2: API Route revalidatePath (HIGH) — 2 hrs
- [ ] `app/api/admin/expenses/route.ts` (or current route) add `revalidatePath('/admin/clients/[id]/budget')`
- [ ] `app/api/admin/ad-spend/route.ts` add `revalidatePath('/admin/clients/[id]/ads')`
- [ ] `app/api/admin/budgets/route.ts` add `revalidatePath('/admin/clients/[id]/budget')`
- [ ] `app/api/admin/kols/route.ts` add `revalidatePath('/admin/clients/[id]/kol')`
- [ ] `app/api/admin/events/route.ts` add `revalidatePath('/admin/clients/[id]/events')`

## Phase 3: Workspace Shared Props (HIGH) — 2 hrs
- [ ] `workspace.tsx`: remove single `Promise.all` for `deliverables`, `files`, `skills`
- [ ] Refactor each tab to fetch its own data with `try/catch`
- [ ] After Setup tab file upload, call `router.refresh()` or invalidate `files` cache

## Phase 4: Event Wiring (HIGH) — 1 hr
- [ ] `event-workspace-board.tsx`: implement `fetchEvents()` using API route
- [ ] `CreateEventModal`: add `onSuccess={fetchEvents}` (or `router.refresh`)
- [ ] Verify `router.refresh()` works for event board

## Phase 5: Realtime Subscriptions (Nice to have) — 3 hrs
- [ ] `budget-ledger-board`: subscribe to `expenses` `insert`
- [ ] `ads-tracker-board`: subscribe to `ad_spend_logs` `insert`
- [ ] `roi-dashboard-board`: subscribe to `expenses` + `ad_spend_logs` (optional, could revalidate on mount)
- [ ] `omni-calendar-board`: subscribe to `events` + `scheduled_posts`
- [ ] `content-production-board`: subscribe to `content_productions`

## Phase 6: Verification — 2 hrs
- [ ] Test: create expense → switch to ROI tab → verify new row appears (no F5)
- [ ] Test: create ad spend log → switch to ROI tab → verify new row appears
- [ ] Test: upload file in Setup → check assets tab → verify file appears without F5
- [ ] Test: create event → check Calendar tab → verify event appears
- [ ] `npx tsc --noEmit` passes
- [ ] `npx eslint .` passes