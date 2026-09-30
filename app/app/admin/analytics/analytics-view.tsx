"use client"

import * as React from "react"
import { useQueryState, parseAsString } from "nuqs"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { PageContainer } from "@/components/layout/page-container"
import { CampaignAnalyticsView, type CampaignItem } from "./campaign-analytics-view"
import { AudienceTrajectory } from "@/components/analytics/audience-trajectory"
import { Icons } from "@/components/icons"
import { useAppStore } from "@/lib/store/app-store"
import { SOCIAL_CLIENTS } from "@/components/social-accounts/social-data"
import { MOCK_SCHEDULED_POSTS, generateMockMetrics } from "@/lib/mock-data"

function formatNumber(num: number): string {
  if (!num || isNaN(num)) return "0"
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M"
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "k"
  return num.toLocaleString("id-ID")
}

function getCampaignStatus(c: { startDate: string | null; endDate: string | null }): "active" | "completed" | "upcoming" {
  const now = new Date()
  if (!c.startDate && !c.endDate) return "active"
  if (c.endDate) {
    const end = new Date(c.endDate + "T23:59:59")
    if (end < now) return "completed"
  }
  if (c.startDate) {
    const start = new Date(c.startDate + "T00:00:00")
    if (start > now) return "upcoming"
  }
  return "active"
}

export function AnalyticsView() {
  // Zustand v5: select stable references, derive during render.
  const campaigns = useAppStore((s) => s.campaigns)

  // Active client lives in the URL (nuqs), shared with the sidebar + dashboard.
  const [clientId, setClientId] = useQueryState(
    "clientId",
    parseAsString.withDefault(SOCIAL_CLIENTS[0].id)
  )

  const clientsList = React.useMemo(
    () => SOCIAL_CLIENTS.map((c) => ({ id: c.id, name: c.name })),
    []
  )

  const activeClient = clientsList.find((c) => c.id === clientId) ?? clientsList[0]

  // Metrics are deterministic and derived from post ids (mock repository).
  const allMetrics = React.useMemo(() => generateMockMetrics(MOCK_SCHEDULED_POSTS), [])
  const allPosts = MOCK_SCHEDULED_POSTS

  // Scope every aggregate to the active client so the page follows ?clientId=.
  const clientPosts = React.useMemo(
    () => allPosts.filter((p) => p.client_id === activeClient.id),
    [allPosts, activeClient.id]
  )
  const clientMetrics = React.useMemo(() => {
    const ids = new Set(clientPosts.map((p) => p.id))
    return allMetrics.filter((m) => ids.has(m.post_id))
  }, [allMetrics, clientPosts])

  const totals = React.useMemo(() => {
    let reach = 0, clicks = 0, engagement = 0, inquiries = 0
    for (const m of clientMetrics) {
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
  }, [clientMetrics])

  // Campaign cards for the active client, with stats derived from metrics.
  const preparedCampaigns: CampaignItem[] = React.useMemo(() => {
    return campaigns
      .filter((c) => c.clientId === activeClient.id)
      .map((c) => {
        let reach = 0, engagement = 0, clicks = 0, inquiries = 0, contentCount = 0
        const campName = c.name?.trim().toLowerCase()

        for (const m of allMetrics) {
          const post = allPosts.find((p) => p.id === m.post_id)
          if (!post) continue
          if (post.client_id !== c.clientId) continue

          const postTag = post.campaign_tag?.trim().toLowerCase()
          const matchesTag = Boolean(postTag && campName && postTag === campName)
          let matches = matchesTag
          if (!matches && c.startDate && c.endDate && post.scheduled_at) {
            const postDate = post.scheduled_at.split("T")[0]
            if (postDate >= c.startDate && postDate <= c.endDate) matches = true
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
          start_date: c.startDate,
          end_date: c.endDate,
          color: c.color,
          notes: c.notes,
          client_id: c.clientId,
          clientName: activeClient.name,
          status: getCampaignStatus(c),
          stats: { reach, engagement, clicks, inquiries, contentCount },
        }
      })
  }, [campaigns, activeClient.id, activeClient.name, allMetrics, allPosts])

  return (
    <PageContainer
      pageTitle="Analytics & Insights"
      pageDescription="Performa campaign, engagement rate, dan korelasi konten terhadap sales & inquiry bisnis"
    >
      <div className="flex flex-col gap-6">
        {/* Client switcher: follows ?clientId=, shared with the sidebar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="admin-section-label">Active Client</span>
            <select
              value={clientId}
              onChange={(e) => void setClientId(e.target.value)}
              aria-label="Pilih klien untuk analitik"
              className="h-9 px-3 rounded-full bg-[hsl(var(--admin-surface-low))] border border-[hsl(var(--admin-outline-variant))]/40 text-xs font-bold text-[hsl(var(--admin-on-surface))] outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--admin-cobalt))]/30"
            >
              {clientsList.map((c) => (
                <option key={c.id} value={c.id}>
                  Client: {c.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-[hsl(var(--admin-outline))]">
            {clientPosts.length} konten dianalisis untuk {activeClient.name}
          </p>
        </div>

        {/* 4 Balanced Highlight Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-transparent bg-[hsl(var(--brand-accent))]/5 shadow-sm transition-all hover:shadow-md hover:bg-[hsl(var(--brand-accent))]/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-[hsl(var(--brand-accent))]/10 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-110 pointer-events-none"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardDescription className="flex items-center gap-1.5 font-medium text-[hsl(var(--brand-accent))] text-xs">
                <Icons.trendingUp className="size-3.5" />
                Total Reach
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold tabular-nums tracking-tight text-[hsl(var(--admin-on-surface))]">{formatNumber(totals.reach)}</div>
              <p className="text-[11px] text-[hsl(var(--admin-outline))] mt-1 font-medium">Jangkauan audiens seluruh konten</p>
            </CardContent>
          </Card>

          <Card className="border-none bg-[hsl(var(--admin-surface-low))] shadow-sm transition-all hover:shadow-md group">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 font-medium text-xs text-[hsl(var(--admin-outline))]">
                <Icons.layers className="size-3.5 group-hover:text-[hsl(var(--admin-on-surface))] transition-colors" />
                Total Engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums tracking-tight text-[hsl(var(--admin-on-surface))]">{formatNumber(totals.engagement)}</div>
              <p className="text-[11px] text-[hsl(var(--admin-outline))] mt-1 flex items-center gap-1">
                <span>Rasio interaksi:</span>
                <span className="font-semibold text-[hsl(var(--admin-on-surface))]">{totals.engagementRate}%</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-none bg-[hsl(var(--admin-surface-low))] shadow-sm transition-all hover:shadow-md group">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 font-medium text-xs text-[hsl(var(--admin-outline))]">
                <Icons.mousePointer className="size-3.5 group-hover:text-[hsl(var(--admin-on-surface))] transition-colors" />
                Web Clicks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums tracking-tight text-[hsl(var(--admin-on-surface))]">{formatNumber(totals.clicks)}</div>
              <p className="text-[11px] text-[hsl(var(--admin-outline))] mt-1">Traffic link profil & promosi bio</p>
            </CardContent>
          </Card>

          <Card className="border-none bg-[hsl(var(--admin-surface-low))] shadow-sm transition-all hover:shadow-md group">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 font-medium text-xs text-[hsl(var(--admin-outline))]">
                <Icons.chat className="size-3.5 group-hover:text-[hsl(var(--admin-on-surface))] transition-colors" />
                Inquiries Bisnis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums tracking-tight text-[hsl(var(--admin-on-surface))]">{formatNumber(totals.inquiries)}</div>
              <p className="text-[11px] text-[hsl(var(--admin-outline))] mt-1 flex items-center gap-1">
                <span>Konversi klik:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{totals.inquiryRate}%</span>
                <span>(WA & DM)</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Audience Trajectory, reference #2 signature chart */}
        <AudienceTrajectory />

        {/* Section Performa Campaign */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[hsl(var(--admin-on-surface))]">Performa per Campaign</h2>
              <p className="text-xs text-[hsl(var(--admin-outline))] mt-0.5">Analisis efektivitas kampanye tematik klien</p>
            </div>
          </div>

          {/* Interactive Campaign View with Tabs, Client Filter, & Search */}
          <CampaignAnalyticsView
            campaigns={preparedCampaigns}
            clients={clientsList}
          />
        </div>
      </div>
    </PageContainer>
  )
}
