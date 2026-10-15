import { z } from "zod"

export interface ContentAnalytics {
  id: string
  post_id: string
  client_id: string
  reach: number
  impressions: number
  likes: number
  comments: number
  shares: number
  saves: number
  clicks: number
  wa_inquiries: number
  dm_inquiries: number
  recorded_at: string
  created_at: string
  updated_at: string
}

export type ContentAnalyticsInsert = Omit<ContentAnalytics, 'id' | 'created_at' | 'updated_at'>
export type ContentAnalyticsUpdate = Partial<ContentAnalyticsInsert>

// ---------------------------------------------------------------------------
// METER Framework Content Performance Audit (analytics-and-reporting skill)
// ---------------------------------------------------------------------------

export const AuditPerformanceInputSchema = z.object({
  clientId: z.string().min(1, "clientId wajib diisi"),
  period: z.string().optional().default("30d"),
})

export type AuditPerformanceInput = z.input<typeof AuditPerformanceInputSchema>

export const ActionableIterationSchema = z.object({
  action: z.string().describe("Concrete iteration action based on factual data"),
  targetPlatform: z.string().describe("instagram, tiktok, linkedin, twitter"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  recommendedPrompt: z.string().describe("Suggested hook or brief prompt to feed into Composer"),
})

export const AuditPerformanceReportSchema = z.object({
  overallHealth: z.enum(["EXCELLENT", "STABLE", "NEEDS_OPTIMIZATION"]),
  signalScore: z.number().min(0).max(100).describe("Composite score from Saves, Shares, Clicks, and Inquiries"),
  summary: z.string(),
  signalAnalysis: z.object({
    reachSignal: z.string(),
    engagementSignal: z.string(),
    conversionSignal: z.string(),
  }),
  winners: z.array(z.object({
    title: z.string(),
    reason: z.string(),
  })),
  underperformers: z.array(z.object({
    title: z.string(),
    rootCause: z.string(),
    fixAngle: z.string(),
  })),
  actionableIterations: z.array(ActionableIterationSchema),
})

export type AuditPerformanceReport = z.infer<typeof AuditPerformanceReportSchema>

export type AuditPerformanceResponse = {
  report?: AuditPerformanceReport
  error?: string
}

// ---------------------------------------------------------------------------
// Multi-Account Analytics Aggregator & Social Channel Insights
// ---------------------------------------------------------------------------

export interface PlatformMetricsSummary {
  platform: string
  accountHandle: string | null
  accountAvatar: string | null
  accountStatus: "belum" | "terhubung" | "gagal"
  postCount: number
  totalReach: number
  totalViews: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalSaves: number
  totalClicks: number
  totalInquiries: number
  engagementRate: number // in percentage, e.g. 4.2
}

export interface InstagramInsights {
  reelsCount: number
  carouselCount: number
  staticCount: number
  totalReach: number
  avgSaves: number
  dmInquiries: number
  avgEngagementRate: number
  topPostTitle: string | null
}

export interface TikTokInsights {
  videoCount: number
  totalViews: number
  avgShares: number
  viralPotentialScore: number // 0-100 based on share/save to view ratio
  waInquiries: number
  avgEngagementRate: number
  topPostTitle: string | null
}

export interface MultiAccountAnalytics {
  clientId: string
  clientName: string
  connectedAccountsCount: number
  totalReach: number
  totalViews: number
  totalEngagement: number
  totalClicks: number
  totalInquiries: number
  overallEngagementRate: number
  platforms: Record<string, PlatformMetricsSummary>
  platformList: PlatformMetricsSummary[]
  instagramInsights: InstagramInsights
  tiktokInsights: TikTokInsights
  lastSyncedAt: string | null
}

export const SyncMultiAccountInputSchema = z.object({
  clientId: z.string().min(1, "clientId wajib diisi"),
  source: z.enum(["woopsocial", "ayrshare", "all"]).optional().default("all"),
})

export type SyncMultiAccountInput = z.infer<typeof SyncMultiAccountInputSchema>

export interface SyncMultiAccountResult {
  success: boolean
  accountsFound: number
  accountsSynced: number
  metricsCreated: number
  syncedPlatforms: string[]
  message: string
}
