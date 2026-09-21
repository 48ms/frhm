-- Enable Supabase Realtime on tables used by dashboard boards
-- This allows frontend components to subscribe to INSERT events and
-- refresh without a manual page reload.
--
-- Tables (verified against actual component code):
--   expenses            → budget-ledger-board.tsx, roi-dashboard-board.tsx
--   ad_spend_logs       → ads-tracker-board.tsx, roi-dashboard-board.tsx
--   platform_posts      → omni-calendar-board.tsx
--   content_productions → content-production-board.tsx
--
-- How to apply:
--   Supabase Dashboard → SQL Editor → paste & run
--   (Re-running is safe: ADD TABLE errors if already a member, so guard first.)

DO $$
DECLARE
  t text;
  tables text[] := ARRAY['expenses', 'ad_spend_logs', 'platform_posts', 'content_productions'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
