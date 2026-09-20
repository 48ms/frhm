-- Migration: 010_pipeline_stages.sql
-- Records the repo's pipeline: 7 stages, and which stage each skill belongs to,
-- plus what each skill reads/writes. Sourced from the repo README ("How the skills
-- chain" + "Skill catalog"), not invented.

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  key         text PRIMARY KEY,          -- foundation | plan | create | media | publish | grow | measure
  label       text NOT NULL,
  description text,
  sort_order  int  NOT NULL
);

ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS stage      text REFERENCES public.pipeline_stages(key),
  ADD COLUMN IF NOT EXISTS reads_files  jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS writes_files jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS skills_stage_idx ON public.skills (stage);

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS stages_read ON public.pipeline_stages;
CREATE POLICY stages_read ON public.pipeline_stages FOR SELECT TO authenticated USING (true);

INSERT INTO public.pipeline_stages (key, label, description, sort_order) VALUES
  ('foundation', 'Foundation',        'Siapa brand, suaranya, audiensnya, strateginya. Semua skill konten baca ini dulu.', 1),
  ('plan',       'Plan',              'Pilar, ide, kalender, batch, campaign.', 2),
  ('create',     'Create',            'Nulis konten: hook, caption, script, post, carousel, angle.', 3),
  ('media',      'Media',             'Gambar, video, voice, musik, editing.', 4),
  ('publish',    'Publish',           'Validasi → konfirmasi → posting/jadwal.', 5),
  ('grow',       'Grow & Engage',     'Growth per platform, engagement, komunitas.', 6),
  ('measure',    'Measure & Recycle', 'Analitik, audit, eksperimen → balik ke Plan.', 7)
ON CONFLICT (key) DO UPDATE
  SET label = EXCLUDED.label, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;
