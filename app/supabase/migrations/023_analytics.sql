-- 023_analytics.sql
-- Analytics Layer: Tracking post performance and AI-generated summaries.

CREATE TABLE IF NOT EXISTS public.post_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  views INT DEFAULT 0,
  reach INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  saves INT DEFAULT 0,
  clicks INT DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id)
);

CREATE TABLE IF NOT EXISTS public.analytics_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_tag TEXT, -- link to campaign name
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  ai_insight TEXT,
  total_reach INT DEFAULT 0,
  total_engagement INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.post_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full post_metrics" ON public.post_metrics FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Client read post_metrics" ON public.post_metrics FOR SELECT USING (
  client_id = (SELECT client_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Admin full analytics_summaries" ON public.analytics_summaries FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Client read analytics_summaries" ON public.analytics_summaries FOR SELECT USING (
  client_id = (SELECT client_id FROM public.users WHERE id = auth.uid())
);
