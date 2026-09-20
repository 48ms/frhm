# Tasks: Storage & Schema Security Fixes (Consolidated)

## Phase 1: Consolidate Migrations & Schema (CRITICAL) — 3 hrs
- [ ] Move 6 root migrations to `app/supabase/migrations/`
- [ ] Resolve duplicate `campaigns` definitions
- [ ] Add `client_id` (UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE) to `kols`, `tasks`, `content_assets`, `platform_posts`
- [ ] Remove empty root `supabase/migrations/`

## Phase 2: Add RLS & Triggers (CRITICAL) — 2 hrs
- [ ] Add `ENABLE ROW LEVEL SECURITY` to `platform_posts`, `content_items`, `campaigns`
- [ ] Add tenant-scoped policies (`client_id = current_user_client_id() OR is_admin()`) to all tables
- [ ] Add `update_updated_at_column()` trigger to `kols`, `tasks`, `brand_assets`, `content_items`, `content_assets`, `platform_posts`, `campaigns`

## Phase 3: Add Indexes (MEDIUM) — 0.5 hr
- [ ] Create index on `client_id` for `content_assets`, `platform_posts`, `content_items`, `tasks`, `kols`, `brand_assets`

## Phase 4: Secure Storage & Uploads (HIGH) — 2 hrs
- [ ] Change `brand_assets` bucket to `public = false`
- [ ] Add tenant-scoped RLS to `storage.objects` (verify `auth.uid()` vs `client_id` mapping)
- [ ] Update `brand-asset-hub.tsx`:
  - Replace `Math.random()` with `crypto.randomUUID()`
  - Replace `getPublicUrl()` with `createSignedUrl()`
  - Add file size limit validation
- [ ] Create API route for uploads to enforce server-side MIME/type validation (mitigate spoofing/XSS)

## Phase 5: Resolve Dual Systems (HIGH) — 3 hrs
- [ ] Merge or align `platform_posts` and `scheduled_posts`
- [ ] Merge or align `content_items` and `content_assets`
- [ ] Update `approval-board.tsx` to include `.eq('client_id', clientId)` check

## Phase 6: Verification — 1 hr
- [ ] `npx tsc --noEmit` passes
- [ ] Apply migrations via Management API
- [ ] Verify `explain analyze` shows index usage on `client_id`
- [ ] Test Storage RLS: Client A cannot access Client B's private assets
- [ ] Test Upload API: rejects invalid MIME types (e.g., `.html` as `.png`)
- [ ] Delete `-v2` files from change directory
- [ ] Archive change