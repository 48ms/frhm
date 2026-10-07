/**
 * Report generator — membangun berkas laporan dari data metrik NYATA
 * (post_metrics & analytics_summaries), bukan angka rekaan.
 *
 * Semua fungsi di sini murni (pure): input data → output string/berkas.
 * Tidak ada simulasi progres, tidak ada angka hardcoded.
 */

import type { PostMetric, AnalyticsSummary } from "@/features/analytics/api/service"

export type ReportFormat = "pdf" | "markdown" | "csv"
export type ReportRange = "7d" | "30d" | "90d"

const RANGE_DAYS: Record<ReportRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
}

/** Titik potong waktu (epoch ms) untuk rentang yang dipilih. */
export function rangeCutoff(range: ReportRange, now = Date.now()): number {
  return now - RANGE_DAYS[range] * 86_400_000
}

/** Saring metrik ke rentang tanggal yang diminta (berdasarkan recorded_at). */
export function filterMetricsByRange(metrics: PostMetric[], range: ReportRange): PostMetric[] {
  const cutoff = rangeCutoff(range)
  return metrics.filter((m) => {
    const t = new Date(m.recorded_at).getTime()
    return Number.isFinite(t) && t >= cutoff
  })
}

export interface ReportTotals {
  posts: number
  reach: number
  views: number
  engagement: number
  waInquiries: number
  dmInquiries: number
}

/** Agregasi angka dari baris metrik nyata. */
export function aggregate(metrics: PostMetric[]): ReportTotals {
  return metrics.reduce<ReportTotals>(
    (acc, m) => ({
      posts: acc.posts + 1,
      reach: acc.reach + (m.reach ?? 0),
      views: acc.views + (m.views ?? 0),
      engagement:
        acc.engagement +
        (m.likes ?? 0) +
        (m.comments ?? 0) +
        (m.shares ?? 0) +
        (m.saves ?? 0),
      waInquiries: acc.waInquiries + (m.wa_inquiries ?? 0),
      dmInquiries: acc.dmInquiries + (m.dm_inquiries ?? 0),
    }),
    { posts: 0, reach: 0, views: 0, engagement: 0, waInquiries: 0, dmInquiries: 0 }
  )
}

/** Baris-baris laporan yang dipakai ketiga format. */
export interface ReportModel {
  clientName: string
  range: ReportRange
  generatedAt: string
  totals: ReportTotals
  byPlatform: { platform: string; posts: number; reach: number; engagement: number }[]
  insights: string[]
}

export function buildReportModel(
  clientName: string,
  range: ReportRange,
  metrics: PostMetric[],
  summaries: AnalyticsSummary[]
): ReportModel {
  const scoped = filterMetricsByRange(metrics, range)
  const totals = aggregate(scoped)

  const platformMap = new Map<string, { posts: number; reach: number; engagement: number }>()
  for (const m of scoped) {
    const key = m.platform || "unknown"
    const cur = platformMap.get(key) ?? { posts: 0, reach: 0, engagement: 0 }
    cur.posts += 1
    cur.reach += m.reach ?? 0
    cur.engagement += (m.likes ?? 0) + (m.comments ?? 0) + (m.shares ?? 0) + (m.saves ?? 0)
    platformMap.set(key, cur)
  }
  const byPlatform = [...platformMap.entries()]
    .map(([platform, v]) => ({ platform, ...v }))
    .sort((a, b) => b.reach - a.reach)

  // Hanya insight yang benar-benar tersimpan di DB (kolom ai_insight).
  const insights = summaries
    .map((s) => s.ai_insight)
    .filter((v): v is string => Boolean(v && v.trim()))

  return {
    clientName,
    range,
    generatedAt: new Date().toISOString(),
    totals,
    byPlatform,
    insights,
  }
}

/** Nama berkas yang aman untuk diunduh. */
export function reportFileName(clientName: string, range: ReportRange, ext: string): string {
  const slug = clientName.replace(/\s+/g, "-").toLowerCase() || "client"
  return `${slug}-performance-${range}.${ext}`
}

const RANGE_LABEL: Record<ReportRange, string> = {
  "7d": "7 hari terakhir",
  "30d": "30 hari terakhir",
  "90d": "90 hari terakhir",
}

/** CSV sungguhan (RFC 4180) dari baris metrik nyata. */
export function buildCsv(model: ReportModel): string {
  const esc = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines: string[] = []
  lines.push(["Laporan", model.clientName, RANGE_LABEL[model.range]].map(esc).join(","))
  lines.push(["Dibuat", model.generatedAt].map(esc).join(","))
  lines.push("")
  lines.push(["Platform", "Posts", "Reach", "Engagement"].map(esc).join(","))
  for (const p of model.byPlatform) {
    lines.push([p.platform, p.posts, p.reach, p.engagement].map(esc).join(","))
  }
  lines.push("")
  lines.push(["Total Posts", model.totals.posts].map(esc).join(","))
  lines.push(["Total Reach", model.totals.reach].map(esc).join(","))
  lines.push(["Total Views", model.totals.views].map(esc).join(","))
  lines.push(["Total Engagement", model.totals.engagement].map(esc).join(","))
  lines.push(["WA Inquiries", model.totals.waInquiries].map(esc).join(","))
  lines.push(["DM Inquiries", model.totals.dmInquiries].map(esc).join(","))
  return lines.join("\n")
}

/** Markdown dari baris metrik nyata. */
export function buildMarkdown(model: ReportModel): string {
  const n = (v: number) => v.toLocaleString("id-ID")
  const out: string[] = []
  out.push(`# Laporan Performa — ${model.clientName}`)
  out.push("")
  out.push(`Rentang: **${RANGE_LABEL[model.range]}** · Dibuat ${model.generatedAt}`)
  out.push("")
  out.push("## Ringkasan")
  out.push("")
  out.push("| Metrik | Nilai |")
  out.push("| --- | --- |")
  out.push(`| Post tercatat | ${n(model.totals.posts)} |`)
  out.push(`| Reach | ${n(model.totals.reach)} |`)
  out.push(`| Views | ${n(model.totals.views)} |`)
  out.push(`| Engagement | ${n(model.totals.engagement)} |`)
  out.push(`| WA inquiries | ${n(model.totals.waInquiries)} |`)
  out.push(`| DM inquiries | ${n(model.totals.dmInquiries)} |`)
  out.push("")
  out.push("## Per platform")
  out.push("")
  out.push("| Platform | Posts | Reach | Engagement |")
  out.push("| --- | --- | --- | --- |")
  for (const p of model.byPlatform) {
    out.push(`| ${p.platform} | ${n(p.posts)} | ${n(p.reach)} | ${n(p.engagement)} |`)
  }
  if (model.insights.length) {
    out.push("")
    out.push("## Catatan AI")
    out.push("")
    for (const i of model.insights) out.push(`- ${i}`)
  }
  return out.join("\n")
}
