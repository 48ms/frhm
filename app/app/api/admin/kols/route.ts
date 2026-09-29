import { NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'

export const dynamic = 'force-dynamic'

/**
 * KOL & vendor CRM.
 *
 * GET  /api/admin/kols?client_id=<uuid>           list KOLs for a client
 * POST /api/admin/kols                            create / update / delete
 *   body: { action: 'create'|'update'|'delete', id?, name?, niche?, contact_info?, rate_card? }
 */
export async function GET(req: Request) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('client_id')

  let query = supabase.from('kols').select('*')
  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query.order('name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ kols: data ?? [] })
}

export async function POST(req: Request) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const { action, client_id, id, name, niche, contact_info, rate_card, platforms, notes } = await req.json()

  if (!action) {
    return NextResponse.json({ error: 'action wajib diisi' }, { status: 400 })
  }

  if (action === 'delete' && id) {
    const { error } = await supabase.from('kols').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // create / update both need a client_id
  if (!client_id) {
    return NextResponse.json({ error: 'client_id wajib diisi' }, { status: 400 })
  }

  const payload = {
    client_id,
    name,
    niche: niche || null,
    contact_info: contact_info || null,
    rate_card: rate_card ? Number(rate_card) : 0,
    platforms: platforms || [],
    notes: notes || null,
  }

  if (action === 'update' && id) {
    const { error } = await supabase
      .from('kols')
      .update(payload)
      .eq('id', id)
      .eq('client_id', client_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (action === 'create') {
    const { data, error } = await supabase
      .from('kols')
      .insert(payload)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ kol: data })
  } else {
    return NextResponse.json({ error: 'action tidak valid' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
