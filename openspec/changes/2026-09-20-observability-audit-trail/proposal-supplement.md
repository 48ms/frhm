# Proposal Supplement: Observability Deep-Dive (O19-O26)

## New Findings Beyond O1-O18

### Issue O19: No Forensic Data in `audit_log` (HIGH)

**Problem:** `audit_log` has no `ip_address`, `user_agent`, or `request_id` columns.

**Impact:** If an account is compromised, admin cannot determine WHERE the attacker logged in from or correlate sessions.

**Fix:** Add `ip_address inet`, `user_agent text`, `request_id text` columns to `audit_log`.

### Issue O20: No AI Token/Cost Tracking (CRITICAL)

**Problem:** `lib/ai/providers.ts` does NOT surface `usage` (prompt_tokens/completion_tokens). No `ai_logs`/`token_usage` table exists.

**Impact:** **Financial blindspot.** A buggy infinite loop in Trends/Analytics generation could drain the OpenAI/Anthropic quota (hundreds of dollars), with no way to identify which client or route caused it.

**Fix:**
1. Surface `usage` from AI provider responses
2. Create `ai_usage_logs` table (client_id, route, model, prompt_tokens, completion_tokens, cost_estimate, created_at)
3. Log every AI call via a wrapper

### Issue O21: File Upload/Delete Not Audited (HIGH)

**Problem:** `brand-asset-hub.tsx` uploads/deletes directly to Supabase with no `logAudit`.

**Impact:** If an asset is deleted (accidentally or maliciously), no record of who deleted it.

### Issue O22: Client Portal Actions Not Audited (HIGH)

**Problem:** `approval-board.tsx` updates `platform_posts.status` directly via Supabase client (`UPDATE platform_posts SET status='Approved'`), bypassing any audit. No API route involved.

**Impact:** Client approvals/rejections are **completely invisible** in the audit trail. Cannot prove a client approved content.

### Issue O23: No Database Performance Monitoring (MEDIUM)

**Problem:** No `pg_stat_statements`, no query timing, no slow-query detection.

**Impact:** Slow queries degrade UX silently; no data to optimize.

### Issue O24: No Feature Flags (MEDIUM)

**Problem:** Zero feature flag system.

**Impact:** Cannot disable a broken feature (e.g., auto-publish) without a redeploy.

### Issue O25: No Logger Module / Log Levels (MEDIUM)

**Problem:** No logger abstraction. Only `lib/audit/log.ts`. All other logging is raw `console.log/error/warn` (14/37/5 calls).

**Impact:** No log levels, no environment-aware logging, no structured JSON logs.

### Issue O26: Security Events Partially Logged (MEDIUM)

**Problem:** 401/403 responses are returned but NOT logged as security events.

**Impact:** Cannot detect probing/attack patterns (repeated 403s).

## NEW Findings O27-O30 (Deep Verification)

### Issue O27: No Trigger-Based Audit Backstop (HIGH)

**Problem:** `audit_log` is written **100% by application code** (`logAudit()`). No database trigger automatically captures mutations.

**Impact:** If a developer forgets `logAudit()` (as in the 20 un-audited routes), or a direct DB/admin query runs, the mutation is **invisible** with zero backstop. Trigger-based audit is the industry standard for forensic integrity.

**Fix:** Create a generic `audit_row_change()` trigger function attached to critical tables (users, clients, deliverables, scheduled_posts) that inserts into `audit_log` on UPDATE/DELETE.

### Issue O28: `telegram_notification_logs` Table Missing from DB (HIGH)

**Problem:** `lib/telegram/service.ts` writes delivery status to `telegram_notification_logs`:
```ts
supabase.from('telegram_notification_logs').insert({ recipient_type, status, ... })
```
But this table is one of the **12 missing tables** — it lives only in `supabase/migrations/005_telegram_notifications.sql` (root, never pushed).

**Impact:** Every notification log write fails silently (wrapped in try/catch). Admin can never verify "did the client actually receive the Telegram approval notice?" — a real dispute-resolution gap.

**Fix:** Push migration 005 to live DB (tracked in `backend-schema-and-forms`).

### Issue O29: No `last_login` / `last_active` Tracking (MEDIUM)

**Problem:** No migration adds `last_login` or `last_active` to `users`.

**Impact:** Cannot detect stale/abandoned accounts or suspicious inactivity. Compliance audits often ask "when did this user last access the system?"

**Fix:** Add `last_login timestamptz` column, update on signin via Supabase trigger or app-level `logAudit`.

### Issue O30: Audit Metadata Lacks Before/After Diff (MEDIUM)

**Problem:** `logAudit` calls record `summary` + `metadata`, but `metadata` does **not** capture the old and new field values (e.g., `before: {status: 'draft'}, after: {status: 'published'}`).

**Impact:** For forensic disputes ("the client says they never approved this"), the audit trail cannot show what the value *changed from*. Only that an action happened.

**Fix:** Extend `logAudit` usage to include `{ before, after }` in metadata for update operations.

## Fix Strategy (Supplement)

| Phase | Action |
|-------|--------|
| 1 | Add forensic columns to `audit_log` |
| 2 | Create `ai_usage_logs` table + wrapper |
| 3 | Add `logAudit` to file upload/delete |
| 4 | Route client approvals through an audited API |
| 5 | Enable `pg_stat_statements` |
| 6 | Add feature flag table + helper |
| 7 | Create `lib/logger.ts` with levels |
| 8 | Log 401/403 as security events |
| 9 | Add DB trigger audit backstop on critical tables |
| 10 | Push `telegram_notification_logs` migration |
| 11 | Add `last_login` column + tracking |
| 12 | Add before/after diff to `logAudit` metadata |

## Prioritization

**Must fix:** O20 (AI cost), O22 (client approval audit), O21 (file audit)
**Should fix:** O19 (forensics), O23 (DB perf)
**Nice to have:** O24, O25, O26
