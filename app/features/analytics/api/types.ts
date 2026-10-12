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
