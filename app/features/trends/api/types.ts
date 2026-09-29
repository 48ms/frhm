import type { TrendRadarItem } from '@/lib/trends/radar'

export type TrendRadarFilter = 'all' | 'fnb'

export interface TrendRadarListResponse {
  trends: TrendRadarItem[]
}

export interface TrendGeneratePayload {
  clientId: string
  trendTopic: string
  trendSnippet?: string
}
