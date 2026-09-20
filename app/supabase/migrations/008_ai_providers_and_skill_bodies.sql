-- Migration: 008_ai_providers_and_skill_bodies.sql
-- Two additions:
--   1. ai_providers      : pluggable LLM endpoints (gemini / anthropic / openai / custom 9router)
--   2. skills.body + references : the FULL original SKILL.md so a skill can be used
--      verbatim as a prompt. The repo stays the source of truth; this is a read-only copy.

CREATE TABLE IF NOT EXISTS public.ai_providers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label       text NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('gemini','anthropic','openai','custom')),
  model       text NOT NULL,
  base_url    text,                          -- custom / 9router endpoint
  api_key     text,                          -- stored server-side only (RLS: admin only)
  is_default  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- only one default at a time
CREATE UNIQUE INDEX IF NOT EXISTS ai_providers_one_default
  ON public.ai_providers (is_default) WHERE is_default;

CREATE TABLE IF NOT EXISTS public.skill_files (
  skill_id    text NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  path        text NOT NULL,                 -- 'SKILL.md' or 'references/<name>.md'
  content     text NOT NULL,                 -- verbatim file content
  PRIMARY KEY (skill_id, path)
);

ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_files  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aip_admin_all ON public.ai_providers;
DROP POLICY IF EXISTS skillfiles_read ON public.skill_files;

-- API keys must never reach the browser: admin-only, all verbs.
CREATE POLICY aip_admin_all ON public.ai_providers
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY skillfiles_read ON public.skill_files
  FOR SELECT TO authenticated USING (true);
