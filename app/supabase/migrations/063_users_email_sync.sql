-- Migration 063: mirror auth.users.email into public.users
--
-- Several admin/support routes select public.users.email, but 001 never
-- created the column, so PostgREST answered 42703. Keep public.users.email in
-- sync with auth.users and backfill existing rows once.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.users u
SET email = lower(a.email),
    updated_at = NOW()
FROM auth.users a
WHERE a.id = u.id
  AND a.email IS NOT NULL
  AND (u.email IS NULL OR u.email <> lower(a.email));

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key
  ON public.users (lower(email))
  WHERE email IS NOT NULL;

-- New signups: include email in the profile row created by the auth trigger.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public SET row_security = off
AS $$
BEGIN
  INSERT INTO public.users (id, role, client_id, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NULL,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    lower(NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed: % %', SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$$;

-- Email changes in Supabase Auth propagate to the profile row.
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public SET row_security = off
AS $$
BEGIN
  UPDATE public.users
  SET email = lower(NEW.email),
      updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_email();

NOTIFY pgrst, 'reload schema';
