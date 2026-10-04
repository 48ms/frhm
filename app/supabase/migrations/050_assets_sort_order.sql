-- 050_assets_sort_order.sql
-- Media Library manual ordering: add sort_order so users can drag assets into a
-- deliberate sequence. Listings read ORDER BY sort_order ASC, created_at DESC, so
-- a freshly uploaded asset still lands on top until someone rearranges the grid.

alter table public.assets
  add column if not exists sort_order integer not null default 0;

-- Cover the ordered, client-scoped listing.
create index if not exists assets_client_sort_idx
  on public.assets (client_id, sort_order);
