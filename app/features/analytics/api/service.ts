"use server"

import { createClient } from "@/lib/supabase/server"

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
