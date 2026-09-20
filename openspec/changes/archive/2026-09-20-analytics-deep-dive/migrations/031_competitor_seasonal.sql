-- Migration 031: Competitor Benchmarks & Seasonal Intelligence (Phase 2)

-- 1. Table competitor_benchmarks
CREATE TABLE IF NOT EXISTS competitor_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  brand_name text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'facebook', 'linkedin', 'twitter')),
  avg_reach integer DEFAULT 0,
  avg_er numeric(5,2) DEFAULT 0.00,
  weekly_posts integer DEFAULT 0,
  notes text,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Index for client lookups
CREATE INDEX IF NOT EXISTS idx_competitor_benchmarks_client_id ON competitor_benchmarks(client_id);

-- 2. Table seasonal_periods
CREATE TABLE IF NOT EXISTS seasonal_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  category text DEFAULT 'general',
  impact_multiplier numeric(3,2) DEFAULT 1.00,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Seed default seasonal periods (Ramadan, Lebaran, Back to School, Harbolnas, Natal/Tahun Baru)
INSERT INTO seasonal_periods (name, start_date, end_date, category, impact_multiplier, notes)
VALUES
  ('Ramadan & Lebaran 2026', '2026-02-18', '2026-03-22', 'religious_fnb', 1.40, 'Lonjakan F&B, hampers, baju muslim'),
  ('Back to School 2026', '2026-06-15', '2026-07-15', 'education_retail', 1.20, 'Promosi alat tulis, perlengkapan sekolah'),
  ('Harbolnas 9.9 - 12.12', '2026-09-09', '2026-12-12', 'ecommerce', 1.50, 'Peak season promo tanggal kembar'),
  ('Natal & Tahun Baru 2026', '2026-12-20', '2027-01-05', 'holiday_fnb', 1.35, 'Liburan, staycation, hampers akhir tahun')
ON CONFLICT DO NOTHING;
