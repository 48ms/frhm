import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit/log'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

/**
 * POST /api/admin/clients/[id]/outputs/[outputId]/send
 *
 * Promote a skill output into a deliverable bound for the client — this is the step that turns
 * "the agent drafted" into "the human judges". Mirrors the repo rule: the bridge publishes only
 * finished, approved work; a deliverable is what the client sees and acts on (draft → sent →
 * approved | revision_requested).
 *
 * The deliverable type is inferred from the skill's pipeline stage (foundation/plan → brief,
 * create/media → content, grow/measure → report). The admin can override the title.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string; outputId: string } },
) {
  const clientId = params.id
  const outputId = params.outputId

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
          catch { /* server component */ }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang bisa mengirim' }, { status: 403 })
  }

  const { data: output } = await supabase
    .from('skill_outputs')
    .select('id, client_id, skill_id, stage, title, content, status, deliverable_id')
    .eq('id', outputId)
    .eq('client_id', clientId)
    .single()

  if (!output) return NextResponse.json({ error: 'Hasil tidak ditemukan' }, { status: 404 })
  if (output.deliverable_id) {
    return NextResponse.json({ error: 'Hasil ini sudah dikirim ke client' }, { status: 409 })
  }

  // stage → type by default (brief/konten/laporan), but the admin may override
  const body = await request.json().catch(() => ({}))
  const stage = output.stage ?? 'create'
  let type = 'content'
  if (['foundation', 'plan', 'publish'].includes(stage)) type = 'brief'
  if (['grow', 'measure'].includes(stage)) type = 'report'
  if (body.type && ['brief', 'content', 'report'].includes(body.type)) type = body.type

  const title = String(body.title ?? '').trim() || output.title

  const { data: deliverable, error: delErr } = await supabase
    .from('deliverables')
    .insert({
      client_id: clientId,
      type,
      title,
      content_md: output.content,
      status: 'draft',
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single()

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 })

  // link the output to the deliverable so the two stay in sync
  const { error: linkErr } = await supabase
    .from('skill_outputs')
    .update({ deliverable_id: deliverable.id, status: 'sent' })
    .eq('id', output.id)

  if (linkErr) {
    // deliverable was created but link failed — surface it; the orphan can be cleared later
    return NextResponse.json({ error: linkErr.message, deliverable }, { status: 500 })
  }

  await logAudit({
    actorId: user.id,
    actorRole: 'admin',
    action: 'deliverable.send',
    entityType: 'deliverable',
    entityId: deliverable.id,
    clientId,
    summary: `Admin mengirim "${title}" ke client`,
    metadata: { title, type, skill_id: output.skill_id, stage: output.stage },
  })

  return NextResponse.json({ success: true, deliverable, output_id: output.id }, { status: 201 })
}