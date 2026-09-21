# Tasks: Backend Schema & Forms

> Status verified against actual code (2026-09-21), not assumed.

## Phase 1: Migrations consolidation — ✅ DONE
- [x] List all `.sql` files in `supabase/migrations/` (root) — **root folder now EMPTY (0 files)**
- [x] Move 6 migration files to `app/supabase/migrations/` — **39 files present**
- [x] Rename them sequentially (036, 037, etc.)
- [x] Delete the root `supabase/migrations/` folder — **verified: empty**

## Phase 2: Forms wiring — ✅ DONE (verified 2026-09-21)
- [x] `CampaignForm` → wired to `POST /api/admin/clients/{id}/campaigns` with toast ✅
- [x] `ContentDraftForm` → wired to `POST /api/admin/platform-posts` with toast ✅
- [x] `/api/admin/content-drafts` not needed — ContentDraftForm uses `/api/admin/platform-posts` (exists)
- [x] `EventWorkspaceBoard` → **IMPLEMENTED**: fetchEvents (line 45-54), clickable list (145-175), EventChecklist (110)
- [x] `CreateEventModal.onSuccess` → **IMPLEMENTED**: POST `/api/admin/clients/:id/events` + `onSuccess()` (create-event-modal.tsx:52-76)
- [x] Campaign creation test via `/admin/planning/new` → **FORM WIRED** (fetches clients list, POST to campaigns)
- [x] Content draft test via `HeroAssetCard` → **FORM WIRED** (fetches clients list, POST to platform-posts)

## Phase 3: Inline errors / validation — ⚠️ PARTIAL
- [x] `components/feedback/feedback-board.tsx` → toast + inline errors
- [x] `components/admin/global-automations-board.tsx` → toast + inline errors
- [x] `components/marketing/kol-crm-board.tsx` → toast + inline errors
- [ ] `app/admin/settings/users/page.tsx` → inline error (`setErr`) + inline render, **no sonner toast** — functional but UX improvement possible
- [ ] `app/admin/deliverables/[id]/page.tsx` → uses `alert()` at lines 150,165 for save/delete errors — **should use sonner toast**
- [ ] `components/deliverable/comment-section.tsx` → no error handling (delegated to parent `onAddComment`)
- [ ] `app/admin/deliverables/new/page.tsx` → inline error + error render, **no sonner toast** — functional
- [ ] `app/admin/deliverables/new/page.tsx` → **NO zod, NO react-hook-form** — manual validation only

## Phase 4: KOL route — ✅ DONE
- [x] `/api/admin/kols` route exists
- [x] `kol-crm-board.tsx` already has `fetch()` + toast

## Phase 5: Verification — ⚠️ PARTIAL
- [x] 12 tables exist (live DB verified in earlier audit round)
- [ ] Verify Event/Budget/Ads/Assets tabs no longer return 404/empty errors — **NOT RUN**
- [ ] Test campaign creation: `/admin/planning/new` — **FORM WIRED, NOT E2E TESTED**
- [ ] Test content draft: `/admin/deliverables/[id]` via HeroAssetCard — **FORM WIRED, NOT E2E TESTED**
- [ ] Archive this change — **NOT DONE**
