-- 021_content_planning.sql
-- Content Planning Layer: priority + campaign grouping untuk scheduled posts.
-- Pain Point 1: Sulit lihat keseluruhan rencana konten, campaign/promo/event bertumpuk,
-- prioritas sering berubah, belum ada sistem pengingat.

-- Priority untuk setiap postingan agar bisa di-sort & di-highlight
ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal';

-- Tag kampanye/promo/event agar konten bisa dikelompokkan di calendar view
ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS campaign_tag TEXT;

-- Tabel kampanye: campaign, promo, atau event — dengan warna untuk visual di calendar
CREATE TABLE IF NOT EXISTS public.content_campaigns (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('campaign', 'promo', 'event')),
  start_date DATE,
  end_date   DATE,
  color      TEXT DEFAULT '#3b82f6',
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index untuk filter cepat per client + campaign
CREATE INDEX IF NOT EXISTS content_campaigns_client_idx ON public.content_campaigns (client_id);
CREATE INDEX IF NOT EXISTS scheduled_posts_priority_idx ON public.scheduled_posts (priority);
