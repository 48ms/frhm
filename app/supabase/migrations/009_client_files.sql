-- Migration: 009_client_files.sql
-- One folder of files per client, mirroring the repo's convention: every skill reads and
-- writes `brand-profile.md` (and later other artifacts) from the client's own folder.
-- Path looks like 'brand-profile.md' (relative to the client folder).

CREATE TABLE IF NOT EXISTS public.client_files (
  client_id   uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  path        text NOT NULL,                 -- e.g. 'brand-profile.md'
  content     text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, path)
);

CREATE INDEX IF NOT EXISTS client_files_client_idx ON public.client_files (client_id);

ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cf_admin_all ON public.client_files;
DROP POLICY IF EXISTS cf_client_read ON public.client_files;

-- admin: full control
CREATE POLICY cf_admin_all ON public.client_files
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- client: may read only their own folder
CREATE POLICY cf_client_read ON public.client_files
  FOR SELECT TO authenticated
  USING (client_id = public.current_user_client_id());
