-- Migration: 002_rls_policies.sql
-- Description: Row Level Security policies for Taraju Client Dashboard
-- Created: 2026-09-13
--
-- IMPORTANT: policies on `users`/`clients` must NOT subquery `users`
-- directly (causes "infinite recursion detected in policy"). Use the
-- SECURITY DEFINER helpers defined below.

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper functions (bypass RLS via SECURITY DEFINER + row_security=off)
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text LANGUAGE sql SECURITY DEFINER
SET search_path = public SET row_security = off STABLE
AS $$ SELECT role FROM public.users WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.current_user_client_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER
SET search_path = public SET row_security = off STABLE
AS $$ SELECT client_id FROM public.users WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER
SET search_path = public SET row_security = off STABLE
AS $$ SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') $$;

-- ---------- users ----------
CREATE POLICY admin_all_users ON users
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY user_own_profile ON users
  FOR SELECT USING (id = auth.uid());

-- ---------- clients ----------
CREATE POLICY admin_all_clients ON clients
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY client_own_client ON clients
  FOR SELECT USING (id = public.current_user_client_id());

-- ---------- deliverables ----------
CREATE POLICY admin_all_deliverables ON deliverables
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY client_own_deliverables ON deliverables
  FOR SELECT USING (client_id = public.current_user_client_id());

-- Clients may approve / request revision on their own deliverables
CREATE POLICY client_update_deliverables ON deliverables
  FOR UPDATE
  USING (client_id = public.current_user_client_id())
  WITH CHECK (client_id = public.current_user_client_id());

-- ---------- comments ----------
CREATE POLICY admin_all_comments ON comments
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY client_own_comments ON comments
  FOR ALL
  USING (
    user_id = auth.uid()
    AND deliverable_id IN (
      SELECT id FROM public.deliverables
      WHERE client_id = public.current_user_client_id()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND deliverable_id IN (
      SELECT id FROM public.deliverables
      WHERE client_id = public.current_user_client_id()
    )
  );

-- ---------- status_history ----------
CREATE POLICY admin_all_status_history ON status_history
  FOR SELECT USING (public.is_admin());

CREATE POLICY client_own_status_history ON status_history
  FOR SELECT USING (
    deliverable_id IN (
      SELECT id FROM public.deliverables
      WHERE client_id = public.current_user_client_id()
    )
  );
