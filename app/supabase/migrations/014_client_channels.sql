-- Client channels — the publishing bridge's per-client connection state.
--
-- The repo is explicit about where channels live and what the dashboard may claim:
--
--   AGENTS.md, ground truth 1: "Skills route publishing through a scheduling bridge; its
--   canonical capability surface lives in tools/integrations/woopsocial.md — treat that guide
--   as the source of truth."
--
--   AGENTS.md, ground truth 2: "The bridge publishes/schedules only: it has no analytics
--   surface and does not generate or edit media."
--
--   woopsocial.md: "Social Accounts — list connected accounts and their platform-specific
--   options, and connect NEW accounts via oauth_create_authorization ... Project and account
--   identifiers are surfaced automatically — discover them, don't ask the user to paste IDs."
--
-- So the bridge OWNS the connection: it holds the OAuth grant and the account IDs. This table
-- must NOT store credentials, tokens, or account IDs — storing any of those would duplicate
-- the source of truth and drift. It records only what the dashboard needs to gate a stage and
-- tell the admin what to do next:
--
--   * which platform/handle this client publishes to (declared in the repo's own
--     brand-profile.md "## Channels" section — that document stays the source of truth; rows
--     here mirror it so the UI can render a per-account checklist),
--   * whether the bridge reports that account as connected, and when that was last confirmed,
--   * the human-side note (e.g. "belum login", "menunggu OAuth").
--
-- Confirmation is NOT a column. AGENTS.md, ground truth 4 — "Nothing is scheduled, published,
-- or deleted without explicit user confirmation" — is a per-action consent, given at publish
-- time, never a standing flag. A stored "approved = true" would violate it.

create table if not exists client_channels (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  platform    text not null,                    -- instagram | tiktok | youtube | ...
  handle      text,                             -- '@taraju___' — may be null until known
  status      text not null default 'belum',    -- belum | terhubung | gagal
  note        text,                             -- human-side note shown in the checklist
  -- when the bridge last confirmed this account (Health / Social Accounts listing). NULL means
  -- "never confirmed" — the UI must not show it as connected until this is set.
  confirmed_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (client_id, platform)
);

create index if not exists client_channels_client_idx on client_channels(client_id);

-- status is a closed set; a typo'd status would silently unlock the Publish stage.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'client_channels_status_check'
  ) then
    alter table client_channels
      add constraint client_channels_status_check
      check (status in ('belum', 'terhubung', 'gagal'));
  end if;
end $$;

-- "terhubung" is only meaningful with a confirmation time; otherwise the row claims a
-- connection nobody verified. This is the DB enforcing ground truth 2's "don't fake success"
-- one level down.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'client_channels_confirmed_check'
  ) then
    alter table client_channels
      add constraint client_channels_confirmed_check
      check (status <> 'terhubung' or confirmed_at is not null);
  end if;
end $$;

-- keep updated_at honest on the channel rows
create or replace function touch_client_channels()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_client_channels_touch on client_channels;
create trigger trg_client_channels_touch
  before update on client_channels
  for each row execute function touch_client_channels();

alter table client_channels enable row level security;

-- Admins manage every client's channels; a client user sees only their own. Uses the
-- SECURITY DEFINER helpers from 002_rls_policies.sql — subquerying `users` inside a policy
-- causes "infinite recursion detected in policy" (see the note at the top of that file).
drop policy if exists client_channels_admin_all on client_channels;
create policy client_channels_admin_all on client_channels
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists client_channels_client_read on client_channels;
create policy client_channels_client_read on client_channels
  for select using (client_id = public.current_user_client_id());
