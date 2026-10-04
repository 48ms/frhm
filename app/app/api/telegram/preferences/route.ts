import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request) {
  const rl = checkRateLimit(getClientIp(request.headers), 'telegram/preferences', RATE_LIMITS.mutation.limit, RATE_LIMITS.mutation.windowMs)
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

  let body: { enabled: boolean; type: 'client' | 'admin'; id: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'Field "enabled" harus boolean' }, { status: 400 })
  }

  if (body.type === 'client') {
    // Pastikan user memiliki akses ke client ini
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, client_id')
      .eq('id', user.id)
      .single()

    const isAdmin = userProfile?.role === 'admin'
    const isOwner = userProfile?.client_id === body.id

    if (!isAdmin && !isOwner) {
      return denyForbidden()
    }

    // The `clients` table only grants SELECT to client users (policy
    // client_own_client is FOR SELECT), so a client's UPDATE via the
    // anon/publishable key silently affects 0 rows. We already verified
    // ownership above, so perform the write with the service role.
    const admin = createSupabaseServiceClient()

    const { data: updated, error } = await admin
      .from('clients')
      .update({ telegram_notifications_enabled: body.enabled })
      .eq('id', body.id)
      .select('id, telegram_notifications_enabled')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!updated) {
      return NextResponse.json({ error: 'Client tidak ditemukan atau tidak bisa diubah' }, { status: 404 })
    }

    void logAudit({
      action: 'telegram_prefs.update',
      entityType: 'client',
      entityId: body.id,
      clientId: body.id,
      summary: `Preferensi Telegram client ${body.enabled ? 'diaktifkan' : 'dinonaktifkan'}`,
      metadata: { enabled: body.enabled },
      request,
    })

    return NextResponse.json({ ok: true, enabled: body.enabled })
  }

  if (body.type === 'admin') {
    // Admin mengubah preferensi notifikasi miliknya sendiri
    if (body.id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: hanya bisa mengubah preferensi sendiri' }, { status: 403 })
    }

    const { error } = await supabase
      .from('users')
      .update({ telegram_notifications_enabled: body.enabled })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    void logAudit({
      action: 'telegram_prefs.update',
      actorId: user.id,
      entityType: 'user',
      entityId: user.id,
      summary: `Preferensi Telegram admin ${body.enabled ? 'diaktifkan' : 'dinonaktifkan'}`,
      metadata: { enabled: body.enabled },
      request,
    })

    return NextResponse.json({ ok: true, enabled: body.enabled })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}