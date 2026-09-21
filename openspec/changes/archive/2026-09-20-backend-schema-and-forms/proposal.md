# Proposal: Backend Schema & Forms Fix

## Overview
A deep dive fullstack audit revealed two critical systemic issues in the administrative and backend architecture that must be addressed immediately.

## Issue 1: Split Migration Pipeline (12 Missing Tables)
**Problem:**
The application references 44 tables, but only 32 exist in the Supabase database. 12 tables return 404 errors when queried.
The root cause is a **split migration pipeline**: 
- The app uses `app/supabase/migrations/` for its core schema.
- However, 6 migration files defining the 12 missing tables were placed in the project root at `supabase/migrations/` and were never pushed to the database.

**The 12 missing tables (defined in root migration files, never applied):**

| Migration File (root) | Missing Tables |
|----------------------|----------------|
| `005_telegram_notifications.sql` | `telegram_notification_logs` |
| `20260918071447_social_media_schema.sql` | `content_assets`, `platform_posts` |
| `20260918134807_fase_2_content_production.sql` | `tasks`, `kols`, `brand_assets`, `content_items` |
| `20260918141819_fase_3_erp_tables.sql` | `events`, `event_tasks`, `event_vendors`, `client_budgets`, `expenses`, `ad_spend_logs` |

**Affected client workspace tabs:**
- **Events tab** → `events`, `event_tasks`, `event_vendors`
- **Budget tab** → `client_budgets`, `expenses`
- **Ads tab** + **ROI tab** → `ad_spend_logs`, `expenses`
- **Assets tab** → `brand_assets`
- **Approvals page** (client portal) → `content_assets`, `platform_posts`

**Proposed Fix:**
1. Move the 6 migration files from `supabase/migrations/` to `app/supabase/migrations/`.
2. Rename them to maintain the sequential numbering (e.g., `036_...`, `037_...`).
3. Run `supabase db push` to apply them.
4. Delete the empty root `supabase/migrations/` folder to prevent future confusion.

## Issue 2: "Dead" Submission Forms
**Problem:**
Two critical administrative forms have extensive UI and validation but **do not save data**:
1. `CampaignForm` (`components/admin/campaign-form.tsx`): The `onSubmit` handler only calls `console.log` and redirects. Data is lost.
2. `ContentDraftForm` (`components/admin/content-draft-form.tsx`): The `onSubmit` handler only calls `console.log`.

**Proposed Fix:**
1. **CampaignForm**: Wire up the form to `POST /api/admin/clients/[id]/campaigns` (or create the endpoint if missing).
2. **ContentDraftForm**: Wire up the form to `POST /api/admin/content-productions` or the appropriate draft endpoint.
3. Add `toast` notifications for success/error states to replace silent failures.

## Issue 3: Event Workspace Board is a STUB (Not Implemented)
**Problem:**
`components/events/event-workspace-board.tsx` (2552 bytes) is a **placeholder**, not a working feature:
```tsx
// For now, placeholder UI since we haven't built the fetch logic
const events = [] // We will fetch this
...
<div className="p-4 border rounded-md">Rundown content goes here</div>
<div className="p-4 border rounded-md">Vendors content goes here</div>
<div className="p-4 border rounded-md">Post-Mortem content goes here</div>
```
Even after DB migration is pushed (Issue 1), the Event tab will still show an empty state because the component never fetches or renders real data.

**Proposed Fix:**
1. Implement `fetch(events)` from Supabase filtered by `client_id`.
2. Render the event list; on click, load `event_tasks` (checklist) and `event_vendors`.
3. Wire `CreateEventModal.onSuccess` to refresh the event list.

## Issue 4: Form Validation & Error-Handling Gaps (Quality)
**Problem:**
Deep-dive audit found 9 forms with missing validation and/or poor error handling (using `alert()` instead of inline errors/toasts):

| Component | Issue |
|-----------|-------|
| `components/analytics/analytics-board.tsx` | No validation + `alert()` |
| `components/feedback/feedback-board.tsx` | `alert()` for errors |
| `components/deliverable/comment-section.tsx` | No validation, no loading state |
| `components/admin/global-automations-board.tsx` | `alert()` for errors |
| `components/marketing/kol-crm-board.tsx` | Direct Supabase write + `alert()` |
| `app/admin/deliverables/new/page.tsx` | Direct Supabase write, no validation |
| `app/admin/deliverables/[id]/page.tsx` | `alert()` for errors |
| `components/client/brand-profile-editor.tsx` | `alert()` for errors |
| `app/admin/settings/users/page.tsx` | `alert()` for errors |

**Proposed Fix:**
1. Replace `alert()` with inline error state or `sonner` toast (already a project dependency).
2. Add zod validation to `deliverables/new` and `comment-section`.
3. Move direct Supabase writes behind API routes for proper auth/error handling.

## Total Estimated Effort
- DB Migration Fix (Issue 1): 30 minutes
- CampaignForm API wiring (Issue 2): 1.5 hours
- ContentDraftForm API wiring (Issue 2): 1.5 hours
- Event Workspace implementation (Issue 3): 3-4 hours
- Form quality fixes (Issue 4): 2-3 hours
**Total**: 9-11 hours
