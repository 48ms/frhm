import { createSupabaseServiceClient } from '@/lib/supabase/service'

/**
 * Append one row to audit_log.
 *
 * Uses the service role: audit rows must be writable from API routes that already hold a
 * service client (publish, onboarding, resets) and there is deliberately no INSERT policy for
 * app roles , a client cannot forge history from the browser.
 *
 * Never throws. An audit write must not fail the action it describes; a missing log line is
 * better than a failed publish. Errors are swallowed and reported on stderr only.
 */
export type AuditInput = {
  actorId?: string | null
  actorRole?: string | null
  actorName?: string | null
  action: string
  entityType?: string | null
  entityId?: string | null
  clientId?: string | null
  summary: string
  metadata?: Record<string, unknown>
  /** Forensic context. Pass the incoming Request to auto-fill ip/ua/request-id. */
  request?: Request
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}

/**
 * Extract forensic fields from an incoming request's headers.
 * x-forwarded-for may hold a comma-separated chain; the first entry is the client.
 */
function forensicFromRequest(request?: Request) {
  if (!request) return { ipAddress: null, userAgent: null, requestId: null }
  const h = request.headers
  const xff = h.get('x-forwarded-for') ?? ''
  const ipAddress = xff.split(',')[0].trim() || h.get('x-real-ip') || null
  const userAgent = h.get('user-agent') || null
  const requestId = h.get('x-request-id') || h.get('x-vercel-id') || null
  return { ipAddress, userAgent, requestId }
}

export async function logAudit(input: AuditInput): Promise<void> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return
    }
    const admin = createSupabaseServiceClient()

    // fill actor_name/role from the users row when only an id is known
    let role = input.actorRole ?? null
    let name = input.actorName ?? null
    if (input.actorId && (!role || !name)) {
      const { data } = await admin
        .from('users').select('role, full_name').eq('id', input.actorId).maybeSingle()
      role = role ?? data?.role ?? null
      name = name ?? data?.full_name ?? null
    }

    const forensic = forensicFromRequest(input.request)

    const { error } = await admin.from('audit_log').insert({
      actor_id: input.actorId ?? null,
      actor_role: role,
      actor_name: name,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      client_id: input.clientId ?? null,
      summary: input.summary,
      metadata: input.metadata ?? {},
      ip_address: input.ipAddress ?? forensic.ipAddress,
      user_agent: input.userAgent ?? forensic.userAgent,
      request_id: input.requestId ?? forensic.requestId,
    })
    if (error) console.error('[audit] insert failed:', error.message)
  } catch (e) {
    console.error('[audit] unexpected:', e)
  }
}
