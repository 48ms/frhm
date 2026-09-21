import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { logAudit } from '@/lib/audit/log'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return denyUnauthorized()
  }

  let body: { type: 'client' | 'admin'; id: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
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

    // `clients` has no client UPDATE policy (only client_own_client FOR SELECT),
    // so a user-JWT UPDATE would silently affect 0 rows. Ownership is already
    // enforced above (isAdmin || isOwner), so use the service-role client here.
    const srv = createSupabaseServiceClient()
    const { error } = await srv
      .from('clients')
      .update({
        telegram_chat_id: null,
        telegram_username: null,
        telegram_notifications_enabled: false,
      })
      .eq('id', body.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    void logAudit({
      action: 'telegram.disconnect',
      entityType: 'client',
      entityId: body.id,
      clientId: body.id,
      summary: `Memutus koneksi Telegram client`,
      request,
    })

    return NextResponse.json({ ok: true })
  }

  if (body.type === 'admin') {
    // Admin memutuskan telegramnya sendiri
    const { error } = await supabase
      .from('users')
      .update({
        telegram_chat_id: null,
        telegram_username: null,
        telegram_notifications_enabled: false,
      })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    void logAudit({
      action: 'telegram.disconnect',
      actorId: user.id,
      entityType: 'user',
      entityId: user.id,
      summary: `Memutus koneksi Telegram admin`,
      request,
    })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
