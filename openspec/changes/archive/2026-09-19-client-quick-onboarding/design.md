# Design: Client Quick Onboarding

## Context

See `proposal.md` for motivation. Current state that shapes the approach:

- **Client creation** lives in a page-scoped dialog inside `app/app/admin/clients/page.tsx`; the form is a 3-field object (`name`, `contact_email`, `contact_phone`) and the POST goes to `app/app/api/admin/clients/route.ts`.
- The API already provisions the Supabase auth user (`admin.auth.admin.createUser`), links `public.users.client_id`, rolls back the `clients` row on failure, and writes an audit entry via `logAudit`.
- **Brand profile** is a client file (`brand-profile.md`) read by `loadClientFiles(supabase, clientId)` and consumed by `app/app/api/admin/clients/[id]/generate-campaign/route.ts`. Batch Automations refuses clients that lack it (`hasBrandProfile` gate in `app/app/admin/automations/page.tsx`).
- **AI access** is centralized: `resolveProvider(supabase, provider_id)` + `chatJson<T>(provider, systemPrompt, messages)` in `lib/ai/`. Existing route `generate-campaign` is the reference pattern for prompt → validated JSON → DB insert.
- **Skills catalogue**: `skills`, `skill_packs`, `pack_skills`, `client_skills` tables (migration 007). 106 skills / 17 packs, seeded by `app/scripts/seed_skills.py`.
- **Sidebar** (`components/app-sidebar.tsx`) renders grouped `NavItem`s via `NavMain`; `NavMain` has no action slot in group headers today.
- **Command palette** (`components/admin-command-search.tsx`) already lists searchable navigation entries.

## Goals / Non-Goals

**Goals:**
- One reusable `CreateClientDialog` usable from the clients page, the sidebar, and the command palette.
- A 5-field smart form (name + niche + target audience + products + USP) that stays under ~60 seconds to complete.
- On submit: create the client, generate `brand-profile.md` via foundation skills, assign starter + niche skill packs — in one server round-trip with a clear success/failure surface.
- Keep the existing rollback guarantee (no client row without a usable state).

**Non-Goals:**
- No full multi-step wizard or rich text editing of the generated profile (editing stays in Client Setup).
- No change to the 106-skill catalogue or pack definitions themselves.
- No per-client AI provider selection in the onboarding form (uses the admin default provider).
- Not redesigning the clients list page layout.

## Decisions

### D1: Extract `<CreateClientDialog>` as a shared client component
Move the dialog out of `clients/page.tsx` into `components/client/create-client-dialog.tsx`, exposing `open`, `onOpenChange`, and `onCreated` props.
- *Why*: the sidebar and command palette need to mount the same dialog without duplicating form/validation logic.
- *Alternative considered*: URL-driven modal (`?new=1`) — rejected because the sidebar is rendered outside the route segment that would own the param, and it forces a navigation.

### D2: Single global mount point for the dialog
Mount one `CreateClientDialog` in the admin layout and drive it from a tiny client store (React context or a lightweight event emitter) so sidebar `+` and palette both just call `openCreateClient()`.
- *Why*: avoids N dialogs and keeps state consistent.
- *Alternative considered*: each trigger owns its own dialog instance — simpler but duplicates fetch/refresh handling and can double-mount.

### D3: Extend the POST payload with marketing fields, keep the API as the orchestrator
`POST /api/admin/clients` accepts `{ name, contact_email, contact_phone, niche, target_audience, products, usp }`. After the client row + auth user are created, the route runs brand-profile synthesis and skill seeding.
- *Why*: keeps the "create + provision + seed" transaction-ish flow in one place with the existing rollback, rather than a second client-side call that could leave a half-onboarded client.
- *Alternative considered*: client-side chained calls (create → generate → assign). Rejected: more failure surfaces, no rollback, slower perceived UX.

### D4: Brand profile generation reuses the `resolveProvider` + `chatJson` pipeline
Synthesize a markdown document from a prompt that instructs the model to apply the four foundation skills (brand-profile, audience-research, voice-builder, content-pillars) and return strict JSON `{ brand_profile_md: string }`. Persist to the client files store (`brand-profile.md`).
- *Why*: matches the proven pattern in `generate-campaign`; keeps output machine-parseable.
- *Trade-off*: one extra LLM call adds latency (~5–15s). Acceptable because it removes ~20 minutes of manual work.

### D5: Niche → skill pack mapping is a static table
A `NICHE_PACK_MAP` constant maps each niche to a list of pack slugs (always including `social-media-starter-kit`). Insert matching rows into `client_skills` with status `belum`.
- *Why*: deterministic, auditable, and easy to extend without a schema change.
- *Alternative considered*: let the AI choose packs — rejected as non-deterministic and harder to test.

### D6: Graceful degradation if generation fails
If the LLM call fails or no provider is configured, the client row is **kept** (creation succeeded) and the response reports `brandProfileGenerated: false` with a reason; the dialog shows a non-blocking warning ("Client dibuat, tapi profil brand gagal digenerate — coba lagi di Client Setup").
- *Why*: a client without a brand profile is still usable; rolling back a successful creation over an AI hiccup would be worse UX.
- *Contrast*: auth-user creation failure still rolls back (a client with no login is worse than none).

## Risks / Trade-offs

- [LLM latency makes the create request slow] → Keep the existing `maxDuration` headroom, show a progress state in the dialog, and make the AI step non-fatal so a timeout still yields a usable client.
- [Model returns malformed JSON] → `chatJson` already validates/parses; on failure treat as D6 degraded path, never write a partial file.
- [Duplicate skill assignment] → `client_skills` inserts use upsert/ignore on `(client_id, skill_id)`.
- [New required fields could block quick creation] → Only `name` is hard-required; niche defaults to "Other" and audience/products/USP are optional, so the fast path still works.
- [Palette/sidebar need auth context] → The dialog and store live under the admin layout, which is already gated by `requireAdmin`.

## Migration Plan

1. Land the shared dialog + store and refactor `clients/page.tsx` to use it (no behavior change beyond fields).
2. Extend the API payload and add brand-profile synthesis + skill seeding behind the new fields (backward compatible: absent fields → old behavior).
3. Add the sidebar `+` action and the palette command.
4. No DB schema migration required (uses existing `clients`, `client_skills`, and files store).
- **Rollback**: revert the commit; existing clients and previously generated profiles are untouched since the change is additive.

## Resolved Decisions

- **Brand profile storage**: `client_files` table (`client_id`, `path`, `content`), read back by `loadClientFiles` in `lib/ai/server.ts`. Write `path = 'brand-profile.md'`. No Supabase Storage bucket needed.
