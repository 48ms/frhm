-- 026_feedback_form.sql
-- Feedback form from clients after deliverable review or campaign end

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES public.deliverables(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Admin can view all feedback
CREATE POLICY "Admin view feedback" ON public.feedback FOR ALL USING (public.is_admin());

-- Clients can insert their own feedback (via their portal login)
CREATE POLICY "Client create feedback" ON public.feedback FOR INSERT WITH CHECK (
  client_id = (SELECT client_id FROM public.users WHERE id = auth.uid())
);

-- Clients can view their own feedback
CREATE POLICY "Client view own feedback" ON public.feedback FOR SELECT USING (
  client_id = (SELECT client_id FROM public.users WHERE id = auth.uid())
);

-- Seed with 'NPS style' question template comment
INSERT INTO public.feedback (client_id, deliverable_id, rating, title, comment, status)
SELECT
  c.id,
  NULL, -- general feedback, not tied to specific deliverable
  3,
  'Tanya Umum Kepuasan',
  'Kami ingin tahu tingkat kepuasan Anda terhadap hasil kerja kami. Silakan berikan rating 1-5 dan komentar pendapat Anda.',
  'pending'
FROM public.clients c
WHERE c.name IN ('Taraju', 'Pawon Sengon')
ON CONFLICT DO NOTHING;