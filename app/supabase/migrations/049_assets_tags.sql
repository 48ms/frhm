-- 049_assets_tags.sql
-- Media Library batch tagging: add tags[] column + GIN index for tag filtering.

alter table public.assets
  add column if not exists tags text[] not null default '{}';

-- GIN index so tag containment filters (tags @> ARRAY['campaign']) stay fast.
create index if not exists assets_tags_gin_idx
  on public.assets using gin (tags);

-- Cover the standard client-scoped listing queries.
create index if not exists assets_client_tags_idx
  on public.assets (client_id);
