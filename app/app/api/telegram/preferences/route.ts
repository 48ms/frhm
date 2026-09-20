import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('clients')
      .update({ telegram_notifications_enabled: body.enabled })
      .eq('id', body.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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

    return NextResponse.json({ ok: true, enabled: body.enabled })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}