-- 039: Trigger-based audit backstop (O27)
-- Captures direct DB changes (via DBeaver, SQL, etc.) that bypass the API layer.
-- Uses SECURITY DEFINER so the trigger can INSERT into audit_log even when
-- the caller has no INSERT policy on it.

-- 1. Prevent direct modification of audit_log itself (immutable).
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is immutable — direct UPDATE/DELETE is not allowed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_log_immutable_update ON public.audit_log;
CREATE TRIGGER audit_log_immutable_update
  BEFORE UPDATE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

DROP TRIGGER IF EXISTS audit_log_immutable_delete ON public.audit_log;
CREATE TRIGGER audit_log_immutable_delete
  BEFORE DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- 2. Generic audit trigger function.
-- Logs INSERT/UPDATE/DELETE on critical tables into audit_log.
-- Uses SECURITY DEFINER to bypass audit_log's RLS.
-- Does NOT log audit_log itself (would cause recursion).
CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_action text;
  v_entity_id uuid;
  v_old jsonb;
  v_new jsonb;
  v_client_id uuid;
BEGIN
  -- Backstop semantics: only log changes that did NOT come through an
  -- authenticated API call. When a user session is present (auth.uid() IS NOT NULL),
  -- the API route is responsible for auditing with richer context (actor, IP, request).
  -- Direct DB edits (DBeaver/psql) and service-role jobs have auth.uid() = NULL → logged here.
  IF auth.uid() IS NOT NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_action := TG_TABLE_NAME || '.insert';
    v_new := to_jsonb(NEW);
    BEGIN v_entity_id := (NEW.id)::uuid; EXCEPTION WHEN OTHERS THEN v_entity_id := NULL; END;
    BEGIN v_client_id := (NEW.client_id)::uuid; EXCEPTION WHEN OTHERS THEN v_client_id := NULL; END;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := TG_TABLE_NAME || '.update';
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    BEGIN v_entity_id := (NEW.id)::uuid; EXCEPTION WHEN OTHERS THEN v_entity_id := NULL; END;
    BEGIN v_client_id := (NEW.client_id)::uuid; EXCEPTION WHEN OTHERS THEN v_client_id := NULL; END;
    -- Skip if nothing actually changed (e.g. updated_at trigger only)
    IF v_old = v_new THEN RETURN NEW; END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := TG_TABLE_NAME || '.delete';
    v_old := to_jsonb(OLD);
    BEGIN v_entity_id := (OLD.id)::uuid; EXCEPTION WHEN OTHERS THEN v_entity_id := NULL; END;
    BEGIN v_client_id := (OLD.client_id)::uuid; EXCEPTION WHEN OTHERS THEN v_client_id := NULL; END;
  END IF;

  INSERT INTO public.audit_log (
    action, entity_type, entity_id, client_id, summary, metadata
  ) VALUES (
    v_action,
    TG_TABLE_NAME,
    v_entity_id,
    v_client_id,
    format('%s %s via direct DB', TG_TABLE_NAME, lower(TG_OP)),
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'old', v_old,
      'new', v_new,
      'via', 'trigger_backstop'
    )
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach triggers to critical tables.
-- Only UPDATE and DELETE (INSERT is usually safe from API; UPDATE/DELETE are the risky ones).
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'deliverables', 'clients', 'users', 'campaigns',
    'client_skills', 'competitor_benchmarks',
    'ai_providers', 'bridge_config'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS audit_backstop_update ON public.%I', tbl
    );
    EXECUTE format(
      'CREATE TRIGGER audit_backstop_update AFTER UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn()', tbl
    );

    EXECUTE format(
      'DROP TRIGGER IF EXISTS audit_backstop_delete ON public.%I', tbl
    );
    EXECUTE format(
      'CREATE TRIGGER audit_backstop_delete AFTER DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn()', tbl
    );
  END LOOP;
END $$;
