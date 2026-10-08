export type Timeframe = "7d" | "30d" | "90d"

export type DashboardMetric = {
  label: string
  value: string
  delta: string
  trend: "up" | "down" | "neutral"
  /** Relative sparkline heights, 0-100, rendered as mini bars. */
  spark: number[]
}

export type DashboardProfile = {
  id: string
  client_id: string
  greeting: string
  velocity: number
  peak_label: string
  peak_value: string
  /** Two SVG paths (reach + engagement) per timeframe. */
  charts: Record<Timeframe, { reach: string; engage: string }>
  insights: { label: string; value: string; sub: string }[]
  metrics: DashboardMetric[]
  updated_at?: string
}
