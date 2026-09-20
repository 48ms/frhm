/*
  Migration 041: feature_flags
  Store toggleable feature flags in DB. Checked by `isFeatureEnabled()` helper.
*/

CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default flags (idempotent — only insert, never overwrite an admin's choice)
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('auto_publish_enabled', TRUE, 'Master kill-switch for automatic content publishing (cron)'),
  ('ai_usage_tracking', TRUE, 'Track token usage and costs for AI provider calls'),
  ('audit_logging', TRUE, 'Write audit records to audit_log table')
ON CONFLICT (key) DO NOTHING;

-- RLS: Deny all direct access. Only accessible via service_role in server-side code.
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all access" ON public.feature_flags;
CREATE POLICY "Deny all access" ON public.feature_flags
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (FALSE)
  WITH CHECK (FALSE);
