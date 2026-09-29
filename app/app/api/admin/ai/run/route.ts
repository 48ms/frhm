import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { chatDetailed, type Provider } from '@/lib/ai/providers'
import { logAiUsage } from '@/lib/ai/usage'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'
import { loadClientFiles } from '@/lib/ai/server'
import {
  loadGroundTruths,
  loadSkillGuardrails,
  groundTruthsBlock,
  guardrailsBlock,
  VERIFY_QUARTERLY_RULE,
} from '@/lib/ai/prompt-context'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) {
          try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
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

// Build the system prompt: the skill's ORIGINAL text, verbatim, plus the client's WHOLE workspace
// (not just brand-profile.md — a create-stage skill needs voice.md and the pillars too) and the
// repo rules. Mirrors the chat route so a batch run and an interview see the same context.
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

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(ip, 'admin/ai/run', RATE_LIMITS.ai.limit, RATE_LIMITS.ai.windowMs)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan AI. Coba lagi dalam beberapa detik.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  const supabase = await getSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return denyForbidden()
  }

  const body = await request.json().catch(() => ({}))
  const { skill_id, client_id, brief, provider_id } = body ?? {}
  if (!skill_id || !client_id || !brief) {
    return NextResponse.json({ error: 'skill_id, client_id, dan brief wajib' }, { status: 400 })
  }

  // which provider to use
  let provider: Provider | null = null
  if (provider_id) {
    const { data } = await supabase.from('ai_providers').select('*').eq('id', provider_id).single()
    provider = data as Provider | null
  } else {
    const { data } = await supabase.from('ai_providers').select('*').eq('is_default', true).maybeSingle()
    provider = data as Provider | null
  }
  if (!provider) {
    return NextResponse.json(
      { error: 'Belum ada provider AI. Atur di /admin/settings/ai dulu.' },
      { status: 400 }
    )
  }

  // the skill's original text
  const { data: skillFile } = await supabase
    .from('skill_files').select('content').eq('skill_id', skill_id).eq('path', 'SKILL.md').single()
  if (!skillFile?.content) {
    return NextResponse.json({ error: `Skill ${skill_id} tidak punya SKILL.md` }, { status: 400 })
  }

  // The client's WHOLE workspace. The repo is explicit that brand-profile.md is the source of
  // truth ("every skill reads it from there"), but create-stage skills also read voice.md and the
  // content pillars, and the chat route already serves all of them. Reading only brand-profile.md
  // here made a batch run blind to the rest of the folder — this closes that gap (Gap #5).
  const { data: client } = await supabase
    .from('clients').select('name, brand_profile').eq('id', client_id).single()
  if (!client) return NextResponse.json({ error: 'Client tidak ditemukan' }, { status: 404 })

  const files = await loadClientFiles(supabase, client_id)
  const fileNames = Object.keys(files)
  const workspace = fileNames.length
    ? fileNames.map((f) => `### ${f}\n\n${files[f]}`).join('\n\n')
    : brandBlock(client.name, (client.brand_profile ?? {}) as Record<string, unknown>)

  // Repo rules, shared with the chat route: this skill's guardrails + the AGENTS.md ground truths.
  const guardrails = await loadSkillGuardrails(supabase, skill_id)
  const truths = await loadGroundTruths(supabase)

  const system = buildSystemPrompt(
    skillFile.content,
    workspace,
    guardrailsBlock(guardrails),
    groundTruthsBlock(truths)
  )

  try {
    // Reuse the shared client so this route parses SSE the same way the chat route does
    // (9router answers in SSE even when stream:false). One wire implementation, not two.
    const startTime = Date.now()
    const { text: out, usage } = await chatDetailed(provider, system, [{ role: 'user', content: brief }])
    const durationMs = Date.now() - startTime

    if (!out.trim()) {
      return NextResponse.json({ error: 'AI mengembalikan hasil kosong' }, { status: 502 })
    }

    // Record AI usage for cost tracking (O20)
    await logAiUsage({
      userId: user.id,
      clientId: client_id,
      route: 'api/admin/ai/run',
      providerKind: provider.kind,
      model: provider.model,
      promptTokens: usage?.promptTokens ?? 0,
      completionTokens: usage?.completionTokens ?? 0,
      latencyMs: durationMs,
    })

    return NextResponse.json({ success: true, output: out, skill_id, client_id })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memanggil AI' },
      { status: 502 }
    )
  }
}
