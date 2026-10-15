-- Migration 057: WhatsApp Notification Logs
-- Menyimpan riwayat audit pengiriman notifikasi WhatsApp untuk client dan admin

CREATE TABLE IF NOT EXISTS public.whatsapp_notification_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_type text NOT NULL CHECK (recipient_type IN ('client', 'admin', 'user')),
  recipient_id text,
  phone text NOT NULL,
  event_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'skipped', 'ready')),
  message text,
  click_url text,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.whatsapp_notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin all whatsapp_notification_logs" ON public.whatsapp_notification_logs;

CREATE POLICY "Admin all whatsapp_notification_logs"
  ON public.whatsapp_notification_logs FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_walogs_created_at ON public.whatsapp_notification_logs(created_at);
