import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const deliverableId = searchParams.get('deliverable_id')

  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const supabase = await createClient()

  // Base query – client can see all own feedback, optionally filter by deliverable
  let query = supabase
    .from('feedback')
    .select('id, rating, title, comment, status, created_at, responded_at, resolved_at')
    .eq('client_id', clientId)

  if (deliverableId) query = query.eq('deliverable_id', deliverableId)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ feedback: data ?? [] })
}

export async function POST(request: Request) {
  const { client_id, deliverable_id, rating, title, comment } = await request.json()

  if (!client_id || !rating || !title) {
    return NextResponse.json({ error: 'client_id, rating, title required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('feedback')
    .insert({
      client_id,
      deliverable_id: deliverable_id || null,
      rating,
      title,
      comment: comment || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ feedback: data })
}
