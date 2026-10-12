"use server"

import { createClient } from "@/lib/supabase/server"
import { resolveProvider, loadSkillBundle, loadClientFiles, brandContext } from "@/lib/ai/server"
import { chatJson } from "@/lib/ai/providers"
import { logger } from "@/lib/logger"
import {
  AuditPerformanceInputSchema,
  AuditPerformanceReportSchema,
  type AuditPerformanceInput,
  type AuditPerformanceResponse,
  type AuditPerformanceReport,
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
