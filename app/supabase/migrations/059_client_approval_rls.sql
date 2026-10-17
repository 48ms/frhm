-- Migration 059: Client Approval & Revision RLS for Scheduled Posts
--
-- Description:
-- Memungkinkan user dengan role client untuk menyetujui (status = 'scheduled')
-- atau memberikan catatan revisi (notes) pada postingan terjadwal milik brand mereka sendiri.
-- Mencegah cross-tenant tampering dengan memastikan client_id = public.current_user_client_id().

DROP POLICY IF EXISTS client_update_scheduled_posts ON public.scheduled_posts;

CREATE POLICY client_update_scheduled_posts ON public.scheduled_posts
  FOR UPDATE
  USING (client_id = public.current_user_client_id())
  WITH CHECK (client_id = public.current_user_client_id());

COMMENT ON POLICY client_update_scheduled_posts ON public.scheduled_posts IS
  'Memungkinkan klien menyetujui atau mengajukan revisi pada jadwal postingan milik brandnya sendiri.';
