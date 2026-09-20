-- The publishing bridge's credentials — global, not per client.
--
-- tools/integrations/woopsocial.md: "Auth keys are created in the WoopSocial dashboard → API
-- (app.woopsocial.com/api-access). API/MCP access is on the paid plans." One key belongs to one
-- WoopSocial account; which clients publish is decided by the projects/accounts inside it. So
-- the key is a single global setting, not a column on every client.
--
-- "The API key is a production credential — it can publish, delete, and change account
-- settings. Treat the ?api_key= URL as a secret; never paste it into shared chats or commit it
-- anywhere." It lives in this table, read only by the server, and is never sent to the browser.
--
-- No project/account IDs are stored here either: woopsocial.md says "Project and account
-- identifiers are surfaced automatically — discover them, don't ask the user to paste IDs."
-- They are fetched live, not cached, so they cannot go stale.

create table if not exists bridge_config (
  id          text primary key default 'woopsocial',  -- one row today; the bridge's name
  api_key     text,                                    -- secret; never exposed to the client
  enabled     boolean not null default false,
  -- last Health check result, so the UI can show connectivity without calling the API on render
  last_ok_at       timestamptz,
  last_error       text,
  last_checked_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

insert into bridge_config (id) values ('woopsocial')
on conflict (id) do nothing;

create or replace function touch_bridge_config()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_bridge_config_touch on bridge_config;
create trigger trg_bridge_config_touch
  before update on bridge_config
  for each row execute function touch_bridge_config();

alter table bridge_config enable row level security;

-- Admin-only, and only through the server (service role / admin session). The API key must never
-- reach a client browser or a non-admin user. No anon/client-user policy is created on purpose.
drop policy if exists bridge_config_admin_all on bridge_config;
create policy bridge_config_admin_all on bridge_config
  for all using (public.is_admin()) with check (public.is_admin());
