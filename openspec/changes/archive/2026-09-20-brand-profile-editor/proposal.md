# Proposal: Brand Profile Editor

## Why
AI-generated `brand-profile.md` is a strong first draft, but agency admins consistently need the ability to fine-tune pillars, voice, and guardrails before the profile becomes the source of truth for content generation. Without an editor, admins either accept the AI output as-is (risking misaligned tone) or manually recreate the document in a text editor (wasting ~15 minutes per client). Adding an inline editor within the Client Workspace Foundation tab reduces iteration time from 15 minutes to under 2 minutes and keeps the brand profile as a living document that evolves with the brand.

## What Changes
- **Editor Component**: Build `<BrandProfileEditor />` as a reusable dialog that mounts inside the Client Workspace `Foundation` tab.
- **Pillar Adjustment**: Allow admins to adjust the 4 pillar percentage allocations (must sum to 100%) with live preview of how the change affects the `content-pillars` section of `brand-profile.md`.
- **Voice/Guardrails Toggle**: Add/remove Do's/Don'ts keywords with a simple textarea + add button.
- **Save Pipeline**: On save, the editor re-renders the full `brand-profile.md` markdown string and writes it to `client_files` via the existing `client_files` table + `upsert` pattern (same as the quick onboarding change).
- **Non-destructive**: Canceling edits returns the user to the previous `brand-profile.md` content without overwriting.

## Capabilities

### New Capabilities
- `client/brand-profile-editor`: Inline editor for `brand-profile.md` within the Client Workspace Foundation tab, enabling pillar percentage adjustment, voice/guardrails editing, and safe save/cancel pipeline.

### Modified Capabilities
- `client/quick-onboarding`: The brand-profile synthesis path now produces a file that is immediately editable via the new editor, rather than being final on generation.

## Impact
- **Frontend Components**:
  - `components/client/brand-profile-editor.tsx`: New dialog component with pillar sliders, voice/guardrails form, save/cancel.
  - `app/app/admin/clients/[id]/page.tsx`: Inject the editor into the Foundation tab UI.
  - `components/admin/global-automations-board.tsx`: No change needed (already gated by `hasBrandProfile`).
- **Backend & APIs**:
  - `app/app/api/admin/clients/[id]/generate-campaign/route.ts`: Existing brand-profile writing logic stays the same; the editor re-uses the same `client_files.upsert` pattern.
  - `lib/ai/server.ts` / `lib/onboarding/niche-packs.ts`: No changes needed.
- **Database**:
  - `client_files` table: `upsert` on `(client_id, path='brand-profile.md')` with new content on every save.
  - No schema migration required.