-- 018_audit_log.sql
--
-- One place to answer "who did what, when". status_history only covers deliverable status
-- flips; this covers everything the dashboard can do that a client or an auditor would ask
-- about: publishing, sending to client, approvals, revisions, password resets, onboarding,
-- bulk skill runs.
--
-- Rows are append-only by convention (no UPDATE/DELETE policies are granted to app roles).

create table if not exists public.audit_log (
  id           uuid primary key default uuid_generate_v4(),
  actor_id     uuid references auth.users(id) on delete set null,
  actor_role   text,                       -- 'admin' | 'client' — snapshot, survives role changes
  actor_name   text,                       -- snapshot so the row still reads after a rename
  action       text not null,              -- stable verb, e.g. 'deliverable.publish'
  entity_type  text,                       -- 'deliverable' | 'client' | 'skill_output' | ...
  entity_id    uuid,
  client_id    uuid references public.clients(id) on delete set null,
  summary      text not null,              -- human sentence shown in the UI
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists audit_log_created_at_idx
  on public.audit_log (created_at desc);

create index if not exists audit_log_client_created_idx
  on public.audit_log (client_id, created_at desc);

create index if not exists audit_log_entity_idx
  on public.audit_log (entity_type, entity_id);

alter table public.audit_log enable row level security;

-- admins read everything
drop policy if exists admin_read_audit_log on public.audit_log;
create policy admin_read_audit_log on public.audit_log
  for select using (public.is_admin());

-- a client reads only rows that concern their own account
drop policy if exists client_read_own_audit_log on public.audit_log;
create policy client_read_own_audit_log on public.audit_log
  for select using (client_id = public.current_user_client_id());

-- Inserts go through service-role writes in API routes; no direct INSERT policy for app roles,
-- so a client cannot forge an audit row from the browser.

comment on table public.audit_log is
  'Append-only trail of consequential actions. Written by API routes (service role) and read by admin UI.';
