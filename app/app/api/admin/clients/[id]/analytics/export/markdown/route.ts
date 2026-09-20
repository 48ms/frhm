import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch client
  const { data: client } = await supabase.from('clients').select('name').eq('id', clientId).single()

  // Fetch latest summary
  const { data: summaries } = await supabase
    .from('analytics_summaries')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)

  const latestSummary = summaries?.[0]

  // Fetch all posts with metrics for the period
  let postsData: Array<{
    id: string
    title: string
    platform: string
    scheduled_at: string
    campaign_tag?: string
    post_metrics?: Array<{
      views?: number
      reach?: number
      likes?: number
      comments?: number
      shares?: number
      saves?: number
      clicks?: number
    }>
  }> = []
  if (latestSummary) {
    const { data: posts } = await supabase
      .from('scheduled_posts')
      .select(`
        id, title, platform, scheduled_at, campaign_tag,
        post_metrics ( views, reach, likes, comments, shares, saves, clicks )
      `)
      .eq('client_id', clientId)
      .eq('status', 'published')
      .gte('scheduled_at', latestSummary.period_start)
      .lte('scheduled_at', latestSummary.period_end)
      .order('scheduled_at', { ascending: true })

    postsData = posts || []
  }

  const filteredPosts = latestSummary?.campaign_tag
    ? postsData.filter(p => p.campaign_tag === latestSummary.campaign_tag)
    : postsData

  const postsWithMetrics = filteredPosts.map(p => {
    const m = (Array.isArray(p.post_metrics) ? p.post_metrics[0] : p.post_metrics) as
      { views: number; reach: number; likes: number; comments: number; shares: number; saves: number; clicks: number } | undefined
    if (!m) return null
    return { ...p, metrics: m }
  }).filter((p): p is NonNullable<typeof p> => p !== null)

  // Campaign breakdown
  const campaignStats = new Map<string, { posts: number; reach: number; engagement: number }>()
  for (const p of postsWithMetrics) {
    const tag = p.campaign_tag || 'Tanpa Kampanye'
    const stat = campaignStats.get(tag) || { posts: 0, reach: 0, engagement: 0 }
    stat.posts++
    stat.reach += p.metrics.reach || 0
    stat.engagement += (p.metrics.likes || 0) + (p.metrics.comments || 0) + (p.metrics.shares || 0) + (p.metrics.saves || 0)
    campaignStats.set(tag, stat)
  }

  // Top/Bottom 3 by ER
  const sortedByER = [...postsWithMetrics].sort((a, b) => {
    const erA = a.metrics.reach > 0 ? ((a.metrics.likes + a.metrics.comments + a.metrics.shares + a.metrics.saves) / a.metrics.reach) * 100 : 0
    const erB = b.metrics.reach > 0 ? ((b.metrics.likes + b.metrics.comments + b.metrics.shares + b.metrics.saves) / b.metrics.reach) * 100 : 0
    return erB - erA
  })
  const top3 = sortedByER.slice(0, 3)
  const bottom3 = sortedByER.slice(-3).reverse()

  // Build Markdown
  const lines: string[] = []

  lines.push(`# Laporan Bulanan: ${client?.name || 'Client'}`)
  lines.push('')
  lines.push(`**Periode:** ${latestSummary ? `${new Date(latestSummary.period_start).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} – ${new Date(latestSummary.period_end).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Belum ada data'}`)
  lines.push(`**Campaign:** ${latestSummary?.campaign_tag || 'Semua'}`)
  lines.push(`**Generated:** ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`)
  lines.push(`**Source:** Frhm Digital Marketing Platform`)
  lines.push('')

  if (latestSummary) {
    lines.push(`## Ringkasan Eksekutif (AI Insight)`)
    lines.push('')
    lines.push(latestSummary.ai_insight)
    lines.push('')
    if (latestSummary.total_wa_inquiries !== undefined || latestSummary.total_dm_inquiries !== undefined) {
      lines.push(`**Attribution:** WA inquiry ${latestSummary.total_wa_inquiries || 0} | DM inquiry ${latestSummary.total_dm_inquiries || 0}`)
      lines.push('')
    }

    // Competitor benchmarks
    const { data: competitorRows } = await supabase
      .from('competitor_benchmarks')
      .select('brand_name, platform, avg_reach, avg_er, weekly_posts')
      .eq('client_id', clientId)

    if (competitorRows && competitorRows.length > 0) {
      lines.push(`## Benchmark Kompetitor`)
      lines.push('')
      lines.push('| Brand | Platform | Avg Reach | Avg ER | Post/minggu |')
      lines.push('|-------|----------|-----------|--------|--------------|')
      for (const c of competitorRows) {
        lines.push(`| ${c.brand_name} | ${c.platform} | ${c.avg_reach.toLocaleString()} | ${c.avg_er}% | ${c.weekly_posts} |`)
      }
      lines.push('')
    }

    // Seasonal periods
    const { data: seasonalRows } = await supabase
      .from('seasonal_periods')
      .select('name, start_date, end_date, impact_multiplier')
      .gte('end_date', latestSummary.period_start)
      .lte('start_date', latestSummary.period_end)

    if (seasonalRows && seasonalRows.length > 0) {
      lines.push(`## Faktor Musiman`)
      lines.push('')
      for (const s of seasonalRows) {
        lines.push(`- ${s.name}: multiplier ${s.impact_multiplier}x (${new Date(s.start_date).toLocaleDateString('id-ID')} - ${new Date(s.end_date).toLocaleDateString('id-ID')})`)
      }
      lines.push('')
    }

    // Predictive Forecast
    const { data: predictionRows } = await supabase
      .from('analytics_predictions')
      .select('target_month, forecasted_reach, forecasted_er, forecasted_wa_inquiries, forecasted_dm_inquiries, estimated_roi_multiplier, confidence_score')
      .eq('client_id', clientId)
      .order('target_month', { ascending: false })
      .limit(1)

    if (predictionRows && predictionRows.length > 0) {
      const p = predictionRows[0]
      lines.push(`## Proyeksi Performa & ROI Forecasting`)
      lines.push('')
      lines.push(`- **Target Bulan:** ${new Date(p.target_month).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`)
      lines.push(`- **Target Reach:** ${p.forecasted_reach.toLocaleString()} | **Target ER:** ${p.forecasted_er}%`)
      lines.push(`- **Proyeksi WA Inquiry:** +${p.forecasted_wa_inquiries} | **Proyeksi DM Inquiry:** +${p.forecasted_dm_inquiries}`)
      lines.push(`- **Estimasi ROI Multiplier:** ${p.estimated_roi_multiplier}x (Confidence Level ${Math.round(p.confidence_score * 100)}%)`)
      lines.push('')
    }
  }

  lines.push(`## Performa per Kampanye`)
  lines.push('')
  lines.push('| Kampanye | Post | Reach | Engagement Rate |')
  lines.push('|----------|------|-------|-----------------|')
  for (const [tag, s] of campaignStats.entries()) {
    const er = s.reach > 0 ? ((s.engagement / s.reach) * 100).toFixed(1) : '0'
    lines.push(`| ${tag} | ${s.posts} | ${s.reach.toLocaleString()} | ${er}% |`)
  }
  lines.push('')

  lines.push(`## Top 3 Postingan (by Engagement Rate)`)
  lines.push('')
  lines.push('| # | Judul | Platform | Reach | Eng. Rate | Kampanye |')
  lines.push('|---|-------|----------|-------|-----------|----------|')
  top3.forEach((p, i) => {
    const er = p.metrics.reach > 0 ? ((p.metrics.likes + p.metrics.comments + p.metrics.shares + p.metrics.saves) / p.metrics.reach * 100).toFixed(1) : '0'
    lines.push(`| ${i + 1} | ${p.title} | ${p.platform} | ${p.metrics.reach.toLocaleString()} | ${er}% | ${p.campaign_tag || '-'} |`)
  })
  lines.push('')

  lines.push(`## Bottom 3 Postingan (by Engagement Rate)`)
  lines.push('')
  lines.push('| # | Judul | Platform | Reach | Eng. Rate | Kampanye |')
  lines.push('|---|-------|----------|-------|-----------|----------|')
  bottom3.forEach((p, i) => {
    const er = p.metrics.reach > 0 ? ((p.metrics.likes + p.metrics.comments + p.metrics.shares + p.metrics.saves) / p.metrics.reach * 100).toFixed(1) : '0'
    lines.push(`| ${i + 1} | ${p.title} | ${p.platform} | ${p.metrics.reach.toLocaleString()} | ${er}% | ${p.campaign_tag || '-'} |`)
  })
  lines.push('')

  if (latestSummary?.operator_notes) {
    lines.push(`## Catatan Operator`)
    lines.push('')
    lines.push(latestSummary.operator_notes)
    lines.push('')
  }

  lines.push(`---`)
  lines.push(`*Generated by Frhm on ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}*`)
  lines.push(`*https://frhm.app*`)
  lines.push('')

  const markdown = lines.join('\n')

  return new NextResponse(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="laporan-${clientId}-${new Date().toISOString().split('T')[0]}.md"`,
    },
  })
}