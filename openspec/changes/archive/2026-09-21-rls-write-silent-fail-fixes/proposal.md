# Fix Silent-Fail RLS Writes for Client User

## Background

Several client-facing API routes perform database writes using the anonymous Supabase client.
The `users`, `clients`, and `skill_outputs` tables have **SELECT-only** RLS policies for client users:

| Table | Policy | Command |
|-------|--------|---------|
| `users` | `user_own_profile` | FOR SELECT |
| `clients` | `client_own_client` | FOR SELECT |
| `skill_outputs` | `so_client_own` | FOR SELECT |

**Impact:** Client JWT UPDATE/INSERT returns `[]` (0 rows) but the route returns `success: true` — silent failure.

## Root Cause Discovery

Each bug was identified by running behavioral tests against the live DB with a real client JWT:

```python
# Example: client JWT UPDATE on `clients` table
headers = {
    'apikey': PUB_KEY,
    'Authorization': f'Bearer {CLIENT_JWT}',
    'Prefer': 'return=representation'
}
# PATCH to clients table → returns [] (0 rows affected)
# But the route reported {ok: true, enabled: false}
```

**Verification method:** Service-role read-back compared before/after state. If the value changed, the fix worked.

## Fixes Applied (5 routes)

| Route | What it writes | Policy blocked | Fix applied | E2E proof |
|-------|---------------|----------------|-------------|-----------|
| `/api/telegram/preferences` (PATCH) | `clients.telegram_notifications_enabled` | `client_own_client` FOR SELECT | use `createAdminClient()` after ownership check | DB: True→False→True persisted |
| `/api/client/deliverables/:id/approve` (POST) | `skill_outputs.status = approved` | `so_client_own` FOR SELECT | use `createAdminClient()` after ownership check | DB: draft→approved persisted |
| `/api/client/deliverables/:id/revision` (POST) | `skill_outputs.status = revision_requested` | `so_client_own` FOR SELECT | same helper `patchSkillOutputsByDeliverable()` | same as approve |
| `/api/client/me` (DELETE, GDPR) | `users.full_name=null, client_id=null` | `user_own_profile` FOR SELECT | use `createAdminClient()` after auth check | DB: `full_name=null, client_id=null` persisted |
| `/api/telegram/disconnect` (POST, type=client) | `clients.telegram_chat_id=null, telegram_username=null, telegram_notifications_enabled=false` | `client_own_client` FOR SELECT | use `createAdminClient()` after ownership check | DB: all 3 fields cleared → None |

## Design Decision: Service-Role Bypass vs Migration

We chose to add a service-role helper (`createAdminClient(url, SERVICE_ROLE_KEY)`) rather than adding an RLS policy because:

1. The write is already gated by an ownership check (`users.client_id === req.body.id`) or admin role check
2. Adding `FOR UPDATE` policy on `clients` would expose the table to wider write access
3. The service role is scoped to a single route path, not table-wide
4. Management API token is expired — cannot apply migration anyway

**Security note:** The service-role bypass is safe because:
- Authenticated user is verified first (`auth.getUser()`)
- Ownership is verified (`users.client_id === body.id` or `profile.role === 'admin'`)
- The service-role query is scoped to the same `WHERE id = ?` predicate
- The pattern is documented in code comments

## Verification

```bash
npx tsc --noEmit       # 0 errors
npx next build         # clean
npx playwright test e2e/   # 24/24 pass
```

E2E tests added:
- `app/e2e/client-settings-telegram.spec.ts` — patch + DB read-back
- `app/e2e/client-approve-revision.spec.ts` — POST + DB read-back  
- `app/e2e/client-telegram-disconnect.spec.ts` — POST + DB read-back

## Files Modified
- `app/app/api/telegram/preferences/route.ts`
- `app/app/api/client/deliverables/[id]/approve/route.ts`
- `app/app/api/client/deliverables/[id]/revision/route.ts`
- `app/app/api/client/me/route.ts`
- `app/app/api/telegram/disconnect/route.ts`
- `app/e2e/client-approve-revision.spec.ts` (new)
- `app/e2e/client-settings-telegram.spec.ts` (new)
- `app/e2e/client-telegram-disconnect.spec.ts` (new)

## Related Audit Findings (confirmed safe)

- All 67 API routes were scanned for auth guards — only `health` (intentionally public) and `trends/radar` (no client data) lack guard
- `scheduled_posts`, `client_skills`, `ai_usage_logs` — all written from admin-routed or service-role contexts ✅
- `feedback` INSERT — has `Client create feedback FOR INSERT WITH CHECK (client_id = current_user_client_id())` ✅
- `brand_assets` INSERT/UPDATE — has `Client own brand_assets FOR ALL` ✅
- `deliverable_comments` INSERT — works through view + SECURITY DEFINER trigger ✅
