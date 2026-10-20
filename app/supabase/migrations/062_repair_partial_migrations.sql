-- Migration 062: repair objects missing from partially applied migrations
--
-- On 2026-10-20 every migration file was compared against the live schema.
-- 035, 045 and 053 were applied far enough to create their tables, but a few
-- objects never landed. Everything below is idempotent, so re-running is safe.
--
-- The other gaps found in the same audit were whole migrations that had never
-- run (028, 048, 056, 057, 058, 059); those were applied from their own files.

-- 035_scheduler_engine.sql: scheduler indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_publishing_status
  ON public.scheduled_posts (publishing_status);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at
  ON public.scheduled_posts (scheduled_at);

-- 045_reminder_settings.sql: updated_at trigger + its function
CREATE OR REPLACE FUNCTION public.update_reminder_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_reminder_settings_updated_at ON public.reminder_settings;
CREATE TRIGGER set_reminder_settings_updated_at
  BEFORE UPDATE ON public.reminder_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_reminder_settings_updated_at();

-- 053_dashboard_profiles.sql: per-client lookup index
CREATE INDEX IF NOT EXISTS idx_dashboard_profiles_client_id
  ON public.dashboard_profiles (client_id);
