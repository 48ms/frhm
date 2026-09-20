# Multi-Client Dashboard

Admin dashboard answers "what needs me right now, per client" without opening each workspace.

## Per-client cards

Each card carries the client's name, skill progress (`done/total` + bar), deliverable counts by
state, last activity date and a **Buka** button into the workspace. Revisions are called out
because they are the state that actually needs admin work.

The header carries a **Tambah client** button: the empty state already linked to the client list,
but once clients existed there was no way to add another from the dashboard.

## Client-side brand label

The client dashboard prints the **client's own name** above the greeting. The greeting alone shows
the person's name, which says nothing about which account they are reviewing — confusing as soon
as one contact handles two clients.

> **Naming warning.** `clients.name` is the *customer's* brand, not this product's name. "Taraju"
> is currently a client row and a test account, so it reads as the customer brand in the UI. Do
> not surface it as if it were the SaaS's own branding.

## Layout (`/admin/dashboard`)

1. **Deliverable stat cards** — totals by status across all clients (unchanged).
2. **Action strip** (`ActionStrip`) — the three counts that decide the next move:
   - *Menunggu review client* — deliverables in `sent`
   - *Perlu revisi dari kamu* — `revision_requested` (admin must act)
   - *Disetujui, siap publish* — `approved`
3. **Client panels** (`ClientOverview`) — one card per client:
   - pipeline progress bar (`selesai` / total `client_skills`) with `n/m · %`
   - three counts: menunggu review · minta revisi · siap publish
   - a revision badge on the header when the client is waiting on the admin
   - last activity date and a **Buka** button to the client workspace
4. **Deliverable Terbaru** + **Aktivitas Terbaru** — unchanged.

## Data

Three extra queries, aggregated in JS (no N+1, no per-client round trip):

| query | used for |
|---|---|
| `clients` (id, name, contact_email) | the panels themselves |
| `client_skills` (client_id, status) | progress numerator/denominator |
| `deliverables` (client_id, status, updated_at) | the three counts + last activity |

Counts are bucketed into `Map`s keyed by `client_id`, then joined in one pass.

## Accessibility notes

- `NumberTicker` renders a hidden 0-9 digit column for the roll animation; the real value lives
  in an `sr-only` span. Verified: screen-reader values read `4, 1, 0, 3, 0` for the five stat
  cards. Not a bug — do not "fix" the extra digits.
- **Buka** is a `<Link>` wrapping a `<Button>`. It navigates correctly (verified), but prefer
  linking the card title on any future panel to avoid a nested interactive element.

## Verified

- Two clients listed: **Taraju** 106/106 · 100% with 3 siap publish; **Pawon Sengon** 0/0 · 0%.
- Action strip: 0 review · 0 revisi · 3 siap publish.
- **Buka** opens the client workspace.
