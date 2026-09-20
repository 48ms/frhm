# Tasks: Observability & Audit Trail Fixes

## Phase 1: Audit Coverage (15 routes) — 5 hrs
- [x] Add `logAudit({ action: 'user.create' })` to `POST /api/admin/users`
- [x] Add `logAudit({ action: 'user.delete' })` to `DELETE /api/admin/users/[id]`
- [x] Add `logAudit({ action: 'ai.provider.change' })` to `PATCH /api/admin/ai/providers`
- [x] Add `logAudit({ action: 'telegram.disconnect' })` to `POST /api/telegram/disconnect`
- [x] Add `logAudit({ action: 'telegram.preferences' })` to `PATCH /api/telegram/preferences`
- [x] Add `logAudit({ action: 'client.delete' })` to `DELETE /api/admin/clients/[id]`
- [x] Add `logAudit({ action: 'competitor.delete' })` to `DELETE /api/admin/clients/[id]/competitors`
- [x] Add `logAudit({ action: 'skill.delete' })` to `DELETE /api/admin/clients/[id]/skills`
- [x] Add `logAudit({ action: 'deliverable.delete' })` to `DELETE /api/admin/deliverables/[id]`
- [ ] Add `logAudit({ action: 'deliverable.send' })` to `POST /api/admin/deliverables/[id]/send`
- [x] Add `logAudit({ action: 'deliverable.create' })` to `POST /api/admin/deliverables`
- [ ] Add `logAudit({ action: 'scheduled_post.create' })` to `POST /api/admin/scheduled-posts`
- [ ] Add `logAudit({ action: 'publish' })` to `POST /api/cron/publish`
- [ ] Add `logAudit({ action: 'daily_insight' })` to `GET /api/cron/daily-insight`
- [x] Add `logAudit({ action: 'auth.signin' })` to `/auth/callback/route.ts` login handler

## Phase 2: Error Handling (10 routes) — 3 hrs
- [x] Create `app/error.tsx` (ErrorBoundary for all pages)
- [ ] Create `app/admin/error.tsx` (errorBoundary for admin)
- [ ] Create `app/client/error.tsx` (errorBoundary for client)
- [ ] Add `ErrorBoundary` wrapper in `app/layout.tsx`
- [ ] Fix `app/admin/deliverables/new/page.tsx` catch block → alert

## Phase 3: Rate Limiting (11 routes) — 3 hrs
- [ ] Add rate limit middleware to `POST /api/admin/clients`
- [ ] Add rate limit middleware to `PATCH /api/admin/clients/[id]`
- [ ] Add rate limit middleware to `POST /api/admin/users`
- [ ] Add rate limit middleware to `PATCH /api/admin/users/[id]`
- [ ] Add rate limit middleware to `POST /api/admin/ai/run`
- [ ] Add rate limit middleware to `POST /api/admin/deliverables`
- [ ] Add rate limit middleware to `POST /api/admin/scheduled-posts`
- [ ] Add rate limit middleware to `POST /api/admin/content-productions`
- [ ] Add rate limit middleware to `POST /api/admin/clients/[id]/reset-password`
- [ ] Add rate limit middleware to `POST /api/telegram/webhook`
- [ ] Add rate limit middleware to `POST /api/admin/bridge/connect`

## Phase 4: Health Check — 0.5 hr
- [ ] Create `GET /api/health` → returns `{ status: 'ok', uptime: 'xxx', timestamp: 'xxx' }`

## Phase 5: Error Tracking — 1 hr
- [ ] Add `@sentry/nextjs` to `package.json`
- [ ] Configure `sentry.client.config.js`
- [ ] Add Sentry initialization to `app/layout.tsx`

## Phase 6: GDPR Compliance — 1.5 hr
- [ ] Create `GET /api/client/me/export` → returns `{ client: ..., users: ..., deliverables: ..., skills: ... }` as JSON
- [ ] Create `DELETE /api/client/me` → soft-delete user (keep audit)

## Phase 7: Session Revocation — 0.5 hr
- [ ] Add `POST /api/admin/clients/[id]/revoke-sessions` (calls `supabase.admin.users.deleteById` or similar)

## Phase 8: Audit Log Retention — 0.5 hr
- [ ] Add cron cleanup: `DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '90 days'`

## Phase 9: Forensic Data (HIGH) — 1 hr
- [ ] Add `ip_address inet`, `user_agent text`, `request_id text` columns to `audit_log`
- [ ] Update `logAudit()` to accept and store IP/UA from request headers
- [ ] Backfill not required (new columns nullable)

## Phase 10: AI Usage Tracking (CRITICAL) — 2 hrs
- [ ] Surface `usage` (prompt_tokens/completion_tokens) from AI provider responses in `lib/ai/providers.ts`
- [ ] Create migration `ai_usage_logs` table (client_id, route, model, prompt_tokens, completion_tokens, cost_estimate, created_at)
- [ ] Create wrapper `logAiUsage()` called from every AI route
- [ ] Add index on `client_id` + `created_at`

## Phase 11: Client Action Auditing (HIGH) — 2 hrs
- [ ] Add `logAudit` to `brand-asset-hub.tsx` upload + delete (via API route)
- [ ] Route `approval-board.tsx` writes through an audited API route `/api/client/approvals`
- [ ] Add `action: 'client.approve'` / `'client.reject'` audit entries

## Phase 12: Infrastructure Observability (MEDIUM) — 1.5 hrs
- [ ] Enable `pg_stat_statements` extension
- [ ] Create `lib/logger.ts` with log levels (debug/info/warn/error)
- [ ] Replace `console.*` calls with `logger.*`
- [ ] Log 401/403 responses as security events

## Phase 13: Feature Flags (MEDIUM) — 1 hr
- [ ] Create `feature_flags` table (key, enabled, description)
- [ ] Create `isFeatureEnabled(key)` helper
- [ ] Use flag for auto-publish kill-switch

## Phase 14: Trigger-Based Audit Backstop (HIGH) — 2 hrs
- [x] Create `audit_row_change()` SECURITY DEFINER trigger function
- [x] Attach to critical tables: `users`, `clients`, `deliverables`, `scheduled_posts`, `platform_posts`
- [x] Trigger writes `action: 'db.<table>.update'` / `'db.<table>.delete'` with before/after metadata
- [x] Verify trigger does not break app writes (test insert/update/delete)

## Phase 15: Before/After Diff in logAudit (MEDIUM) — 1 hr
- [ ] For UPDATE operations, fetch old row before update
- [ ] Include `metadata: { before: {...}, after: {...} }` in `logAudit` calls

## Phase 16: last_login Tracking (MEDIUM) — 1 hr
- [ ] Add `last_login timestamptz` column to `users`
- [ ] Update on successful signin (auth callback or middleware)

## Phase 17: Verification — 1 hr
- [ ] `npx tsc --noEmit` passes
- [ ] Apply mutations: delete user, verify audit_log has row
- [ ] Test login: verify audit_log has signin row
- [ ] Test health: `/api/health` returns 200
- [ ] Test error boundary: render invalid JSON, see fallback UI
- [ ] Verify `ai_usage_logs` row after an AI call
- [ ] Verify client approval writes audit row
- [ ] Verify trigger fires on direct DB update (psql)
- [ ] Archive change
