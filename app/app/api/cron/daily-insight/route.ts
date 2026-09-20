import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'
import { chatDetailed, type Provider } from '@/lib/ai/providers'
import { logAiUsage } from '@/lib/ai/usage'
import { buildInsightPrompt, type InsightContext } from '@/lib/analytics/insight-prompt'
import { buildAdminReport, buildClientReport } from '@/lib/telegram/messages/daily-briefing'
import { sendTelegramMessage } from '@/lib/telegram/service'
import { analyzeSentiment, aggregateSentiments, type SentimentSummary } from '@/lib/nlp/sentiment'

export const dynamic = 'force-dynamic'

// Vercel Cron Job: GET /api/cron/daily-insight (scheduled harian via cron.yaml atau external)
export async function GET(request: Request) {
  // Security: require Bearer token for cron-triggered requests (not manual browser access)
  const secret = process.env.CRON_SECRET
  if (secret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Fetch all active clients with Telegram notifications enabled
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, telegram_chat_id, telegram_notif_enabled')
    .eq('telegram_notif_enabled', true)
    .not('telegram_chat_id', 'is', null)

  if (!clients || clients.length === 0) {
    return NextResponse.json({ message: 'No clients eligable for daily insight' })
  }

  const now = new Date()
  const periodEnd = now.toISOString().split('T')[0]
  const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const periodStartStr = periodStart.toISOString().split('T')[0]

  const results = []
  const errors = []

  for (const client of clients) {
    try {
      const result = await generateDailyInsightForClient(client, periodStartStr, periodEnd)
      results.push(result)
    } catch (err: unknown) {
      console.error(`[daily-insight] Client ${client.id} failed:`, err)
      errors.push({
        clientId: client.id,
        clientName: client.name,
        error: err instanceof Error ? err.message : String(err)
      })
    }
  }

  await logAudit({
    actorId: 'system',
    actorRole: 'system',
    actorName: 'Daily Cron Job',
    action: 'analytics.daily_insight_batch',
    entityType: 'cron',
    entityId: `daily-insight-${periodStartStr}`,
    clientId: null,
    summary: `Processed ${clients.length} clients. Success: ${results.length}, Errors: ${errors.length}.`,
  })

  return NextResponse.json({ processed: clients.length, results, errors })
}

// Helper: merge two SentimentSummary objects
function mergeSummaries(a: SentimentSummary, b: SentimentSummary): SentimentSummary {
  const total = a.total_processed + b.total_processed
  if (total === 0) return { total_processed: 0, positive_count: 0, neutral_count: 0, negative_count: 0, avg_confidence: 0 }
  return {
    total_processed: total,
    positive_count: a.positive_count + b.positive_count,
    neutral_count: a.neutral_count + b.neutral_count,
    negative_count: a.negative_count + b.negative_count,
    avg_confidence: Number(((a.avg_confidence * a.total_processed + b.avg_confidence * b.total_processed) / total).toFixed(2)),
  }
}

async function generateDailyInsightForClient(
  client: { id: string; name: string; telegram_chat_id: string | null; telegram_notif_enabled?: boolean | null },
  periodStart: string,
  periodEnd: string
) {
  const supabase = await createClient()

  // 2. Fetch posts with metrics for period
  const { data: posts, error: postsError } = await supabase
    .from('scheduled_posts')
    .select(`
      id, title, platform, scheduled_at, campaign_tag, content_type, creative_format,
      post_metrics!inner ( id, views, reach, likes, comments, shares, saves, clicks, wa_inquiries, dm_inquiries, comment_details, sentiment_summary )
    `)
    .eq('client_id', client.id)
    .gte('scheduled_at', periodStart)
    .lte('scheduled_at', periodEnd)
    .eq('status', 'published')
    .order('scheduled_at', { ascending: true })

  if (postsError) throw new Error(postsError.message)
  if (!posts || posts.length === 0) return { clientId: client.id, status: 'no_data' }

  // 3. Calculate aggregations
  let totalReach = 0, totalEngagement = 0
  const typeCounts: Record<string, { posts: number; reach: number }> = {}
  let totalWa = 0, totalDm = 0
  const formatSequence: string[] = []

  const postsWithMetrics = posts.map(p => {
    const m = (Array.isArray(p.post_metrics) ? p.post_metrics[0] : p.post_metrics) as
      | { views: number; reach: number; likes: number; comments: number; shares: number; saves: number; clicks: number; wa_inquiries: number; dm_inquiries: number; comment_details: unknown; sentiment_summary: unknown; id: string }
      | undefined
    if (!m) return null

    const reach = m.reach || 0
    const engagement = (m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0)
    const contentType = p.content_type || 'educational'
    const creativeFormat = p.creative_format || 'reels'

    totalReach += reach
    totalEngagement += engagement
    totalWa += m.wa_inquiries || 0
    totalDm += m.dm_inquiries || 0
    formatSequence.push(creativeFormat)

    const stat = typeCounts[contentType] || { posts: 0, reach: 0 }
    stat.posts++
    stat.reach += reach
    typeCounts[contentType] = stat

    return {
      title: p.title,
      platform: p.platform,
      scheduled_at: p.scheduled_at,
      campaign_tag: p.campaign_tag || 'Tanpa Kampanye',
      content_type: contentType,
      creative_format: creativeFormat,
      reach,
      engagement,
      er: reach > 0 ? (engagement / reach) * 100 : 0,
      comment_details: (m.comment_details as Array<Record<string, unknown>>) || undefined,
      sentiment_summary: (m.sentiment_summary as SentimentSummary) || undefined,
      post_metrics_id: m.id,
    }
  }).filter(Boolean) as Array<{
    title: string; platform: string; scheduled_at: string; campaign_tag: string
    content_type: string; creative_format: string; reach: number; engagement: number; er: number
    comment_details?: Array<Record<string, unknown>>
    sentiment_summary?: SentimentSummary
    post_metrics_id?: string
  }>

  // === Sentiment Analysis on comment_details (Milestone 1b) ===
  let clientSentimentSummary: SentimentSummary = { total_processed: 0, positive_count: 0, neutral_count: 0, negative_count: 0, avg_confidence: 0 }

  for (const post of postsWithMetrics) {
    if (!post.comment_details || !Array.isArray(post.comment_details) || post.comment_details.length === 0) continue

    // Skip if already classified
    const existing = post.sentiment_summary
    if (existing && existing.total_processed > 0 && existing.total_processed === post.comment_details.length) {
      // Merge into client-level summary
      clientSentimentSummary = mergeSummaries(clientSentimentSummary, existing)
      continue
    }

    // Classify each comment
    const comments = post.comment_details as Array<{ text?: string }>
    const sentiments = await Promise.all(
      comments.map(c => analyzeSentiment(c.text || ''))
    )
    const summary = aggregateSentiments(sentiments)

    // Persist back to post_metrics
    if (post.post_metrics_id) {
      await supabase
        .from('post_metrics')
        .update({ sentiment_summary: summary })
        .eq('id', post.post_metrics_id)
    }

    clientSentimentSummary = mergeSummaries(clientSentimentSummary, summary)
  }

  // 4. Content mix ratio
  const contentMixRatio = Object.entries(typeCounts)
    .map(([t, s]) => `${t}: ${s.posts} post (${s.reach.toLocaleString()} reach)`)
    .join('\n')

  // 5. Creative fatigue detection
  const fatigueFlags: string[] = []
  let consecutive = 1
  for (let i = 1; i < formatSequence.length; i++) {
    if (formatSequence[i] === formatSequence[i - 1]) {
      consecutive++
    } else {
      if (consecutive >= 3) fatigueFlags.push(`${formatSequence[i - 1]} x${consecutive}`)
      consecutive = 1
    }
  }
  if (consecutive >= 3) fatigueFlags.push(`${formatSequence[formatSequence.length - 1]} x${consecutive}`)

  // 6. Campaign breakdown
  const campaignStats = new Map<string, { posts: number; reach: number; engagement: number }>()
  for (const p of postsWithMetrics) {
    const tag = p.campaign_tag
    const stat = campaignStats.get(tag) || { posts: 0, reach: 0, engagement: 0 }
    stat.posts++
    stat.reach += p.reach
    stat.engagement += p.engagement
    campaignStats.set(tag, stat)
  }
  const campaignBreakdown = Array.from(campaignStats.entries())
    .map(([tag, s]) => `${tag}: ${s.posts} post (${s.reach.toLocaleString()} reach)`)
    .join('\n')

  // 7. Build insight prompt
  const sortedByER = [...postsWithMetrics].sort((a, b) => b.er - a.er)
  const top3 = sortedByER.slice(0, 3)
    .map(p => `- "${p.title}" (${p.platform}) | ER ${p.er.toFixed(1)}% | Reach ${p.reach.toLocaleString()}`)
    .join('\n')
  const bottom3 = sortedByER.slice(-3).reverse()
    .map(p => `- "${p.title}" (${p.platform}) | ER ${p.er.toFixed(1)}% | Reach ${p.reach.toLocaleString()}`)
    .join('\n')

  const creativeFatigueStr = fatigueFlags.length > 0 ? fatigueFlags.join(', ') : 'Tidak terdeteksi'

  // 8a. Competitor benchmarks
  const { data: competitorData } = await supabase
    .from('competitor_benchmarks')
    .select('brand_name, platform, avg_reach, avg_er, weekly_posts')
    .eq('client_id', client.id)

  const competitorSummary = competitorData && competitorData.length > 0
    ? competitorData.map((c: {
      brand_name: string
      platform: string
      avg_reach: number
      avg_er: number
      weekly_posts: number
    }) => `${c.brand_name} (${c.platform}): reach ${c.avg_reach.toLocaleString('id-ID')}, ER ${c.avg_er}%, ${c.weekly_posts} post/minggu`).join('. ')
    : 'Tidak ada benchmark kompetitor tersedia'

  // 8b. Seasonal periods
  const { data: seasonalData } = await supabase
    .from('seasonal_periods')
    .select('name, start_date, end_date, impact_multiplier')
    .gte('end_date', periodStart)
    .lte('start_date', periodEnd)

  const seasonalSummary = seasonalData && seasonalData.length > 0
    ? seasonalData.map((s: { name: string; impact_multiplier: number }) => `${s.name} (multiplier ${s.impact_multiplier}x)`).join(', ')
    : 'Tidak ada periode musiman aktif'

  // Predictive forecast
  const { data: predictionData } = await supabase
    .from('analytics_predictions')
    .select('target_month, forecasted_reach, forecasted_er, forecasted_wa_inquiries, forecasted_dm_inquiries, estimated_roi_multiplier, confidence_score')
    .eq('client_id', client.id)
    .order('target_month', { ascending: false })
    .limit(1)

  const predictiveSummary = predictionData && predictionData.length > 0
    ? predictionData.map((p: {
      target_month: string
      forecasted_reach: number
      forecasted_er: number
      forecasted_wa_inquiries: number
      forecasted_dm_inquiries: number
      estimated_roi_multiplier: number
      confidence_score: number
    }) => `Target ${new Date(String(p.target_month)).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}: reach ${p.forecasted_reach.toLocaleString('id-ID')}, ER ${p.forecasted_er}%, WA inquiry ${p.forecasted_wa_inquiries}, DM inquiry ${p.forecasted_dm_inquiries}, ROI multiplier ${p.estimated_roi_multiplier}x (confidence ${p.confidence_score * 100}%)`).join('. ')
    : 'Tidak ada forecast tersedia'

  // 8c. Build insight prompt
  const context: InsightContext = {
    client_name: client.name,
    period_start: periodStart,
    period_end: periodEnd,
    campaign_tag: null,
    total_posts: postsWithMetrics.length,
    total_reach: totalReach,
    total_engagement: totalEngagement,
    engagement_rate: totalReach > 0 ? totalEngagement / totalReach * 100 : 0,
    campaign_breakdown: campaignBreakdown || 'Tidak ada data',
    content_mix_ratio: contentMixRatio,
    attribution_funnel: `WA inquiry: ${totalWa} | DM inquiry: ${totalDm}`,
    creative_fatigue_flags: creativeFatigueStr,
    competitor_benchmarks: competitorSummary,
    seasonal_context: seasonalSummary,
    predictive_forecast: predictiveSummary,
    top3_posts: top3,
    bottom3_posts: bottom3,
    wow_delta: 'N/A',
    mom_delta: 'N/A',
    sentiment_summary: formatSentimentSummary(clientSentimentSummary),
  }

  const prompt = buildInsightPrompt(context)

  // 8. Fetch AI provider + Generate
  const { data: providerData } = await supabase
    .from('ai_providers')
    .select('*')
    .eq('is_default', true)
    .maybeSingle()

  if (!providerData) throw new Error('Provider AI belum dikonfigurasi')

  const provider: Provider = {
    kind: providerData.kind as Provider['kind'],
    model: providerData.model,
    base_url: providerData.base_url,
    api_key: providerData.api_key,
  }

  const startTime = Date.now()
  const { text: aiInsight, usage } = await chatDetailed(provider, 'Kamu adalah Senior Social Media Analyst untuk agency Frhm.', [
    { role: 'user', content: prompt }
  ])
  await logAiUsage({
    userId: null,
    clientId: client.id,
    route: 'api/cron/daily-insight',
    model: provider.model,
    providerKind: provider.kind,
    promptTokens: usage?.promptTokens ?? 0,
    completionTokens: usage?.completionTokens ?? 0,
    latencyMs: Date.now() - startTime,
    costEstimate: 0,
  })

  // 9. Save summary to DB
  const { data: summary, error: sumError } = await supabase
    .from('analytics_summaries')
    .insert({
      client_id: client.id,
      campaign_tag: null,
      period_start: periodStart,
      period_end: periodEnd,
      ai_insight: aiInsight,
      total_reach: totalReach,
      total_engagement: totalEngagement,
      total_wa_inquiries: totalWa,
      total_dm_inquiries: totalDm,
      operator_notes: null,
    })
    .select()
    .single()

  if (sumError) throw new Error(sumError.message)

  // 10. Dual-dispatch Telegram notifications (Internal Bot + Client Group)
  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  const briefingData = {
    clientName: client.name,
    todayStr,
    periodStart,
    periodEnd,
    totalPosts: postsWithMetrics.length,
    totalReach,
    engagementRate: context.engagement_rate,
    totalWa,
    totalDm,
    aiInsight,
    sentimentSummary: clientSentimentSummary.total_processed > 0 ? clientSentimentSummary : undefined,
    competitorBenchmarks: competitorSummary !== 'Tidak ada benchmark kompetitor tersedia' ? competitorSummary : undefined,
    seasonalContext: seasonalSummary !== 'Tidak ada periode musiman aktif' ? seasonalSummary : undefined,
    predictiveForecast: predictiveSummary !== 'Tidak ada forecast tersedia' ? predictiveSummary : undefined,
  }

  // A. Dispatch ke Admin/Bot Frhm Internal (TELEGRAM_ADMIN_CHAT_ID)
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  let adminMessageId: number | undefined
  if (adminChatId) {
    const adminReportText = buildAdminReport(briefingData)
    const adminRes = await sendTelegramMessage({
      chatId: adminChatId,
      text: adminReportText,
      parseMode: 'HTML',
      recipientType: 'admin',
      eventType: 'daily_insight_admin',
    })
    if (adminRes.success) adminMessageId = adminRes.messageId
  }

  // B. Dispatch ke Telegram Client Group (bila telegram_notif_enabled = true & telegram_chat_id terpasang)
  let clientMessageId: number | undefined
  if (client.telegram_notif_enabled && client.telegram_chat_id) {
    const clientReportText = buildClientReport(briefingData)
    const clientRes = await sendTelegramMessage({
      chatId: client.telegram_chat_id,
      text: clientReportText,
      parseMode: 'HTML',
      recipientType: 'client',
      recipientId: client.id,
      eventType: 'daily_insight_client',
    })
    if (clientRes.success) clientMessageId = clientRes.messageId
  }

  return {
    clientId: client.id,
    clientName: client.name,
    status: 'insight_generated',
    summaryId: summary.id,
    reach: totalReach,
    er: context.engagement_rate,
    waInquiries: totalWa,
    dmInquiries: totalDm,
    adminTelegramMessageId: adminMessageId,
    clientTelegramMessageId: clientMessageId,
  }
}

function formatSentimentSummary(summary: { total_processed: number; positive_count: number; neutral_count: number; negative_count: number; avg_confidence: number }): string {
  if (summary.total_processed === 0) return 'Tidak ada komentar yang diproses'
  return `Diproses ${summary.total_processed} komentar — Positif: ${summary.positive_count}, Netral: ${summary.neutral_count}, Negatif: ${summary.negative_count}. Rata-rata keyakinan: ${summary.avg_confidence}%`
}
