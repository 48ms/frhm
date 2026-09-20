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
  const { kanban_id, new_status } = await req.json()

  if (!kanban_id || !new_status) {
    return NextResponse.json({ error: 'kanban_id dan new_status wajib diisi' }, { status: 400 })
  }

  // Verify ownership
  const { data: owner } = await supabase
    .from('content_productions')
    .select('id')
    .eq('id', kanban_id)
    .eq('client_id', clientId)
    .maybeSingle()

  if (!owner) {
    return NextResponse.json({ error: 'Content production tidak ditemukan untuk klien ini' }, { status: 404 })
  }

  const { error } = await supabase
    .from('content_productions')
    .update({ status: new_status })
    .eq('id', kanban_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
