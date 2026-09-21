import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { resolveProvider, loadClientFiles } from '@/lib/ai/server'
import { evaluateThreeGates } from '@/lib/trends/validator'
import { generateTrendContent } from '@/lib/trends/generator'
import { notifyClientContentReady } from '@/lib/telegram/service'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'
// eslint-disable-next-line no-restricted-imports
import { createClient } from '@supabase/supabase-js'
import { denyUnauthorized } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const rl = checkRateLimit(getClientIp(request.headers), 'trends/generate', RATE_LIMITS.ai.limit, RATE_LIMITS.ai.windowMs)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan AI. Coba lagi dalam beberapa detik.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return denyUnauthorized()
  }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang memiliki akses' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { clientId, trendTopic, trendSnippet, providerId, campaignTag } = body

  if (!clientId || !trendTopic) {
    return NextResponse.json({ error: 'Parameter clientId dan trendTopic wajib diisi' }, { status: 400 })
  }

  // 1. Ambil data klien
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id, name, telegram_chat_id, telegram_notifications_enabled')
    .eq('id', clientId)
    .single()

  if (clientErr || !client) {
    return NextResponse.json({ error: 'Klien tidak ditemukan' }, { status: 404 })
  }

  // 2. Ambil brand files klien (brand-profile.md, voice.md)
  const files = await loadClientFiles(supabase, clientId)
  const brandProfile = files['brand-profile.md'] || `Brand: ${client.name}. Bergerak di industri F&B dan gaya hidup.`
  const voiceGuide = files['voice.md'] || undefined

  // 3. Resolve AI provider
  const provider = await resolveProvider(supabase, providerId)

  // 4. Evaluasi The Three Gates (Fit, Safety, Timing)
  const evaluation = await evaluateThreeGates({
    trendTopic,
    trendSnippet,
    brandName: client.name,
    brandProfile,
    voiceGuide,
    provider,
  })

  // Jika tidak lolos gerbang keamanan atau relevansi
  if (!evaluation.passed) {
    return NextResponse.json(
      {
        success: false,
        passed: false,
        evaluation,
        error: `Tren ditolak oleh The Three Gates: ${evaluation.reasoning}`,
      },
      { status: 422 }
    )
  }

  // 5. Eksekusi penulisan konten dan 3 variasi hook
  const generated = await generateTrendContent({
    trendTopic,
    trendSnippet,
    angle: evaluation.recommendedAngle,
    brandName: client.name,
    brandProfile,
    voiceGuide,
    provider,
    campaignTag,
  })

  // 6. Simpan materi ke tabel deliverables dengan status 'sent' dan campaign_tag
  const { data: deliverable, error: deliverableErr } = await supabase
    .from('deliverables')
    .insert({
      client_id: client.id,
      type: 'content',
      title: `[Tren] ${generated.title}`,
      content_md: generated.markdownContent,
      status: 'sent',
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single()

  if (deliverableErr || !deliverable) {
    return NextResponse.json(
      { error: deliverableErr?.message || 'Gagal menyimpan deliverable' },
      { status: 500 }
    )
  }

  // 7. Kirim notifikasi Telegram ke klien (jika terhubung)
  if (client.telegram_chat_id && client.telegram_notifications_enabled) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    notifyClientContentReady({
      clientChatId: client.telegram_chat_id,
      clientId: client.id,
      clientName: client.name,
      title: deliverable.title,
      deliverableId: deliverable.id,
      campaignTag: campaignTag || undefined,
    }, {
      onBlocked: async (recipientType, recipientId) => {
        if (recipientId && serviceRoleKey && supabaseUrl) {
          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
          await supabaseAdmin
            .from('clients')
            .update({ telegram_notifications_enabled: false })
            .eq('id', recipientId)
        }
      },
    }).catch((telegramErr) => {
      console.error('[Trends API] Gagal kirim notifikasi Telegram klien:', telegramErr)
    })
  }

  return NextResponse.json(
    {
      success: true,
      passed: true,
      deliverable,
      evaluation,
      generated,
    },
    { status: 201 }
  )
}
