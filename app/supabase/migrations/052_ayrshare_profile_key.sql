-- Migration 052: Replace WoopSocial with Ayrshare Profile Key
--
-- We are migrating our Social Media API Aggregator from WoopSocial to Ayrshare.
-- Each client will have an isolated profile in Ayrshare, identified by a profileKey.

alter table public.clients rename column woopsocial_project_id to ayrshare_profile_key;

comment on column public.clients.ayrshare_profile_key is
  'Ayrshare profileKey for multi-tenant publishing isolation. NULL means no Ayrshare profile generated yet.';
