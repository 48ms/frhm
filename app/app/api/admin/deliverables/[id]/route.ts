import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logAudit } from '@/lib/audit/log'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch { /* server component */ }
        },
      },
    }
  )
}

/** PATCH /api/admin/deliverables/[id] — edit deliverable.
 *  If the deliverable is currently approved/revision_requested, editing it
 *  resets status to 'draft' (T016). */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const rl = checkRateLimit(getClientIp(req.headers), 'admin/deliverables', RATE_LIMITS.mutation.limit, RATE_LIMITS.mutation.windowMs)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi dalam beberapa detik.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 })

  const allowed = ['title', 'type', 'content_md', 'external_link', 'client_id']
  const patch: Record<string, unknown> = {}
  for (const k of allowed) if (k in body) patch[k] = body[k]
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Tidak ada field untuk diubah' }, { status: 400 })
  }

  // current status → decide whether to reset
  const { data: current } = await supabase
    .from('deliverables').select('status').eq('id', params.id).single()

  let resetToDraft = false
  if (current && (current.status === 'approved' || current.status === 'revision_requested')) {
    patch.status = 'draft'
    resetToDraft = true
  }
  patch.updated_by = user.id

  const { data, error } = await supabase
    .from('deliverables').update(patch).eq('id', params.id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  void logAudit({
    action: resetToDraft ? 'deliverable.edit_reset_to_draft' : 'deliverable.edit',
    actorId: user.id,
    actorRole: 'admin',
    entityType: 'deliverable',
    entityId: params.id,
    clientId: data.client_id as string | null,
    summary: resetToDraft
      ? `Mengedit deliverable ${params.id} → status direset ke draft`
      : `Mengedit deliverable ${params.id}`,
    request: req,
  })

  return NextResponse.json({ data, reset_to_draft: resetToDraft })
}

/** DELETE /api/admin/deliverables/[id] — only allowed when status = 'draft' (T017). */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: current } = await supabase
    .from('deliverables').select('status, client_id').eq('id', params.id).single()

  if (!current) return NextResponse.json({ error: 'Deliverable tidak ditemukan' }, { status: 404 })
  if (current.status !== 'draft') {
    return NextResponse.json(
      { error: 'Hanya deliverable berstatus draft yang bisa dihapus' },
      { status: 400 }
    )
  }

  const { error } = await supabase.from('deliverables').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  void logAudit({
    action: 'deliverable.delete',
    actorId: user.id,
    actorRole: 'admin',
    entityType: 'deliverable',
    entityId: params.id,
    clientId: (current.client_id as string | null) ?? null,
    summary: `Menghapus deliverable ${params.id}`,
    request: req,
  })

  return NextResponse.json({ success: true })
}
