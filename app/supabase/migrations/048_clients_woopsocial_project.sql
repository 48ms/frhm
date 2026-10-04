-- Migration 048: Add woopsocial_project_id to clients for bridge tenant isolation
--
-- The publish cron fetches all social accounts under one WoopSocial API key and
-- must never mix accounts between clients. Each client has a unique WoopSocial
-- project ID stored here; cron reads it per-post and scopes bridge calls to the
-- correct project.
--
-- If the column is NULL the post will be skipped (fail-safe), so the bridge
-- never publishes on behalf of a client it can't identify.

alter table public.clients
  add column if not exists woopsocial_project_id text null;

comment on column public.clients.woopsocial_project_id is
  'WoopSocial project ID used for publishing; NULL means the client is not yet connected to the bridge.';

create index if not exists clients_woopsocial_project_idx on public.clients(woopsocial_project_id) where woopsocial_project_id is not null;
