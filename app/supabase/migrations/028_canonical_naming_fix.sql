-- Migration: 028_canonical_naming_fix.sql
-- Canonical naming fix + new columns for analytics client report
-- Idempotent: safe to run repeatedly (ADD COLUMN IF NOT EXISTS, CREATE VIEW IF NOT EXISTS)

-- 1. Compatibility views for legacy code referencing old table names
-- campaigns -> content_campaigns
CREATE VIEW IF NOT EXISTS public.campaigns AS
SELECT
  id,
  client_id,
  name,
  type,
  start_date,
  end_date,
  color,
  notes,
  created_at
FROM public.content_campaigns;

-- content_metrics -> post_metrics
CREATE VIEW IF NOT EXISTS public.content_metrics AS
SELECT
  id,
  post_id,
  client_id,
  platform,
  views,
  reach,
  likes,
  comments,
  shares,
  saves,
  clicks,
  recorded_at
FROM public.post_metrics;

-- 2. Add campaign_tag to deliverables (nullable, references content_campaigns.name)
ALTER TABLE public.deliverables
ADD COLUMN IF NOT EXISTS campaign_tag TEXT;

-- Add foreign key reference (not enforced, just documentation)
-- campaign_tag references content_campaigns.name for the same client
COMMENT ON COLUMN public.deliverables.campaign_tag IS 'References content_campaigns.name for campaign grouping. Nullable.';

-- 3. Add operator_notes to analytics_summaries
ALTER TABLE public.analytics_summaries
ADD COLUMN IF NOT EXISTS operator_notes TEXT;

COMMENT ON COLUMN public.analytics_summaries.operator_notes IS 'Free-text operator commentary for client report export.';

-- 4. Add comment on deliverables.status clarifying 'sent' = 'Terkirim ke Client'
COMMENT ON COLUMN public.deliverables.status IS 'Status values: draft (Draft), sent (Terkirim ke Client), approved (Disetujui), revision_requested (Minta Revisi). Note: "sent" is labeled "Terkirim ke Client" in UI, not "Review".';

-- 5. RLS policies for the new views (inherit from underlying tables)
-- Views automatically inherit RLS from base tables in Postgres 15+
-- Explicit policies not needed for simple SELECT views

-- 6. Index for deliverables.campaign_tag for faster filtering
CREATE INDEX IF NOT EXISTS idx_deliverables_campaign_tag ON public.deliverables(campaign_tag);

-- 7. Ensure analytics_summaries has index on client_id + period for report queries
CREATE INDEX IF NOT EXISTS idx_analytics_summaries_client_period ON public.analytics_summaries(client_id, period_start, period_end);

-- 8. Grant select on views to authenticated roles (inherited from base tables, but explicit for clarity)
GRANT SELECT ON public.campaigns TO authenticated;
GRANT SELECT ON public.content_metrics TO authenticated;

-- 9. Verify canonical tables exist and have correct structure
DO $$
BEGIN
  -- Verify content_campaigns exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'content_campaigns') THEN
    RAISE EXCEPTION 'content_campaigns table does not exist. Run migration 021 first.';
  END IF;

  -- Verify post_metrics exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_metrics') THEN
    RAISE EXCEPTION 'post_metrics table does not exist. Run migration 023 first.';
  END IF;

  -- Verify analytics_summaries exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'analytics_summaries') THEN
    RAISE EXCEPTION 'analytics_summaries table does not exist. Run migration 023 first.';
  END IF;

  RAISE NOTICE 'Canonical naming fix migration completed successfully.';
  RAISE NOTICE 'Views created: campaigns -> content_campaigns, content_metrics -> post_metrics';
  RAISE NOTICE 'Added: deliverables.campaign_tag, analytics_summaries.operator_notes';
  RAISE NOTICE 'Comment added on deliverables.status';
END $$;