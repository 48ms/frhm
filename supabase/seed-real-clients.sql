-- Content Productions for real clients (Taraju + Pawon Sengon)
INSERT INTO public.content_productions (client_id, title, platform, stage, priority, assignee, due_date, assets, notes)
VALUES
  ('44b48931-a33e-470a-9f3e-9064ee46373f', 'Foto Produk Arabika', 'instagram', 'editing', 'high', 'Studio', NOW() + INTERVAL '3 days', '[{"name": "draf-foto", "url": "#"}]'::jsonb, 'Riset lighting'),
  ('44b48931-a33e-470a-9f3e-9064ee46373f', 'Video Roastery Tour', 'youtube', 'shooting', 'urgent', 'Bima', NOW() + INTERVAL '2 days', '[]'::jsonb, 'Syuting 27 Sep'),
  ('29e127c8-6289-4f88-a2d6-dd4311dd2cba', 'Resep Card Sambal', 'instagram', 'design', 'normal', 'Studio', NOW() + INTERVAL '5 days', '[{"name": "v1", "url": "#"}]'::jsonb, 'Menunggu approval');

-- Post Metrics for the 4 scheduled posts (auto-generated)
INSERT INTO public.post_metrics (post_id, client_id, platform, views, reach, likes, comments, shares, saves, clicks)
SELECT 
  sp.id,
  sp.client_id,
  sp.platform,
  (random() * 15000 + 3000)::int,
  (random() * 8000 + 2000)::int,
  (random() * 300 + 50)::int,
  (random() * 80 + 10)::int,
  (random() * 40 + 5)::int,
  (random() * 25 + 3)::int,
  (random() * 150 + 20)::int
FROM public.scheduled_posts sp;
