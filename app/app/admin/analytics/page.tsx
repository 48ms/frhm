import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3Icon, TrendingUpIcon, TargetIcon, MousePointerClickIcon, CalendarIcon } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from("content_campaigns")
    .select("*, clients(name)")
    .order("created_at", { ascending: false })

  const { data: metrics } = await supabase
    .from("post_metrics")
    .select("*")

  const allMetrics = metrics ?? []
  
  let globalReach = 0
  let globalClicks = 0
  let globalConversions = 0

  const campaignStats = new Map<string, {
    reach: number,
    engagement: number,
    clicks: number,
    conversions: number,
    contentCount: number,
  }>()

  for (const m of allMetrics) {
    globalReach += m.reach
    globalClicks += m.clicks
    globalConversions += m.conversions

    if (m.campaign_id) {
      const stat = campaignStats.get(m.campaign_id) ?? { reach: 0, engagement: 0, clicks: 0, conversions: 0, contentCount: 0 }
      stat.reach += m.reach
      stat.engagement += m.engagement
      stat.clicks += m.clicks
      stat.conversions += m.conversions
      stat.contentCount += 1
      campaignStats.set(m.campaign_id, stat)
    }
  }

  const allCampaigns = campaigns ?? []
  const activeCount = allCampaigns.filter(c => c.status === "active").length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics & Insights</h1>
        <p className="text-sm text-muted-foreground">Performa campaign dan korelasi konten terhadap sales</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-transparent bg-brand-accent/5 shadow-sm transition-all hover:shadow-md hover:bg-brand-accent/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <CardHeader className="pb-2 relative z-10">
            <CardDescription className="flex items-center gap-2 font-medium text-brand-accent">
              <TrendingUpIcon className="size-4" />
              Total Reach
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold tabular-nums tracking-tight text-foreground">{(globalReach / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground/80 mt-1 font-medium">Jangkauan audiens seluruh konten</p>
          </CardContent>
        </Card>
        
        <Card className="border-none bg-background/80 backdrop-blur-xl shadow-sm transition-all hover:shadow-md group">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium">
              <MousePointerClickIcon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              Web Clicks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums tracking-tight">{globalClicks}</div>
            <p className="text-xs text-muted-foreground mt-1">Konversi traffic dari sosmed</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-background/80 backdrop-blur-xl shadow-sm transition-all hover:shadow-md group">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium">
              <TargetIcon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              Est. Conversions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums tracking-tight">{globalConversions}</div>
            <p className="text-xs text-muted-foreground mt-1">Berdasarkan tracking link</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-background/80 backdrop-blur-xl shadow-sm transition-all hover:shadow-md group">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium">
              <BarChart3Icon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              Active Campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums tracking-tight">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Dari total {allCampaigns.length} campaign</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-semibold mt-6 tracking-tight">Performa per Campaign</h2>
      {allCampaigns.length === 0 ? (
        <Card className="border-none bg-zinc-50/50 dark:bg-zinc-900/20 backdrop-blur-sm shadow-inner">
          <CardContent className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4 shadow-sm">
              <CalendarIcon className="size-6 text-muted-foreground/60" />
            </div>
            <p className="font-medium text-foreground/80">Belum ada data campaign.</p>
            <p className="text-xs mt-1 text-muted-foreground/60">Sinkronisasi data metrics akan muncul di sini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {allCampaigns.map((c) => {
            const stats = campaignStats.get(c.id) ?? { reach: 0, engagement: 0, clicks: 0, conversions: 0, contentCount: 0 }
            const isActive = c.status === "active"
            
            return (
              <Card key={c.id} className="border-transparent bg-background/80 backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base group-hover:text-brand-accent transition-colors">{c.name}</CardTitle>
                      <CardDescription className="mt-1 font-medium tracking-wide text-xs uppercase">
                        {c.clients?.name ?? "Unknown Client"}
                      </CardDescription>
                    </div>
                    <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-brand-accent text-white shadow-sm" : "bg-muted text-muted-foreground"}>
                      {isActive ? "Aktif" : c.status === "completed" ? "Selesai" : "Paused"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <p className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider">Total Konten</p>
                      <p className="font-semibold text-lg tabular-nums">{stats.contentCount}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider">Reach</p>
                      <p className="font-semibold text-lg tabular-nums">{(stats.reach / 1000).toFixed(1)}k</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider">Engagement</p>
                      <p className="font-semibold text-lg tabular-nums">{(stats.engagement / 1000).toFixed(1)}k</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider">Clicks / Conv</p>
                      <p className="font-bold text-lg text-brand-accent tabular-nums drop-shadow-sm">{stats.clicks} <span className="text-muted-foreground text-sm font-medium">/</span> {stats.conversions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
