# Tasks: Storage & Schema Security Fixes (Consolidated)

## Phase 1: Consolidate Migrations & Schema (CRITICAL) — 3 hrs
- [x] Move 6 root migrations to `app/supabase/migrations/` (done via migration 036 consolidation)
- [x] Resolve duplicate `campaigns` definitions (merged in previous session)
- [x] Add `client_id` (UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE) to `kols`, `tasks`, `content_assets`, `platform_posts` (verified present)
- [x] Remove empty root `supabase/migrations/` (done in previous session)

## Phase 2: Add RLS & Triggers (CRITICAL) — 2 hrs
- [x] Add `ENABLE ROW LEVEL SECURITY` to `platform_posts`, `content_items`, `campaigns` (verified all RLS=True)
- [x] Add tenant-scoped policies (`client_id = current_user_client_id() OR is_admin()`) to all tables (verified via pg_policies)
- [x] Add `update_updated_at_column()` trigger to `kols`, `tasks`, `brand_assets`, `content_items`, `content_assets`, `platform_posts`, `campaigns` (all verified present)

## Phase 3: Add Indexes (MEDIUM) — 0.5 hr
- [x] Create index on `client_id` for `content_assets`, `platform_posts`, `content_items`, `tasks`, `kols`, `brand_assets` (all verified present)

## Phase 4: Secure Storage & Uploads (HIGH) — 2 hrs
- [x] Change `brand_assets` bucket to `public = false`
- [x] Add tenant-scoped RLS to `storage.objects` (verify `auth.uid()` vs `client_id` mapping)
- [x] Update `brand-asset-hub.tsx`:
  - [x] Replace `Math.random()` with `crypto.randomUUID()`
  - [x] Replace `getPublicUrl()` with `createSignedUrl()` (bucket is private)

## Phase 5: Resolve Dual Systems (HIGH) — 3 hrs
- [x] `platform_posts`: 0 rows, `scheduled_posts`: active table — no merge needed in production
- [x] `content_items` & `content_assets`: both 0 rows, no data to merge
- [x] Update `approval-board.tsx` to include `.eq('client_id', clientId)` check (fixed in client/approvals/page.tsx — defense-in-depth on content_assets + platform_posts)

## Phase 6: Verification — 1 hr
- [ ] `npx tsc --noEmit` passes
- [ ] Apply migrations via Management API
- [ ] Verify `explain analyze` shows index usage on `client_id`
- [ ] Test Storage RLS: Client A cannot access Client B's private assets
- [ ] Test Upload API: rejects invalid MIME types (e.g., `.html` as `.png`)
- [ ] Delete `-v2` files from change directory
- [ ] Archive change