import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'
import { denyUnauthorized } from '@/lib/auth/guard'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const rl = checkRateLimit(getClientIp(request.headers), 'social/audit', RATE_LIMITS.mutation.limit, RATE_LIMITS.mutation.windowMs)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return denyUnauthorized()
  }

  let body: {
    accountId: string
    handle: string
    platform: string
    oldScopes: string[]
    newScopes: string[]
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!body.accountId || !body.handle) {
    return NextResponse.json({ error: 'Missing accountId or handle' }, { status: 400 })
  }

  const added = body.newScopes.filter((s) => !body.oldScopes.includes(s))
  const removed = body.oldScopes.filter((s) => !body.newScopes.includes(s))

  if (added.length === 0 && removed.length === 0) {
    return NextResponse.json({ ok: true, changed: false })
  }

  await logAudit({
    actorId: user.id,
    action: 'social_scopes.update',
    entityType: 'social_account',
    // Prototype account ids are not UUIDs, so entity_id stays null and the
    // account is identified in metadata instead.
    entityId: null,
    summary: `Updated scopes for ${body.handle} (${body.platform}): added [${added.join(', ')}], removed [${removed.join(', ')}]`,
    metadata: {
      accountId: body.accountId,
      handle: body.handle,
      platform: body.platform,
      added,
      removed,
      oldScopes: body.oldScopes,
      newScopes: body.newScopes,
    },
    request,
  })

  return NextResponse.json({ ok: true, changed: true })
}
