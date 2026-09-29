import type { TrendRadarFilter } from './types'
import type { TrendRadarItem } from '@/lib/trends/radar'
import { getCombinedTrendRadar } from '@/lib/trends/radar'

export async function fetchTrendRadar(filter: TrendRadarFilter): Promise<TrendRadarItem[]> {
  const category = filter === 'fnb' ? 'fnb' : undefined
  return getCombinedTrendRadar(category)
}
