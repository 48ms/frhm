-- Migration 060: re-seed required feature flags
--
-- 041 and 045 already insert these rows, but production lost `reminder_enabled`
-- at some point (likely a manual delete or a partial restore). The flag table has
-- no admin UI, so a missing row silently disables the feature via fail-closed
-- checks. Re-asserting the rows here is idempotent: existing values are kept.

INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('auto_publish_enabled', TRUE, 'Master kill-switch for automatic content publishing (cron)'),
  ('ai_usage_tracking', TRUE, 'Track token usage and costs for AI provider calls'),
  ('audit_logging', TRUE, 'Write audit records to audit_log table'),
  ('reminder_enabled', TRUE, 'Master kill-switch for the scheduled-post reminder cron')
ON CONFLICT (key) DO NOTHING;
