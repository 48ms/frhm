-- Migration 053: Create dashboard_profiles table for factual analytics frontend
-- Resolves the issue where dashboard falls back to hardcoded data because the table doesn't exist.

CREATE TABLE IF NOT EXISTS public.dashboard_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  greeting TEXT DEFAULT 'Good day, Creator',
  velocity INTEGER DEFAULT 0,
  peak_label TEXT DEFAULT 'Peak Performance',
  peak_value TEXT DEFAULT '0%',
  charts JSONB DEFAULT '{"7d": {"reach": "", "engage": ""}, "30d": {"reach": "", "engage": ""}, "90d": {"reach": "", "engage": ""}}'::jsonb,
  insights JSONB DEFAULT '[]'::jsonb,
  metrics JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id)
);

-- RLS: Only admins can write/view all. Clients can only select their own profile.
ALTER TABLE public.dashboard_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full dashboard_profiles" ON public.dashboard_profiles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Client read dashboard_profiles" ON public.dashboard_profiles
  FOR SELECT USING (client_id = public.current_user_client_id());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_dashboard_profiles_client_id ON public.dashboard_profiles(client_id);
