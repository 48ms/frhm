import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role, client_id')
    .eq('id', user.id)
    .single()

  const url = new URL(request.url)
  const clientId = url.searchParams.get('client_id')

  // admin bisa lihat semua / client hanya miliknya
  if (profile?.role !== 'admin') {
    if (clientId && clientId !== profile?.client_id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let query = supabase
    .from('content_campaigns')
    .select('*')
    .order('start_date', { ascending: false })

  if (clientId) query = query.eq('client_id', clientId)
  else if (profile?.role === 'client' && profile.client_id)
    query = query.eq('client_id', profile.client_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaigns: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { client_id, name, type, start_date, end_date, color, notes } = body

  if (!client_id || !name || !type) {
    return NextResponse.json({ error: 'client_id, name, type required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('content_campaigns')
    .insert({
      client_id,
      name,
      type,
      start_date: start_date || null,
      end_date: end_date || null,
      color: color || '#3b82f6',
      notes: notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    actorId: user.id,
    actorRole: 'admin',
    actorName: profile?.full_name || 'Admin',
    action: 'campaign.create',
    entityType: 'content_campaign',
    entityId: data.id,
    clientId: client_id,
    summary: `Buat kampanye "${name}" (${type})`,
    metadata: { type, start_date, end_date },
  })

  return NextResponse.json({ campaign: data })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { id, name, type, start_date, end_date, color, notes } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (type !== undefined) updates.type = type
  if (start_date !== undefined) updates.start_date = start_date || null
  if (end_date !== undefined) updates.end_date = end_date || null
  if (color !== undefined) updates.color = color
  if (notes !== undefined) updates.notes = notes

  const { data, error } = await supabase
    .from('content_campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    actorId: user.id,
    actorRole: 'admin',
    actorName: profile?.full_name || 'Admin',
    action: 'campaign.update',
    entityType: 'content_campaign',
    entityId: id,
    clientId: data.client_id,
    summary: `Update kampanye "${data.name}"`,
    metadata: updates,
  })

  return NextResponse.json({ campaign: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id parameter required' }, { status: 400 })

  // unlink scheduled posts first, then delete
  await supabase.from('scheduled_posts').update({ campaign_tag: null }).eq('campaign_tag', id)
  const { error } = await supabase.from('content_campaigns').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
