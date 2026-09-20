import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'

export const dynamic = 'force-dynamic'

/** GET client feedback list (for client portal) */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify user belongs to this client
  const { data: profile } = await supabase
    .from('users').select('client_id, role, full_name').eq('id', user.id).single()
  if (!profile || profile.client_id !== clientId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const deliverableId = searchParams.get('deliverable_id')

  let query = supabase
    .from('feedback')
    .select('id, rating, title, comment, status, created_at, responded_at, resolved_at, deliverable_id')
    .eq('client_id', clientId)

  if (deliverableId) query = query.eq('deliverable_id', deliverableId)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ feedback: data ?? [] })
}

/** POST new feedback (client portal) */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('client_id, role, full_name').eq('id', user.id).single()
  if (!profile || profile.client_id !== clientId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { deliverable_id, rating, title, comment } = body

  if (!rating || rating < 1 || rating > 5 || !title) {
    return NextResponse.json({ error: 'rating (1-5) and title required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('feedback')
    .insert({
      client_id: clientId,
      deliverable_id: deliverable_id || null,
      rating,
      title,
      comment: comment || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    actorId: user.id,
    actorRole: 'client',
    actorName: profile.full_name || 'Client',
    action: 'feedback.create',
    entityType: 'feedback',
    entityId: data.id,
    clientId,
    summary: `Client mengirim feedback "${title}" rating ${rating}`,
  })

  return NextResponse.json({ feedback: data })
}
