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
