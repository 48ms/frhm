-- Migration: 003_triggers_functions.sql
-- Description: Triggers and functions for Taraju Client Dashboard
-- Created: 2026-09-13
--
-- All triggers that write to RLS-protected tables use SECURITY DEFINER
-- + `SET row_security = off` so they can insert regardless of the
-- invoking user's policies (e.g. handle_new_user, status_history log).

-- =============================================
-- Auto-set updated_at on UPDATE
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public SET row_security = off
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliverables_updated_at
  BEFORE UPDATE ON deliverables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Stamp created_by / updated_by from auth.uid() when not provided
-- =============================================
CREATE OR REPLACE FUNCTION public.stamp_deliverable_actor()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public SET row_security = off
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_by IS NULL THEN NEW.created_by := auth.uid(); END IF;
    IF NEW.updated_by IS NULL THEN NEW.updated_by := auth.uid(); END IF;
  ELSE
    IF NEW.updated_by IS NULL THEN NEW.updated_by := auth.uid(); END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER stamp_deliverable_actor_trg
  BEFORE INSERT OR UPDATE ON deliverables
  FOR EACH ROW EXECUTE FUNCTION public.stamp_deliverable_actor();

-- =============================================
-- Auto-log status changes to status_history
-- =============================================
CREATE OR REPLACE FUNCTION public.log_deliverable_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public SET row_security = off
AS $$
DECLARE
  actor uuid;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    actor := COALESCE(auth.uid(), NEW.updated_by, NEW.created_by);
    IF actor IS NOT NULL THEN
      INSERT INTO public.status_history (deliverable_id, from_status, to_status, changed_by)
      VALUES (NEW.id, OLD.status, NEW.status, actor);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER deliverable_status_change
  AFTER UPDATE ON deliverables
  FOR EACH ROW EXECUTE FUNCTION public.log_deliverable_status_change();

-- =============================================
-- Auto-create user profile on auth signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public SET row_security = off
AS $$
BEGIN
  INSERT INTO public.users (id, role, client_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NULL,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Auto-set sent_at / approved_at on status change
-- =============================================
CREATE OR REPLACE FUNCTION public.set_deliverable_timestamps()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public SET row_security = off
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'sent' AND OLD.status != 'sent' THEN
      NEW.sent_at = NOW();
    ELSIF NEW.status = 'approved' AND OLD.status != 'approved' THEN
      NEW.approved_at = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_deliverable_timestamps_trigger
  BEFORE UPDATE ON deliverables
  FOR EACH ROW EXECUTE FUNCTION public.set_deliverable_timestamps();
