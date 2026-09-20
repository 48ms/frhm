-- 040: AI usage & cost tracking (O20, CRITICAL)
-- Records every AI call's token usage per client so cost can be attributed.

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients (id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  route text NOT NULL,
  model text NOT NULL,
  provider_kind text,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  cost_estimate numeric(12, 6) NOT NULL DEFAULT 0,
  latency_ms integer,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_client_created
  ON public.ai_usage_logs (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created
  ON public.ai_usage_logs (created_at DESC);

-- RLS: admins see all, clients see only their own usage.
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_ai_usage" ON public.ai_usage_logs;
CREATE POLICY "admin_all_ai_usage"
  ON public.ai_usage_logs FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "client_read_own_ai_usage" ON public.ai_usage_logs;
CREATE POLICY "client_read_own_ai_usage"
  ON public.ai_usage_logs FOR SELECT
  USING (client_id = current_user_client_id());

-- Service role (logAiUsage helper) bypasses RLS via service key.