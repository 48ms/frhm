export interface PostMetric {
  id: string
  title: string
  platform: string
  scheduled_at: string
  campaign_tag?: string
  content_type?: string
  creative_format?: string
  post_metrics?: {
    reach: number
    likes: number
    comments: number
    shares: number
    saves: number
    clicks: number
    views: number
    wa_inquiries: number
    dm_inquiries: number
    theme_tag: string | null
    sentiment_summary?: {
      total_processed: number
      positive_count: number
      neutral_count: number
      negative_count: number
      avg_confidence: number
    } | null
  }[] | Record<string, unknown>
}

export interface MetricsResponse {
  posts: PostMetric[]
}

export interface Summary {
  id: string
  period_start: string
  period_end: string
  ai_insight: string
  total_reach: number
  campaign_tag?: string
  operator_notes?: string
}

export interface Campaign {
  id: string
  name: string
}

export type MetricField =
  | 'reach'
  | 'likes'
  | 'comments'
  | 'shares'
  | 'saves'
  | 'clicks'
  | 'views'
  | 'wa_inquiries'
  | 'dm_inquiries'

export interface GenerateInsightPayload {
  clientId: string
  periodStart: string
  periodEnd: string
  campaignTag?: string
}

export interface GenerateInsightResponse {
  summary: Summary
}

export interface UpdateMetricPayload {
  postId: string
  field: MetricField
  value: number
}

export interface UpdateSummaryNotesPayload {
  id: string
  ai_insight?: string
  operator_notes?: string
}
