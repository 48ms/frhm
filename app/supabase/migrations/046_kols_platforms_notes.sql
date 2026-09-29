-- ============================================================
-- 046: KOL & Vendor CRM — add platforms + notes
-- ============================================================
-- Context: the KOL CRM detail page (app/admin/crm/[id]/page.tsx)
-- renders kol.platforms and kol.notes, but the kols table created in
-- migration 036 only had (client_id, name, niche, contact_info, rate_card).
-- That schema/UI drift made the detail page silently render empty fields.
-- This migration adds the two columns so the CRM is complete.

ALTER TABLE public.kols
  ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN public.kols.platforms IS 'Platform tempat KOL aktif, e.g. {instagram,tiktok}';
COMMENT ON COLUMN public.kols.notes IS 'Catatan bebas: preferensi konten, histori kerja sama, dsb.';
