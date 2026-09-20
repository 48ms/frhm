-- 024_scheduled_posts_traceability.sql
-- Add traceability links from scheduled_posts to production tasks and skill outputs

ALTER TABLE public.scheduled_posts
ADD COLUMN IF NOT EXISTS production_id UUID REFERENCES public.content_productions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS skill_output_id UUID REFERENCES public.skill_outputs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_production_id ON public.scheduled_posts(production_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_skill_output_id ON public.scheduled_posts(skill_output_id);