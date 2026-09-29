-- 044_skill_outputs_production.sql
-- Link skill_outputs to content_productions for task-scoped AI generation.
-- This enables the "Review" badge workflow: AI output -> draft -> user approve -> task advance.
--
-- NOTE: `deliverable_id` already exists (017) and points at public.deliverables.
-- This is a SEPARATE link: an AI output can be attached to a Kanban production task
-- without being a client-facing deliverable. Hence a new column, not a reuse.

ALTER TABLE public.skill_outputs
  ADD COLUMN IF NOT EXISTS production_id UUID REFERENCES public.content_productions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS skill_outputs_production_idx ON public.skill_outputs(production_id);

COMMENT ON COLUMN public.skill_outputs.production_id IS 'Optional link to the Kanban production task this output was generated for';
