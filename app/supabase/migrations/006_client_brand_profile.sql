-- Migration: 006_client_brand_profile.sql
-- Gives every client a workspace: a brand profile (jsonb) that mirrors the
-- shape the social-media-skills `brand-profile` skill produces, so the 106
-- marketing skills have shared brand context per client.
--
-- Shape of the jsonb:
--   { who, audience, voice, pov, proof, guardrails, pillars: string[] }

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS brand_profile jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Fast lookup / future search on profile fields
CREATE INDEX IF NOT EXISTS clients_brand_profile_gin
  ON public.clients USING gin (brand_profile);
