-- SQL Migration untuk Modul Social Accounts (Supabase / PostgreSQL)

-- 1. Buat Tabel `social_clients`
CREATE TABLE IF NOT EXISTS public.social_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    initials TEXT NOT NULL,
    tagline TEXT
);

-- 2. Buat Tabel `social_accounts`
CREATE TABLE IF NOT EXISTS public.social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.social_clients(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- Instagram, TikTok, YouTube, dll.
    handle TEXT NOT NULL,
    name TEXT,
    fans TEXT NOT NULL DEFAULT '0',
    growth TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    icon TEXT NOT NULL,
    bg TEXT NOT NULL,
    fg TEXT NOT NULL,
    metrics JSONB DEFAULT '{}'::jsonb,
    token_expiry TEXT,
    bandwidth TEXT,
    webhook_health TEXT,
    scopes TEXT[] DEFAULT '{}'
);

-- 3. Row Level Security (RLS)
ALTER TABLE public.social_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- (Opsional) Policy Publik untuk membaca (Sesuaikan dengan kebutuhan Auth)
CREATE POLICY "Enable read access for all authenticated users" ON public.social_clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.social_accounts FOR SELECT TO authenticated USING (true);

-- 4. Insert Data Awal (Migrasi Faktual dari Dummy)
INSERT INTO public.social_clients (id, name, short_name, initials, tagline)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'B2B Shell Representatives', 'B2B Shell Reps', 'BS', 'Enterprise spatial computing & industrial IoT'),
  ('22222222-2222-2222-2222-222222222222', 'E2E Wizard Corp', 'Wizard Corp', 'WZ', 'Full-stack development & QA automation');

INSERT INTO public.social_accounts (client_id, platform, handle, name, fans, growth, status, icon, bg, fg, metrics, token_expiry, bandwidth)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Instagram', '@shell.creative', 'Shell Creative Studio Global', '428K', '+12.4%', 'SYNCED', 'photo_camera', 'bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600', 'text-white', '{"reach": "1.2M", "posts": "48", "likes": "14.2K"}', '58 days', 'HIGH BANDWIDTH'),
  ('22222222-2222-2222-2222-222222222222', 'YouTube', 'Wizard Devs', 'E2E Wizard Developers', '112K', '+2.1%', 'SYNCED', 'smart_display', 'bg-[#ba1a1a]', 'text-white', '{"reach": "500K", "posts": "124"}', NULL, NULL);
