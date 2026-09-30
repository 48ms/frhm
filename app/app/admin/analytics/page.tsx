import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { PageContainer } from "@/components/layout/page-container"
import { CampaignAnalyticsView, type CampaignItem } from "./campaign-analytics-view"
import { AudienceTrajectory } from "@/components/analytics/audience-trajectory"
import { Icons } from "@/components/icons"
import { MOCK_CLIENTS, MOCK_CAMPAIGNS, MOCK_SCHEDULED_POSTS, generateMockMetrics } from "@/lib/mock-data"

export const dynamic = "force-dynamic"

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

export default async function AnalyticsPage() {
  const clientsList = MOCK_CLIENTS
  const allCampaigns = MOCK_CAMPAIGNS
  const allPosts = MOCK_SCHEDULED_POSTS
  const allMetrics = generateMockMetrics(allPosts)
  
  let globalReach = 0
  let globalClicks = 0
  let globalEngagement = 0
  let globalInquiries = 0

  for (const m of allMetrics) {
    globalReach += Number(m.reach) || 0
    globalClicks += Number(m.clicks) || 0
    const engagement = (Number(m.likes) || 0) + (Number(m.comments) || 0) + (Number(m.shares) || 0) + (Number(m.saves) || 0)
    globalEngagement += engagement
    const inquiries = (Number(m.wa_inquiries) || 0) + (Number(m.dm_inquiries) || 0)
    globalInquiries += inquiries
  }

  // Hitung rasio konversi global
  const globalInquiryRate = globalClicks > 0 
    ? ((globalInquiries / globalClicks) * 100).toFixed(1) 
    : "0.0"

  const globalEngagementRate = globalReach > 0 
    ? ((globalEngagement / globalReach) * 100).toFixed(1) 
    : "0.0"

  // Siapkan data tiap campaign lengkap dengan stats
  const preparedCampaigns: CampaignItem[] = allCampaigns.map((c) => {
    let reach = 0
    let engagement = 0
    let clicks = 0
    let inquiries = 0
    let contentCount = 0
    const campName = c.name?.trim().toLowerCase()

    for (const m of allMetrics) {
      const post = allPosts.find((p) => p.id === m.post_id)
      if (!post) continue

      const postTag = post.campaign_tag?.trim().toLowerCase()
      const matchesTag = Boolean(postTag && campName && postTag === campName)
      const isSameClient = post.client_id === c.client_id
      
      let matches = matchesTag
      if (!matches && isSameClient && c.start_date && c.end_date && post.scheduled_at) {
        const postDate = post.scheduled_at.split("T")[0]
        if (postDate >= c.start_date && postDate <= c.end_date) {
          matches = true
        }
      }

      if (matches) {
        reach += Number(m.reach) || 0
        engagement += (Number(m.likes) || 0) + (Number(m.comments) || 0) + (Number(m.shares) || 0) + (Number(m.saves) || 0)
        clicks += Number(m.clicks) || 0
        inquiries += (Number(m.wa_inquiries) || 0) + (Number(m.dm_inquiries) || 0)
        contentCount += 1
      }
    }

    const clientObj = clientsList.find((cl) => cl.id === c.client_id)
    const clientName = clientObj?.name ?? "Client"

    return {
      id: c.id,
      name: c.name,
      type: c.type,
      start_date: c.start_date,
      end_date: c.end_date,
      color: c.color,
      notes: c.notes,
      client_id: c.client_id,
      clientName,
      status: getCampaignStatus(c),
      stats: { reach, engagement, clicks, inquiries, contentCount }
    }
  })

  return (
    <PageContainer
      pageTitle="Analytics & Insights"
      pageDescription="Performa campaign, engagement rate, dan korelasi konten terhadap sales & inquiry bisnis"
    >
      <div className="flex flex-col gap-6">

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
              <div className="text-3xl font-bold tabular-nums tracking-tight text-[hsl(var(--admin-on-surface))]">{formatNumber(globalReach)}</div>
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
              <div className="text-3xl font-bold tabular-nums tracking-tight text-[hsl(var(--admin-on-surface))]">{formatNumber(globalEngagement)}</div>
              <p className="text-[11px] text-[hsl(var(--admin-outline))] mt-1 flex items-center gap-1">
                <span>Rasio interaksi:</span>
                <span className="font-semibold text-[hsl(var(--admin-on-surface))]">{globalEngagementRate}%</span>
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
              <div className="text-3xl font-bold tabular-nums tracking-tight text-[hsl(var(--admin-on-surface))]">{formatNumber(globalClicks)}</div>
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
              <div className="text-3xl font-bold tabular-nums tracking-tight text-[hsl(var(--admin-on-surface))]">{formatNumber(globalInquiries)}</div>
              <p className="text-[11px] text-[hsl(var(--admin-outline))] mt-1 flex items-center gap-1">
                <span>Konversi klik:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{globalInquiryRate}%</span>
                <span>(WA & DM)</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Audience Trajectory — reference #2 signature chart */}
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
