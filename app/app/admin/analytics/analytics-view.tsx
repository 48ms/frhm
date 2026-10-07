"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { CampaignAnalyticsView, type CampaignItem } from "./campaign-analytics-view"
import { AudienceTrajectory } from "@/components/analytics/audience-trajectory"
import { Icons } from "@/components/icons"
import { useQuery } from "@tanstack/react-query"
import { campaignQueries } from "@/features/campaigns/api/queries"
import { analyticsQueries } from "@/features/analytics/api/queries"
import { scheduledPostQueries } from "@/features/scheduled-posts/api/queries"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"

function formatNumber(num: number): string {
  if (!num || isNaN(num)) return "0"
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M"
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "k"
  return num.toLocaleString("id-ID")
}

function getCampaignStatus(c: { start_date: string | null; end_date: string | null }): "active" | "completed" | "upcoming" {
  const now = new Date()
  if (!c.start_date && !c.end_date) return "active"
  if (c.end_date) {
    const end = new Date(c.end_date + "T23:59:59")
    if (end < now) return "completed"
  }
  if (c.start_date) {
    const start = new Date(c.start_date + "T00:00:00")
    if (start > now) return "upcoming"
  }
  return "active"
}

export function AnalyticsView() {
  // Klien aktif factual dari DB (useActiveDashboard) — sumber clientId URL.
  const { clientId, client: activeClient, clients } = useActiveDashboard()

  // Campaign factual dari Supabase (content_campaigns) milik klien aktif.
  const { data: campaignsData } = useQuery({
    ...campaignQueries.listByClient(clientId),
    enabled: Boolean(clientId),
  })
  const campaigns = campaignsData ?? []

  // Scheduled posts factual dari Supabase (scheduled_posts) milik klien aktif.
  const { data: postsData } = useQuery({
    ...scheduledPostQueries.listByClient(clientId),
    enabled: Boolean(clientId),
  })
  const allPosts = postsData ?? []

  // Metrics factual dari Supabase (post_metrics) milik klien aktif.
  const { data: metricsData } = useQuery({
    ...analyticsQueries.listMetricsByClient(clientId),
    enabled: Boolean(clientId),
  })
  const allMetrics = metricsData ?? []

  // Analytics summaries / AI insight faktual dari Supabase (analytics_summaries).
  const { data: summariesData } = useQuery({
    ...analyticsQueries.listSummariesByClient(clientId),
    enabled: Boolean(clientId),
  })
  const latestSummary = summariesData?.[0]

  const clientsList = React.useMemo(
    () => clients.map((c) => ({ id: c.id, name: c.name })),
    [clients]
  )

  // Deret trajektori faktual dari post_metrics (recorded_at). Satu titik per
  // tanggal rekaman, dijumlahkan lintas postingan, terurut lama ke baru.
  const trajectory = React.useMemo(() => {
    const byDay = new Map<string, { reach: number; engage: number }>()
    for (const m of allMetrics) {
      const day = (m.recorded_at || "").split("T")[0]
      if (!day) continue
      const cur = byDay.get(day) ?? { reach: 0, engage: 0 }
      cur.reach += Number(m.reach) || 0
      cur.engage +=
        (Number(m.likes) || 0) +
        (Number(m.comments) || 0) +
        (Number(m.shares) || 0) +
        (Number(m.saves) || 0)
      byDay.set(day, cur)
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([day, v]) => ({ label: day, reach: v.reach, engage: v.engage }))
  }, [allMetrics])

  const totals = React.useMemo(() => {
    let reach = 0, clicks = 0, engagement = 0, inquiries = 0
    for (const m of allMetrics) {
      reach += Number(m.reach) || 0
      clicks += Number(m.clicks) || 0
      engagement += (Number(m.likes) || 0) + (Number(m.comments) || 0) + (Number(m.shares) || 0) + (Number(m.saves) || 0)
      inquiries += (Number(m.wa_inquiries) || 0) + (Number(m.dm_inquiries) || 0)
    }
    return {
      reach,
      clicks,
      engagement,
      inquiries,
      inquiryRate: clicks > 0 ? ((inquiries / clicks) * 100).toFixed(1) : "0.0",
      engagementRate: reach > 0 ? ((engagement / reach) * 100).toFixed(1) : "0.0",
    }
  }, [allMetrics])

  // Campaign cards for the active client, with stats derived from metrics.
  const preparedCampaigns: CampaignItem[] = React.useMemo(() => {
    return campaigns.map((c) => {
      let reach = 0, engagement = 0, clicks = 0, inquiries = 0, contentCount = 0
      const campName = c.name?.trim().toLowerCase()

      for (const m of allMetrics) {
        const post = allPosts.find((p) => p.id === m.post_id)
        if (!post) continue
        
        const postTag = post.campaign_tag?.trim().toLowerCase()
        const matchesTag = Boolean(postTag && campName && postTag === campName)
        let matches = matchesTag
        if (!matches && c.start_date && c.end_date && post.scheduled_at) {
          const postDate = post.scheduled_at.split("T")[0]
          if (postDate >= c.start_date && postDate <= c.end_date) matches = true
        }

        if (matches) {
          reach += Number(m.reach) || 0
          engagement += (Number(m.likes) || 0) + (Number(m.comments) || 0) + (Number(m.shares) || 0) + (Number(m.saves) || 0)
          clicks += Number(m.clicks) || 0
          inquiries += (Number(m.wa_inquiries) || 0) + (Number(m.dm_inquiries) || 0)
          contentCount += 1
        }
      }

      return {
        id: c.id,
        name: c.name,
        type: c.type,
        start_date: c.start_date,
        end_date: c.end_date,
        color: c.color,
        notes: c.notes,
        client_id: c.client_id,
        clientName: activeClient?.name || "Client",
        status: getCampaignStatus(c),
        stats: { reach, engagement, clicks, inquiries, contentCount },
      }
    })
  }, [campaigns, allMetrics, allPosts, activeClient?.name])

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="admin-card-glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-xs font-semibold text-muted-foreground">Aggregate Reach</CardDescription>
            <div className="rounded-full bg-blue-500/10 p-2 text-blue-600">
              <Icons.activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-syne tracking-tight">{formatNumber(totals.reach)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>Total jangkauan dari metrik tercatat</span>
            </p>
          </CardContent>
        </Card>

        <Card className="admin-card-glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-xs font-semibold text-muted-foreground">Engagement Rate</CardDescription>
            <div className="rounded-full bg-violet-500/10 p-2 text-violet-600">
              <Icons.heart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-syne tracking-tight">{totals.engagementRate}%</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>Interaksi dibagi jangkauan (metrik faktual)</span>
            </p>
          </CardContent>
        </Card>

        <Card className="admin-card-glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-xs font-semibold text-muted-foreground">Total Clicks</CardDescription>
            <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
              <Icons.bolt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-syne tracking-tight">{formatNumber(totals.clicks)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>Volume klik dari metrik tercatat</span>
            </p>
          </CardContent>
        </Card>

        <Card className="admin-card-glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-xs font-semibold text-muted-foreground">Inquiry Rate</CardDescription>
            <div className="rounded-full bg-orange-500/10 p-2 text-orange-600">
              <Icons.chat className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-syne tracking-tight">{totals.inquiryRate}%</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>Pertanyaan dibagi klik (metrik faktual)</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AudienceTrajectory data={trajectory} />
        </div>
        <div className="lg:col-span-4">
          <Card className="admin-card-glass h-full">
            <CardHeader>
              <CardDescription className="text-xs font-semibold text-muted-foreground">Performance Insight</CardDescription>
              <h3 className="text-lg font-bold font-syne mt-1">AI Contextual Summary</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icons.bot className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-primary">Faktual AI Insight</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {latestSummary?.ai_insight || (
                    allMetrics.length > 0 
                      ? `Berdasarkan ${allMetrics.length} data metrik tercatat, total jangkauan (reach) mencapai ${formatNumber(totals.reach)} dengan tingkat interaksi ${totals.engagementRate}%.`
                      : "Belum ada data metrik faktual tercatat untuk klien ini pada periode aktif."
                  )}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Periode ringkasan</span>
                  <span className="text-foreground">
                    {latestSummary
                      ? `${latestSummary.period_start} s.d. ${latestSummary.period_end}`
                      : "Belum ada ringkasan"}
                  </span>
                </div>
                {latestSummary && (
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Total reach ringkasan</span>
                    <span className="text-foreground">{formatNumber(Number(latestSummary.total_reach) || 0)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CampaignAnalyticsView campaigns={preparedCampaigns} clients={clientsList} />
    </div>
  )
}
