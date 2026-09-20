import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { chatDetailed, type Provider } from '@/lib/ai/providers'
import { logAiUsage } from '@/lib/ai/usage'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'

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

// Build the system prompt: the skill's ORIGINAL text, verbatim, plus brand context.
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
  if (!user) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin' }, { status: 403 })
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

  // The client's brand context. The repo is explicit that brand-profile.md is the source of
  // truth ("Store brand-profile.md with the user's project files — it is the source of truth,
  // and every skill reads it from there"), and the interactive chat route already reads it.
  // Reading the same file here keeps one source of truth instead of a copy that drifts;
  // the clients.brand_profile JSON is only a fallback for a client that has no .md yet.
  const { data: client } = await supabase
    .from('clients').select('name, brand_profile').eq('id', client_id).single()
  if (!client) return NextResponse.json({ error: 'Client tidak ditemukan' }, { status: 404 })

  const { data: profileFile } = await supabase
    .from('client_files').select('content')
    .eq('client_id', client_id).eq('path', 'brand-profile.md').maybeSingle()

  const brand = profileFile?.content?.trim()
    ? profileFile.content
    : brandBlock(client.name, (client.brand_profile ?? {}) as Record<string, unknown>)
  const system = buildSystemPrompt(skillFile.content, brand)

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
