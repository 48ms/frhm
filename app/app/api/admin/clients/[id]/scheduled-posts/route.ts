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
  const { scheduled_post_id, publish_date } = await req.json()

  if (!scheduled_post_id || !publish_date) {
    return NextResponse.json({ error: 'scheduled_post_id dan publish_date wajib diisi' }, { status: 400 })
  }

  // Verify ownership
  const { data: owner } = await supabase
    .from('scheduled_posts')
    .select('id')
    .eq('id', scheduled_post_id)
    .eq('client_id', clientId)
    .maybeSingle()

  if (!owner) {
    return NextResponse.json({ error: 'Scheduled post tidak ditemukan untuk klien ini' }, { status: 404 })
  }

  const { error } = await supabase
    .from('scheduled_posts')
    .update({ publish_date: new Date(publish_date).toISOString() })
    .eq('id', scheduled_post_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
