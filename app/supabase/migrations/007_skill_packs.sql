-- Migration: 007_skill_packs.sql
-- Brings the social-media-skills library (106 skills, 17 topic packs) into the
-- dashboard so each client can work from the same playbook.
--
-- skills       : catalogue of the 106 skills (global, shared across clients)
-- skill_packs  : the 17 topic packs, each grouping a set of skills
-- pack_skills  : join table pack <-> skill
-- client_skills: per-client assignment/tracking (which skills are in play)

CREATE TABLE IF NOT EXISTS public.skill_packs (
  id          text PRIMARY KEY,            -- slug, e.g. 'instagram-growth'
  name        text NOT NULL,
  description text,
  category    text,                        -- grouping label used in the UI
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.skills (
  id          text PRIMARY KEY,            -- slug, e.g. 'hook-writer'
  name        text NOT NULL,
  description text,
  category    text,                        -- foundation / planning / writing / ...
  job         text,                        -- the "what it does" one-liner
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pack_skills (
  pack_id  text NOT NULL REFERENCES public.skill_packs(id) ON DELETE CASCADE,
  skill_id text NOT NULL REFERENCES public.skills(id)      ON DELETE CASCADE,
  PRIMARY KEY (pack_id, skill_id)
);

CREATE TABLE IF NOT EXISTS public.client_skills (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  skill_id    text NOT NULL REFERENCES public.skills(id)  ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'belum' CHECK (status IN ('belum','jalan','selesai')),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, skill_id)
);

CREATE INDEX IF NOT EXISTS skills_category_idx      ON public.skills (category);
CREATE INDEX IF NOT EXISTS pack_skills_skill_idx    ON public.pack_skills (skill_id);
CREATE INDEX IF NOT EXISTS client_skills_client_idx ON public.client_skills (client_id);

-- RLS: catalogue is readable by any signed-in user; per-client rows follow the
-- usual admin-all / client-own rule.
ALTER TABLE public.skill_packs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_skills   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS packs_read   ON public.skill_packs;
DROP POLICY IF EXISTS skills_read  ON public.skills;
DROP POLICY IF EXISTS packskills_read ON public.pack_skills;
DROP POLICY IF EXISTS cs_admin_all ON public.client_skills;
DROP POLICY IF EXISTS cs_client_own ON public.client_skills;

CREATE POLICY packs_read      ON public.skill_packs   FOR SELECT TO authenticated USING (true);
CREATE POLICY skills_read     ON public.skills        FOR SELECT TO authenticated USING (true);
CREATE POLICY packskills_read ON public.pack_skills   FOR SELECT TO authenticated USING (true);

CREATE POLICY cs_admin_all ON public.client_skills
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY cs_client_own ON public.client_skills
  FOR SELECT TO authenticated
  USING (client_id = public.current_user_client_id());
