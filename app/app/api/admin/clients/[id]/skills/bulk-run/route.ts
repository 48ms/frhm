import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { chatDetailed, type Provider } from '@/lib/ai/providers'
import { logAiUsage } from '@/lib/ai/usage'
import { logAudit } from '@/lib/audit/log'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'
import { loadClientFiles } from '@/lib/ai/server'
import {
  loadGroundTruths,
  loadSkillGuardrailsBatch,
  groundTruthsBlock,
  VERIFY_QUARTERLY_RULE,
  hasVolatileFacts,
} from '@/lib/ai/prompt-context'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST /api/admin/clients/[id]/skills/bulk-run
 *
 * Runs several skills back-to-back for one client and saves each result to `skill_outputs`.
 * The single-skill path lives at /api/admin/ai/run; this is the batch sibling so an admin can
 * take a whole stage's worth of skills in one go instead of one-at-a-time.
 *
 * Body: { skill_ids: string[], brief?: string, provider_id?: string }
 * Response: { results: [{ skill_id, ok, output?, error? }] }  — always 200 unless auth/shape fail,
 * because a partial batch is normal and the caller shows per-skill status.
 */

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) {
          try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { /* server */ }
        },
      },
    }
  )
}

function brandBlock(name: string, bp: Record<string, unknown>): string {
  const f = (k: string) => (bp?.[k] as string) || '-'
  const pillars = Array.isArray(bp?.pillars) && (bp.pillars as string[]).length
    ? (bp.pillars as string[]).join(', ')
    : '-'
  return [
    `# Brand Profile: ${name}`,
    `Siapa brand: ${f('who')}`,
    `Target audiens: ${f('audience')}`,
    `Voice & tone: ${f('voice')}`,
    `Sudut pandang: ${f('pov')}`,
    `Bukti/kredibilitas: ${f('proof')}`,
    `Batasan: ${f('guardrails')}`,
    `Pilar konten: ${pillars}`,
  ].join('\n')
}

function buildSystemPrompt(
  skillMd: string,
  workspace: string,
  guardrailsBlockText: string = '',
  truthsBlock: string = ''
): string {
  return [
    'You are operating under the following skill. Follow its instructions exactly.',
    'The skill text below is the authoritative specification — do not summarise it, apply it.',
    '',
    '--- BEGIN SKILL ---',
    skillMd,
    '--- END SKILL ---',
    '',
    'The client workspace you are working from (always write in this brand voice):',
    '',
    workspace,
    guardrailsBlockText,
    truthsBlock,
    VERIFY_QUARTERLY_RULE,
  ].join('\n')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rl = checkRateLimit(getClientIp(request.headers), 'skills-bulk-run', RATE_LIMITS.ai.limit, RATE_LIMITS.ai.windowMs)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan AI. Coba lagi dalam beberapa detik.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: adminProfile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') {
    return denyForbidden()
  }

  const clientId = (await params).id
  const body = await request.json().catch(() => ({}))
  const skillIds: string[] = Array.isArray(body?.skill_ids) ? body.skill_ids : []
  const providerId: string | undefined = body?.provider_id
  if (skillIds.length === 0) {
    return NextResponse.json({ error: 'Pilih minimal satu skill' }, { status: 400 })
  }

  // Provider
  let provider: Provider | null = null
  if (providerId) {
    const { data } = await supabase.from('ai_providers').select('*').eq('id', providerId).single()
    provider = data as Provider | null
  } else {
    const { data } = await supabase.from('ai_providers').select('*').eq('is_default', true).maybeSingle()
    provider = data as Provider | null
  }
  if (!provider) {
    return NextResponse.json(
      { error: 'Belum ada provider AI. Atur di /admin/settings/ai dulu.' },
      { status: 400 },
    )
  }

  // The client's WHOLE workspace, not just brand-profile.md. Same reason as the run route: a
  // create-stage skill in a batch still needs voice.md and the pillars, and the chat route already
  // serves all of them. One source of truth across routes.
  const { data: client } = await supabase
    .from('clients').select('name, brand_profile').eq('id', clientId).single()
  if (!client) return NextResponse.json({ error: 'Client tidak ditemukan' }, { status: 404 })

  const files = await loadClientFiles(supabase, clientId)
  const fileNames = Object.keys(files)
  const workspace = fileNames.length
    ? fileNames.map((f) => `### ${f}\n\n${files[f]}`).join('\n\n')
    : brandBlock(client.name, (client.brand_profile ?? {}) as Record<string, unknown>)

  // The AGENTS.md ground truths — identical for every skill in the batch.
  const truths = await loadGroundTruths(supabase)
  const truthsBlock = groundTruthsBlock(truths)

  // Look up stages once — denormalised into skill_outputs so the Hasil tab can group without a join
  const { data: skillRows } = await supabase
    .from('skills').select('id, name, stage').in('id', skillIds)
  const stageById = new Map((skillRows ?? []).map((s) => [s.id, s.stage as string | null]))

  // Pre-fetch ALL skill_files in ONE query (was N+1 in the loop)
  const { data: skillFiles } = await supabase
    .from('skill_files').select('skill_id, content')
    .in('skill_id', skillIds)
    .eq('path', 'SKILL.md')
  const skillFilesMap = new Map((skillFiles ?? []).map(f => [f.skill_id, f.content]))

  // Pre-fetch guardrails for all skills, then render each block with the same renderer the other
  // routes use — so a guardrail block means the same thing everywhere.
  const guardrailsBySkill = await loadSkillGuardrailsBatch(supabase, skillIds)

  // The batch brief
  const brief: string = (body?.brief ?? '').trim()

  // Run AI calls in parallel (respect AI provider rate limits)
  const allResults = await Promise.all(
    skillIds.map(async (skillId) => {
      const startTime = Date.now()
      const skillContent = skillFilesMap.get(skillId)
      if (!skillContent) {
        return { skill_id: skillId, ok: false, error: 'SKILL.md tidak ditemukan', latencyMs: 0, promptTokens: 0, completionTokens: 0 }
      }

      const system = buildSystemPrompt(
        skillContent,
        workspace,
        guardrailsBySkill.get(skillId) ?? '',
        truthsBlock
      )
      const userMsg = brief || 'Jalankan skill ini untuk brand di atas dan berikan hasilnya.'

      let text = ''
      let usage: { promptTokens?: number; completionTokens?: number } | null | undefined
      try {
        ;({ text, usage } = await chatDetailed(provider, system, [{ role: 'user', content: userMsg }]))
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : 'Gagal memanggil AI'
        return { skill_id: skillId, ok: false, error: errMsg, latencyMs: Date.now() - startTime, promptTokens: 0, completionTokens: 0 }
      }

      const latencyMs = Date.now() - startTime
      if (!text.trim()) {
        return { skill_id: skillId, ok: false, error: 'AI mengembalikan hasil kosong', latencyMs, promptTokens: 0, completionTokens: 0 }
      }

      return { skill_id: skillId, ok: true, output: text, latencyMs, promptTokens: usage?.promptTokens ?? 0, completionTokens: usage?.completionTokens ?? 0 }
    }),
  )

  // Process results sequentially to avoid race conditions on DB writes
  const results: { skill_id: string; ok: boolean; output?: string; error?: string }[] = []
  const campaignSkillIds: string[] = []

  for (const item of allResults) {
    const { skill_id, ok, error, output, latencyMs, promptTokens, completionTokens } = item

    // Log AI usage
    await logAiUsage({
      userId: user.id,
      clientId,
      route: 'api/admin/clients/[id]/skills/bulk-run',
      model: provider.model,
      providerKind: provider.kind,
      promptTokens,
      completionTokens,
      latencyMs,
      errorMessage: error ?? (output ? undefined : 'Unknown error'),
      costEstimate: 0,
    }).catch(() => {})

    if (!ok || !output) {
      results.push({ skill_id, ok: false, error: error ?? 'Unknown error' })
      continue
    }

    // Persist to skill_outputs
    const { data: skillMeta } = await supabase
      .from('skills').select('name').eq('id', skill_id).maybeSingle()
    const stage = stageById.get(skill_id) ?? 'plan'

    await supabase.from('skill_outputs').insert({
      client_id: clientId,
      skill_id,
      stage,
      title: skillMeta?.name ?? skill_id,
      content: output,
      status: 'draft',
      needs_verification: hasVolatileFacts(output),
    })

    // Mark the skill as done
    await supabase.from('client_skills').upsert(
      { client_id: clientId, skill_id, status: 'selesai' },
      { onConflict: 'client_id,skill_id' },
    )

    // Track campaign skill for post-processing
    if (skill_id === 'campaign-and-launch-planning') {
      campaignSkillIds.push(skill_id)
      results.push({ skill_id, ok: true, output })
    } else {
      results.push({ skill_id, ok: true, output })
    }
  }

  // Post-process campaign skills: create content_campaigns
  for (const skillId of campaignSkillIds) {
    const result = results.find(r => r.skill_id === skillId)
    if (!result?.output) continue
    const out = result.output
    const lines = out.split('\n')
    const titleLine = lines.find(l => /^#\s*/.test(l))
    const extractedName = titleLine ? titleLine.replace(/^#\s*/, '').trim() : `Kampanye ${new Date().toLocaleDateString('id-ID')}`

    const { data: existingCampaign } = await supabase
      .from('content_campaigns')
      .select('id')
      .eq('client_id', clientId)
      .eq('name', extractedName)
      .maybeSingle()

    if (!existingCampaign) {
      await supabase.from('content_campaigns').insert({
        client_id: clientId,
        name: extractedName,
        type: 'campaign',
        notes: 'Auto-generated from campaign-and-launch-planning skill output',
      })
    }
  }

  const okCount = results.filter((r) => r.ok).length
  const failCount = results.filter((r) => !r.ok).length

  await logAudit({
    actorId: user.id,
    actorRole: 'admin',
    action: 'skill.bulk_run',
    entityType: 'client',
    entityId: clientId,
    clientId,
    summary: `Admin menjalankan ${results.length} skill (${okCount} berhasil, ${failCount} gagal)`,
    metadata: {
      skill_ids: skillIds,
      ok_count: okCount,
      fail_count: failCount,
      brief: brief || null,
      failed: results.filter((r) => !r.ok).map((r) => ({ skill_id: r.skill_id, error: r.error })),
    },
  })

  return NextResponse.json({
    results,
    ok_count: okCount,
    fail_count: failCount,
  })
}