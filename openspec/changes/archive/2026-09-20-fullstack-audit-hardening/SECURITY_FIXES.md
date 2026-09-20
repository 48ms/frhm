# Security Fixes Summary (2026-09-20)

## Vulnerabilities Found and Fixed

| Route | Issue | Fix | Verified |
|-------|-------|-----|----------|
| `/api/admin/seasonal-periods` | Only `getUser()` — client could access | Changed to `requireAdmin()` | client → 403 ✅ |
| `/api/admin/deliverable-templates` | Only `getUser()` — client could access | Changed to `requireAdmin()` | client → 403 ✅ |
| `/api/admin/deliverables/[id]` | Only `getUser()` — client could PATCH title & reset status | Changed to `requireAdmin()` | client → 403 ✅ |
| `/api/admin/ai/providers` | Only `getUser()` — client could read/write | Changed to `requireAdmin()` | client → 403 ✅ |

## How Verification Was Done

1. Logged in as **client user** (`taraju.test.4fd43222@gmail.com`)
2. Sent GET/PATCH requests with **client cookie** to each route
3. All returned **HTTP 403 "Hanya admin"** (previously returned 200)

## What Was NOT Changed

- `feedback` table RLS policy — verified correct (`with_check` restricts INSERT to own client)
- RLS on `deliverables` table — client UPDATE policy uses `client_id = current_user_client_id()` (correct)
- Routes that correctly use `requireAdmin()` — left unchanged

## Notes

- `deliverable_comments` view (SECURITY DEFINER) — already fixed in previous change via API route
- `skill_outputs` RLS — uses `so_admin_all` (EXISTS users role=admin) + `so_client_own` (correct)
- All audit logs still work; `actorRole: 'admin'` now correct (matches actual access)
