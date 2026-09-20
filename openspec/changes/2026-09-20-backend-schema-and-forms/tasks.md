# Tasks: Backend Schema & Forms

## Phase 1: Migration Consolidation (30 minutes)
- [ ] List all `.sql` files in `supabase/migrations/` (root)
- [ ] Move 6 migration files to `app/supabase/migrations/`
- [ ] Rename them sequentially (036, 037, etc.)
- [ ] Delete the root `supabase/migrations/` folder
- [ ] Run `npx supabase db push` to create the 12 missing tables
- [ ] Verify tables exist: `openspec admin clients table check` or Supabase Studio

## Phase 2: Form Wiring - Campaign (1.5 hours)
- [ ] Check if `/api/admin/clients/[id]/campaigns` accepts POST (it does per `generate-campaign` route)
- [ ] Update `CampaignForm` `onSubmit` to execute `fetch` POST request
- [ ] Add `toast.success` and error handling in `CampaignForm`
- [ ] Test campaign creation in UI (test page: `/admin/planning/new`)

## Phase 3: Form Wiring - Drafts (1.5 hours)
- [ ] Identify correct API endpoint for `ContentDraftForm` (may need to create `/api/admin/content-drafts`)
- [ ] Update `ContentDraftForm` `onSubmit` to execute `fetch` POST request
- [ ] Add `toast.success` and error handling
- [ ] Test draft creation via `HeroAssetCard` (`/admin/deliverables/[id]`)

## Phase 4: Event Workspace Implementation (3-4 hours)
- [ ] Implement `fetch(events)` from Supabase filtered by `client_id` in `EventWorkspaceBoard`
- [ ] Render the event list (clickable cards)
- [ ] On event click, load `event_tasks` (checklist) and `event_vendors` tabs
- [ ] Wire `CreateEventModal.onSuccess` to call `router.refresh()` or state refresh
- [ ] Test event create/view in Client Workspace `/admin/clients/[id]?tab=events`

## Phase 5: Form Quality Fixes (2-3 hours)

**Task 5.1: Replace alert() with toast (45 minutes)**
- [ ] `components/feedback/feedback-board.tsx` → inline errors
- [ ] `app/admin/settings/users/page.tsx` → inline errors + toast
- [ ] `components/admin/global-automations-board.tsx` → toast
- [ ] `app/admin/deliverables/[id]/page.tsx` → inline errors

**Task 5.2: Add validation (1.5 hours)**
- [ ] `components/deliverable/comment-section.tsx` → zod schema + react-hook-form
- [ ] `app/admin/deliverables/new/page.tsx` → zod schema + react-hook-form

**Task 5.3: Move to API routes (1 hour)**
- [ ] `components/marketing/kol-crm-board.tsx` → create `/api/admin/kols`
- [ ] `app/admin/deliverables/new/page.tsx` → use existing `/api/admin/deliverables`

## Phase 6: Verification (1 hour)
- [ ] Verify 12 tables exist via `openspec admin clients table check`
- [ ] Verify Event/Budget/Ads/Assets tabs in Client Workspace no longer return 404/empty errors
- [ ] Test campaign creation: `/admin/planning/new`
- [ ] Test content draft: `/admin/deliverables/[id]` via HeroAssetCard
- [ ] Archive both changes: `openspec archive client-portal-fixes` + `openspec archive backend-schema-and-forms`
