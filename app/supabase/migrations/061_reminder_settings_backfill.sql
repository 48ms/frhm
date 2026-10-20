-- Migration 061: backfill reminder_settings for every existing client
--
-- 045 only seeded the clients that existed when it ran. Clients created later
-- have no row, so the reminder cron (which reads reminder_settings) never sees
-- them even after they enable reminders elsewhere.
--
-- Defaults match 045: reminders stay OFF until a client opts in.

INSERT INTO public.reminder_settings (client_id, enabled, reminder_hour, reminder_channel)
SELECT c.id, FALSE, 9, 'telegram'
FROM public.clients c
LEFT JOIN public.reminder_settings rs ON rs.client_id = c.id
WHERE rs.client_id IS NULL;
