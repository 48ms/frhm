# Tasks: Backend Schema & Forms

> Status verified against actual code (2026-09-21), not assumed.

## Phase 1: Migrations consolidation — ✅ DONE
- [x] List all `.sql` files in `supabase/migrations/` (root) — **root folder now EMPTY (0 files)**
- [x] Move 6 migration files to `app/supabase/migrations/` — **39 files present**
- [x] Rename them sequentially (036, 037, etc.)
- [x] Delete the root `supabase/migrations/` folder — **verified: empty**

## Phase 2: Forms wiring — ⚠️ PARTIAL (3 of 5 components still have TODO stubs)
- [ ] `CampaignForm` onSubmit → still `console.log` + `// TODO: Connect to Server Action / Supabase` + `router.push` (components/admin/campaign-form.tsx:71-76). Used by `/admin/planning/new`.
- [ ] `ContentDraftForm` onSubmit → still `console.log` + `// TODO: Connect to backend` (components/admin/content-draft-form.tsx:45-48). Used by `HeroAssetCard`.
- [ ] `/api/admin/content-drafts` route → **DOES NOT EXIST** (must be created before wiring ContentDraftForm)
- [x] `EventWorkspaceBoard` → **IMPLEMENTED**: fetchEvents (line 45-54), clickable list (145-175), EventChecklist (110)
- [x] `CreateEventModal.onSuccess` → **IMPLEMENTED**: POST `/api/admin/clients/:id/events` + `onSuccess()` (create-event-modal.tsx:52-76)
- [ ] Campaign creation test via `/admin/planning/new` — **BLOCKED by CampaignForm stub**
- [ ] Content draft test via `HeroAssetCard` — **BLOCKED by missing API + ContentDraftForm stub**

## Phase 3: Inline errors / validation — ⚠️ PARTIAL
- [x] `components/feedback/feedback-board.tsx` → toast + inline errors
- [x] `components/admin/global-automations-board.tsx` → toast + inline errors
- [x] `components/marketing/kol-crm-board.tsx` → toast + inline errors
- [ ] `app/admin/settings/users/page.tsx` → inline errors only, **no toast**
- [ ] `app/admin/deliverables/[id]/page.tsx` → inline errors only, **no toast**
- [ ] `components/deliverable/comment-section.tsx` → **NO zod, NO react-hook-form, NO inline errors**
- [ ] `app/admin/deliverables/new/page.tsx` → inline errors only, **no toast**
- [ ] `app/admin/deliverables/new/page.tsx` → **NO zod, NO react-hook-form**

## Phase 4: KOL route — ✅ DONE
- [x] `/api/admin/kols` route exists
- [x] `kol-crm-board.tsx` already has `fetch()` + toast

## Phase 5: Verification — ⚠️ PARTIAL
- [x] 12 tables exist (live DB verified in earlier audit round)
- [ ] Verify Event/Budget/Ads/Assets tabs no longer return 404/empty errors — **NOT RUN**
- [ ] Test campaign creation: `/admin/planning/new` — **BLOCKED**
- [ ] Test content draft: `/admin/deliverables/[id]` via HeroAssetCard — **BLOCKED**
- [ ] Archive this change — **NOT DONE**
