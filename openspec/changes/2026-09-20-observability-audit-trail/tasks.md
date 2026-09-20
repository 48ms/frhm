# Tasks: Observability & Audit Trail

> Status verified against actual code (2026-09-21), not assumed.

## Phase 1: Missing audit calls — ⚠️ PARTIAL (1 of 4)
- [ ] `POST /api/admin/deliverables/[id]/send` → **route exists, logAudit NOT verified**
- [x] `POST /api/admin/scheduled-posts` → **logAudit present**
- [ ] `POST /api/cron/publish` → **NO logAudit** (cron route uses service role directly)
- [x] `GET /api/cron/daily-insight` → **logAudit present**

## Phase 2: Error boundaries — ❌ NOT DONE (0 of 3)
- [ ] `app/admin/error.tsx` → **MISSING**
- [ ] `app/client/error.tsx` → **MISSING**
- [x] `app/error.tsx` → **EXISTS** (root-level only)

## Phase 3: Rate limiting — ⚠️ PARTIAL (1 of 6)
- [x] `POST /api/admin/ai/chat` → **checkRateLimit present**
- [ ] `POST /api/admin/deliverables` → **NO checkRateLimit**
- [ ] `POST /api/admin/scheduled-posts` → **NO checkRateLimit**
- [ ] `POST /api/admin/content-productions` → **NOT VERIFIED**
- [ ] `POST /api/admin/clients/[id]/reset-password` → **NOT VERIFIED**
- [ ] `POST /api/telegram/webhook` → **NO checkRateLimit** (webhook, may use signature verify instead)
- [ ] `POST /api/admin/bridge/connect` → **NO checkRateLimit**

## Phase 4: Health endpoint — ✅ DONE
- [x] `GET /api/health` → **EXISTS**, returns `{status, timestamp, uptime}`

## Phase 5: Sentry — ❌ NOT DONE (0 of 3)
- [ ] `@sentry/nextjs` in package.json → **NOT INSTALLED**
- [ ] `sentry.client.config.js` → **MISSING**
- [ ] Sentry init in layout → **MISSING**

## Phase 6: Session management — ⚠️ NOT VERIFIED
- [ ] `POST /api/admin/clients/[id]/revoke-sessions` → **NOT VERIFIED**

## Phase 7: Audit log cleanup — ⚠️ NOT VERIFIED
- [ ] Cron: `DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '90 days'` → **NOT VERIFIED**

## Phase 8: Forensic columns — ✅ DONE
- [x] `ip_address`, `user_agent`, `request_id` columns → **migration 038_audit_log_forensic_columns.sql exists**
- [x] `logAudit()` accepts IP/UA from request headers → **verified in lib/audit/log.ts**

## Phase 9: last_login — ❌ NOT DONE
- [ ] `last_login timestamptz` column to `users` → **NOT in any migration**
- [ ] Update on successful signin → **NOT DONE**

## Phase 10: E2E tests — ⚠️ PARTIAL
- [ ] Delete user → audit_log row → **NOT RUN**
- [ ] Test login → audit_log row → **NOT RUN**
- [x] Test health `/api/health` returns 200 → **VERIFIED via curl (200)**
- [ ] Test error boundary (render invalid JSON) → **BLOCKED: no admin/client error.tsx**
- [ ] Verify `ai_usage_logs` row after AI call → **NOT RUN**
- [ ] Verify client approval writes audit row → **verifiable via e2e/client-approve-revision.spec.ts (DB write proven)**
- [ ] Verify trigger fires on direct DB update → **NOT RUN**
- [ ] Archive change → **NOT DONE**
