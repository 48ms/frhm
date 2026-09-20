# Tasks: Client Portal Critical Fixes

## Phase 1: Critical UI Fixes (1 hour)

- [ ] Fix bottom nav grid: `grid-cols-5` → `grid-cols-6`
- [ ] Test: 6 menu items tidak wrap di mobile
- [ ] Commit & push

## Phase 2: Spec Alignment (2 hours)

- [ ] Update mobile-navigation spec: 'review' → 'revision_requested'
- [ ] Create client/roi-dashboard-basic spec
- [ ] Validate specs: `openspec validate client/*`

## Phase 3: DB Setup (3 hours)

- [ ] Check DB migration status
- [ ] Push migrations untuk events, brand_assets
- [ ] **VERIFY** storage bucket `brand_assets` (cek awal: list bucket kosong, tapi object/list → exists — perlu konfirmasi ulang sebelum setup)
- [ ] Verify tables exist: `supabase db query`

## Phase 4: Settings Page (3 hours)

- [ ] Create `/client/settings` route
- [ ] Implement settings page component
- [ ] Profile form (fetch/update)
- [ ] Password change dialog
- [ ] Telegram preferences
- [ ] Test: nav "Akun" → tidak 404

## Phase 5: Event Workspace (2 hours)

- [ ] Fetch events dari DB di EventWorkspace component
- [ ] Render list event
- [ ] On click → load rundown
- [ ] Test

## Phase 6: Verification (1 hour)

- [ ] E2E test: bottom nav mobile
- [ ] E2E test: client settings
- [ ] Manual test: mobile navigation
- [ ] Manual test: event workspace
- [ ] Manual test: brand assets
- [ ] Archive change: `openspec archive client-portal-fixes`
