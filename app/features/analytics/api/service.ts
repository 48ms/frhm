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
