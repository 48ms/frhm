-- ----------------------------------------------------------------------
-- 037_fix_remaining_rls_gaps.sql
-- Fixes RLS gaps found in Phase 1 re-audit:
--   A) 3 TENANT tables with RLS DISABLED + 0 policies (CRITICAL data leak)
--   B) 5 GLOBAL catalog tables with RLS DISABLED (write exposure)
-- Idempotent — safe to run repeatedly.
-- ----------------------------------------------------------------------

-- ============================================================
-- PART A: TENANT TABLES (have client_id, currently no RLS)
-- ============================================================

-- analytics_predictions
ALTER TABLE public.analytics_predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin all analytics_predictions" ON public.analytics_predictions;
DROP POLICY IF EXISTS "Client own analytics_predictions" ON public.analytics_predictions;
CREATE POLICY "Admin all analytics_predictions" ON public.analytics_predictions FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Client own analytics_predictions" ON public.analytics_predictions FOR ALL
  TO authenticated
  USING (client_id = public.current_user_client_id())
  WITH CHECK (client_id = public.current_user_client_id());
CREATE INDEX IF NOT EXISTS idx_analytics_predictions_client_id ON public.analytics_predictions(client_id);

-- competitor_benchmarks
ALTER TABLE public.competitor_benchmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin all competitor_benchmarks" ON public.competitor_benchmarks;
DROP POLICY IF EXISTS "Client own competitor_benchmarks" ON public.competitor_benchmarks;
CREATE POLICY "Admin all competitor_benchmarks" ON public.competitor_benchmarks FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Client own competitor_benchmarks" ON public.competitor_benchmarks FOR ALL
  TO authenticated
  USING (client_id = public.current_user_client_id())
  WITH CHECK (client_id = public.current_user_client_id());
CREATE INDEX IF NOT EXISTS idx_competitor_benchmarks_client_id ON public.competitor_benchmarks(client_id);

-- content_campaigns
ALTER TABLE public.content_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin all content_campaigns" ON public.content_campaigns;
DROP POLICY IF EXISTS "Client own content_campaigns" ON public.content_campaigns;
CREATE POLICY "Admin all content_campaigns" ON public.content_campaigns FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Client own content_campaigns" ON public.content_campaigns FOR ALL
  TO authenticated
  USING (client_id = public.current_user_client_id())
  WITH CHECK (client_id = public.current_user_client_id());
CREATE INDEX IF NOT EXISTS idx_content_campaigns_client_id ON public.content_campaigns(client_id);

-- ============================================================
-- PART B: GLOBAL CATALOG TABLES (no client_id, shared reference data)
-- Read for any authenticated user; write admin-only.
-- ============================================================

-- repo_ground_truths
ALTER TABLE public.repo_ground_truths ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read repo_ground_truths" ON public.repo_ground_truths;
DROP POLICY IF EXISTS "Admin write repo_ground_truths" ON public.repo_ground_truths;
CREATE POLICY "Read repo_ground_truths" ON public.repo_ground_truths FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Admin write repo_ground_truths" ON public.repo_ground_truths FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- seasonal_periods
ALTER TABLE public.seasonal_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read seasonal_periods" ON public.seasonal_periods;
DROP POLICY IF EXISTS "Admin write seasonal_periods" ON public.seasonal_periods;
CREATE POLICY "Read seasonal_periods" ON public.seasonal_periods FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Admin write seasonal_periods" ON public.seasonal_periods FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- skill_groups
ALTER TABLE public.skill_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read skill_groups" ON public.skill_groups;
DROP POLICY IF EXISTS "Admin write skill_groups" ON public.skill_groups;
CREATE POLICY "Read skill_groups" ON public.skill_groups FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Admin write skill_groups" ON public.skill_groups FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- skill_guardrails
ALTER TABLE public.skill_guardrails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read skill_guardrails" ON public.skill_guardrails;
DROP POLICY IF EXISTS "Admin write skill_guardrails" ON public.skill_guardrails;
CREATE POLICY "Read skill_guardrails" ON public.skill_guardrails FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Admin write skill_guardrails" ON public.skill_guardrails FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- skill_source_files
ALTER TABLE public.skill_source_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read skill_source_files" ON public.skill_source_files;
DROP POLICY IF EXISTS "Admin write skill_source_files" ON public.skill_source_files;
CREATE POLICY "Read skill_source_files" ON public.skill_source_files FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Admin write skill_source_files" ON public.skill_source_files FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- PART C: Revoke dangerous anon grants (defense in depth)
-- ============================================================
-- anon should not be able to write to any public table.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'analytics_predictions','competitor_benchmarks','content_campaigns',
    'repo_ground_truths','seasonal_periods','skill_groups','skill_guardrails','skill_source_files'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM anon', t);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;