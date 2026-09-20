-- ----------------------------------------------------------------------
-- 036_consolidate_orphaned_migrations.sql
-- Consolidation of 6 orphaned root migrations (never pushed).
-- SECURE-BY-DESIGN: tenant-scoped RLS, private storage, FK constraints.
-- Idempotent — safe to run repeatedly.
-- ----------------------------------------------------------------------

-- ============================================================
-- PART A: ENUM TYPES (from social_media_schema.sql)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.content_pillar_enum AS ENUM ('Educational','Promotional','BehindTheScenes','IndustryInsights','Entertainment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.funnel_stage_enum AS ENUM ('TOFU','MOFU','BOFU');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.asset_status_enum AS ENUM ('Idea','Draft','Shooting','Editing','Ready','Published','Archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.platform_enum AS ENUM ('Instagram','LinkedIn','TikTok','Twitter','Facebook');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.post_format_enum AS ENUM ('Reel','Carousel','SingleImage','Thread','TextPost','Story');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.post_status_enum AS ENUM ('Draft','InReview','Approved','Scheduled','Published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- PART B: content_assets (with client_id + tenant RLS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content_pillar public.content_pillar_enum NOT NULL,
    funnel_stage public.funnel_stage_enum NOT NULL,
    raw_assets_url TEXT,
    status public.asset_status_enum DEFAULT 'Idea'::public.asset_status_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin all content_assets" ON public.content_assets;
CREATE POLICY "Admin all content_assets" ON public.content_assets FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Client own content_assets" ON public.content_assets;
CREATE POLICY "Client own content_assets" ON public.content_assets FOR ALL
  TO authenticated
  USING (client_id = public.current_user_client_id())
  WITH CHECK (client_id = public.current_user_client_id());

CREATE INDEX IF NOT EXISTS idx_content_assets_client_id ON public.content_assets(client_id);
CREATE INDEX IF NOT EXISTS idx_content_assets_campaign_id ON public.content_assets(campaign_id);

-- ============================================================
-- PART C: platform_posts (with client_id + tenant RLS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES public.content_assets(id) ON DELETE CASCADE,
    platform public.platform_enum NOT NULL,
    format public.post_format_enum NOT NULL,
    visual_hook TEXT,
    body_content TEXT,
    call_to_action TEXT,
    status public.post_status_enum DEFAULT 'Draft'::public.post_status_enum NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.platform_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin all platform_posts" ON public.platform_posts;
CREATE POLICY "Admin all platform_posts" ON public.platform_posts FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Client own platform_posts" ON public.platform_posts;
CREATE POLICY "Client own platform_posts" ON public.platform_posts FOR ALL
  TO authenticated
  USING (client_id = public.current_user_client_id())
  WITH CHECK (client_id = public.current_user_client_id());

CREATE INDEX IF NOT EXISTS idx_platform_posts_client_id ON public.platform_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_platform_posts_asset_id ON public.platform_posts(asset_id);

-- ============================================================
-- PART D: tasks (with client_id + tenant RLS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    due_date TIMESTAMP WITH TIME ZONE,
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin all tasks" ON public.tasks;
CREATE POLICY "Admin all tasks" ON public.tasks FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Client own tasks" ON public.tasks;
CREATE POLICY "Client own tasks" ON public.tasks FOR ALL
  TO authenticated
  USING (client_id = public.current_user_client_id())
  WITH CHECK (client_id = public.current_user_client_id());

CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- ============================================================
-- PART E: kols (with client_id + tenant RLS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kols (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    niche TEXT,
    contact_info TEXT,
    rate_card NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.kols ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin all kols" ON public.kols;
CREATE POLICY "Admin all kols" ON public.kols FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Client own kols" ON public.kols;
CREATE POLICY "Client own kols" ON public.kols FOR ALL
  TO authenticated
  USING (client_id = public.current_user_client_id())
  WITH CHECK (client_id = public.current_user_client_id());

CREATE INDEX IF NOT EXISTS idx_kols_client_id ON public.kols(client_id);

-- ============================================================
-- PART F: brand_assets (private bucket, signed URLs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.brand_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    category TEXT,
    file_path TEXT NOT NULL,
    file_type TEXT,
    guidelines TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin all brand_assets" ON public.brand_assets;
CREATE POLICY "Admin all brand_assets" ON public.brand_assets FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Client own brand_assets" ON public.brand_assets;
CREATE POLICY "Client own brand_assets" ON public.brand_assets FOR ALL
  TO authenticated
  USING (client_id = public.current_user_client_id())
  WITH CHECK (client_id = public.current_user_client_id());

CREATE INDEX IF NOT EXISTS idx_brand_assets_client_id ON public.brand_assets(client_id);

-- ============================================================
-- PART G: content_items (kanban/calendar data)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    stage TEXT DEFAULT 'Idea',
    is_urgent BOOLEAN DEFAULT false,
    target_date TIMESTAMP WITH TIME ZONE,
    platform TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin all content_items" ON public.content_items;
CREATE POLICY "Admin all content_items" ON public.content_items FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Client own content_items" ON public.content_items;
CREATE POLICY "Client own content_items" ON public.content_items FOR ALL
  TO authenticated
  USING (client_id = public.current_user_client_id())
  WITH CHECK (client_id = public.current_user_client_id());

CREATE INDEX IF NOT EXISTS idx_content_items_client_id ON public.content_items(client_id);
CREATE INDEX IF NOT EXISTS idx_content_items_campaign_id ON public.content_items(campaign_id);

-- ============================================================
-- PART H: telegram_notification_logs (admin-only read)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.telegram_notification_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_type text NOT NULL CHECK (recipient_type IN ('client', 'admin', 'user')),
  recipient_id text,
  chat_id text NOT NULL,
  event_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.telegram_notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin all telegram_notification_logs" ON public.telegram_notification_logs;

CREATE POLICY "Admin all telegram_notification_logs"
  ON public.telegram_notification_logs FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_tglogs_created_at ON public.telegram_notification_logs(created_at);

-- ============================================================
-- PART I: ERP tables (events, budgets, expenses, ad spend)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ,
  location TEXT,
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  stage TEXT DEFAULT 'pre',
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  cost NUMERIC DEFAULT 0,
  contact_info TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_budget NUMERIC DEFAULT 0,
  remaining_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, month)
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES public.client_budgets(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  category TEXT,
  description TEXT,
  expense_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ad_spend_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  spend NUMERIC DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  log_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: ERP tables (tenant-scoped)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spend_logs ENABLE ROW LEVEL SECURITY;

-- events: client_id on row
DROP POLICY IF EXISTS "Admin all events" ON public.events;
CREATE POLICY "Admin all events" ON public.events FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Client own events" ON public.events;
CREATE POLICY "Client own events" ON public.events FOR ALL TO authenticated
  USING (client_id = public.current_user_client_id())
  WITH CHECK (client_id = public.current_user_client_id());

-- event_*: inherit via join to events.client_id
DROP POLICY IF EXISTS "Admin all event_tasks" ON public.event_tasks;
CREATE POLICY "Admin all event_tasks" ON public.event_tasks FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Client own event_tasks" ON public.event_tasks;
CREATE POLICY "Client own event_tasks" ON public.event_tasks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_tasks.event_id AND e.client_id = public.current_user_client_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_tasks.event_id AND e.client_id = public.current_user_client_id()));

DROP POLICY IF EXISTS "Admin all event_vendors" ON public.event_vendors;
CREATE POLICY "Admin all event_vendors" ON public.event_vendors FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Client own event_vendors" ON public.event_vendors;
CREATE POLICY "Client own event_vendors" ON public.event_vendors FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_vendors.event_id AND e.client_id = public.current_user_client_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_vendors.event_id AND e.client_id = public.current_user_client_id()));

-- budgets/expenses/ad_spend: client_id on row
DROP POLICY IF EXISTS "Admin all client_budgets" ON public.client_budgets;
CREATE POLICY "Admin all client_budgets" ON public.client_budgets FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Client own client_budgets" ON public.client_budgets;
CREATE POLICY "Client own client_budgets" ON public.client_budgets FOR ALL TO authenticated
  USING (client_id = public.current_user_client_id())
  WITH CHECK (client_id = public.current_user_client_id());

DROP POLICY IF EXISTS "Admin all expenses" ON public.expenses;
CREATE POLICY "Admin all expenses" ON public.expenses FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Client own expenses" ON public.expenses;
CREATE POLICY "Client own expenses" ON public.expenses FOR ALL TO authenticated
  USING (client_id = public.current_user_client_id())
  WITH CHECK (client_id = public.current_user_client_id());

DROP POLICY IF EXISTS "Admin all ad_spend_logs" ON public.ad_spend_logs;
CREATE POLICY "Admin all ad_spend_logs" ON public.ad_spend_logs FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Client own ad_spend_logs" ON public.ad_spend_logs;
CREATE POLICY "Client own ad_spend_logs" ON public.ad_spend_logs FOR ALL TO authenticated
  USING (client_id = public.current_user_client_id())
  WITH CHECK (client_id = public.current_user_client_id());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_client_id ON public.events(client_id);
CREATE INDEX IF NOT EXISTS idx_event_tasks_event_id ON public.event_tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_event_vendors_event_id ON public.event_vendors(event_id);
CREATE INDEX IF NOT EXISTS idx_client_budgets_client_id ON public.client_budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_expenses_client_id ON public.expenses(client_id);
CREATE INDEX IF NOT EXISTS idx_ad_spend_logs_client_id ON public.ad_spend_logs(client_id);

-- ============================================================
-- PART J: expense → budget deduction trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_expense_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.budget_id IS NOT NULL THEN
    UPDATE public.client_budgets
    SET remaining_balance = remaining_balance - NEW.amount
    WHERE id = NEW.budget_id;
  ELSE
    UPDATE public.client_budgets
    SET remaining_balance = remaining_balance - NEW.amount
    WHERE client_id = NEW.client_id
    AND date_trunc('month', month) = date_trunc('month', NEW.expense_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_expense_inserted ON public.expenses;
CREATE TRIGGER on_expense_inserted
AFTER INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.handle_expense_insert();

-- ============================================================
-- PART K: Storage bucket (PRIVATE — fixes S1, S2, S8)
-- ============================================================
-- S1: bucket must be private, not public.
INSERT INTO storage.buckets (id, name, public) VALUES ('brand_assets', 'brand_assets', false)
  ON CONFLICT (id) DO UPDATE SET public = false;

-- S2/S8: tenant-scoped storage RLS (client_id in path: brand_assets/<client_id>/<file>)
DROP POLICY IF EXISTS "Allow authenticated users to manage brand_assets" ON storage.objects;

DROP POLICY IF EXISTS "Admin all storage brand_assets" ON storage.objects;
CREATE POLICY "Admin all storage brand_assets" ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'brand_assets' AND public.is_admin())
  WITH CHECK (bucket_id = 'brand_assets' AND public.is_admin());

DROP POLICY IF EXISTS "Client own storage brand_assets" ON storage.objects;
CREATE POLICY "Client own storage brand_assets" ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'brand_assets'
    AND (storage.foldername(name))[1] = public.current_user_client_id()::text
  )
  WITH CHECK (
    bucket_id = 'brand_assets'
    AND (storage.foldername(name))[1] = public.current_user_client_id()::text
  );

-- ============================================================
-- PART L: Telegram columns (005 + 027 merged, idempotent)
-- ============================================================
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS telegram_chat_id text,
  ADD COLUMN IF NOT EXISTS telegram_username text,
  ADD COLUMN IF NOT EXISTS telegram_notifications_enabled boolean DEFAULT true;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS telegram_chat_id text,
  ADD COLUMN IF NOT EXISTS telegram_username text,
  ADD COLUMN IF NOT EXISTS telegram_notifications_enabled boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_clients_telegram_chat_id ON public.clients(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_users_telegram_chat_id ON public.users(telegram_chat_id);

-- ============================================================
-- PART M: updated_at triggers on all new tables (S13)
-- ============================================================
-- handle_updated_at() already exists in DB (from 004_analytics.sql).
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'content_assets','platform_posts','tasks','kols','brand_assets','content_items',
    'events','event_tasks','client_budgets','expenses','ad_spend_logs'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
      EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', t);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- ============================================================
-- PART N: campaigns FK (S9) + pillar_allocation column
-- ============================================================
-- campaigns.client_id already has FK (verified live).
-- Add the missing column from social_media_schema variant.
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS pillar_allocation JSONB
  DEFAULT '{"Educational": 30, "Promotional": 20, "BehindTheScenes": 20, "IndustryInsights": 20, "Entertainment": 10}'::jsonb;

-- Ensure FK exists (idempotent) — original auto-named constraint already exists (campaigns_client_id_fkey), no action needed.
-- NOTE: Do NOT create a second FK with a custom name (caused duplicate constraint).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_name = 'campaigns'
      AND constraint_name = 'campaigns_client_id_fkey'
  ) THEN
    ALTER TABLE public.campaigns
      ADD CONSTRAINT campaigns_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaigns_client_id ON public.campaigns(client_id);