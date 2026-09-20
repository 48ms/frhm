-- ============================================================
-- Compatibility view: the app reads/writes `deliverable_comments`
-- with columns (author_id, author_name, author_role, content),
-- but the canonical schema is `comments(user_id, content_md, ...)`.
--
-- This view exposes the shape the app expects and maps to the
-- real table. Writes go through BEFORE/AFTER triggers below.
-- ============================================================

-- Read view with author profile joined
CREATE OR REPLACE VIEW public.deliverable_comments AS
SELECT
  c.id,
  c.deliverable_id,
  c.user_id            AS author_id,
  COALESCE(u.full_name, 'User') AS author_name,
  COALESCE(u.role, 'client')    AS author_role,
  c.content_md         AS content,
  c.created_at
FROM public.comments c
LEFT JOIN public.users u ON u.id = c.user_id;

-- The view is read-only for inserts, so provide an INSTEAD OF trigger
-- that maps writes back to public.comments.
CREATE OR REPLACE FUNCTION public.deliverable_comments_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  INSERT INTO public.comments (deliverable_id, user_id, content_md)
  VALUES (NEW.deliverable_id, NEW.author_id, NEW.content);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS deliverable_comments_insert_trg ON public.deliverable_comments;
CREATE TRIGGER deliverable_comments_insert_trg
  INSTEAD OF INSERT ON public.deliverable_comments
  FOR EACH ROW EXECUTE FUNCTION public.deliverable_comments_insert();
