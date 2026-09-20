import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const CompetitorSchema = z.object({
  brand_name: z.string().min(2),
  platform: z.enum(['instagram', 'tiktok', 'facebook', 'linkedin', 'twitter']),
  avg_reach: z.number().int().min(0).default(0),
  avg_er: z.number().min(0).max(100).default(0),
  weekly_posts: z.number().int().min(0).default(0),
  notes: z.string().optional().nullable(),
})

// GET /api/admin/clients/[id]/competitors
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: competitors, error } = await supabase
    .from('competitor_benchmarks')
    .select('*')
    .eq('client_id', clientId)
    .order('brand_name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ competitors: competitors || [] })
}

// POST /api/admin/clients/[id]/competitors
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = CompetitorSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload tidak valid', details: parsed.error.flatten() }, { status: 400 })
  }

  const { data: competitor, error } = await supabase
    .from('competitor_benchmarks')
    .insert({
      client_id: clientId,
      ...parsed.data
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ competitor })
}

// DELETE /api/admin/clients/[id]/competitors
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const competitorId = url.searchParams.get('id')
  if (!competitorId) return NextResponse.json({ error: 'competitor id required' }, { status: 400 })

  const { error } = await supabase
    .from('competitor_benchmarks')
    .delete()
    .eq('id', competitorId)
    .eq('client_id', clientId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
