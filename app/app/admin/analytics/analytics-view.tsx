"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CampaignAnalyticsView, type CampaignItem } from "./campaign-analytics-view"
import { AudienceTrajectory } from "@/components/analytics/audience-trajectory"
import { MultiAccountAggregator } from "@/components/analytics/multi-account-aggregator"
import { Icons } from "@/components/icons"
import { useQuery } from "@tanstack/react-query"
import { campaignQueries } from "@/features/campaigns/api/queries"
import { analyticsQueries, useAuditPerformanceAndIterate } from "@/features/analytics/api/queries"
import type { AuditPerformanceReport } from "@/features/analytics/api/types"
import { scheduledPostQueries } from "@/features/scheduled-posts/api/queries"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"

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
  const pathname = usePathname()
  const isClientPortal = pathname?.startsWith("/client") ?? false
  // Klien aktif factual dari DB (useActiveDashboard) — sumber clientId URL.
  const { clientId, client: activeClient, clients } = useActiveDashboard()

  const [auditReport, setAuditReport] = React.useState<AuditPerformanceReport | null>(null)
  const { mutateAsync: runAudit, isPending: isAuditing } = useAuditPerformanceAndIterate()

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
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
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

  // Deret trajektori faktual dari post_metrics (recorded_at).
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

  const handleRunMeterAudit = async () => {
    try {
      const res = await runAudit({ clientId, period: "30d" })
      if (res.error) {
        toast.error(res.error)
        return
      }
      if (res.report) {
        setAuditReport(res.report)
        toast.success("Audit Performa METER Selesai!", {
          description: `Kesehatan: ${res.report.overallHealth} (Signal Score: ${res.report.signalScore}/100)`
        })
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengaudit performa konten.")
    }
  }

  if (metricsLoading) {
    return (
      <div className="space-y-6" data-testid="analytics-loading">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="admin-card-glass">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="h-3 w-24 rounded-full bg-muted animate-pulse" />
                <div className="rounded-full bg-muted p-2 size-8 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-7 w-20 rounded-md bg-muted animate-pulse" />
                <div className="h-3 w-32 rounded-full bg-muted/70 animate-pulse mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Card className="admin-card-glass h-[280px]">
              <CardContent className="h-full flex items-center justify-center">
                <div className="h-3 w-40 rounded-full bg-muted animate-pulse" />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-4">
            <Card className="admin-card-glass h-[280px]">
              <CardContent className="h-full flex items-center justify-center">
                <div className="h-3 w-32 rounded-full bg-muted animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="analytics-loaded">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="admin-card-glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-xs font-semibold text-muted-foreground">Aggregate Reach</CardDescription>
            <div className="rounded-full bg-[hsl(var(--admin-cobalt))]/10 p-2 text-[hsl(var(--admin-cobalt))]">
              <Icons.activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight flex items-baseline">
              <MetricTicker value={totals.reach} thousandSeparator="." />
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>Total jangkauan dari metrik tercatat</span>
            </p>
          </CardContent>
        </Card>

        <Card className="admin-card-glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-xs font-semibold text-muted-foreground">Engagement Rate</CardDescription>
            <div className="rounded-full bg-[hsl(var(--admin-lavender))]/10 p-2 text-[hsl(var(--admin-lavender))]">
              <Icons.heart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight flex items-baseline">
              <MetricTicker value={`${totals.engagementRate}%`} decimalSeparator="." />
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>Interaksi dibagi jangkauan (metrik faktual)</span>
            </p>
          </CardContent>
        </Card>

        <Card className="admin-card-glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-xs font-semibold text-muted-foreground">Total Clicks</CardDescription>
            <div className="rounded-full bg-[hsl(var(--success))]/10 p-2 text-[hsl(var(--success))]">
              <Icons.bolt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight flex items-baseline">
              <MetricTicker value={totals.clicks} thousandSeparator="." />
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>Volume klik dari metrik tercatat</span>
            </p>
          </CardContent>
        </Card>

        <Card className="admin-card-glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-xs font-semibold text-muted-foreground">Inquiry Rate</CardDescription>
            <div className="rounded-full bg-[hsl(var(--warning))]/10 p-2 text-[hsl(var(--warning))]">
              <Icons.chat className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight flex items-baseline">
              <MetricTicker value={`${totals.inquiryRate}%`} decimalSeparator="." />
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>Pertanyaan dibagi klik (metrik faktual)</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <AudienceTrajectory data={trajectory} />
        </div>
        <div className="lg:col-span-5">
          <Card className="admin-card-glass h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-xs font-semibold text-muted-foreground">Performance Insight &bull; AI Contextual Summary</CardDescription>
                  <h3 className="text-lg font-bold font-syne mt-0.5">METER Performance Audit</h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRunMeterAudit}
                  isLoading={isAuditing}
                  disabled={isAuditing}
                  className="gap-1.5 text-xs shadow-sm"
                >
                  <Icons.sparkles className="size-3.5 text-primary" />
                  {isAuditing ? (
                    <ShimmeringText text="Auditing METER..." className="text-xs" />
                  ) : (
                    <span>Audit METER (AI)</span>
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 flex-1">
              {auditReport ? (
                <div className="space-y-3.5">
                  {/* Status & Signal Score Banner */}
                  <div className={cn(
                    "p-3 rounded-xl border flex items-center justify-between",
                    auditReport.overallHealth === "EXCELLENT"
                      ? "bg-success/10 border-success/20 text-success"
                      : auditReport.overallHealth === "STABLE"
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "bg-warning/10 border-warning/20 text-warning"
                  )}>
                    <div className="flex items-center gap-2">
                      <Icons.target className="size-4 shrink-0" />
                      <div>
                        <span className="font-bold text-xs uppercase block">Status: {auditReport.overallHealth}</span>
                        <span className="text-2xs opacity-90">Signal Score: {auditReport.signalScore}/100</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setAuditReport(null)} className="min-h-9 text-2xs min-h-11">
                      Reset
                    </Button>
                  </div>

                  {/* Summary */}
                  <p className="text-xs leading-relaxed text-foreground/90 bg-muted/30 p-2.5 rounded-lg border border-border/30">
                    {auditReport.summary}
                  </p>

                  {/* Winners & Underperformers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
                    <div className="p-2.5 rounded-lg border border-border/40 bg-muted/20 space-y-1">
                      <span className="font-bold text-success flex items-center gap-1">
                        <Icons.circleCheck className="size-3" /> Top Winner
                      </span>
                      {auditReport.winners[0] ? (
                        <>
                          <p className="font-semibold text-foreground truncate">{auditReport.winners[0].title}</p>
                          <p className="text-muted-foreground line-clamp-2">{auditReport.winners[0].reason}</p>
                        </>
                      ) : (
                        <p className="text-muted-foreground italic">Belum ada winner tercatat</p>
                      )}
                    </div>
                    <div className="p-2.5 rounded-lg border border-border/40 bg-muted/20 space-y-1">
                      <span className="font-bold text-warning flex items-center gap-1">
                        <Icons.warning className="size-3" /> Underperformer
                      </span>
                      {auditReport.underperformers[0] ? (
                        <>
                          <p className="font-semibold text-foreground truncate">{auditReport.underperformers[0].title}</p>
                          <p className="text-muted-foreground line-clamp-2">{auditReport.underperformers[0].rootCause}</p>
                        </>
                      ) : (
                        <p className="text-muted-foreground italic">Performa konten seimbang</p>
                      )}
                    </div>
                  </div>

                  {/* 3 Actionable Iterations (Closed Loop) */}
                  <div className="space-y-2 pt-1 border-t border-border/40">
                    <span className="text-2xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Rekomendasi Iterasi (Next Actions):
                    </span>
                    <div className="space-y-1.5">
                      {auditReport.actionableIterations.slice(0, 3).map((iter, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-card border border-border/40 shadow-xs flex items-center justify-between gap-2 text-xs">
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-3xs uppercase font-mono px-1 py-0">
                                {iter.targetPlatform}
                              </Badge>
                              <span className="font-semibold text-xs truncate">{iter.action}</span>
                            </div>
                            <p className="text-2xs text-muted-foreground italic truncate mt-0.5">
                              "{iter.recommendedPrompt}"
                            </p>
                          </div>
                          <Link
                            href={isClientPortal ? `/client/support?clientId=${clientId}` : `/admin/composer`}
                            className="shrink-0 text-primary hover:underline text-2xs font-semibold flex items-center gap-0.5"
                            title={isClientPortal ? "Ajukan Permintaan Konten" : "Buat di Composer"}
                          >
                            <span>{isClientPortal ? "Request" : "Composer"}</span>
                            <Icons.arrowRight className="size-3" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <MultiAccountAggregator clientId={clientId} />

      <CampaignAnalyticsView
        campaigns={preparedCampaigns}
        clients={clientsList}
        isClientPortal={isClientPortal}
      />
    </div>
  )
}
