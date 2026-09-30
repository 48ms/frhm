# Tasks

## Phase 1: Identify Silent-Fail Writes
- [x] Enumerate all client-facing API routes that write to DB
- [x] Cross-check each table's client RLS policy in migrations
- [x] Verify against live schema via service-role queries
- [x] Test behavioral: run UPDATE with client JWT, compare 0 rows vs expected

## Phase 2: Fix Service-Role Bypass
- [x] `/api/telegram/preferences` — service-role client
- [x] `/api/client/deliverables/:id/approve` — shared `patchSkillOutputsByDeliverable()` helper
- [x] `/api/client/deliverables/:id/revision` — same helper
- [x] `/api/client/me` DELETE — service-role for users update
- [x] `/api/telegram/disconnect` (client path) — service-role for clients update

## Phase 3: E2E Verification
- [x] Write browser tests with real session cookies (not Playwright request context)
- [x] Verify DB writes via service-role read-back (before/after comparison)
- [x] Run full Playwright suite → 24/24 pass
- [x] Clean up temporary verification scripts

## Phase 4: Documentation
- [x] Update OpenSpec proposal with full proof table
- [x] Add security rationale (why service-role over migration)
- [x] Record related audit findings (tables confirmed safe)
- [x] Add `tasks.md` with all phases complete
