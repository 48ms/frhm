# Audit Log

Append-only trail of consequential actions, so "who did what, when" is answerable without
digging through other tables.

## Table

`audit_log` (migration `018_audit_log.sql`):

| column | note |
|---|---|
| `actor_id` / `actor_role` / `actor_name` | who — role and name are **snapshots**, so a row still reads correctly after a rename or role change |
| `action` | stable verb, e.g. `deliverable.publish`, `client.reset_password` |
| `entity_type` / `entity_id` | what it was done to |
| `client_id` | which client it concerns — drives the client-level RLS policy |
| `summary` | one human sentence, rendered in the UI |
| `metadata` | jsonb detail (title, platforms, failed skills, …) |
| `created_at` | when |

Indexes: `created_at desc`, `(client_id, created_at desc)`, `(entity_type, entity_id)`.

## Writing

`lib/audit/log.ts` → `logAudit(...)`. It uses the service role and **never throws**: a failed
log line must not fail the action it describes. Errors go to stderr only.

Call sites:

| action | route |
|---|---|
| `deliverable.publish` | `api/admin/deliverables/[id]/publish` |
| `deliverable.send` | `api/admin/clients/[id]/outputs/[outputId]/send` |
| `deliverable.approve` | `api/client/deliverables/[id]/approve` |
| `deliverable.revision_request` | `api/client/deliverables/[id]/revision` |
| `client.create` | `api/admin/clients` |
| `client.reset_password` | `api/admin/clients/[id]/reset-password` |
| `skill.bulk_run` | `api/admin/clients/[id]/skills/bulk-run` |

**Passwords are never logged.** `client.reset_password` and `client.create` record the email
only; the generated password exists solely in the HTTP response.

## Reading

`/admin/audit` — server component reads the table (RLS limits it to admins), resolves client
names in one extra query, and hands rows to `list.tsx`. The client component offers a segmented
filter (≤5 pills, per the design rules), a text search over summary/actor/client, and a timeline
list with per-action icons. Caps at the 300 most recent rows.

Sidebar entry: **Audit Log** (`HistoryIcon`).

## Security

- RLS: `admin_read_audit_log` (`is_admin()`), `client_read_own_audit_log`
  (`client_id = current_user_client_id()`).
- **No INSERT policy for app roles** — a browser session cannot forge history; rows are written
  only by the service role inside API routes.
- No UPDATE/DELETE policies: the table is append-only from the app's perspective.

Verified:

| check | result |
|---|---|
| anon read `audit_log` (PostgREST) | `0 rows` |
| anon read `clients` | `0 rows` |
| client visits `/admin/audit` | redirected to `/client/dashboard` |
| client calls admin export API | `403` |

## Related but separate

`status_history` predates this and still records deliverable status transitions via a DB trigger.
It is narrower (status only); `audit_log` covers intent and context. Both are kept — the trigger
keeps working even on writes that bypass the API.
