import { createSupabaseServiceClient } from '@/lib/supabase/service'

export type AiUsageInput = {
  /** Caller's user id (the admin/client who triggered the call). Null for system/cron calls. */
  userId: string | null
  /** Which client this belongs to — null for admin-wide calls. */
  clientId?: string | null
  /** The route identifier, e.g. 'api/admin/clients/[id]/skills/bulk-run'. */
  route: string
  /** Provider model identifier, e.g. 'gpt-4o-mini' or 'claude-3-haiku'. */
  model: string
  /** AI provider kind. */
  providerKind: string
  /** Tokens consumed by the prompt. */
  promptTokens: number
  /** Tokens produced by the model. */
  completionTokens: number
  /** Milliseconds the request took. */
  latencyMs?: number
  /** Error message when the call failed (optional — success is assumed by default). */
  errorMessage?: string | null
  /** Cost estimate in USD (optional — callers without a pricing table can omit). */
  costEstimate?: number | null
}

/**
 * Record one AI call's usage in ai_usage_logs.
 *
 * Uses the service role so rows are written even when the caller holds only a
 * client public key (the service key is read from env at runtime). Errors are
 * swallowed — an audit gap is worse than a failed insert, but logging should
 * never break the calling flow.
 *
 * See O20: AI Usage Tracking (CRITICAL).
 */
export async function logAiUsage(input: AiUsageInput): Promise<void> {
  try {
    const admin = createSupabaseServiceClient()

    await admin.from('ai_usage_logs').insert({
      user_id: input.userId ?? null,
      client_id: input.clientId ?? null,
      route: input.route,
      model: input.model,
      provider_kind: input.providerKind,
      prompt_tokens: input.promptTokens,
      completion_tokens: input.completionTokens,
      latency_ms: input.latencyMs ?? null,
      success: !input.errorMessage,
      error_message: input.errorMessage ?? null,
      cost_estimate: input.costEstimate ?? 0,
    })
  } catch (e) {
    console.error('[ai-usage] log failed:', e)
  }
}
