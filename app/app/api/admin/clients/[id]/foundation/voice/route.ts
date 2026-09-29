import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'
import { logAudit } from '@/lib/audit/log'

export const dynamic = 'force-dynamic'
export const maxDuration = 800

/**
 * Generate voice.md from real writing samples.
 *
 * Unlike the batch endpoint, voice-builder requires the user to supply actual writing
 * samples (3-5, from voice-builder/SKILL.md: "3 is the floor"). The repo forbids inventing
 * a voice from the brand profile alone, so this endpoint exists precisely for the case
 * where samples ARE available.
 *
 * The samples are injected into the conversation as a user message, then the same
 * interactive chat route drives the skill interview until it emits voice.md.
 *
 * POST /api/admin/clients/[id]/foundation/voice
 * Body: { samples: string[] }
 * Response: { success, file: { path: "voice.md", content }, errors: [] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx
  const { id: clientId } = await params

  const body = await request.json().catch(() => ({}))
  const samples: unknown = body?.samples

  // Validate: at least 3 substantial samples (repo rule: "3 is the floor").
  if (!Array.isArray(samples) || samples.length < 3) {
    return NextResponse.json(
      { error: 'Minimal 3 sampel tulisan asli. Tempel contoh tulisan klien dulu.' },
      { status: 400 }
    )
  }
  const sampleTexts = samples
    .map((s) => String(s ?? '').trim())
    .filter((s) => s.length > 0)
  if (sampleTexts.length < 3) {
    return NextResponse.json(
      { error: 'Minimal 3 sampel tulisan asli, masing-masing tidak boleh kosong.' },
      { status: 400 }
    )
  }
  const totalChars = sampleTexts.reduce((sum, s) => sum + s.length, 0)
  if (totalChars < 100) {
    return NextResponse.json(
      { error: 'Sampel terlalu pendek. Minimal 100 karakter total untuk bisa menganalisis voice.' },
      { status: 400 }
    )
  }

  // Guard: client exists.
  const { data: client } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .single()
  if (!client) {
    return NextResponse.json({ error: 'Client tidak ditemukan' }, { status: 404 })
  }

  // Guard: voice-builder skill must exist with writes_files = ['voice.md'].
  const { data: skillRow, error: skillErr } = await supabase
    .from('skills')
    .select('id, writes_files')
    .eq('id', 'voice-builder')
    .maybeSingle()
  if (skillErr || !skillRow) {
    return NextResponse.json({ error: 'Skill voice-builder tidak ada di database.' }, { status: 400 })
  }
  const writes: string[] = Array.isArray(skillRow.writes_files) ? skillRow.writes_files : []
  const path = writes[0]
  if (writes.length === 0 || path !== 'voice.md') {
    return NextResponse.json(
      { error: 'Skill voice-builder tidak menghasilkan voice.md sesuai konfigurasi.' },
      { status: 400 }
    )
  }

  const origin = request.nextUrl.origin
  const cookie = request.headers.get('cookie') ?? ''

  // Initial instructions + the actual samples as the first user turn.
  const samplesBlock = sampleTexts.map((s, i) => `### SAMPEL ${i + 1}\n\n${s}`).join('\n\n')
  const msgs: Array<{ role: 'user' | 'assistant'; content: string }> = [
    {
      role: 'user',
      content:
        'Saya beri kamu contoh tulisan asli klien berikut. Analisis sesuai skill voice-builder ' +
        'sampai menghasilkan voice.md lengkap.\n\n' +
        samplesBlock +
        '\n\nJangan bertanya balik. Langsung tulis voice.md sesuai template skill, lengkap.',
    },
  ]

  let file: { path?: string; content?: string } | null = null
  const nudge =
    'Ya, semua sudah benar. Silakan lanjut tulis voice.md lengkap sesuai template skill.'

  const results: Array<{ path: string; status: 'ada' | 'gagal'; error?: string }> = []

  try {
    for (let turn = 0; turn < 4 && !file; turn++) {
      const res = await fetch(`${origin}/api/admin/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie },
        body: JSON.stringify({
          client_id: clientId,
          skill_id: 'voice-builder',
          messages: msgs,
        }),
      })

      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        results.push({ path, status: 'gagal', error: `HTTP ${res.status}: ${detail.slice(0, 160)}` })
        break
      }

      const body = await res.json().catch(() => ({}))
      if (body?.error) {
        results.push({ path, status: 'gagal', error: String(body.error).slice(0, 160) })
        break
      }

      const candidate = body?.file
      if (candidate?.content) {
        file = { path, content: String(candidate.content) }
        break
      }

      // Keep the conversation going, same nudge pattern as the batch endpoint.
      if (body?.reply && turn < 3) {
        msgs.push({ role: 'assistant', content: String(body.reply) })
        msgs.push({ role: 'user', content: nudge })
      } else {
        results.push({ path, status: 'gagal', error: 'Skill tidak menghasilkan voice.md pada sesi ini' })
        break
      }
    }

    if (!file) {
      if (results.length === 0) {
        results.push({ path, status: 'gagal', error: 'Skill tidak selesai dalam 4 turn' })
      }
      return NextResponse.json({ success: false, files: results, errors: results.map((r) => `${r.path}: ${r.error ?? 'gagal'}`) }, { status: 502 })
    }

    // Save voice.md to the client folder (same upsert key as files route).
    const { error: saveErr } = await supabase
      .from('client_files')
      .upsert(
        { client_id: clientId, path, content: file.content, updated_at: new Date().toISOString() },
        { onConflict: 'client_id,path' }
      )
    if (saveErr) {
      return NextResponse.json(
        { error: `Gagal menyimpan voice.md: ${saveErr.message}` },
        { status: 500 }
      )
    }

    await logAudit({
      actorId: ctx.userId,
      actorRole: 'admin',
      action: 'client.foundation.voice',
      entityType: 'client',
      entityId: clientId,
      clientId,
      summary: `Generate voice.md dari ${sampleTexts.length} sampel tulisan asli`,
      metadata: { samples: sampleTexts.length, content_length: file.content!.length },
    })

    return NextResponse.json({
      success: true,
      file: { path, content: file.content! },
      files: [{ path, status: 'ada' as const }],
      errors: [],
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error'
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    )
  }
}