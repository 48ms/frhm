import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { logAudit } from '@/lib/audit/log'

export const dynamic = 'force-dynamic'

/** PATCH /api/admin/deliverables/[id] — edit deliverable.
 *  If the deliverable is currently approved/revision_requested, editing it
 *  resets status to 'draft' (T016). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = checkRateLimit(getClientIp(req.headers), 'admin/deliverables', RATE_LIMITS.mutation.limit, RATE_LIMITS.mutation.windowMs)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi dalam beberapa detik.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase, userId } = ctx

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 })

  const allowed = ['title', 'type', 'content_md', 'external_link', 'client_id']
  const patch: Record<string, unknown> = {}
  for (const k of allowed) if (k in body) patch[k] = body
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Tidak ada field untuk diubah' }, { status: 400 })
  }

  // current status → decide whether to reset
  const { data: current } = await supabase
    .from('deliverables').select('status').eq('id', (await params).id).single()

  let resetToDraft = false
  if (current && (current.status === 'approved' || current.status === 'revision_requested')) {
    patch.status = 'draft'
    resetToDraft = true
  }
  patch.updated_by = userId

  const { data, error } = await supabase
    .from('deliverables').update(patch).eq('id', (await params).id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  void logAudit({
    action: resetToDraft ? 'deliverable.edit_reset_to_draft' : 'deliverable.edit',
    actorId: userId,
    actorRole: 'admin',
    entityType: 'deliverable',
    entityId: (await params).id,
    clientId: data.client_id as string | null,
    summary: resetToDraft
      ? `Mengedit deliverable ${(await params).id} → status direset ke draft`
      : `Mengedit deliverable ${(await params).id}`,
    request: req,
  })

  return NextResponse.json({ data, reset_to_draft: resetToDraft })
}

/** DELETE /api/admin/deliverables/[id] — only allowed when status = 'draft' (T017). */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase, userId } = ctx

  const { data: current } = await supabase
    .from('deliverables').select('status, client_id').eq('id', (await params).id).single()

  if (!current) return NextResponse.json({ error: 'Deliverable tidak ditemukan' }, { status: 404 })
  if (current.status !== 'draft') {
    return NextResponse.json(
      { error: 'Hanya deliverable berstatus draft yang bisa dihapus' },
      { status: 400 }
    )
  }

  const { error } = await supabase.from('deliverables').delete().eq('id', (await params).id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  void logAudit({
    action: 'deliverable.delete',
    actorId: userId,
    actorRole: 'admin',
    entityType: 'deliverable',
    entityId: (await params).id,
    clientId: (current.client_id as string | null) ?? null,
    summary: `Menghapus deliverable ${(await params).id}`,
    request: req,
  })

  return NextResponse.json({ success: true })
}