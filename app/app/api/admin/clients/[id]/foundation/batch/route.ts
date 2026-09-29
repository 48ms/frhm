import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'
import { logAudit } from '@/lib/audit/log'

export const dynamic = 'force-dynamic'
export const maxDuration = 800

/**
 * Batch generation of the 3 foundation files that can be derived from brand-profile.md:
 *   audience.md → social-strategy.md → content-pillars.md
 *
 * Run order matters (from pipeline_map.json):
 *   - audience-research  reads [brand-profile.md]
 *   - social-strategy    reads [audience.md, brand-profile.md]
 *   - content-pillars    reads [brand-profile.md, voice.md]
 *
 * Chain guard: stop at the first failure — later skills read earlier artifacts, so
 * continuing after a failure would produce a document built on a missing input.
 *
 * voice.md is deliberately NOT in this batch: voice-builder derives voice from real writing
 * samples, and the repo forbids inventing one from the brand profile alone.
 *
 * POST /api/admin/clients/[id]/foundation/batch
 * Response: { success, files: [{path, status}], errors: [] }
 */
const BATCH_SKILLS = ['audience-research', 'social-strategy', 'content-pillars'] as const

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx
  const { id: clientId } = await params

  // Guard 1: the client must exist.
  const { data: client } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .single()
  if (!client) {
    return NextResponse.json({ error: 'Client tidak ditemukan' }, { status: 404 })
  }

  // Guard 2: brand-profile.md must exist — every skill in the batch reads it first.
  const { data: profile } = await supabase
    .from('client_files')
    .select('content')
    .eq('client_id', clientId)
    .eq('path', 'brand-profile.md')
    .maybeSingle()
  if (!profile?.content) {
    return NextResponse.json(
      { error: 'brand-profile.md belum ada. Isi brand profile dulu sebelum generate.' },
      { status: 400 }
    )
  }

  // Resolve each skill's declared output path from the DB (skills.writes_files),
  // so we never guess a filename.
  const { data: skillRows, error: skillErr } = await supabase
    .from('skills')
    .select('id, name, writes_files')
    .in('id', BATCH_SKILLS as unknown as string[])
  if (skillErr) {
    return NextResponse.json({ error: skillErr.message }, { status: 400 })
  }

  const outputPath: Record<string, string | null> = {}
  for (const s of skillRows ?? []) {
    const writes: string[] = Array.isArray(s.writes_files) ? (s.writes_files as string[]) : []
    outputPath[s.id] = writes[0] ?? null
  }
  const missing = BATCH_SKILLS.filter((id) => !outputPath[id])
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Skill tidak punya writes_files: ${missing.join(', ')}` },
      { status: 400 }
    )
  }

  const origin = request.nextUrl.origin
  const cookie = request.headers.get('cookie') ?? ''

  const results: Array<{ path: string; status: 'ada' | 'gagal'; error?: string }> = []
  let stopped = false

  for (const skillId of BATCH_SKILLS) {
    if (stopped) {
      results.push({ path: outputPath[skillId] as string, status: 'gagal', error: 'Dilewati: langkah sebelumnya gagal' })
      continue
    }

    const path = outputPath[skillId] as string
    try {
      // Drive the interview until the artifact is produced (the model may ask questions
      // first even when told not to). Same loop as scripts/run_skill.py: at most 4 turns.
      const msgs: Array<{ role: 'user' | 'assistant'; content: string }> = [
        {
          role: 'user',
          content:
            'Mulai sesi untuk klien ini. Semua yang kamu butuhkan sudah ada di workspace. ' +
            'Jangan bertanya balik — langsung tulis artifact-nya lengkap sesuai template skill.',
        },
      ]
      let file: { path?: string; content?: string } | null = null
      const nudge =
        'Ya, semua sudah benar. Silakan lanjut tulis artifact-nya lengkap sesuai template skill.'

      for (let turn = 0; turn < 4 && !file; turn++) {
        const res = await fetch(`${origin}/api/admin/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie },
          body: JSON.stringify({
            client_id: clientId,
            skill_id: skillId,
            messages: msgs,
          }),
        })

        if (!res.ok) {
          const detail = await res.text().catch(() => '')
          results.push({ path, status: 'gagal', error: `HTTP ${res.status}: ${detail.slice(0, 160)}` })
          stopped = true
          break
        }

        const body = await res.json().catch(() => ({}))
        if (body?.error) {
          results.push({ path, status: 'gagal', error: String(body.error).slice(0, 160) })
          stopped = true
          break
        }

        // If the model produced the artifact this turn, grab it.
        const candidate = body?.file
        if (candidate?.content && (!candidate.path || candidate.path === path)) {
          file = { path, content: String(candidate.content) }
          break
        }

        // Otherwise keep the conversation going: echo the reply and nudge once more.
        if (body?.reply && turn < 3) {
          msgs.push({ role: 'assistant', content: String(body.reply) })
          msgs.push({ role: 'user', content: nudge })
        } else {
          results.push({ path, status: 'gagal', error: 'Skill tidak menghasilkan artifact pada sesi ini' })
          stopped = true
          break
        }
      }

      if (!file) {
        if (!stopped && results[results.length - 1]?.status !== 'gagal') {
          results.push({ path, status: 'gagal', error: 'Skill tidak selesai dalam 4 turn' })
          stopped = true
        }
        continue
      }

      // Save to the client folder. Same upsert key as the files route: (client_id, path).
      const { error: saveErr } = await supabase
        .from('client_files')
        .upsert(
          { client_id: clientId, path, content: file.content, updated_at: new Date().toISOString() },
          { onConflict: 'client_id,path' }
        )
      if (saveErr) {
        results.push({ path, status: 'gagal', error: saveErr.message })
        stopped = true
        continue
      }

      results.push({ path, status: 'ada' })
    } catch (e) {
      results.push({ path, status: 'gagal', error: (e as Error)?.message ?? 'unknown error' })
      stopped = true
    }
  }

  const errors = results.filter((r) => r.status === 'gagal').map((r) => `${r.path}: ${r.error ?? 'gagal'}`)
  const generated = results.filter((r) => r.status === 'ada').length

  await logAudit({
    actorId: ctx.userId,
    actorRole: 'admin',
    action: 'client.foundation.batch',
    entityType: 'client',
    entityId: clientId,
    clientId,
    summary: `Batch generate foundation: ${generated}/${BATCH_SKILLS.length} file`,
    metadata: { results: results.map((r) => ({ path: r.path, status: r.status })) },
  })

  return NextResponse.json({
    success: errors.length === 0,
    generated,
    files: results,
    errors,
  })
}
