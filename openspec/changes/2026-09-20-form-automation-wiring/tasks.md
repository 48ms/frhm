# Tasks: Form Automation Wiring

> Status verified against actual code (2026-09-21), not assumed.

## Phase 1: router.refresh after mutations — ❌ NOT DONE
- [ ] `budget-ledger-board.tsx` handleExpenseSuccess → **only setExpenses, NO router.refresh** (line 36-41)
- [ ] `budget-ledger-board.tsx` handleBudgetSuccess → **only setBudget, NO router.refresh** (line 32-34)
- [ ] `ads-tracker-board.tsx` → **NO router.refresh**
- [ ] `kol-crm-board.tsx` → **NO router.refresh** (has fetch for KOLs)
- [x] `content-production-board.tsx` → uses `fetchProductions()` (own state refetch, not router.refresh)

## Phase 2: revalidatePath in API routes — ❌ NOT DONE (0 of 5)
- [ ] `app/api/admin/clients/[id]/expenses/route.ts` → **no revalidatePath**
- [ ] `app/api/admin/clients/[id]/ad-spend/route.ts` → **no revalidatePath**
- [ ] `app/api/admin/clients/[id]/budgets/route.ts` → **no revalidatePath**
- [ ] `app/api/admin/kols/route.ts` → **no revalidatePath**
- [ ] `app/api/admin/clients/[id]/events/route.ts` → **no revalidatePath**

## Phase 3: workspace.tsx refactoring — ⚠️ PARTIAL
- [ ] `workspace.tsx` → remove single `Promise.all` for deliverables/files/skills — **NOT VERIFIED**
- [ ] Refactor each tab to fetch its own data with try/catch — **NOT VERIFIED**
- [ ] After Setup tab file upload, call `router.refresh()` — **NOT VERIFIED**
- [x] `event-workspace-board.tsx` → **IMPLEMENTED** fetchEvents + CreateEventModal onSuccess
- [x] Verify `router.refresh()` for event board → uses local state refetch instead (works)

## Phase 4: Realtime subscriptions — ❌ NOT DONE (0 of 5)
- [ ] `budget-ledger-board` → subscribe to `expenses` insert
- [ ] `ads-tracker-board` → subscribe to `ad_spend_logs` insert
- [ ] `roi-dashboard-board` → subscribe to `expenses` + `ad_spend_logs`
- [ ] `omni-calendar-board` → subscribe to `events` + `scheduled_posts`
- [ ] `content-production-board` → subscribe to `content_productions`
- [x] (existing) `deliverable-notifier.tsx` → **only component with channel + on subscribe**

## Phase 5: E2E tab-switch tests — ❌ NOT DONE (0 of 5)
- [ ] Test: create expense → switch to ROI tab → row appears (no F5)
- [ ] Test: create ad spend log → switch to ROI tab → row appears
- [ ] Test: upload file in Setup → check assets tab → file appears
- [ ] Test: create event → check Calendar tab → event appears
- [ ] Test: `npx tsc --noEmit` passes
- [ ] Test: `npx eslint .` passes
