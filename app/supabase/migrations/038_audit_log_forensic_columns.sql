-- 038: Observability — forensic columns on audit_log (O19)
-- Adds ip_address / user_agent / request_id so every audit row can be traced
-- back to a network origin and a request. Idempotent.

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS request_id text;

-- Speed up "who did what from where" investigations.
CREATE INDEX IF NOT EXISTS idx_audit_log_ip_address
  ON public.audit_log (ip_address)
  WHERE ip_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_request_id
  ON public.audit_log (request_id)
  WHERE request_id IS NOT NULL;

-- Faster timeline scans (the audit page orders by created_at desc).
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON public.audit_log (created_at DESC);
