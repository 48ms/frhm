# Tasks: Client Quick Onboarding

## 1. Shared Dialog & Store

- [x] 1.1 Create `components/client/create-client-dialog.tsx` extracting the existing dialog from `app/app/admin/clients/page.tsx`, exposing `open`, `onOpenChange`, and `onCreated` props — verify the file compiles (`npx tsc --noEmit`) and renders no form duplication in `page.tsx`.
- [x] 1.2 Add a lightweight client store/context (`components/client/create-client-provider.tsx`) exposing `openCreateClient()` — verify `tsc` passes and the provider is mounted once in `app/app/admin/layout.tsx`.
- [x] 1.3 Refactor `app/app/admin/clients/page.tsx` to consume the shared dialog and store — verify the existing "Client Baru" and empty-state "Buat Client Pertama" buttons still open the dialog and creating a client still refreshes the list.

## 2. Smart Form Fields

- [x] 2.1 Add form fields: niche (dropdown: F&B, Fashion, Personal Brand, B2B/Corporate, E-Commerce, Retail, Other), target audience, core products/services, USP — verify all fields render and only `name` blocks submission.
- [x] 2.2 Add client-side validation (name required) with a visible error message — verify submitting an empty name shows the error and does not fire the request.

## 3. API Orchestration

- [x] 3.1 Extend `POST /api/admin/clients` to accept `niche`, `target_audience`, `products`, `usp` while remaining backward compatible when they are absent — verify an old-shape payload (name only) still returns 201.
- [x] 3.2 Add a `NICHE_PACK_MAP` constant (niche → pack slugs, always including `social-media-starter-kit`) in a shared module — verify the map covers every niche option in the form.
- [x] 3.3 After client + auth user creation, synthesize `brand-profile.md` using `resolveProvider` + `chatJson` with a foundation-skills prompt and write it to `client_files` (`path = 'brand-profile.md'`) — verify a created client with niche data has a non-empty `brand-profile.md` row.
- [x] 3.4 Seed `client_skills` from `NICHE_PACK_MAP` with status `belum`, upserting on `(client_id, skill_id)` to avoid duplicates — verify a created F&B client has starter-kit + platform growth skills assigned.
- [x] 3.5 Implement graceful degradation: if no provider or the LLM fails, keep the client and return `brandProfileGenerated: false` with a reason — verify creating a client with no AI provider configured still returns 201 with the flag false.

## 4. Entry Points

- [x] 4.1 Add a `+` action button to the `CLIENTS` group header in `components/app-sidebar.tsx` wired to `openCreateClient()` — verify clicking it from `/admin/dashboard` opens the dialog without navigation.
- [x] 4.2 Add a `NavMain` action-slot prop (or equivalent) so group headers can render the `+` button — verify other groups render unchanged.
- [x] 4.3 Register a "Tambah Client Baru" command in `components/admin-command-search.tsx` — verify pressing Ctrl+K, typing "Tambah Client", and selecting it opens the dialog.

## 5. Verification

- [x] 5.1 Run `npx tsc --noEmit` and `npm run build` — verify both exit 0.
- [x] 5.2 Add/adjust an E2E test covering: sidebar `+` → fill form → submit → client appears with generated brand profile — verify the test passes.
- [x] 5.3 Confirm Batch Automations (`/admin/automations`) lists the new client as eligible (`hasBrandProfile = true`) — verify the checkbox is enabled for the created client.
- [x] 5.4 Run `openspec validate client-quick-onboarding --strict` — verify the change validates with no errors.
