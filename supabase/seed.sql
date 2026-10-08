-- SEED DATA OPERATIONAL (FAKTUAL) - IDEMPOTENT

-- 0. Cleanup (Delete data lama agar tidak error conflict)
-- Hapus sesuai urutan foreign key dependency
DELETE FROM public.post_metrics;
DELETE FROM public.content_productions;
DELETE FROM public.scheduled_posts;

-- 1. Masukkan data 'clients'
INSERT INTO public.clients (id, name, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'B2B Shell Reps', now()),
  ('22222222-2222-2222-2222-222222222222', 'Wizard Corp', now())
ON CONFLICT (id) DO NOTHING;

-- 2. Scheduled Posts
INSERT INTO public.scheduled_posts (client_id, title, content, platform, status, scheduled_at, notes)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Q4 Product Launch', 'Exciting things coming!', 'Instagram', 'scheduled', NOW() + INTERVAL '3 days', 'Hero campaign post'),
  ('11111111-1111-1111-1111-111111111111', 'Team Update', 'Behind the scenes.', 'TikTok', 'draft', NOW() + INTERVAL '1 day', 'Needs review'),
  ('22222222-2222-2222-2222-222222222222', 'Dev Tutorial: Edge Functions', 'Learn to use edge functions.', 'YouTube', 'scheduled', NOW() + INTERVAL '5 days', '');

-- 3. Content Productions
INSERT INTO public.content_productions (client_id, title, platform, stage, priority, assignee, due_date, assets, notes)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Hero Video Assets', 'instagram', 'editing', 'high', 'Bima', NOW() + INTERVAL '7 days', '[{"name": "Draft 1", "url": "#"}]'::jsonb, 'Waiting for client assets'),
  ('22222222-2222-2222-2222-222222222222', 'Q4 Tech Roadmap', 'youtube', 'ready', 'normal', 'Studio', NOW() - INTERVAL '2 days', '[]'::jsonb, '');

-- 4. Post Metrics (Analytics)
INSERT INTO public.post_metrics (post_id, client_id, platform, views, reach, likes, comments, shares, saves, clicks)
SELECT 
  id,
  client_id,
  platform,
  (random() * 10000 + 2000)::int, 
  (random() * 5000 + 1000)::int, 
  (random() * 200 + 50)::int, 
  (random() * 50 + 10)::int, 
  (random() * 30 + 5)::int, 
  (random() * 20 + 2)::int, 
  (random() * 100 + 10)::int
FROM public.scheduled_posts;
