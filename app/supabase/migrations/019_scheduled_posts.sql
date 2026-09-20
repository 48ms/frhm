-- 019_scheduled_posts.sql
--
-- Calendar view & content queue schedule table.
-- Holds the target publication time, target platform, and status.

CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deliverable_id  UUID REFERENCES public.deliverables(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  content         TEXT NOT NULL DEFAULT '',
  platform        TEXT NOT NULL,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'cancelled')),
  published_at    TIMESTAMPTZ,
  external_post_id TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scheduled_posts_client_idx ON public.scheduled_posts (client_id);
CREATE INDEX IF NOT EXISTS scheduled_posts_scheduled_at_idx ON public.scheduled_posts (client_id, scheduled_at);

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sp_admin_all ON public.scheduled_posts;
CREATE POLICY sp_admin_all ON public.scheduled_posts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS sp_client_own ON public.scheduled_posts;
CREATE POLICY sp_client_own ON public.scheduled_posts
  FOR SELECT USING (client_id = public.current_user_client_id());
