# Client Onboarding & Notifications

How a client goes from "admin creates them" to "reviewing deliverables", and how they get told
when something needs their attention. Built on Supabase auth + Postgres realtime — no extra
services.

## 1. Admin creates a client

`POST /api/admin/clients` (`app/api/admin/clients/route.ts`)

- Admin opens **Client → Client Baru**, fills name + (optional) email/phone.
- Name is required. If an email is given, the route also provisions the login:

  1. Insert row in `clients` (name, contact_email, contact_phone).
  2. `admin.auth.admin.createUser({ email, password: <random 12>, email_confirm: true })`
     with `user_metadata: { role: 'client', full_name: name }`. The existing
     `on_auth_user_created` trigger (migration 003) seeds `public.users` from that metadata.
  3. Link `public.users.client_id = <new client id>`.
  4. Return `credentials: { email, password }` **once**.

- **Rollback on failure**: if the auth user or the link fails, the just-created `clients` row is
  deleted. A client without a login is worse than no client.
- The UI shows a one-time "Akun client dibuat" dialog with the email + password. Copy it and hand
  it to the client out-of-band. It is never stored in plaintext and cannot be shown again.

Password generation lives in the route as `genPassword()` — 12 chars from an unambiguous
alphabet (no `0/O/1/l/I`), via `crypto.getRandomValues`.

## 2. Admin resets a client password

`POST /api/admin/clients/[id]/reset-password`

- Finds the auth user via `users.client_id → id`. **Do not** `select('email')` from `users`
  (that column doesn't exist there) — the auth email comes from
  `admin.auth.admin.getUserById(id)`.
- Generates a fresh random password with `auth.admin.updateUserById`. The old one stops working
  immediately.
- Returns `{ email, password }` once; the workspace dialog shows it with a "save it now" warning.
- UI: **Reset Password** button in the client workspace header (`app/admin/clients/[id]/workspace.tsx`).

## 3. Client login + dashboard

- Login page: `app/auth/login/page.tsx` (`/auth/login`). Email/password or Google (Google is
  skipped for now).
- Client area is gated by `app/client/layout.tsx`: anonymous → `/auth/login`; admins are bounced
  to `/admin/dashboard`.
- `deliverables.client_id` references `clients.id`, **not** the auth user id. Always resolve it
  through `users.client_id` first (see `app/client/deliverables/[id]/page.tsx` for the pattern).

## 4. Notifications

Two mechanisms, both keyed on deliverable status:

### Sidebar badge (server-rendered)
`app/client/layout.tsx` counts the client's `deliverables` with `status = 'sent'` and passes
`pendingCount` to `AppSidebar`. `components/nav-main.tsx` renders it as a pill on the
"Deliverable Saya" item.

### Realtime refresh
`components/client/deliverable-notifier.tsx` subscribes to
`postgres_changes` on `deliverables` filtered by `client_id`. On a status change it calls
`router.refresh()`, so the sidebar badge and dashboard counters update with no manual reload.

Requires `deliverables` in the `supabase_realtime` publication (Supabase enables this for
tracked tables; verify in Database → Replication if a badge ever lags).

## 5. Client pipeline view

`GET /client/pipeline` (`app/client/pipeline/page.tsx`) — read-only progress.

- Reads `pipeline_stages` (7 rows, migration 010), `skills` (with `.stage`), and this client's
  `client_skills.status` (`belum` / `jalan` / `selesai`).
- Shows an overall progress bar (`done skills / all skills`) plus one card per stage with its own
  bar and a status-icon grid of the stage's skills.
- No write actions — clients watch, admins drive.

## Pitfalls hit while building this

- **`users` has no `email` column** — selecting it throws. Use the auth admin API for emails.
- **`deliverables.client_id` ≠ auth uid** — resolve via `users.client_id`.
- **`AppSidebar` props must be destructured** to be in scope (a type-only declaration is not
  enough — `pendingCount` was undefined until added to the destructuring list).
- **`let` vs `const`** on an object that is only mutated (not reassigned) trips
  `prefer-const`; use `const`.
