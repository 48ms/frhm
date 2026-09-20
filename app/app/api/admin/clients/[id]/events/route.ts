import { NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const clientId = params.id
  const body = await req.json()

  const { name, description, event_date, location } = body

  if (!name || !event_date) {
    return NextResponse.json(
      { error: 'Nama dan tanggal event wajib diisi' },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      client_id: clientId,
      name,
      description: description || null,
      event_date: new Date(event_date).toISOString(),
      location: location || null,
      status: 'planned',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ event: data })
}
