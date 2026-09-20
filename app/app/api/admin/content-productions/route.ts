import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase
    .from('users')
    .select('role, client_id')
    .eq('id', user.id)
    .single()

  const url = new URL(request.url)
  const clientId = url.searchParams.get('client_id')

  if (profile?.role !== 'admin') {
    if (clientId && clientId !== profile?.client_id)
      return denyForbidden()
  }

  let query = supabase
    .from('content_productions')
    .select('*')
    .order('created_at', { ascending: false })

  if (clientId) query = query.eq('client_id', clientId)
  else if (profile?.role === 'client' && profile.client_id)
    query = query.eq('client_id', profile.client_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ productions: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin')
    return denyForbidden()

  const body = await request.json()
  const { client_id, title, platform, stage, priority, assignee, due_date, assets, notes } = body

  if (!client_id || !title) {
    return NextResponse.json({ error: 'client_id and title required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('content_productions')
    .insert({
      client_id,
      title,
      platform: platform || 'instagram',
      stage: stage || 'idea',
      priority: priority || 'normal',
      assignee: assignee || null,
      due_date: due_date || null,
      assets: assets || [],
      notes: notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    actorId: user.id,
    actorRole: 'admin',
    actorName: profile?.full_name || 'Admin',
    action: 'production.create',
    entityType: 'content_production',
    entityId: data.id,
    clientId: client_id,
    summary: `Buat task produksi "${title}" (${platform})`,
    metadata: { stage, priority },
  })

  return NextResponse.json({ production: data })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin')
    return denyForbidden()

  const body = await request.json()
  const { id, title, platform, stage, priority, assignee, due_date, assets, notes } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (title !== undefined) updates.title = title
  if (platform !== undefined) updates.platform = platform
  if (stage !== undefined) updates.stage = stage
  if (priority !== undefined) updates.priority = priority
  if (assignee !== undefined) updates.assignee = assignee
  if (due_date !== undefined) updates.due_date = due_date
  if (assets !== undefined) updates.assets = assets
  if (notes !== undefined) updates.notes = notes

  const { data, error } = await supabase
    .from('content_productions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ production: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin')
    return denyForbidden()

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('content_productions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
