# Proposal: Form Automation & Cross-Tab Wiring

## Overview

After verifying cross-tab data flow, we identified **5 wiring gaps** where successful form submissions do not propagate fresh data to dependent tabs or boards. Unlike earlier findings (missing tables, dead forms), these issues concern **how data flows after a mutation** and whether the UI stays synchronized.

## Issue W1: Cross-Tab Desync (Budget → ROI, Ads → ROI, Event → Calendar) (HIGH)

**Problem:**
- `ExpenseFormModal` (Budget tab) writes to `expenses`
- `AdSpendFormModal` (Ads tab) writes to `ad_spend_logs`
- `CreateEventModal` (Events tab) writes to `events` (stub, see Issue 5)

**ROI tab** reads `expenses` and `ad_spend_logs`
**Calendar tab** reads `events` (via `content_assets` + `platform_posts`)

Current wiring:
- `budget-ledger-board` uses local state (`setExpenses`, `setBudget`) — updates Budget tab only
- `ads-tracker-board` uses local state (`setLogs`) — updates Ads tab only
- `roi-dashboard-board` reads from DB once on mount; **does not know** when Expense or AdSpend changes
- `omni-calendar-board` reads from DB once on mount; **does not know** when Event changes

**Impact:** If admin creates an expense, then immediately clicks ROI tab, ROI shows the old data (until manual F5 or remount). In multi-tab workflows, this is frustrating and can lead to incorrect budget/ROI analysis.

## Issue W2: Shared Workspace Props Stale (HIGH)

**Problem:**
`workspace.tsx` (Client Workspace page) executes once on load:
```tsx
const [{ data: deliverables }, { data: files }, { data: skills }, ...] = await Promise.all([...])
```
These arrays are passed as props to multiple tabs:
- `files={allFiles ? Object.keys(allFiles) : []}` → Setup, Assets
- `deliverables` → Deliverables tabs (both admin & client)
- `skills` → Pipeline, Skills

If the Setup tab uploads a file (mutation), `files` prop remains stale. Other tabs that display the file list will not see the new entry until the entire page reloads (F5).

## Issue W3: No Realtime Subscriptions on Marketing/Ops Boards (MEDIUM)

**Current State:** Only 3 files subscribe Supabase realtime:
- `deliverables/[id]/page.tsx` (admin approval)
- `client/deliverables/[id]/page.tsx` (client approval)
- `deliverable-notifier.tsx` (notification)

**Missing:** `ads-tracker-board`, `budget-ledger-board`, `roi-dashboard-board`, `kol-crm-board`, `omni-calendar-board`, `content-production-board`, `brand-asset-hub`

**Impact:** Even if admin keeps two tabs open (e.g., Budget + ROI), ROI will not auto-update when a new expense is added. On-mount fetch helps on remount, but doesn't solve the multi-tab live view.

## Issue W4: CreateEventModal Wiring (HIGH)

**Problem:**
`EventWorkspaceBoard` is a **stub** — `const events = []` + no fetch. `CreateEventModal` exists with `clientId` prop but has no `onSuccess` callback wired to refresh or fetch.

**Impact:** Even after DB tables exist, Events tab will not show events.

## Issue W5: Calendar Tab Reads Missing Tables (HIGH)

**Problem:**
`omni-calendar-board` reads `campaigns`, `content_assets`, `platform_posts`. `content_assets` and `platform_posts` are in the **12 missing tables** (no migration yet). `campaigns` may or may not be in DB (needs verification).

**Impact:** Calendar tab cannot render scheduled content until migrations are pushed.

## Fix Strategy

**For W1 (Cross-Tab):**
1. Keep optimistic local state update in parent board (already done for Budget, Ads, KOL, Content)
2. **Add `router.refresh()`** in parent board after successful submit (already done for Trends)
3. Add **`revalidatePath()`** to API routes that mutate shared data (Expense, AdSpend, Budget, Event, KOL)

**For W2 (Shared Props):**
1. Change `workspace.tsx` from "fetch all once" to "fetch per-section with error tolerance"
2. After Setup tab mutation (file upload), call `router.refresh()` or invalidate `files` cache

**For W3 (Realtime):**
1. Add Supabase realtime subscriptions to `ads-tracker-board`, `budget-ledger-board`, `roi-dashboard-board`, `omni-calendar-board`, `content-production-board`, `brand-asset-hub`
2. Subscribe to `insert` on relevant tables (ad_spend_logs, expenses, events, content_assets)

**For W4 (Events):**
1. Wire `CreateEventModal.onSuccess` → `router.refresh()` or `fetchEvents()`
2. Implement Event fetch logic

**For W5 (Calendar):**
1. Push migrations for missing tables (already tracked in backend-schema-and-forms)
2. Verify Calendar reads correct tables (events + scheduled_posts)

## Total Estimated Effort

| Issue | Hours |
|-------|-------|
| W1 (router.refresh + revalidatePath) | 3 |
| W2 (workspace.tsx refactor) | 2 |
| W3 (realtime subscriptions) | 3 |
| W4 (event wiring) | 1 |
| W5 (migration push) | 0 |
| **Total** | **~9** |

## Prioritization

**Must fix before launch:** W1, W4, W2
**Nice to have:** W3 (realtime is polish, not critical)
**Already tracked:** W5 (backend-schema-and-forms)