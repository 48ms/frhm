-- Seed ad_spend_logs & kols for real clients (Taraju + Pawon Sengon)
-- Referenced by components/campaigns/campaigns-board.tsx (KPI 3/4 + Assigned Talent)

-- KOLs (kolaborator) per klien
INSERT INTO public.kols (client_id, name, niche, contact_info, rate_card, platforms, notes)
VALUES
  ('44b48931-a33e-470a-9f3e-9064ee46373f', 'Rani Kopi', 'Kopi & Kuliner', 'rani@example.com', 3500000, ARRAY['instagram','tiktok'], 'Reviewer single origin'),
  ('44b48931-a33e-470a-9f3e-9064ee46373f', 'Barista Bagas', 'Coffee Education', 'bagas@example.com', 2500000, ARRAY['youtube'], 'Konten edukasi roasting'),
  ('29e127c8-6289-4f88-a2d6-dd4311dd2cba', 'Dapur Bunda Ika', 'Masakan Rumahan', 'ika@example.com', 4200000, ARRAY['instagram','tiktok','youtube'], 'Cocok untuk resep warisan');

-- Ad spend logs (telemetri iklan berbayar)
INSERT INTO public.ad_spend_logs (client_id, campaign_name, spend, clicks, log_date)
VALUES
  ('44b48931-a33e-470a-9f3e-9064ee46373f', 'Kampanye Specialty Arabika 2026', 1500000, 4200, NOW() - INTERVAL '3 days'),
  ('44b48931-a33e-470a-9f3e-9064ee46373f', 'Kampanye Specialty Arabika 2026', 1750000, 5100, NOW() - INTERVAL '1 day'),
  ('29e127c8-6289-4f88-a2d6-dd4311dd2cba', 'Promo Paket Hantaran & Gathering', 980000, 2600, NOW() - INTERVAL '2 days'),
  ('29e127c8-6289-4f88-a2d6-dd4311dd2cba', 'Eksplorasi Resep Sambal Warisan', 620000, 1900, NOW() - INTERVAL '5 days');
