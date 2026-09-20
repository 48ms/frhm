import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { chatDetailed, type Provider } from '@/lib/ai/providers'
import { logAiUsage } from '@/lib/ai/usage'
import { logAudit } from '@/lib/audit/log'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

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

function buildSystemPrompt(skillMd: string, brand: string): string {
  return [
    'You are operating under the following skill. Follow its instructions exactly.',
    'The skill text below is the authoritative specification — do not summarise it, apply it.',
    '',
    '--- BEGIN SKILL ---',
    skillMd,
    '--- END SKILL ---',
    '',
    'The brand you are working for (always write in this brand voice):',
    '',
    brand,
  ].join('\n')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
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

  const clientId = params.id
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

  // Brand context — brand-profile.md is the repo's source of truth; JSON is the fallback.
  const { data: client } = await supabase
    .from('clients').select('name, brand_profile').eq('id', clientId).single()
  if (!client) return NextResponse.json({ error: 'Client tidak ditemukan' }, { status: 404 })

  const { data: profileFile } = await supabase
    .from('client_files').select('content')
    .eq('client_id', clientId).eq('path', 'brand-profile.md').maybeSingle()
  const brand = profileFile?.content?.trim()
    ? profileFile.content
    : brandBlock(client.name, (client.brand_profile ?? {}) as Record<string, unknown>)

  // Look up stages once — denormalised into skill_outputs so the Hasil tab can group without a join
  const { data: skillRows } = await supabase
    .from('skills').select('id, name, stage').in('id', skillIds)
  const stageById = new Map((skillRows ?? []).map((s) => [s.id, s.stage as string | null]))

  // The batch brief: if the admin wrote one, every skill gets it; otherwise the skill runs on
  // brand context alone (its SKILL.md already says what to produce).
  const brief: string = (body?.brief ?? '').trim()

  const results: { skill_id: string; ok: boolean; output?: string; error?: string }[] = []

  // Sequential by design: one provider, and it keeps output order predictable for the admin.
  for (const skillId of skillIds) {
    const { data: skillFile } = await supabase
      .from('skill_files').select('content')
      .eq('skill_id', skillId).eq('path', 'SKILL.md').maybeSingle()
    if (!skillFile?.content) {
      results.push({ skill_id: skillId, ok: false, error: 'SKILL.md tidak ditemukan' })
      continue
    }

    const system = buildSystemPrompt(
      skillFile.content,
      brand,
    )
    const userMsg = brief || 'Jalankan skill ini untuk brand di atas dan berikan hasilnya.'

    const startTime = Date.now()
    try {
      const { text: out, usage } = await chatDetailed(provider, system, [{ role: 'user', content: userMsg }])
      const latencyMs = Date.now() - startTime

      if (!out.trim()) {
        // Log failed call (with zero tokens)
        await logAiUsage({
          userId: user.id,
          clientId,
          route: 'api/admin/clients/[id]/skills/bulk-run',
          model: provider.model,
          providerKind: provider.kind,
          promptTokens: 0,
          completionTokens: 0,
          latencyMs,
          errorMessage: 'AI mengembalikan hasil kosong',
          costEstimate: 0,
        })
        results.push({ skill_id: skillId, ok: false, error: 'AI mengembalikan hasil kosong' })
        continue
      }

      // Log successful call
      await logAiUsage({
        userId: user.id,
        clientId,
        route: 'api/admin/clients/[id]/skills/bulk-run',
        model: provider.model,
        providerKind: provider.kind,
        promptTokens: usage?.promptTokens ?? 0,
        completionTokens: usage?.completionTokens ?? 0,
        latencyMs,
        costEstimate: 0, // TODO: integrate pricing table later
      })

      // Persist to skill_outputs so it appears in the Hasil tab (same table the single path uses)
      const { data: skillMeta } = await supabase
        .from('skills').select('name').eq('id', skillId).maybeSingle()
      const stage = stageById.get(skillId) ?? 'plan'

      await supabase.from('skill_outputs').insert({
        client_id: clientId,
        skill_id: skillId,
        stage,
        title: skillMeta?.name ?? skillId,
        content: out,
        status: 'draft',
      })

      // Mark the skill as done for this client so the pipeline reflects reality
      await supabase.from('client_skills').upsert(
        { client_id: clientId, skill_id: skillId, status: 'selesai' },
        { onConflict: 'client_id,skill_id' },
      )

      if (skillId === 'campaign-and-launch-planning') {
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

      results.push({ skill_id: skillId, ok: true, output: out })
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Gagal memanggil AI'
      await logAiUsage({
        userId: user.id,
        clientId,
        route: 'api/admin/clients/[id]/skills/bulk-run',
        model: provider.model,
        providerKind: provider.kind,
        promptTokens: 0,
        completionTokens: 0,
        latencyMs: Date.now() - startTime,
        errorMessage: errMsg,
        costEstimate: 0,
      })
      results.push({
        skill_id: skillId,
        ok: false,
        error: errMsg,
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