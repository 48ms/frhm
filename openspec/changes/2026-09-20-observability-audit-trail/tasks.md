# Tasks: Observability & Audit Trail

> Status verified against actual code and live DB (2026-09-22).

## Phase 1: Missing audit calls — ✅ DONE
- [x] `POST /api/admin/deliverables/[id]/send` → **logAudit present**
- [x] `POST /api/admin/scheduled-posts` → **logAudit present**
- [x] `POST /api/cron/publish` → **writes audit_log directly** (line 119)
- [x] `GET /api/cron/daily-insight` → **logAudit present**

## Phase 2: Error boundaries — ✅ DONE
- [x] `app/admin/error.tsx` → **EXISTS**
- [x] `app/client/error.tsx` → **EXISTS**
- [x] `app/error.tsx` → **EXISTS** (root-level)
- [x] **Error reporter** → **/api/errors/report** (rate-limited 30/min)
- [x] Error boundaries POST to reporter → **TELEGRAM + audit_log + structured log**
- [x] Error reporter writes `system.error` to audit_log (forensic, immutable)
- [x] **UUID constraint**: `audit_log.entity_id` is UUID — digest must go in `metadata.digest`, NOT `entity_id` (silent insert failure otherwise, root-caused 2026-09-21)

## Phase 5b: Error reporting coverage (2026-09-21)
- [x] `cron/daily-insight` catch → `reportError` (Telegram + audit)
- [x] `cron/check-zero-metrics` query error → `reportError`
- [x] `admin/clients/[id]/generate-campaign` 500 → `reportError`
- [x] Telegram delivery verified: `telegram_notification_logs` status=sent

## Phase 3: Rate limiting — ✅ DONE (12+ routes covered)
- [x] `POST /api/admin/ai/chat` → **checkRateLimit**
- [x] `POST /api/admin/deliverables` → **checkRateLimit**
- [x] `POST /api/admin/scheduled-posts` → **checkRateLimit**
- [x] `POST /api/admin/content-productions` → **checkRateLimit**
- [x] `POST /api/admin/clients/[id]/reset-password` → **checkRateLimit (3 req/60s)**
- [x] `POST /api/admin/bridge/connect` → **checkRateLimit**
- [x] `POST /api/admin/users` → **checkRateLimit**
- [x] `PATCH /api/admin/users/[id]` → **checkRateLimit**

## Phase 4: Health endpoint — ✅ DONE
- [x] `GET /api/health` → **EXISTS**, returns `{status, timestamp, uptime}`

## Phase 5: Sentry — ✅ DONE (2026-09-21)
- [x] `@sentry/nextjs@8.55.2` installed (v8 compatible with Next.js 14.2.35)
- [x] Sentry init: `instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- [x] `experimental.instrumentationHook: true` in `next.config.mjs`
- [x] `withSentryConfig()` wrapper in `next.config.mjs`
- [x] `NEXT_PUBLIC_SENTRY_DSN` in `.env.local`
- [x] `SENTRY_AUTH_TOKEN` in `.env.local` + `.sentryclirc` (untracked)
- [x] CSP `connect-src` includes Sentry ingest domain
- [x] `global-error.tsx` — Sentry captures React rendering errors
- [x] Source maps upload: 300 files via `CI=true npx next build`
- [x] Error capture verified: `Sentry.captureException()` → event in Sentry dashboard
- [x] `.sentryclirc` untracked + added to `.gitignore` (contains auth token)
- [x] `sourcemaps.deleteSourcemapsAfterUpload: true` in next.config.mjs
- [x] `@sentry/cli@3.8.0` installed (devDependency, replaces v1.77.3)

## Phase 6: Session management — ✅ DONE
- [x] `POST /api/admin/clients/[id]/revoke-sessions` → **IMPLEMENTED** — admin reset password to invalidate all sessions (note: no native revoke-by-user-id API exists; Supabase auth doesn't expose `/admin/users/{id}/sessions`)

## Phase 7: Audit log cleanup — ❌ BLOCKED (immutability conflict)
- [ ] Cron: `DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '90 days'` → **IMPOSSIBLE**
- **Reason**: Migration 039 `audit_log_immutable_delete` trigger blocks ALL DELETE on audit_log (forensic requirement)
- **Resolution**: Marked won't-fix; action filter + search were added as UI mitigation since growth is ~28 rows/day (~5 MB/year), far from a performance concern. Retention policy to be revisited if spec immutability requirement changes.

## Phase 8: Forensic columns — ✅ DONE
- [x] `ip_address`, `user_agent`, `request_id` columns → **migration 038**
- [x] `logAudit()` accepts IP/UA from request headers → **verified in lib/audit/log.ts**

## Phase 9: last_sign_in_at — ✅ DONE (no DDL needed)
- [x] `last_sign_in_at` from Supabase Auth → **already available via auth.users**
- [x] GET `/api/admin/users` enriches with `last_sign_in_at` from `auth.admin.listUsers()`
- [x] UI column "Login Terakhir" shows last login timestamp

## Phase 10: E2E tests — ✅ VERIFIED
- [x] Create user → audit_log row → **VERIFIED via e2e/admin-user-management.spec.ts**
- [x] Delete user → audit_log row → **VERIFIED**
- [x] Test health `/api/health` returns 200 → **VERIFIED**
- [x] Test error boundary → **TESTABLE via admin/client error.tsx**

## Phase 11: Admin page sweep & CRUD verification — ✅ COMPLETED (2026-09-22)

### Admin page sweep (21/21 pages pass)
All admin pages load cleanly (no 5xx errors, no error boundaries, no console errors):
- `/admin/dashboard`, `/admin/analytics`, `/admin/audit`, `/admin/clients`, `/admin/deliverables`, `/admin/users`, `/admin/skills`, `/admin/settings/*`, `/admin/crm`, `/admin/calendar`, `/admin/automations`, `/admin/global-pipeline`, `/admin/planning/new`, `/admin/production`

### Bugs found & fixed

| # | Bug | Location | Evidence | Fix Wiring |
|---|-----|----------|----------|------------|
| 1 | HTTP 500 on `/admin/settings/telegram` | `app/admin/settings/telegram/page.tsx` line 9 | async server component + `motion` (client-only library) | Move animated section to client component `components/telegram/telegram-clients-list.tsx` (wraps `<motion.div>`) |
| 2 | Nested `<a>` inside `<Link>` (HTML invalid, hydration risk) | `app/admin/deliverables/page-client.tsx` line 262-271 | `<a>` inside `<Link>` card | Replace `<a target="_blank">` with `<button onClick={() => window.open(...)}>` |
| 3 | Comma in search query crashes PostgREST | `app/admin/settings/audit/page.tsx` line 63 | `summary.ilike.%a,b%` → PGRST100 | Escape via `ilikeFilter()` which wraps value in quotes: `summary.ilike."%a,b%"` |
| 4 | Postgres 500 on Telegram page (verified via API test) | `/admin/settings/telegram` | 500 status without auth | ✅ Fix #1 resolves this |

### Deep CRUD coverage (verified via existing e2e tests)
- **Users**: `e2e/admin-user-management.spec.ts` — create → verify email/last_sign_in_at → delete → audit_log rows
- **Deliverables**: `e2e/admin-deliverables.spec.ts` — UI routing (full CRUD via forms covered by page tests)
- **Clients**: `e2e/create-client.spec.ts` — full client creation flow
- **Budgets/Campaigns**: `e2e/admin-budget-form.spec.ts`, `e2e/admin-campaign-form.spec.ts` — form wiring with zod + react-hook-form

### E2E test suite summary
| Test file | Coverage | Pass |
|-----------|----------|------|
| `e2e/admin-sweep.spec.ts` | 21 admin pages | 21/21 |
| `e2e/audit-log.spec.ts` | Action filter, search, comma safety | 5/5 |
| `e2e/admin-user-management.spec.ts` | CRUD + audit logging | 1/1 |
| `e2e/create-client.spec.ts` | Client creation | 1/1 |
| `e2e/dogfood-qa.spec.ts` | Full-site exploration | Pending next run |

## Phase 12: Ongoing improvement — ✅ ESTABLISHED

### Looping protocol (automated + manual)
1. **Sweep all admin pages** → `e2e/admin-sweep.spec.ts` (21 tests)
2. **Test CRUD endpoints** → existing e2e tests + API smoke tests
3. **Verify RLS** → `lib/audit/log.ts` patterns (service-role for service operations)
4. **Check audit coverage** → all mutations log via `logAudit()`
5. **Review errors** → Sentry dashboard + `/api/errors/report`

### Documentation location
- This file: `openspec/changes/2026-09-20-observability-audit-trail/tasks.md`
- E2E tests: `e2e/*.spec.ts`
- Audit patterns: `lib/audit/log.ts`
- API routes: `api/admin/**/*.route.ts`

### Maintenance reminders
- **Run sweep weekly**: `npx playwright test e2e/admin-sweep.spec.ts`
- **Add new e2e test when**: new admin page created, new mutation endpoint added
- **Check audit log growth**: `SELECT count(*) FROM audit_log` (expect ~28/day, ~5 MB/year)
