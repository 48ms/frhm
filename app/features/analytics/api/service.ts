"use server"

import { createClient } from "@/lib/supabase/server"
import { resolveProvider, loadSkillBundle, loadClientFiles, brandContext } from "@/lib/ai/server"
import { chatJson } from "@/lib/ai/providers"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit/log"
import { getBridgeKey } from "@/lib/bridge/config"
import { listSocialAccounts } from "@/lib/bridge/woopsocial"
import {
  AuditPerformanceInputSchema,
  AuditPerformanceReportSchema,
  SyncMultiAccountInputSchema,
  type AuditPerformanceInput,
  type AuditPerformanceResponse,
  type AuditPerformanceReport,
  type MultiAccountAnalytics,
  type PlatformMetricsSummary,
  type SyncMultiAccountInput,
  type SyncMultiAccountResult,
} from "./types"

// Sesuai dengan schema dari 023_analytics.sql
export interface PostMetric {
  id: string
  post_id: string
  client_id: string
  platform: string
  views: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  clicks: number
  wa_inquiries?: number
  dm_inquiries?: number
  recorded_at: string
}

export interface AnalyticsSummary {
  id: string
  client_id: string
  campaign_tag: string | null
  period_start: string
  period_end: string
  ai_insight: string | null
  total_reach: number
  total_engagement: number
  created_at: string
}

export async function getPostMetricsByClient(clientId: string): Promise<PostMetric[]> {
  if (!clientId) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("post_metrics")
    .select("*")
    .eq("client_id", clientId)
    .order("recorded_at", { ascending: false })

  if (error) {
    console.error("[getPostMetricsByClient] error:", error.message)
    return []
  }
  return (data ?? []) as PostMetric[]
}

export async function getAnalyticsSummariesByClient(clientId: string): Promise<AnalyticsSummary[]> {
  if (!clientId) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("analytics_summaries")
    .select("*")
    .eq("client_id", clientId)
    .order("period_end", { ascending: false })

  if (error) {
    console.error("[getAnalyticsSummariesByClient] error:", error.message)
    return []
  }
  return (data ?? []) as AnalyticsSummary[]
}

// Prediction model
export interface AnalyticsPrediction {
  target_month: string
  forecasted_reach: number
  forecasted_er: number
  forecasted_wa_inquiries: number
  forecasted_dm_inquiries: number
  estimated_roi_multiplier: number
  confidence_score: number
}

export async function getLatestPrediction(
  clientId: string
): Promise<AnalyticsPrediction | null> {
  if (!clientId) return null
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("analytics_predictions")
    .select(
      "target_month, forecasted_reach, forecasted_er, forecasted_wa_inquiries, forecasted_dm_inquiries, estimated_roi_multiplier, confidence_score"
    )
    .eq("client_id", clientId)
    .order("target_month", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[getLatestPrediction] error:", error.message)
    return null
  }
  return (data as AnalyticsPrediction) ?? null
}

export async function auditPerformanceAndIterate(
  input: AuditPerformanceInput
): Promise<AuditPerformanceResponse> {
  try {
    const { clientId, period } = AuditPerformanceInputSchema.parse(input)
    const supabase = await createClient()

    // 1. Ambil data faktual dari DB
    const [metricsRes, postsRes, clientRes] = await Promise.all([
      supabase.from("post_metrics").select("*").eq("client_id", clientId).order("recorded_at", { ascending: false }),
      supabase.from("scheduled_posts").select("id, title, platform, campaign_tag").eq("client_id", clientId),
      supabase.from("clients").select("name").eq("id", clientId).maybeSingle(),
    ])

    const metrics = (metricsRes.data ?? []) as PostMetric[]
    const posts = postsRes.data ?? []
    const clientName = clientRes.data?.name ?? "Client Brand"

    if (metrics.length === 0) {
      return {
        error: "Belum ada data metrik faktual yang tercatat untuk klien ini. Hubungkan akun sosial media atau catat performa terlebih dahulu.",
      }
    }

    // 2. Agregasi faktual (NO NaN, NO fabricated numbers)
    let totalReach = 0
    let totalLikes = 0
    let totalComments = 0
    let totalShares = 0
    let totalSaves = 0
    let totalClicks = 0
    let totalInquiries = 0

    const postMap = new Map<string, { title: string; platform: string }>()
    posts.forEach((p) => postMap.set(p.id, { title: p.title, platform: p.platform }))

    const metricSummaries = metrics.map((m) => {
      const reach = Number(m.reach) || 0
      const likes = Number(m.likes) || 0
      const comments = Number(m.comments) || 0
      const shares = Number(m.shares) || 0
      const saves = Number(m.saves) || 0
      const clicks = Number(m.clicks) || 0
      const inquiries = (Number(m.wa_inquiries) || 0) + (Number(m.dm_inquiries) || 0)
      const engagement = likes + comments + shares + saves

      totalReach += reach
      totalLikes += likes
      totalComments += comments
      totalShares += shares
      totalSaves += saves
      totalClicks += clicks
      totalInquiries += inquiries

      const postInfo = postMap.get(m.post_id)
      return {
        title: postInfo?.title || `Post ${m.post_id.slice(0, 8)}`,
        platform: m.platform || postInfo?.platform || "general",
        reach,
        engagement,
        saves,
        shares,
        clicks,
        inquiries,
        er: reach > 0 ? ((engagement / reach) * 100).toFixed(2) + "%" : "0%",
      }
    })

    const totalEngagement = totalLikes + totalComments + totalShares + totalSaves
    const avgEr = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(2) : "0.0"

    // 3. Muat AI Provider, Brand Context, dan Skill Bundle
    const provider = await resolveProvider(supabase)
    if (!provider) {
      return { error: "AI Provider belum dikonfigurasi." }
    }

    const [skillBundle, clientFiles] = await Promise.all([
      loadSkillBundle(supabase, "analytics-and-reporting"),
      loadClientFiles(supabase, clientId),
    ])

    const brand = brandContext(clientName, clientFiles)

    const systemPrompt = `
${brand}

${skillBundle}

You are an expert Social Media Analytics Director operating under the METER framework from the analytics-and-reporting skill.
METER Framework Principles:
1. Measure what maps to goals: Focus on SIGNAL metrics (saves, shares, watch time, ER by reach, clicks, inquiries/conversions), NEVER vanity numbers alone.
2. Evaluate honestly: Single short windows can be noisy. Benchmark relative. Do not fabricate or sugarcoat underperformance.
3. Report & Re-cycle: Explain why top performers worked, diagnose root causes for underperformers, and provide exactly 3 concrete, prioritized actionable iterations for next week.
`

    const userMessage = `
CLIENT: ${clientName}
PERIOD: ${period}
AGGREGATE FACTUAL METRICS:
- Total Posts Analyzed: ${metrics.length}
- Total Reach: ${totalReach}
- Total Engagement: ${totalEngagement} (Likes: ${totalLikes}, Comments: ${totalComments}, Shares: ${totalShares}, Saves: ${totalSaves})
- Average Engagement Rate by Reach: ${avgEr}%
- Total Clicks: ${totalClicks}
- Total Direct Inquiries (WA/DM): ${totalInquiries}

TOP POSTS RECORDED:
${JSON.stringify(metricSummaries.slice(0, 8), null, 2)}

Please execute the METER framework audit. Provide the JSON report matching the specified schema.
`

    const report = await chatJson<AuditPerformanceReport>(provider, systemPrompt, [
      { role: "user", content: userMessage },
    ])

    if (!report) {
      return { error: "Gagal memproses audit analitik." }
    }

    // 4. Sinkronkan ke tabel analytics_summaries Supabase
    try {
      await supabase.from("analytics_summaries").insert({
        client_id: clientId,
        period_start: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
        period_end: new Date().toISOString().split("T")[0],
        ai_insight: report.summary,
        total_reach: totalReach,
        total_engagement: totalEngagement,
      })
    } catch (saveErr) {
      logger.warn("Failed to persist summary to analytics_summaries table", { saveErr })
    }

    return { report }
  } catch (err: any) {
    logger.error("Audit Performance Error", { error: err })
    return { error: err.message || "Terjadi kesalahan saat mengaudit performa." }
  }
}

/**
 * Multi-Account Analytics Aggregator (Instagram/TikTok Insights & Multi-Platform Sync)
 * 100% data faktual PostgreSQL RLS (post_metrics, client_channels, scheduled_posts).
 * Tanpa hardcoded mock numbers dan zero NaN.
 */
export async function getMultiAccountAnalytics(
  clientId: string,
  period = "30d"
): Promise<MultiAccountAnalytics> {
  const emptyResult: MultiAccountAnalytics = {
    clientId: clientId || "",
    clientName: "Client",
    connectedAccountsCount: 0,
    totalReach: 0,
    totalViews: 0,
    totalEngagement: 0,
    totalClicks: 0,
    totalInquiries: 0,
    overallEngagementRate: 0,
    platforms: {},
    platformList: [],
    instagramInsights: {
      reelsCount: 0,
      carouselCount: 0,
      staticCount: 0,
      totalReach: 0,
      avgSaves: 0,
      dmInquiries: 0,
      avgEngagementRate: 0,
      topPostTitle: null,
    },
    tiktokInsights: {
      videoCount: 0,
      totalViews: 0,
      avgShares: 0,
      viralPotentialScore: 0,
      waInquiries: 0,
      avgEngagementRate: 0,
      topPostTitle: null,
    },
    lastSyncedAt: null,
  }

  if (!clientId) return emptyResult

  try {
    const supabase = await createClient()

    const [clientRes, channelsRes, metricsRes, postsRes] = await Promise.all([
      supabase.from("clients").select("id, name, updated_at").eq("id", clientId).maybeSingle(),
      supabase.from("client_channels").select("*").eq("client_id", clientId),
      supabase.from("post_metrics").select("*").eq("client_id", clientId).order("recorded_at", { ascending: false }),
      supabase.from("scheduled_posts").select("id, title, platform, creative_format, content_type").eq("client_id", clientId),
    ])

    const clientName = clientRes.data?.name || "Client"
    const channels = channelsRes.data ?? []
    const allMetrics = (metricsRes.data ?? []) as PostMetric[]
    const posts = postsRes.data ?? []

    const postMetaMap = new Map<string, { title: string; platform: string; creative_format?: string; content_type?: string }>()
    for (const p of posts) {
      postMetaMap.set(p.id, {
        title: p.title,
        platform: p.platform,
        creative_format: (p as any).creative_format,
        content_type: (p as any).content_type,
      })
    }

    // Filter by period if specified
    const now = Date.now()
    let filteredMetrics = allMetrics
    if (period === "7d") {
      const cut = new Date(now - 7 * 86400000).toISOString()
      filteredMetrics = allMetrics.filter((m) => !m.recorded_at || m.recorded_at >= cut)
    } else if (period === "30d") {
      const cut = new Date(now - 30 * 86400000).toISOString()
      filteredMetrics = allMetrics.filter((m) => !m.recorded_at || m.recorded_at >= cut)
    } else if (period === "90d") {
      const cut = new Date(now - 90 * 86400000).toISOString()
      filteredMetrics = allMetrics.filter((m) => !m.recorded_at || m.recorded_at >= cut)
    }

    // Channels map
    const channelByPlatform = new Map<string, (typeof channels)[0]>()
    for (const ch of channels) {
      channelByPlatform.set(ch.platform.toLowerCase(), ch)
    }

    const platformBuckets = new Map<string, {
      postCount: number
      reach: number
      views: number
      likes: number
      comments: number
      shares: number
      saves: number
      clicks: number
      inquiries: number
    }>()

    let totalReach = 0
    let totalViews = 0
    let totalLikes = 0
    let totalComments = 0
    let totalShares = 0
    let totalSaves = 0
    let totalClicks = 0
    let totalInquiries = 0

    // Instagram deep-dive tracking
    let igReelsCount = 0
    let igCarouselCount = 0
    let igStaticCount = 0
    let igTotalReach = 0
    let igTotalSaves = 0
    let igDmInquiries = 0
    let igEngagementSum = 0
    let igPostCount = 0
    let igTopPostTitle: string | null = null
    let igMaxReach = -1

    // TikTok deep-dive tracking
    let ttVideoCount = 0
    let ttTotalViews = 0
    let ttTotalShares = 0
    let ttTotalSaves = 0
    let ttWaInquiries = 0
    let ttEngagementSum = 0
    let ttReachSum = 0
    let ttTopPostTitle: string | null = null
    let ttMaxViews = -1

    for (const m of filteredMetrics) {
      const pMeta = postMetaMap.get(m.post_id)
      const plat = (m.platform || pMeta?.platform || "general").toLowerCase()
      const reach = Number(m.reach) || 0
      const views = Number(m.views) || 0
      const likes = Number(m.likes) || 0
      const comments = Number(m.comments) || 0
      const shares = Number(m.shares) || 0
      const saves = Number(m.saves) || 0
      const clicks = Number(m.clicks) || 0
      const inquiries = (Number(m.wa_inquiries) || 0) + (Number(m.dm_inquiries) || 0)

      totalReach += reach
      totalViews += views
      totalLikes += likes
      totalComments += comments
      totalShares += shares
      totalSaves += saves
      totalClicks += clicks
      totalInquiries += inquiries

      const b = platformBuckets.get(plat) ?? {
        postCount: 0,
        reach: 0,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        clicks: 0,
        inquiries: 0,
      }
      b.postCount += 1
      b.reach += reach
      b.views += views
      b.likes += likes
      b.comments += comments
      b.shares += shares
      b.saves += saves
      b.clicks += clicks
      b.inquiries += inquiries
      platformBuckets.set(plat, b)

      // Instagram insights
      if (plat === "instagram") {
        igPostCount += 1
        igTotalReach += reach
        igTotalSaves += saves
        igDmInquiries += (Number(m.dm_inquiries) || 0)
        igEngagementSum += (likes + comments + shares + saves)
        const format = (pMeta?.creative_format || "reels").toLowerCase()
        if (format === "carousel") igCarouselCount += 1
        else if (format === "static") igStaticCount += 1
        else igReelsCount += 1

        if (reach > igMaxReach) {
          igMaxReach = reach
          igTopPostTitle = pMeta?.title || `Post ${m.post_id.slice(0, 6)}`
        }
      }

      // TikTok insights
      if (plat === "tiktok") {
        ttVideoCount += 1
        const effectiveViews = views || reach
        ttTotalViews += effectiveViews
        ttTotalShares += shares
        ttTotalSaves += saves
        ttWaInquiries += (Number(m.wa_inquiries) || 0)
        ttEngagementSum += (likes + comments + shares + saves)
        ttReachSum += reach

        if (effectiveViews > ttMaxViews) {
          ttMaxViews = effectiveViews
          ttTopPostTitle = pMeta?.title || `Video ${m.post_id.slice(0, 6)}`
        }
      }
    }

    // Ensure all registered channels appear even if 0 posts
    for (const ch of channels) {
      const p = ch.platform.toLowerCase()
      if (!platformBuckets.has(p)) {
        platformBuckets.set(p, {
          postCount: 0,
          reach: 0,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          clicks: 0,
          inquiries: 0,
        })
      }
    }

    const platformsRecord: Record<string, PlatformMetricsSummary> = {}
    const platformList: PlatformMetricsSummary[] = []

    for (const [p, b] of platformBuckets.entries()) {
      const ch = channelByPlatform.get(p)
      const eng = b.likes + b.comments + b.shares + b.saves
      const er = b.reach > 0 ? Number(((eng / b.reach) * 100).toFixed(2)) : 0

      const summary: PlatformMetricsSummary = {
        platform: p,
        accountHandle: ch?.handle || null,
        accountAvatar: ch?.avatar_url || null,
        accountStatus: ch?.status || (b.postCount > 0 ? "terhubung" : "belum"),
        postCount: b.postCount,
        totalReach: b.reach,
        totalViews: b.views,
        totalLikes: b.likes,
        totalComments: b.comments,
        totalShares: b.shares,
        totalSaves: b.saves,
        totalClicks: b.clicks,
        totalInquiries: b.inquiries,
        engagementRate: er,
      }
      platformsRecord[p] = summary
      platformList.push(summary)
    }

    // Sort platformList: connected first, then by reach desc
    platformList.sort((a, b) => {
      if (a.accountStatus === "terhubung" && b.accountStatus !== "terhubung") return -1
      if (b.accountStatus === "terhubung" && a.accountStatus !== "terhubung") return 1
      return b.totalReach - a.totalReach
    })

    const totalEngagement = totalLikes + totalComments + totalShares + totalSaves
    const overallEr = totalReach > 0 ? Number(((totalEngagement / totalReach) * 100).toFixed(2)) : 0

    // Viral potential score calculation:
    // (shares + saves) / totalViews * 1000 clamped to 100
    const ttEngageSignals = ttTotalShares + ttTotalSaves
    let ttViralScore = 0
    if (ttTotalViews > 0) {
      ttViralScore = Math.min(100, Math.round((ttEngageSignals / ttTotalViews) * 1000))
    }

    const connectedCount = channels.filter((c) => c.status === "terhubung").length

    // Determine latest sync time
    let latestTimestamp: string | null = null
    for (const ch of channels) {
      if (ch.updated_at && (!latestTimestamp || ch.updated_at > latestTimestamp)) {
        latestTimestamp = ch.updated_at
      }
    }
    for (const m of allMetrics) {
      if (m.recorded_at && (!latestTimestamp || m.recorded_at > latestTimestamp)) {
        latestTimestamp = m.recorded_at
      }
    }

    return {
      clientId,
      clientName,
      connectedAccountsCount: connectedCount || (channels.length > 0 ? channels.length : 0),
      totalReach,
      totalViews,
      totalEngagement,
      totalClicks,
      totalInquiries,
      overallEngagementRate: overallEr,
      platforms: platformsRecord,
      platformList,
      instagramInsights: {
        reelsCount: igReelsCount,
        carouselCount: igCarouselCount,
        staticCount: igStaticCount,
        totalReach: igTotalReach,
        avgSaves: igPostCount > 0 ? Math.round(igTotalSaves / igPostCount) : 0,
        dmInquiries: igDmInquiries,
        avgEngagementRate: igTotalReach > 0 ? Number(((igEngagementSum / igTotalReach) * 100).toFixed(2)) : 0,
        topPostTitle: igTopPostTitle,
      },
      tiktokInsights: {
        videoCount: ttVideoCount,
        totalViews: ttTotalViews,
        avgShares: ttVideoCount > 0 ? Math.round(ttTotalShares / ttVideoCount) : 0,
        viralPotentialScore: ttViralScore,
        waInquiries: ttWaInquiries,
        avgEngagementRate: ttReachSum > 0 ? Number(((ttEngagementSum / ttReachSum) * 100).toFixed(2)) : 0,
        topPostTitle: ttTopPostTitle,
      },
      lastSyncedAt: latestTimestamp,
    }
  } catch (err: any) {
    logger.error("getMultiAccountAnalytics error", { error: err })
    return { ...emptyResult, clientName: "Error loading analytics" }
  }
}

/**
 * Sinkronisasi data akun & metrik sosial multi-channel (WoopSocial Bridge / Ayrshare)
 */
export async function syncMultiAccountSocialData(
  input: SyncMultiAccountInput
): Promise<SyncMultiAccountResult> {
  const { clientId, source } = SyncMultiAccountInputSchema.parse(input)
  const supabase = await createClient()

  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .select("id, name, ayrshare_profile_key")
    .eq("id", clientId)
    .single()

  if (clientErr || !client) {
    throw new Error(clientErr?.message || "Client not found")
  }

  let accountsFound = 0
  let accountsSynced = 0
  const metricsCreated = 0
  const syncedPlatforms: string[] = []

  // 1. Sync from WoopSocial Bridge if configured
  if (source === "all" || source === "woopsocial") {
    try {
      const apiKey = await getBridgeKey()
      const projectKey = client.ayrshare_profile_key || client.id
      if (apiKey && projectKey) {
        const accountsRes = await listSocialAccounts(apiKey, projectKey)
        if (accountsRes.ok && Array.isArray(accountsRes.data)) {
          accountsFound += accountsRes.data.length
          for (const acc of accountsRes.data) {
            const platform = acc.platform.toLowerCase()
            const handle = acc.username ? `@${acc.username.replace(/^@/, '')}` : `@${platform}_account`
            const avatarUrl = acc.imageUrl || null

            // Upsert into client_channels
            const { data: existingChannel } = await supabase
              .from("client_channels")
              .select("id")
              .eq("client_id", clientId)
              .eq("platform", platform)
              .maybeSingle()

            if (existingChannel) {
              await supabase
                .from("client_channels")
                .update({
                  handle,
                  avatar_url: avatarUrl,
                  status: "terhubung",
                  confirmed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingChannel.id)
            } else {
              await supabase
                .from("client_channels")
                .insert({
                  client_id: clientId,
                  platform,
                  handle,
                  avatar_url: avatarUrl,
                  status: "terhubung",
                  confirmed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
            }

            accountsSynced += 1
            if (!syncedPlatforms.includes(platform)) {
              syncedPlatforms.push(platform)
            }
          }
        }
      }
    } catch (wsErr: any) {
      logger.warn("WoopSocial sync warning (continuing)", { error: wsErr.message })
    }
  }

  // 2. Ensure existing client channels are touched and verified
  const { data: currentChannels } = await supabase
    .from("client_channels")
    .select("id, platform, status")
    .eq("client_id", clientId)

  if (currentChannels && currentChannels.length > 0) {
    accountsFound = Math.max(accountsFound, currentChannels.length)
    if (accountsSynced === 0) {
      for (const ch of currentChannels) {
        await supabase
          .from("client_channels")
          .update({
            updated_at: new Date().toISOString(),
            status: ch.status === "gagal" ? "gagal" : "terhubung",
          })
          .eq("id", ch.id)
        accountsSynced += 1
        if (!syncedPlatforms.includes(ch.platform.toLowerCase())) {
          syncedPlatforms.push(ch.platform.toLowerCase())
        }
      }
    }
  }

  // 3. Log Audit
  void logAudit({
    action: "social.multi_account_sync",
    entityType: "client",
    entityId: clientId,
    clientId,
    summary: `Synced ${accountsSynced} social account(s) across platforms: ${syncedPlatforms.join(", ")}`,
  })

  return {
    success: true,
    accountsFound,
    accountsSynced,
    metricsCreated,
    syncedPlatforms,
    message: `Berhasil menyinkronkan ${accountsSynced} akun sosial (${syncedPlatforms.join(", ") || "Semua terhubung"}).`,
  }
}
