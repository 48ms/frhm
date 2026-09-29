-- Migration 045: reminder settings for clients
-- Each client can configure whether they want reminders, and at what time (UTC)

CREATE TABLE IF NOT EXISTS public.reminder_settings (
  client_id UUID PRIMARY KEY REFERENCES public.clients(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  -- Time of day to send reminders (0-23), interpreted as client-local
  reminder_hour SMALLINT NOT NULL DEFAULT 9 CHECK (reminder_hour BETWEEN 0 AND 23),
  reminder_channel TEXT NOT NULL DEFAULT 'telegram' CHECK (reminder_channel IN ('telegram', 'email', 'both')),
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: admins can read/write; clients cannot; service_role bypasses entirely.
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny direct access" ON public.reminder_settings;
DROP POLICY IF EXISTS "reminder_settings_admin_all" ON public.reminder_settings;
CREATE POLICY "reminder_settings_admin_all" ON public.reminder_settings
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Service role access" ON public.reminder_settings
  AS PERMISSIVE FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Seed default: no reminders by default (safe start)
INSERT INTO public.reminder_settings (client_id, enabled, reminder_hour, reminder_channel)
SELECT id, FALSE, 9, 'telegram'
FROM public.clients
ON CONFLICT (client_id) DO NOTHING;

-- Feature flag: global kill-switch for the reminder cron
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('reminder_enabled', TRUE, 'Master kill-switch for the scheduled-post reminder cron')
ON CONFLICT (key) DO NOTHING;

-- Index for cron query: find enabled clients that haven't been notified today
CREATE INDEX IF NOT EXISTS reminder_settings_enabled_active ON public.reminder_settings(client_id) WHERE enabled = TRUE;

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_reminder_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_reminder_settings_updated_at ON public.reminder_settings;
CREATE TRIGGER set_reminder_settings_updated_at
  BEFORE UPDATE ON public.reminder_settings
  FOR EACH ROW EXECUTE FUNCTION update_reminder_settings_updated_at();

-- Audit log entries for reminder config changes
INSERT INTO public.audit_log (actor_role, actor_name, action, entity_type, entity_id, summary)
SELECT 'system', 'Migration 045', 'reminder_settings.created', 'reminder_settings', id, 'Reminder settings created by migration'
FROM public.reminder_settings;
