
# Fix Silent-Fail RLS Writes for Client User

## Background
Several client-facing API routes perform database writes using the anonymous Supabase client.  
The `users`, `clients`, and `skill_outputs` tables have SELECT-only RLS policies for client users:

- `users` → `user_own_profile FOR SELECT`
- `clients` → `client_own_client FOR SELECT`  
- `skill_outputs` → `so_client_own FOR SELECT`

**Impact:** Client JWT UPDATE/INSERT returns `[]` (0 rows) but the routes reported `success: true`.

## Fixes
| Route | Original Bug | Fix |
|-------|--------------|-----|
| `/api/telegram/preferences` | client UPDATE `clients` = 0 rows | use service-role client |
| `/api/client/deliverables/:id/approve` | client UPDATE `skill_outputs` = 0 rows | use service-role client |
| `/api/client/deliverables/:id/revision` | client UPDATE `skill_outputs` = 0 rows | use service-role client |
| `/api/client/me` DELETE | client UPDATE `users` = 0 rows | use service-role client |
| `/api/telegram/disconnect` | client UPDATE `clients` = 0 rows | use service-role client |

## Proof (E2E)
- `skill_outputs` draft → approved persisted (verified via service-role read-back)
- `clients.telegram_notifications_enabled` flipped persisted (True → False → True)
- Playwright: **23/23 tests pass**
- `npx tsc --noEmit` → 0 errors
- `npx next build` → clean

## Files Modified
- `app/app/api/telegram/preferences/route.ts`
- `app/app/api/client/deliverables/[id]/approve/route.ts`
- `app/app/api/client/deliverables/[id]/revision/route.ts`
- `app/app/api/client/me/route.ts`
- `app/e2e/client-approve-revision.spec.ts` (new)
- `app/e2e/client-settings-telegram.spec.ts` (new)

## Related
All RLS policies verified against live DB via service-role queries. No new migration required.
