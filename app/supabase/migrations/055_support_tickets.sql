-- Migration 055: support_tickets
--
-- MASALAH (faktual): `POST /api/support/submit` hanya mengirim alert Telegram
-- dan menulis audit_log. Tidak ada baris di DB yang menyimpan tiket, sehingga
-- user/klien TIDAK BISA melihat histori atau status tiket mereka sendiri —
-- halaman Support berperilaku "one-way form" (kirim lalu hilang).
--
-- SOLUSI: tabel `support_tickets` sebagai sumber kebenaran tiket dukungan.
-- Setiap submit menulis satu baris (status 'open'); admin dapat mengubah
-- status (in_progress/resolved/closed) lewat policy admin_all.
--
-- RLS mengikuti pola repo (002_rls_policies.sql):
--   - admin: FOR ALL via public.is_admin()
--   - client: SELECT baris milik client_id-nya via public.current_user_client_id()
--   - service_role: bypass penuh (untuk cron/route service)

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Normal'
    CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_reply TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_tickets_admin_all" ON public.support_tickets;
CREATE POLICY "support_tickets_admin_all" ON public.support_tickets
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "support_tickets_client_select_own" ON public.support_tickets;
CREATE POLICY "support_tickets_client_select_own" ON public.support_tickets
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (client_id = public.current_user_client_id());

DROP POLICY IF EXISTS "support_tickets_client_insert_own" ON public.support_tickets;
CREATE POLICY "support_tickets_client_insert_own" ON public.support_tickets
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (client_id = public.current_user_client_id());

DROP POLICY IF EXISTS "support_tickets_service_all" ON public.support_tickets;
CREATE POLICY "support_tickets_service_all" ON public.support_tickets
  AS PERMISSIVE FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Query utama: daftar tiket per klien, terbaru dulu.
CREATE INDEX IF NOT EXISTS idx_support_tickets_client_created
  ON public.support_tickets(client_id, created_at DESC);

-- Query admin: tiket yang belum selesai.
CREATE INDEX IF NOT EXISTS idx_support_tickets_open
  ON public.support_tickets(status) WHERE status IN ('open', 'in_progress');

-- Trigger: auto-touch updated_at (pola sama seperti 054/045).
CREATE OR REPLACE FUNCTION touch_support_tickets()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_support_tickets_touch ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_touch
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION touch_support_tickets();
