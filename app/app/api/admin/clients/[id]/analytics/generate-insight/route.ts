import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatDetailed, type Provider } from '@/lib/ai/providers'
import { logAiUsage } from '@/lib/ai/usage'
import { logAudit } from '@/lib/audit/log'
import { buildInsightPrompt, type InsightContext } from '@/lib/analytics/insight-prompt'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { campaign_tag, period_start, period_end } = body

  if (!period_start || !period_end) {
    return NextResponse.json({ error: 'period_start and period_end required' }, { status: 400 })
  }

  // 1. Fetch posts with metrics for the period
  const { data: posts, error: postsError } = await supabase
    .from('scheduled_posts')
    .select(`
      id, title, platform, scheduled_at, campaign_tag, content_type, creative_format,
      post_metrics ( views, reach, likes, comments, shares, saves, clicks, wa_inquiries, dm_inquiries )
    `)
    .eq('client_id', clientId)
    .gte('scheduled_at', period_start)
    .lte('scheduled_at', period_end)
    .eq('status', 'published')

  if (postsError) return NextResponse.json({ error: postsError.message }, { status: 500 })

  const filteredPosts = campaign_tag
    ? posts?.filter(p => p.campaign_tag === campaign_tag) || []
    : posts || []

  if (filteredPosts.length === 0) {
    return NextResponse.json({ error: 'Tidak cukup data untuk insight periode ini' }, { status: 400 })
  }

  // 2. Calculate aggregations
  let totalReach = 0
  let totalEngagement = 0
  const postsWithMetrics = filteredPosts.map(p => {
    const m = (Array.isArray(p.post_metrics) ? p.post_metrics[0] : p.post_metrics) as
      { views: number; reach: number; likes: number; comments: number; shares: number; saves: number; clicks: number; wa_inquiries: number; dm_inquiries: number } | undefined
    if (!m) return null
    const reach = m.reach || 0
    const engagement = (m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0)
    totalReach += reach
    totalEngagement += engagement
    return {
      id: p.id,
      title: p.title,
      platform: p.platform,
      scheduled_at: p.scheduled_at,
      campaign_tag: p.campaign_tag,
      reach,
      engagement,
      er: reach > 0 ? (engagement / reach) * 100 : 0,
      likes: m.likes || 0,
      comments: m.comments || 0,
      shares: m.shares || 0,
      saves: m.saves || 0,
      clicks: m.clicks || 0,
      creative_format: p.creative_format || 'unknown',
      wa_inquiries: m.wa_inquiries || 0,
      dm_inquiries: m.dm_inquiries || 0
    }
  }).filter(Boolean) as unknown as Array<{
    id: string
    title: string
    platform: string
    scheduled_at: string
    campaign_tag?: string
    reach: number
    engagement: number
    er: number
    likes: number
    comments: number
    shares: number
    saves: number
    clicks: number
    creative_format: string
    wa_inquiries: number
    dm_inquiries: number
  }>

  // Campaign breakdown
  const campaignStats = new Map<string, { posts: number; reach: number; engagement: number }>()
  for (const p of postsWithMetrics) {
    const tag = p.campaign_tag || 'Tanpa Kampanye'
    const stat = campaignStats.get(tag) || { posts: 0, reach: 0, engagement: 0 }
    stat.posts++
    stat.reach += p.reach
    stat.engagement += p.engagement
    campaignStats.set(tag, stat)
  }
  const campaignBreakdown = Array.from(campaignStats.entries())
    .map(([tag, s]) => `- ${tag}: ${s.posts} post, ${s.reach.toLocaleString()} reach, ${((s.engagement / s.reach) * 100).toFixed(1)}% ER`)
    .join('\n')

  // Top 3 & Bottom 3 by ER
  const sortedByER = [...postsWithMetrics].sort((a, b) => b.er - a.er)
  const top3 = sortedByER.slice(0, 3)
    .map(p => `- "${p.title}" (${p.platform}) | ER ${p.er.toFixed(1)}% | Reach ${p.reach.toLocaleString()}`)
    .join('\n')
  const bottom3 = sortedByER.slice(-3).reverse()
    .map(p => `- "${p.title}" (${p.platform}) | ER ${p.er.toFixed(1)}% | Reach ${p.reach.toLocaleString()}`)
    .join('\n')

  // Week-over-week delta (compare with previous 7 days)
  const periodStart = new Date(period_start)
  const prevWeekStart = new Date(periodStart)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  const prevWeekEnd = new Date(periodStart)
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 1)

  const { data: prevPosts } = await supabase
    .from('scheduled_posts')
    .select('id, post_metrics (reach, likes, comments, shares, saves)')
    .eq('client_id', clientId)
    .gte('scheduled_at', prevWeekStart.toISOString().split('T')[0])
    .lte('scheduled_at', prevWeekEnd.toISOString().split('T')[0])
    .eq('status', 'published')

  let prevReach = 0, prevEngagement = 0
  if (prevPosts) {
    for (const p of prevPosts) {
      const m = p.post_metrics?.[0]
      if (m) {
        prevReach += m.reach || 0
        prevEngagement += (m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0)
      }
    }
  }
  const wowReachDelta = prevReach > 0 ? ((totalReach - prevReach) / prevReach * 100).toFixed(1) : 'N/A'
  const wowEngDelta = prevEngagement > 0 ? ((totalEngagement - prevEngagement) / prevEngagement * 100).toFixed(1) : 'N/A'
  const wow_delta = `Reach: ${wowReachDelta}% | Engagement: ${wowEngDelta}%`

  // Month-over-month delta (compare with previous month)
  const prevMonthStart = new Date(periodStart)
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1)
  const prevMonthEnd = new Date(periodStart)
  prevMonthEnd.setDate(0) // last day of previous month

  const { data: prevMonthPosts } = await supabase
    .from('scheduled_posts')
    .select('id, post_metrics (reach, likes, comments, shares, saves)')
    .eq('client_id', clientId)
    .gte('scheduled_at', prevMonthStart.toISOString().split('T')[0])
    .lte('scheduled_at', prevMonthEnd.toISOString().split('T')[0])
    .eq('status', 'published')

  let prevMonthReach = 0, prevMonthEngagement = 0
  if (prevMonthPosts) {
    for (const p of prevMonthPosts) {
      const m = p.post_metrics?.[0]
      if (m) {
        prevMonthReach += m.reach || 0
        prevMonthEngagement += (m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0)
      }
    }
  }
  const momReachDelta = prevMonthReach > 0 ? ((totalReach - prevMonthReach) / prevMonthReach * 100).toFixed(1) : 'N/A'
  const momEngDelta = prevMonthEngagement > 0 ? ((totalEngagement - prevMonthEngagement) / prevMonthEngagement * 100).toFixed(1) : 'N/A'
  const mom_delta = `Reach: ${momReachDelta}% | Engagement: ${momEngDelta}%`

  // Content mix ratio
  const typeCounts = new Map<string, { posts: number; reach: number }>()
  for (const p of postsWithMetrics) {
    const ct = p.campaign_tag || 'Tanpa Kampanye'
    const stat = typeCounts.get(ct) || { posts: 0, reach: 0 }
    stat.posts++
    stat.reach += p.reach
    typeCounts.set(ct, stat)
  }
  const contentMixRatio = Array.from(typeCounts.entries())
    .map(([tag, s]) => `${tag}: ${s.posts} post (${s.reach.toLocaleString()} reach)`)
    .join('\n')

  // Attribution funnel
  const totalWa = postsWithMetrics.reduce((acc, p) => acc + (p.wa_inquiries || 0), 0)
  const totalDm = postsWithMetrics.reduce((acc, p) => acc + (p.dm_inquiries || 0), 0)
  const attributionFunnel = `WA inquiry: ${totalWa} | DM inquiry: ${totalDm}`

  // Creative fatigue detection
  const formatSequence = postsWithMetrics.map(p => p.creative_format || 'unknown')
  const fatigueFlags: string[] = []
  let consecutive = 1
  for (let i = 1; i < formatSequence.length; i++) {
    if (formatSequence[i] === formatSequence[i - 1]) {
      consecutive++
    } else {
      if (consecutive >= 3) {
        fatigueFlags.push(`${formatSequence[i - 1]} diproduksi ${consecutive}x berturut-turut`)
      }
      consecutive = 1
    }
  }
  if (consecutive >= 3) fatigueFlags.push(`${formatSequence[formatSequence.length - 1]} diproduksi ${consecutive}x berturut-turut`)
  const creativeFatigueFlags = fatigueFlags.length > 0 ? fatigueFlags.join(', ') : 'Tidak terdeteksi'

  // Competitor benchmarks
  const { data: competitorData } = await supabase
    .from('competitor_benchmarks')
    .select('brand_name, platform, avg_reach, avg_er, weekly_posts')
    .eq('client_id', clientId)

  const competitorSummary = competitorData && competitorData.length > 0
    ? competitorData.map((c: {
      brand_name: string
      platform: string
      avg_reach: number
      avg_er: number
      weekly_posts: number
    }) => `${c.brand_name} (${c.platform}): reach ${c.avg_reach.toLocaleString('id-ID')}, ER ${c.avg_er}%, ${c.weekly_posts} post/minggu`).join('. ')
    : 'Tidak ada benchmark kompetitor tersedia'

  // Seasonal periods
  const { data: seasonalData } = await supabase
    .from('seasonal_periods')
    .select('name, start_date, end_date, impact_multiplier')
    .gte('end_date', period_start)
    .lte('start_date', period_end)

  const seasonalSummary = seasonalData && seasonalData.length > 0
    ? seasonalData.map((s: {
      name: string
      impact_multiplier: number
    }) => `${s.name} (multiplier ${s.impact_multiplier}x)`).join(', ')
    : 'Tidak ada periode musiman aktif'

  // Predictive forecast
  const { data: predictionData } = await supabase
    .from('analytics_predictions')
    .select('target_month, forecasted_reach, forecasted_er, forecasted_wa_inquiries, forecasted_dm_inquiries, estimated_roi_multiplier, confidence_score')
    .eq('client_id', clientId)
    .order('target_month', { ascending: false })
    .limit(1)

  const predictiveSummary = predictionData && predictionData.length > 0
    ? predictionData.map(p =>
      'Target ' + new Date(String(p.target_month)).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) +
      ': reach ' + p.forecasted_reach.toLocaleString('id-ID') +
      ', ER ' + p.forecasted_er + '%' +
      ', WA inquiry ' + p.forecasted_wa_inquiries +
      ', DM inquiry ' + p.forecasted_dm_inquiries +
      ', ROI multiplier ' + p.estimated_roi_multiplier + 'x' +
      ' (confidence ' + (p.confidence_score * 100) + '%)'
    ).join(', ')
    : 'Tidak ada forecast tersedia'

  // Client name
  const { data: clientData } = await supabase.from('clients').select('name, default_ai_provider').eq('id', clientId).single()

  // 3. Build structured prompt
  const context: InsightContext = {
    client_name: clientData?.name || 'Client',
    period_start,
    period_end,
    campaign_tag: campaign_tag || null,
    total_posts: filteredPosts.length,
    total_reach: totalReach,
    total_engagement: totalEngagement,
    engagement_rate: totalReach > 0 ? totalEngagement / totalReach * 100 : 0,
    campaign_breakdown: campaignBreakdown || 'Tidak ada data kampanye',
    content_mix_ratio: contentMixRatio,
    attribution_funnel: attributionFunnel,
    creative_fatigue_flags: creativeFatigueFlags,
    competitor_benchmarks: competitorSummary,
    seasonal_context: seasonalSummary,
    predictive_forecast: predictiveSummary,
    top3_posts: top3 || 'Tidak ada data',
    bottom3_posts: bottom3 || 'Tidak ada data',
    wow_delta,
    mom_delta
  }

  const prompt = buildInsightPrompt(context)

  // 4. Fetch AI provider
  const { data: providerData } = await supabase
    .from('ai_providers')
    .select('*')
    .eq('id', clientData?.default_ai_provider ?? null)
    .single()

  if (!providerData) {
    return NextResponse.json({ error: 'Provider AI belum dikonfigurasi untuk client ini' }, { status: 400 })
  }

  const provider: Provider = {
    kind: providerData.kind as Provider['kind'],
    model: providerData.model,
    base_url: providerData.base_url,
    api_key: providerData.api_key
  }

  // 5. Generate Insight with AI
  let aiInsight = ''
  const startTime = Date.now()
  try {
    const { text, usage } = await chatDetailed(provider, 'Kamu adalah Senior Social Media Analyst untuk agency Frhm.', [
      { role: 'user', content: prompt }
    ])
    aiInsight = text
    await logAiUsage({
      userId: user.id,
      clientId,
      route: 'api/admin/clients/[id]/analytics/generate-insight',
      model: provider.model,
      providerKind: provider.kind,
      promptTokens: usage?.promptTokens ?? 0,
      completionTokens: usage?.completionTokens ?? 0,
      latencyMs: Date.now() - startTime,
      costEstimate: 0,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    await logAiUsage({
      userId: user.id,
      clientId,
      route: 'api/admin/clients/[id]/analytics/generate-insight',
      model: provider.model,
      providerKind: provider.kind,
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: Date.now() - startTime,
      errorMessage: msg,
      costEstimate: 0,
    })
    return NextResponse.json({ error: 'Gagal generate AI insight: ' + msg }, { status: 500 })
  }

  // 6. Save summary
  const { data: summary, error: sumError } = await supabase
    .from('analytics_summaries')
    .insert({
      client_id: clientId,
      campaign_tag: campaign_tag || null,
      period_start,
      period_end,
      ai_insight: aiInsight,
      total_reach: totalReach,
      total_engagement: totalEngagement,
      total_wa_inquiries: totalWa,
      total_dm_inquiries: totalDm,
      operator_notes: null
    })
    .select()
    .single()

  if (sumError) return NextResponse.json({ error: sumError.message }, { status: 500 })

  await logAudit({
    actorId: user.id,
    actorRole: 'admin',
    actorName: 'Admin',
    action: 'analytics.generate',
    entityType: 'analytics_summaries',
    entityId: summary.id,
    clientId,
    summary: 'Generate AI Insight Analytics' + (campaign_tag ? ' (Kampanye: ' + campaign_tag + ')' : ''),
  })

  return NextResponse.json({ summary })
}