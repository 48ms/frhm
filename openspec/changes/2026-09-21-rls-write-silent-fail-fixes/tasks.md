
# Tasks

## Phase 1: Identify Silent-Fail Writes
- [x] Enumerate all client-facing API routes that write to DB
- [x] Cross-check each table's client RLS policy in migrations
- [x] Verify against live schema via service-role queries

## Phase 2: Fix Service-Role Bypass
- [x] `/api/telegram/preferences`
- [x] `/api/client/deliverables/:id/approve`
- [x] `/api/client/deliverables/:id/revision`
- [x] `/api/client/me` DELETE

## Phase 3: E2E Verification
- [x] Write browser tests that use real session cookies
- [x] Verify DB writes via service-role read-back
- [x] Run full Playwright suite → 23/23 pass

## Phase 4: Documentation
- [x] Add to OpenSpec
- [x] Clean up test scripts
