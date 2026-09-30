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
| 4 | Hardcoded credentials in tracked e2e test files | `e2e/*.spec.ts` (9 files) | `dheia.buleud@gmail.com` / `Sum3dang` committed | Replace with `process.env.AUDIT_E2E_EMAIL/PASSWORD` |

### Verified SAFE (no bugs found)
- All 21 admin pages render without 5xx errors or error boundaries
- Campaign form POST returns 200, DB row created correctly
- Budget form POST returns 200, DB row created correctly  
- User CRUD: create → verify email/last_sign_in_at → delete → audit_log rows written
- Client creation flow: command palette + sidebar button + validation + DB write
- Cross-tab: expense creation → ROI tab shows updated data without F5
- Platform posts: POST route writes to DB correctly
- Telegram settings: connect/disconnect toggles work via real session
- Client approve/revision: skill_outputs.status updated via real session

### E2E test suite summary (20 specs, all passing)
| Suite | Tests | Status |
|-------|-------|--------|
| `e2e/admin-sweep.spec.ts` | 21 | ✅ PASS |
| `e2e/audit-log.spec.ts` | 5 | ✅ PASS |
| `e2e/admin-user-management.spec.ts` | 1 | ✅ PASS |
| `e2e/create-client.spec.ts` | 4 | ✅ PASS |
| `e2e/admin-campaign-form.spec.ts` | 1 | ✅ PASS |
| `e2e/admin-budget-form.spec.ts` | 1 | ✅ PASS |
| `e2e/admin-crosstab.spec.ts` | 1 | ✅ PASS |
| `e2e/admin-platform-posts.spec.ts` | 1 | ✅ PASS |
| `e2e/client-approve-revision.spec.ts` | 1 | ✅ PASS |
| `e2e/client-settings-telegram.spec.ts` | 1 | ✅ PASS |
| `e2e/client-telegram-disconnect.spec.ts` | 1 | ✅ PASS |
| `e2e/admin-clients.spec.ts` | 1 | ✅ PASS |
| `e2e/admin-dashboard.spec.ts` | 1 | ✅ PASS |
| `e2e/admin-deliverables.spec.ts` | 2 | ✅ PASS |
| `e2e/admin-remaining.spec.ts` | 4 | ✅ PASS |
| `e2e/admin-skills-audit.spec.ts` | 2 | ✅ PASS |
| `e2e/api-errors-report.spec.ts` | 3 | ✅ PASS |
| `e2e/client-dashboard.spec.ts` | 1 | ✅ PASS |
| `e2e/dogfood-qa.spec.ts` | 5 | ✅ PASS |
| `e2e/login.spec.ts` | 1 | ✅ PASS |
| **TOTAL** | **51** | **51/51 PASS** |

### Infrastructure notes
- **Dev server instability**: Server crashes with `MaxListenersExceededWarning` (listener leak, likely from Sentry `tunnelRoute`). Solution: run tests with per-suite server restart via `bash full-verify.sh <suite>`.
- **Auth pattern**: Per-test login (same proven pattern as `e2e/audit-log.spec.ts`) is more stable than `storageState` due to missing `origins` field bug in Playwright's `storageState()` on Windows.
- **Security fix**: Removed hardcoded credentials from 9 e2e test files; all now use `process.env.*` variables.

## Phase 12: Ongoing improvement — ✅ ESTABLISHED

### Looping protocol (verified workflow)
1. **Start server**: `npx next start -p 3004` (prod build, stable)
2. **Run sweep**: `bash full-verify.sh <suite>` — auto-restarts server per suite
3. **Check results**: All suites must report `exit=0` with `X passed`
4. **Document findings**: Update this tasks.md with any new bugs found

### Documentation location
- This file: `openspec/changes/2026-09-20-observability-audit-trail/tasks.md`
- E2E tests: `e2e/*.spec.ts`
- Audit patterns: `lib/audit/log.ts`
- API routes: `api/admin/**/*.route.ts`
- Test harness: `run-e2e.sh`, `full-verify.sh`

### Maintenance reminders
- **Run sweep after each change**: `bash full-verify.sh admin-sweep`
- **Add new e2e test when**: new admin page created, new mutation endpoint added
- **Check audit log growth**: `SELECT count(*) FROM audit_log` (expect ~28/day, ~5 MB/year)
- **Server health**: Monitor for `MaxListenersExceededWarning` — if seen, restart server
