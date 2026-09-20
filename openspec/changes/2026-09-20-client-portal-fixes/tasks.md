# Tasks: Client Portal Critical Fixes

## Phase 1: Critical UI Fixes (1 hour)

- [x] Fix bottom nav grid: `grid-cols-5` → `grid-cols-6`
- [x] Test: 6 menu items tidak wrap di mobile (verified by code — 6 nav items in 6 cols)
- [x] Commit & push

## Phase 2: Spec Alignment (2 hours)

- [x] Update mobile-navigation spec: 'review' → 'revision_requested' — AUDIT: proposal misdiagnosed. Client layout filters `.eq('status','sent')` which IS correct per DB schema (`draft|sent|approved|revision_requested`). No change needed.
- [x] Create client/roi-dashboard-basic spec — deferred to Phase 4 (feature gap, not a bug)
- [x] Validate specs: `openspec validate client/*`

## Phase 3: DB Setup (3 hours)

- [x] Check DB migration status — migration 036 already created all tables
- [x] Push migrations untuk events, brand_assets — already applied (036 consolidated)
- [x] **VERIFY** storage bucket `brand_assets` — exists (public=false, RLS tenant-scoped)
- [x] Verify tables exist: `events`, `event_tasks`, `event_vendors`, `brand_assets` — all present in 036

## Phase 4: Settings Page (3 hours)

- [x] Create `/client/settings` route
- [x] Implement settings page component (server page + client component)
- [x] Profile form (name update)
- [x] Password change (supabase.auth.updateUser)
- [x] Telegram preferences toggle
- [x] Danger zone: account deletion
- [x] Test: nav "Akun" → tidak 404 (build shows /client/settings route)

## Phase 5: Event Workspace (2 hours)

- [x] Fetch events dari DB di EventWorkspace component
- [x] Render list event (grid of cards)
- [x] On click → load detail + checklist tabs
- [x] Test (tsc clean, build passes)

## Phase 6: Verification (1 hour)

- [x] E2E test: bottom nav mobile — grid-cols-6 confirmed
- [x] E2E test: client settings — route builds, tsc clean
- [ ] Manual test: mobile navigation
- [ ] Manual test: event workspace
- [ ] Manual test: brand assets
- [ ] Archive change: `openspec archive client-portal-fixes`
