# Tasks: Observability & Audit Trail

> Status verified against actual code and live DB (2026-09-21).

## Phase 1: Missing audit calls — ✅ DONE
- [x] `POST /api/admin/deliverables/[id]/send` → **logAudit present**
- [x] `POST /api/admin/scheduled-posts` → **logAudit present**
- [x] `POST /api/cron/publish` → **writes audit_log directly** (line 119)
- [x] `GET /api/cron/daily-insight` → **logAudit present**

## Phase 2: Error boundaries — ✅ DONE
- [x] `app/admin/error.tsx` → **EXISTS**
- [x] `app/client/error.tsx` → **EXISTS**
- [x] `app/error.tsx` → **EXISTS** (root-level)

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

## Phase 5: Sentry — ❌ NOT DONE (blocked by npm install decision)
- [ ] `@sentry/nextjs` in package.json → **NOT INSTALLED**
- [ ] Sentry init in layout → **MISSING**

## Phase 6: Session management — ❌ NOT DONE (no route exists)
- [ ] `POST /api/admin/clients/[id]/revoke-sessions` → **ROUTE DOES NOT EXIST**

## Phase 7: Audit log cleanup — ❌ BLOCKED (immutability conflict)
- [ ] Cron: `DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '90 days'` → **IMPOSSIBLE**
- **Reason**: Migration 039 `audit_log_immutable_delete` trigger blocks ALL DELETE on audit_log (forensic requirement)

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

## Phase 11: Systematic RLS audit (2026-09-21)

### Bug class found & fixed this round:

| # | Bug | Route | Empirical proof | Fix |
|---|-----|-------|----------------|-----|
| 1 | `users` POST INSERT conflicts with `handle_new_user()` trigger | `api/admin/users` POST | 409 `duplicate key users_pkey` | Use `.upsert({...}, {onConflict: 'id'})` |
| 2 | `users` GET missing `email` + `last_sign_in_at` fields | `api/admin/users` GET | Screenshot: blank column, API returned no email | Enrich from `auth.admin.listUsers()` via service-role |
| 3 | `client/me` DELETE audit_log INSERT fails (403 RLS) | `api/client/me` DELETE | 403 `new row violates RLS policy for table "audit_log"` | Use service-role client (`srv`) instead of cookie-client |
| 4 | `auth.admin.*` operations need service-role | `api/admin/users/*` | 400 `requires a valid Bearer token` | Import `@supabase/supabase-js` + `SUPABASE_SERVICE_ROLE_KEY` |
| 5 | `Input`/`Textarea` missing `forwardRef` breaks 9 forms | `components/ui/input.tsx`, `textarea.tsx` | Browser: `"Function components cannot be given refs"` | Wrap with `React.forwardRef` |
| 6 | `z.number()` rejects string input from `<input type="number">` | 4 marketing modals | `Invalid input: expected number, received string` | Change to `z.coerce.number()` + `zodResolver(schema as any)` |

### Verified SAFE (not bugs):
- ✅ `admin/clients/[id]` PATCH — admin JWT **can** update `clients` (RLS allows)
- ✅ `client/assets` brand_assets INSERT — admin JWT can insert (RLS allows)
- ✅ `client/approvals` platform_posts UPDATE — client JWT **cannot** cross-client (RLS blocks, rows=0)
- ✅ `skill_outputs` — already uses service-role in approve/revision routes
- ✅ `admin/clients/[id]/skills/bulk-run` — both `skill_outputs` INSERT and `client_skills` UPSERT work with admin JWT
- ✅ Analytics routes (`analytics_summaries`, `post_metrics`, `analytics_predictions`, `competitor_benchmarks`) — all columns match schema, all writes work with admin JWT
- ✅ `client/feedback` INSERT — works (RLS allows)
- ✅ `client/deliverables/[id]/comments` INSERT — works (RLS allows via SECURITY DEFINER trigger)

### RLS policy summary (empirically verified):
- **Admin JWT** can read/write most tables directly (no RLS block for admin operations)
- **Client JWT** can READ their own data but **cannot** write to `clients`, `users`, `audit_log`, or cross-client resources
- Tables where client write is blocked by RLS: `users`, `audit_log`, `skill_outputs`, `scheduled_posts` (cross-client), `client_skills` (cross-client)
- Tables where client write is allowed: `brand_assets`, `feedback`, `deliverable_comments`, `platform_posts` (own client only via RLS filter)

## Key architectural notes:
- `handle_new_user()` trigger (migration 003) auto-creates `public.users` row on auth.user creation → always use `.upsert()` not `.insert()` for user profile
- `audit_log` is immutable (migration 039) → retention deletion impossible; logs grow unbounded
- `last_login` column does NOT exist in any migration or live DB → use Supabase Auth native `last_sign_in_at` instead
- Service-role client pattern (documented): import `createClient` from `@supabase/supabase-js`, pass `SUPABASE_SERVICE_ROLE_KEY`
