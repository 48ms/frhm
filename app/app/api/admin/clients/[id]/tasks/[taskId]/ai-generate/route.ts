import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isResponse, resolveProvider, loadClientFiles } from '@/lib/ai/server'
import { chat } from '@/lib/ai/providers'
import { logAiUsage } from '@/lib/ai/usage'
import { buildTaskContextPrompt } from '@/lib/ai/task-context'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * POST /api/admin/clients/[id]/tasks/[taskId]/ai-generate
 *
 * Runs one or more skills scoped to a specific production task.
 * The task's context (title, platform, stage, notes, assets) is injected
 * into the prompt so the AI output is directly applicable to the task.
 *
 * Body: { skill_ids: string[], provider_id?: string }
 * Response: { results: [{ skill_id, ok, output?, error? }] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(ip, 'admin/ai/task-generate', RATE_LIMITS.ai.limit, RATE_LIMITS.ai.windowMs)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan AI. Coba lagi dalam beberapa detik.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const body = await request.json().catch(() => ({}))
  const skillIds: string[] = Array.isArray(body?.skill_ids) ? body.skill_ids : []
  const providerId: string | undefined = body?.provider_id
  const clientId = (await params).id
  const taskId = (await params).taskId

  if (skillIds.length === 0) {
    return NextResponse.json({ error: 'Pilih minimal satu skill' }, { status: 400 })
  }

  // Resolve provider
  const provider = await resolveProvider(supabase, providerId)
  if (!provider) {
    return NextResponse.json(
      { error: 'Belum ada provider AI. Atur di /admin/settings/ai dulu.' },
      { status: 400 }
    )
  }

  // Load task context
  const { data: task } = await supabase
    .from('content_productions')
    .select('id, title, platform, stage, notes, assets, priority')
    .eq('id', taskId)
    .eq('client_id', clientId)
    .single()

  if (!task) {
    return NextResponse.json({ error: 'Task tidak ditemukan' }, { status: 404 })
  }

  // Load brand context
  const files = await loadClientFiles(supabase, clientId)
  const brandProfile = files['brand-profile.md']
  if (!brandProfile) {
    return NextResponse.json(
      { error: 'Tolong selesaikan tahap Foundation (Brand Profile) terlebih dahulu.' },
      { status: 400 }
    )
  }

  // Only skills ASSIGNED to this client may run. Without this a caller could pass any
  // skill_id in the library and generate against a client that never got the skill.
  const { data: assigned } = await supabase
    .from('client_skills')
    .select('skill_id, skills!inner(id, name, stage)')
    .eq('client_id', clientId)
    .in('skill_id', skillIds)

  const assignedMap = new Map(
    (assigned ?? []).map((row) => {
      const s = row.skills as unknown as { id: string; name: string; stage: string } | null
      return [row.skill_id, s]
    })
  )

  const unauthorized = skillIds.filter((id) => !assignedMap.has(id))
  if (unauthorized.length > 0) {
    return NextResponse.json(
      { error: `Skill tidak terpasang untuk client ini: ${unauthorized.join(', ')}` },
      { status: 400 }
    )
  }

  const skillsMap = assignedMap

  // Build task context prompt
  const taskContext = buildTaskContextPrompt({
    title: task.title,
    platform: task.platform,
    stage: task.stage,
    priority: task.priority,
    notes: task.notes,
    assets: (task.assets as { name: string }[] | null) ?? [],
  })

  // Pre-fetch ALL SKILL.md files
  const { data: skillFiles } = await supabase
    .from('skill_files')
    .select('skill_id, content')
    .in('skill_id', skillIds)
    .eq('path', 'SKILL.md')

  const skillFilesMap = new Map((skillFiles ?? []).map(f => [f.skill_id, f.content]))

  // Run AI calls sequentially (skills may depend on each other's outputs)
  const results: { skill_id: string; ok: boolean; output?: string; error?: string }[] = []

  for (const skillId of skillIds) {
    const skillMeta = skillsMap.get(skillId)
    const skillContent = skillFilesMap.get(skillId)

    if (!skillContent) {
      results.push({ skill_id: skillId, ok: false, error: 'SKILL.md tidak ditemukan' })
      continue
    }

    // Build system prompt with task context
    const systemPrompt = [
      'You are operating under the following skill. Follow its instructions exactly.',
      '',
      '--- BEGIN SKILL ---',
      skillContent,
      '--- END SKILL ---',
      '',
      'The brand you are working for (always write in this brand voice):',
      '',
      brandProfile,
      '',
      taskContext,
      '',
      'Produce the deliverable for this task. Write in the same language as the task context.',
      'Write the complete deliverable in full — every section the skill specifies, not a summary.',
    ].join('\n')

    const startTime = Date.now()
    let text = ''

    try {
      text = await chat(provider, systemPrompt, [
        { role: 'user', content: `Jalankan skill ini untuk task produksi di atas dan berikan hasilnya.` }
      ])
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Gagal memanggil AI'
      results.push({ skill_id: skillId, ok: false, error: errMsg })
      await logAiUsage({
        userId: ctx.userId,
        clientId,
        route: 'api/admin/clients/[id]/tasks/[taskId]/ai-generate',
        model: provider.model,
        providerKind: provider.kind,
        promptTokens: 0,
        completionTokens: 0,
        latencyMs: Date.now() - startTime,
        errorMessage: errMsg,
        costEstimate: 0,
      }).catch(() => {})
      continue
    }

    const latencyMs = Date.now() - startTime
    if (!text?.trim()) {
      results.push({ skill_id: skillId, ok: false, error: 'AI mengembalikan hasil kosong' })
      continue
    }

    // Save to skill_outputs as draft
    const { error: insertError } = await supabase.from('skill_outputs').insert({
      client_id: clientId,
      skill_id: skillId,
      stage: skillMeta?.stage ?? 'plan',
      title: `${task.title} - ${skillMeta?.name ?? skillId}`,
      content: text,
      status: 'draft',
      production_id: task.id,
    })

    if (insertError) {
      results.push({ skill_id: skillId, ok: false, error: `Gagal menyimpan output: ${insertError.message}` })
      continue
    }

    results.push({ skill_id: skillId, ok: true, output: text })

    // Log usage
    await logAiUsage({
      userId: ctx.userId,
      clientId,
      route: 'api/admin/clients/[id]/tasks/[taskId]/ai-generate',
      model: provider.model,
      providerKind: provider.kind,
      promptTokens: 0,
      completionTokens: 0,
      latencyMs,
      errorMessage: undefined,
      costEstimate: 0,
    }).catch(() => {})
  }

  const okCount = results.filter((r) => r.ok).length
  const failCount = results.filter((r) => !r.ok).length

  return NextResponse.json({
    results,
    ok_count: okCount,
    fail_count: failCount,
    task_id: taskId,
  })
}
