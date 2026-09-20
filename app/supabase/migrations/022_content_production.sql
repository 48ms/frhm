-- 022_content_production.sql
-- Content Production Board Layer: stages (Idea -> Script -> Shooting -> Editing -> Design -> Caption -> Review -> Ready)
-- Plus attachments / asset links per production card.

CREATE TABLE IF NOT EXISTS public.content_productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'instagram',
  stage TEXT CHECK (stage IN ('idea', 'script', 'shooting', 'editing', 'design', 'caption', 'review', 'ready')) NOT NULL DEFAULT 'idea',
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) NOT NULL DEFAULT 'normal',
  assignee TEXT,
  due_date TIMESTAMPTZ,
  assets JSONB DEFAULT '[]'::jsonb, -- array of {name, url}
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.content_productions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access content_productions" ON public.content_productions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Client read content_productions" ON public.content_productions
  FOR SELECT USING (
    client_id = (SELECT client_id FROM public.users WHERE id = auth.uid())
  );
