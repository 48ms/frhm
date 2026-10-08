-- Insert factual dashboard_profiles for real clients (no more hardcoded defaults)
INSERT INTO public.dashboard_profiles (client_id, greeting, velocity, peak_label, peak_value, metrics, insights)
VALUES
  ('44b48931-a33e-470a-9f3e-9064ee46373f',
   'Selamat datang, Taraju.',
   37,
   'Peak Engagement',
   '3.7%',
   '{"audience_size":10261,"engagement_rate":3.7,"total_reach":10261,"total_views":19201,"total_engagement":379}'::jsonb,
   '[{"label":"Reach stabil +3.7% ER","sub":"Faktual"}]'::jsonb),
  ('29e127c8-6289-4f88-a2d6-dd4311dd2cba',
   'Selamat datang, Pawon Sengon.',
   77,
   'High Engagement',
   '7.7%',
   '{"audience_size":7153,"engagement_rate":7.7,"total_reach":7153,"total_views":11688,"total_engagement":554}'::jsonb,
   '[{"label":"ER kuat 7.7% - komunitas aktif","sub":"Faktual"}]'::jsonb);
