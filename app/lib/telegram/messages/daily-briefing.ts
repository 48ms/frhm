/**
 * Format laporan harian untuk dispatch via Telegram.
 * Dua profil: 'admin' (ke bot Frhm internal) dan 'client' (ke grup brand).
 * Dilarang emoji/ikon dekoratif per antislop-copywriting rule.
 */

export interface BriefingData {
  clientName: string
  todayStr: string
  periodStart: string
  periodEnd: string
  totalPosts: number
  totalReach: number
  engagementRate: number
  totalWa: number
  totalDm: number
  aiInsight: string
  sentimentSummary?: {
    total_processed: number
    positive_count: number
    neutral_count: number
    negative_count: number
    avg_confidence: number
  }
  // Forecast & extras (Phase 2-3)
  competitorBenchmarks?: string
  seasonalContext?: string
  predictiveForecast?: string
}

export function buildAdminReport(data: BriefingData): string {
  const lines = [
    `<b>[INTERNAL] Daily Insight Briefing — ${data.clientName}</b>`,
    `<b>${data.todayStr}</b>`,
    '',
    `<b>Periode:</b> ${data.periodStart} - ${data.periodEnd}`,
    `<b>Total Posts:</b> ${data.totalPosts}`,
    `<b>Total Reach:</b> ${data.totalReach.toLocaleString('id-ID')}`,
    `<b>Engagement Rate:</b> ${data.engagementRate.toFixed(1)}%`,
    `<b>Attribution:</b> WA ${data.totalWa} | DM ${data.totalDm}`,
    data.sentimentSummary && data.sentimentSummary.total_processed > 0
      ? `<b>Sentiment:</b> Positif ${data.sentimentSummary.positive_count} | Netral ${data.sentimentSummary.neutral_count} | Negatif ${data.sentimentSummary.negative_count} (${data.sentimentSummary.avg_confidence}% conf.)`
      : '',
    '',
    `<b>AI Insight:</b>`,
    data.aiInsight,
    '',
  ]

  if (data.competitorBenchmarks) {
    lines.push(`<b>Competitor Benchmark:</b> ${data.competitorBenchmarks}`, '')
  }
  if (data.seasonalContext) {
    lines.push(`<b>Seasonal Context:</b> ${data.seasonalContext}`, '')
  }
  if (data.predictiveForecast) {
    lines.push(`<b>Predictive Forecast:</b> ${data.predictiveForecast}`, '')
  }

  lines.push(`<b>Minggu depan:</b> Rekomendasi di atas bisa dieksekusi langsung di dashboard.`)

  return lines.join('\n')
}

export function buildClientReport(data: BriefingData): string {
  const lines = [
    `<b>Halo ${data.clientName}, berikut laporan performa harian Anda:</b>`,
    '',
    `<b>${data.todayStr}</b>`,
    `<b>Total Posts:</b> ${data.totalPosts} | <b>Reach:</b> ${data.totalReach.toLocaleString('id-ID')} | <b>Engagement:</b> ${data.engagementRate.toFixed(1)}%`,
    `<b>Inquiry:</b> ${data.totalWa} WA | ${data.totalDm} DM`,
    data.sentimentSummary && data.sentimentSummary.total_processed > 0
      ? `<b>Sentiment:</b> P ${data.sentimentSummary.positive_count} | N ${data.sentimentSummary.neutral_count} | Neg ${data.sentimentSummary.negative_count}`
      : '',
    '',
    `<b>AI Insight Terbaru:</b>`,
    data.aiInsight.substring(0, 400) + '...',
    '',
  ]

  if (data.predictiveForecast) {
    lines.push(`<b>Proyeksi Bulan Depan:</b> ${data.predictiveForecast}`, '')
  }

  lines.push('Detail lengkap dapat dilihat di dashboard Frhm.')

  return lines.join('\n')
}
