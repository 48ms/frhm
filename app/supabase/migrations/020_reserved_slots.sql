-- 020_reserved_slots.sql
--
-- Add reserved-slot columns to scheduled_posts for pre-campaign reservations.
-- An admin (or campaign manager) can block a time/platform slot before content is ready.

ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS is_reserved    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reserved_for   TEXT,
  ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ;

-- Allow reserved (placeholder) rows with minimal title — these are slots awaiting content
ALTER TABLE public.scheduled_posts
  ALTER COLUMN title SET DEFAULT 'Slot Tersedia',
  ALTER COLUMN title DROP NOT NULL;

-- A reserved placeholder row has status = draft so the calendar counts are unaffected,
-- but the UI renders it distinctly as a "Reserved" placeholder.
ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS scheduled_posts_reserved_idx ON public.scheduled_posts (client_id) WHERE is_reserved = TRUE;
