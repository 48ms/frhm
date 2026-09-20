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

  const { searchParams } = new URL(request.url)
  const queryClientId = searchParams.get('client_id')
  const month = searchParams.get('month') // e.g. "2026-09"

  let clientId = queryClientId

  // If client role, enforce their own client_id
  if (profile?.role === 'client') {
    clientId = profile.client_id
  } else if (profile?.role !== 'admin') {
    return denyForbidden()
  }

  let query = supabase
    .from('scheduled_posts')
    .select('*, deliverables(title, type, status)')
    .order('scheduled_at', { ascending: true })

  if (clientId) {
    query = query.eq('client_id', clientId)
  }

  if (month) {
    // Filter by year-month
    const [year, m] = month.split('-')
    const startDate = new Date(Date.UTC(parseInt(year), parseInt(m) - 1, 1)).toISOString()
    const endDate = new Date(Date.UTC(parseInt(year), parseInt(m), 0, 23, 59, 59)).toISOString()
    query = query.gte('scheduled_at', startDate).lte('scheduled_at', endDate)
  }

  // Pagination: ?page=N&limit=M (default 50, max 100) — calendar view can override with limit=0 for all
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const rawLimit = parseInt(searchParams.get('limit') ?? '50', 10)
  // limit=0 explicitly means "no pagination" (calendar view needs a full month in one request)
  const limit = isNaN(rawLimit) ? 50 : (rawLimit === 0 ? 0 : Math.min(Math.max(1, rawLimit), 100))
  const from = (page - 1) * limit
  const to = from + limit - 1

  if (limit > 0) {
    query = query.range(from, to)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ posts: data ?? [], total: count ?? 0, page, limit })
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

  if (profile?.role !== 'admin') {
    return denyForbidden()
  }

  const body = await request.json()
  const { client_id, deliverable_id, title, content, platform, scheduled_at, status, notes, is_reserved, reserved_for, is_placeholder, priority, campaign_tag } = body

  // Reserved placeholder rows only need client_id + platform + scheduled_at.
  // Full posts require title + content.
  if (!client_id || !platform || !scheduled_at) {
    return NextResponse.json({ error: 'client_id, platform, dan scheduled_at wajib diisi' }, { status: 400 })
  }

  if (!is_placeholder && !title) {
    return NextResponse.json({ error: 'title wajib diisi untuk postingan biasa' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('scheduled_posts')
    .insert({
      client_id,
      deliverable_id: deliverable_id || null,
      title: title || (is_placeholder ? 'Slot Tersedia' : null),
      content: content || '',
      platform: platform.toLowerCase(),
      scheduled_at,
      status: status || (is_placeholder ? 'draft' : 'scheduled'),
      notes: notes || null,
      is_reserved: is_reserved ?? false,
      reserved_for: reserved_for || null,
      is_placeholder: is_placeholder ?? false,
      priority: priority || 'normal',
      campaign_tag: campaign_tag || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit({
    actorId: user.id,
    actorRole: 'admin',
    actorName: profile?.full_name || 'Admin',
    action: is_placeholder ? 'scheduled_post.reserve' : 'scheduled_post.create',
    entityType: 'scheduled_post',
    entityId: data.id,
    clientId: client_id,
    summary: is_placeholder
      ? `Reserve slot ${platform} untuk ${reserved_for ?? 'kampanye'} pada ${new Date(scheduled_at).toLocaleDateString('id-ID')}`
      : `Menjadwalkan postingan "${title}" ke ${platform} untuk ${new Date(scheduled_at).toLocaleDateString('id-ID')}`,
    metadata: { platform, scheduled_at, is_placeholder },
  })

  return NextResponse.json({ post: data })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return denyForbidden()
  }

  const body = await request.json()
  const { id, title, content, platform, scheduled_at, status, notes, is_reserved, reserved_for, is_placeholder, priority, campaign_tag } = body

  if (!id) {
    return NextResponse.json({ error: 'id wajib disertakan' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (title !== undefined) updates.title = title
  if (content !== undefined) updates.content = content
  if (platform !== undefined) updates.platform = platform.toLowerCase()
  if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at
  if (status !== undefined) updates.status = status
  if (notes !== undefined) updates.notes = notes
  if (is_reserved !== undefined) updates.is_reserved = is_reserved
  if (reserved_for !== undefined) updates.reserved_for = reserved_for
  if (is_placeholder !== undefined) updates.is_placeholder = is_placeholder
  if (campaign_tag !== undefined) updates.campaign_tag = campaign_tag || null
  if (priority !== undefined) updates.priority = priority

  const { data, error } = await supabase
    .from('scheduled_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit({
    actorId: user.id,
    actorRole: 'admin',
    actorName: profile?.full_name || 'Admin',
    action: 'scheduled_post.update',
    entityType: 'scheduled_post',
    entityId: id,
    clientId: data.client_id,
    summary: `Memperbarui jadwal postingan "${data.title}"`,
    metadata: updates,
  })

  return NextResponse.json({ post: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return denyForbidden()
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id parameter is required' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('scheduled_posts')
    .select('client_id, title')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('scheduled_posts')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (existing) {
    await logAudit({
      actorId: user.id,
      actorRole: 'admin',
      actorName: profile?.full_name || 'Admin',
      action: 'scheduled_post.delete',
      entityType: 'scheduled_post',
      entityId: id,
      clientId: existing.client_id,
      summary: `Menghapus jadwal postingan "${existing.title}"`,
      metadata: { id },
    })
  }

  return NextResponse.json({ success: true })
}
