-- SQL Migration untuk Modul Dashboard (Supabase / PostgreSQL)

-- 1. Buat Tabel `dashboard_profiles`
CREATE TABLE IF NOT EXISTS public.dashboard_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.social_clients(id) ON DELETE CASCADE,
    greeting TEXT NOT NULL,
    velocity INTEGER NOT NULL,
    peak_label TEXT NOT NULL,
    peak_value TEXT NOT NULL,
    charts JSONB NOT NULL DEFAULT '{}'::jsonb,
    insights JSONB NOT NULL DEFAULT '[]'::jsonb,
    metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Row Level Security (RLS)
ALTER TABLE public.dashboard_profiles ENABLE ROW LEVEL SECURITY;

-- Policy Publik untuk membaca (Sesuaikan dengan kebutuhan Auth)
CREATE POLICY "Enable read access for all authenticated users" ON public.dashboard_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for all authenticated users" ON public.dashboard_profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for all authenticated users" ON public.dashboard_profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 4. Insert Data Awal (Faktual)
-- Menghapus data lama jika ada, agar insert idempotik
DELETE FROM public.dashboard_profiles WHERE client_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

INSERT INTO public.dashboard_profiles (client_id, greeting, velocity, peak_label, peak_value, charts, insights, metrics)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'B2B Shell',
    98,
    'Peak: Friday +34%',
    '248.5K',
    '{
      "7d": {
        "reach": "M0,150 C70,130 130,60 210,95 C290,130 370,40 450,75 C530,110 580,30 600,45",
        "engage": "M0,175 C90,155 160,115 240,135 C320,150 400,95 480,105 C550,115 580,85 600,95"
      },
      "30d": {
        "reach": "M0,165 C80,140 140,50 220,90 C300,130 380,30 460,70 C540,110 580,20 600,40",
        "engage": "M0,180 C90,160 160,110 240,130 C320,150 400,90 480,100 C550,110 580,80 600,90"
      },
      "90d": {
        "reach": "M0,175 C60,150 120,120 200,80 C280,45 360,60 440,35 C520,15 580,25 600,20",
        "engage": "M0,185 C80,175 150,150 230,140 C310,128 390,105 470,95 C550,85 585,70 600,65"
      }
    }'::jsonb,
    '[
      { "label": "TOP PERFORMING FORMAT", "value": "Short Reels", "sub": "8.4x retention multiplier" },
      { "label": "VIRAL DRIFT SCORE", "value": "94 / 100", "sub": "Algorithmic favoritism high" },
      { "label": "AUDIENCE REACTION", "value": "98.2% Positive", "sub": "Sentiment peak" }
    ]'::jsonb,
    '[
      { "label": "Aggregate Reach", "value": "4.5M", "delta": "+18.2%", "trend": "up", "spark": [40, 55, 48, 70, 62, 85, 92] },
      { "label": "Engagement Rate", "value": "6.8%", "delta": "+0.9pt", "trend": "up", "spark": [50, 48, 60, 58, 72, 70, 80] },
      { "label": "Content Velocity", "value": "42 / wk", "delta": "+7", "trend": "up", "spark": [30, 45, 42, 55, 60, 66, 74] },
      { "label": "Inbound Inquiries", "value": "318", "delta": "-4.1%", "trend": "down", "spark": [80, 74, 78, 66, 70, 62, 58] }
    ]'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'E2E Wizard',
    87,
    'Peak: Wednesday +21%',
    '182.3K',
    '{
      "7d": {
        "reach": "M0,140 C70,150 130,90 210,110 C290,120 370,60 450,85 C530,105 580,55 600,60",
        "engage": "M0,170 C90,160 160,130 240,140 C320,150 400,110 480,120 C550,125 580,95 600,100"
      },
      "30d": {
        "reach": "M0,150 C80,130 140,80 220,70 C300,60 380,85 460,55 C540,35 580,50 600,45",
        "engage": "M0,175 C90,165 160,140 240,120 C320,110 400,125 480,95 C550,80 580,90 600,85"
      },
      "90d": {
        "reach": "M0,170 C60,155 120,110 200,95 C280,80 360,70 440,50 C520,35 580,40 600,30",
        "engage": "M0,185 C80,170 150,145 230,130 C310,115 390,110 470,90 C550,75 585,80 600,70"
      }
    }'::jsonb,
    '[
      { "label": "TOP PERFORMING FORMAT", "value": "Dev Tutorials", "sub": "6.1x retention multiplier" },
      { "label": "VIRAL DRIFT SCORE", "value": "88 / 100", "sub": "Strong technical virality" },
      { "label": "AUDIENCE REACTION", "value": "96.4% Positive", "sub": "Developer sentiment high" }
    ]'::jsonb,
    '[
      { "label": "Aggregate Reach", "value": "3.1M", "delta": "+12.7%", "trend": "up", "spark": [35, 42, 50, 55, 60, 68, 78] },
      { "label": "Engagement Rate", "value": "5.2%", "delta": "+0.4pt", "trend": "up", "spark": [45, 50, 48, 58, 62, 60, 68] },
      { "label": "Content Velocity", "value": "31 / wk", "delta": "+3", "trend": "up", "spark": [28, 34, 40, 44, 50, 52, 58] },
      { "label": "Inbound Inquiries", "value": "214", "delta": "+6.8%", "trend": "up", "spark": [40, 46, 52, 50, 62, 70, 76] }
    ]'::jsonb
  );
