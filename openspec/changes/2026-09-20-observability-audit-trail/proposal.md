# Proposal: Observability & Audit Trail Fixes

## Overview

Deep-dive into observability and audit layer revealed **18 findings**. Only 44% of mutation routes write audit logs. Critical operations (delete user, delete client, change AI provider) leave NO trail. The system has NO rate limiting, NO error tracking, and NO compliance features.

## Issue O1: Audit Coverage Only 44% (CRITICAL)

**Problem:**
Only 16 of 36 mutation routes write audit logs. Missing:
- `DELETE /api/admin/clients/[id]` (client deletion)
- `DELETE /api/admin/users/[id]` (user deletion)
- `POST /api/admin/users` (user creation)
- `PATCH /api/admin/ai/providers` (AI provider change)
- `POST /api/telegram/disconnect` / `PATCH /api/telegram/preferences`
- `DELETE /api/admin/clients/[id]/competitors` / `skills` / `deliverables`

**Impact:** Security incidents, accidental deletions, or config changes leave NO forensic trail.

## Issue O2: Login/Logout Not Audited (CRITICAL)

**Problem:**
`/auth/login/page.tsx` and `/auth/callback/route.ts` do not log `action: 'auth.signin'`.

**Impact:** No visibility into who logged in when.

## Issue O3: Deliverable Deletion Not Audited (HIGH)

**Problem:**
`DELETE /api/admin/deliverables/[id]` has no audit log.

**Impact:** Deleted deliverables leave no trace.

## Issue O4: Cron Runs Not Audited (MEDIUM)

**Problem:**
`/api/cron/publish` and `/api/cron/daily-insight` do not log to `audit_log`.

**Impact:** Can't tell when cron last ran or if it failed.

## Issue O5: No Rate Limiting on Mutation Routes (CRITICAL)

**Problem:**
Zero mutation routes (`clients`, `users`, `deliverables`, `scheduled-posts`, `content-productions`, `ai/run`) have rate limiting.

**Impact:** Abuse/brute-force attacks on critical API endpoints.

## Issue O6: No React ErrorBoundary (HIGH)

**Problem:**
No `error.tsx`, no `global-error.tsx`, no `ErrorBoundary` component anywhere.

**Impact:** Unhandled render errors = blank white page. No recovery.

## Issue O7: No Error Tracking (HIGH)

**Problem:**
No Sentry, no Datadog, no structured logging. 37 `console.error` calls logged to nowhere.

**Impact:** Production errors invisible to admins.

## Issue O8: No `/api/health` Endpoint (HIGH)

**Problem:**
Zero health check endpoints.

**Impact:** Can't monitor app status from external tools (UptimeRobot, Datadog).

## Issue O9: No GDPR / Data Export (MEDIUM)

**Problem:**
No `GET /api/client/me/export` or `DELETE /api/client/me` for account deletion.

**Impact:** Cannot comply with GDPR "right to be forgotten".

## Issue O10: No Session Revocation (HIGH)

**Problem:**
Admins cannot kick out compromised user sessions.

**Impact:** Security vulnerability.

## Issue O11: No Request Logging (MEDIUM)

**Problem:**
No `middleware.ts` with request logging.

**Impact:** No access logs for security investigations.

## Issue O12: 20 Files Swallow Errors (MEDIUM)

**Problem:**
20 files have `catch { console.error() }` with no alerting.

**Impact:** Critical errors silently ignored.

## Issue O13: No Retention Policy (MEDIUM)

**Problem:**
`audit_log` grows forever. No scheduled cleanup.

**Impact:** Database bloat over time.

## Issue O14: No External Monitoring (MEDIUM)

**Problem:**
No Vercel Analytics, no external uptime monitoring.

**Impact:** No visibility into app performance/uptime.

## Issue O15: Audit Log Metadata Quality (MEDIUM)

**Problem:**
Some `logAudit` calls only have `summary`, no structured `metadata` (e.g., `delete` operations don't log what was deleted).

**Impact:** Audit trail incomplete for forensics.

## Fix Strategy

**Phase 1: Audit Coverage (15 routes)**
- Add `logAudit()` to all 20 missing mutation routes
- Add `logAudit()` to login/logout flow
- Add `logAudit()` to cron jobs
- Add `logAudit()` to API route deletions

**Phase 2: Error Handling (10 routes)**
- Add `ErrorBoundary` to app root
- Add `error.tsx` files to critical pages
- Convert 20 swallowed errors to alerting

**Phase 3: Observability**
- Add `/api/health` endpoint
- Add rate limiting to all mutation routes
- Add external monitoring (Vercel Analytics, Sentry)
- Add GDPR data export feature

**Phase 4: Retention**
- Add cleanup cron for old audit logs

## Prioritization

**Must fix:** O1, O2, O5, O6, O7 (security & debugging)
**Should fix:** O3, O4, O8, O10 (operational)
**Nice to have:** O9, O11, O12, O13, O14 (compliance & polish)
