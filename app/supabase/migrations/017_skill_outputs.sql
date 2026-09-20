-- 017_skill_outputs.sql
-- Where the work of the 101 non-Foundation skills is kept.
--
-- The repo is explicit that only Foundation skills write workspace files (brand-profile.md, voice.md,
-- …), and that the rest "draft, the human judges". That is fine for a single working session, but a
-- dashboard has to show the work again later — for the admin, and for the client who approves it.
-- `client_files` has no room for that (5 fixed filenames, one version each), and `client_skills.notes`
-- is a note column, not a store: an output can be long, and a skill can produce one per run.
--
-- So each produced artefact gets a row here, grouped by the stage and skill it came from, and can
-- later be promoted into a `deliverable` to send to the client.

CREATE TABLE IF NOT EXISTS public.skill_outputs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  skill_id      text NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  -- Denormalised from the stage the skill belongs to, so the Hasil tab can group without a join
  -- through skill_groups (a skill can sit in several groups; a stage is unambiguous).
  stage         text,
  title         text NOT NULL,
  content       text NOT NULL,
  -- draft → the admin may send it; sent/approved/revisi mirror deliverables so the two agree.
  status        text NOT NULL DEFAULT 'draft',
  -- Set once the output is sent to the client as a deliverable; null while it is just admin-side work.
  deliverable_id uuid REFERENCES public.deliverables(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS skill_outputs_client_idx ON public.skill_outputs (client_id);
CREATE INDEX IF NOT EXISTS skill_outputs_skill_idx ON public.skill_outputs (client_id, skill_id);
CREATE INDEX IF NOT EXISTS skill_outputs_stage_idx ON public.skill_outputs (client_id, stage);

ALTER TABLE public.skill_outputs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS so_admin_all ON public.skill_outputs;
DROP POLICY IF EXISTS so_client_own ON public.skill_outputs;
-- Admin (service role / admin role) sees everything; a client sees only their own outputs.
CREATE POLICY so_admin_all ON public.skill_outputs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );
CREATE POLICY so_client_own ON public.skill_outputs
  FOR SELECT USING (client_id = current_user_client_id());
