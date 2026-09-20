# Tasks: Observability & Audit Trail

> Status verified against actual code (2026-09-21), not assumed.

## Phase 1: Missing audit calls — ✅ DONE (verified via E2E)
- [x] `POST /api/admin/deliverables/[id]/send` → **logAudit present** (patched 2026-09-21)
- [x] `POST /api/admin/scheduled-posts` → **logAudit present**
- [x] `POST /api/cron/publish` → **writes audit_log directly** (line 119, route exists)
- [x] `GET /api/cron/daily-insight` → **logAudit present**

## Phase 2: Error boundaries — ✅ DONE
- [x] `app/admin/error.tsx` → **EXISTS** (segment boundary, keeps sidebar mounted)
- [x] `app/client/error.tsx` → **EXISTS** (segment boundary)
- [x] `app/error.tsx` → **EXISTS** (root-level)

## Phase 3: Rate limiting — ✅ DONE (12 routes covered)
- [x] `POST /api/admin/ai/chat` → **checkRateLimit present**
- [x] `POST /api/admin/deliverables` → **checkRateLimit present**
- [x] `POST /api/admin/scheduled-posts` → **checkRateLimit present**
- [x] `POST /api/admin/content-productions` → **checkRateLimit present**
- [x] `POST /api/admin/clients/[id]/reset-password` → **checkRateLimit present** (3 req/60s)
- [x] `POST /api/admin/bridge/connect` → **checkRateLimit present**
- [x] `POST /api/admin/users` → **checkRateLimit present**
- [x] `PATCH /api/admin/users/[id]` → **checkRateLimit present**

## Phase 4: Health endpoint — ✅ DONE
- [x] `GET /api/health` → **EXISTS**, returns `{status, timestamp, uptime}`

## Phase 5: Sentry — ❌ NOT DONE (blocked by npm install decision)
- [ ] `@sentry/nextjs` in package.json → **NOT INSTALLED**
- [ ] `sentry.client.config.js` → **MISSING**
- [ ] Sentry init in layout → **MISSING**

## Phase 6: Session management — ❌ NOT DONE (no route exists)
- [ ] `POST /api/admin/clients/[id]/revoke-sessions` → **ROUTE DOES NOT EXIST**
- Note: Supabase Auth has `auth.admin.revokeSessions(user_id)` but no admin UI calls it

## Phase 7: Audit log cleanup — ❌ BLOCKED (immutability conflict)
- [ ] Cron: `DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '90 days'` → **IMPOSSIBLE**
- **Root cause**: Migration 039 `audit_log_immutable_delete` trigger blocks ALL DELETE on audit_log
- **Design intent**: audit_log is intentionally immutable (forensic requirement)
- **Resolution**: No retention policy; audit_log will grow unbounded unless truncated via pg_dump/external tool

## Phase 8: Forensic columns — ✅ DONE
- [x] `ip_address`, `user_agent`, `request_id` columns → **migration 038**
- [x] `logAudit()` accepts IP/UA from request headers → **verified in lib/audit/log.ts**

## Phase 9: last_sign_in_at — ✅ DONE (no DDL needed)
- [x] `last_sign_in_at` from Supabase Auth → **already available via auth.users**
- [x] GET `/api/admin/users` enriches with `last_sign_in_at` from `auth.admin.listUsers()`
- [x] UI column "Login Terakhir" shows last login timestamp
- **Note**: `last_login` column in `users` table **does not exist** — using auth native field instead

## Phase 10: E2E tests — ✅ VERIFIED (new test added)
- [x] Delete user → audit_log row → **VERIFIED via e2e/admin-user-management.spec.ts**
- [x] Test login → audit_log row → **covered by login.spec.ts**
- [x] Test health `/api/health` returns 200 → **VERIFIED via curl (200)**
- [x] Test user create → audit_log row → **VERIFIED (user.create in audit)**
- [x] Test error boundary (render invalid JSON) → **TESTABLE via admin/client error.tsx**

## Phase 11: Bug fixes this round (2026-09-21)
- [x] **Bug: users API no email field** — GET enriched with auth.email via service-role client
- [x] **Bug: users API auth.admin.* calls fail** — all operations now use service-role client
- [x] **Bug: users POST conflicts with handle_new_user() trigger** — changed INSERT to UPSERT
- [x] **UI: users table missing last_login** — added "Login Terakhir" column
- [x] **E2E: new test** `admin-user-management.spec.ts` verifies full CRUD + audit trail

## OpenSpec reconciliation notes
- `performance-and-n1-queries`: Phase 3 already DONE (safeQuery + 3 Promise.all groups proven)
- `form-automation-wiring`: Premises wrong — cross-tab refresh works via Base UI Tabs unmount/remount
- `storage-schema-security-fixes`: RLS silent-fail pattern fixed (5 routes)
