"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useQueryState, parseAsString, parseAsStringEnum } from "nuqs"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/animate-ui/components/radix/tabs"
import {
  analyticsQueries,
  useSyncMultiAccountSocialData,
} from "@/features/analytics/api/queries"
import type { PlatformMetricsSummary } from "@/features/analytics/api/types"
import { ANALYTICS_PLATFORMS, ANALYTICS_PERIODS } from "@/lib/searchparams"
import { cn } from "@/lib/utils"

interface MultiAccountAggregatorProps {
  clientId: string
}

function getPlatformIcon(platform: string) {
  const p = platform.toLowerCase()
  if (p === "instagram") return Icons.instagram
  if (p === "tiktok") return Icons.tiktok
  if (p === "twitter" || p === "x") return Icons.twitter
  if (p === "youtube") return Icons.video
  return Icons.hub
}

function getPlatformTheme(platform: string) {
  const p = platform.toLowerCase()
  if (p === "instagram") {
    return {
      border: "border-pink-500/20",
      bg: "bg-pink-500/10",
      text: "text-pink-500",
      badge: "bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-purple-500/10 border-pink-500/30 text-pink-400",
    }
  }
  if (p === "tiktok") {
    return {
      border: "border-cyan-500/20",
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      badge: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
    }
  }
  if (p === "twitter" || p === "x") {
    return {
      border: "border-sky-500/20",
      bg: "bg-sky-500/10",
      text: "text-sky-400",
      badge: "bg-sky-500/10 border-sky-500/30 text-sky-400",
    }
  }
  if (p === "youtube") {
    return {
      border: "border-red-500/20",
      bg: "bg-red-500/10",
      text: "text-red-400",
      badge: "bg-red-500/10 border-red-500/30 text-red-400",
    }
  }
  return {
    border: "border-border/40",
    bg: "bg-muted/30",
    text: "text-muted-foreground",
    badge: "bg-muted/40 border-border/40 text-muted-foreground",
  }
}

export function MultiAccountAggregator({ clientId }: MultiAccountAggregatorProps) {
  const [selectedPlatform, setSelectedPlatform] = useQueryState(
    "platform",
    parseAsStringEnum([...ANALYTICS_PLATFORMS]).withDefault("all")
  )
  const [selectedPeriod, setSelectedPeriod] = useQueryState(
    "period",
    parseAsStringEnum([...ANALYTICS_PERIODS]).withDefault("30d")
  )

  const { data: analytics, isLoading, refetch } = useQuery({
    ...analyticsQueries.multiAccount(clientId, selectedPeriod),
    enabled: Boolean(clientId),
  })

  const syncMutation = useSyncMultiAccountSocialData()

  const handleSyncSocialAccounts = async () => {
    if (!clientId) {
      toast.error("Pilih klien terlebih dahulu")
      return
    }

    try {
      const res = await syncMutation.mutateAsync({ clientId, source: "all" })
      if (res.success) {
        toast.success("Sinkronisasi Akun Berhasil", {
          description: res.message,
        })
        void refetch()
      } else {
        toast.error("Gagal menyinkronkan akun sosial")
      }
    } catch (err: any) {
      toast.error("Gagal sinkronisasi", {
        description: err.message || "Terjadi kesalahan saat memanggil bridge.",
      })
    }
  }

  const platforms = analytics?.platformList ?? []

  const filteredPlatforms = React.useMemo(() => {
    if (selectedPlatform === "all") return platforms
    return platforms.filter((p) => p.platform.toLowerCase() === selectedPlatform.toLowerCase())
  }, [platforms, selectedPlatform])

  const igInsights = analytics?.instagramInsights
  const ttInsights = analytics?.tiktokInsights

  return (
    <div className="space-y-6" data-testid="multi-account-aggregator">
      {/* Header Container */}
      <Card className="admin-card-glass border border-border/40 overflow-hidden shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary">
                  <Icons.hub className="size-3.5" />
                </span>
                <CardTitle className="text-base sm:text-lg font-bold font-syne tracking-tight">
                  Multi-Account Social Aggregator
                </CardTitle>
                <Badge variant="outline" className="text-2xs font-mono font-medium border-primary/30 text-primary bg-primary/5">
                  Live Sync
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Agregasi jangkauan, interaksi, dan wawasan lintas akun media sosial klien aktif.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Period Selector Chips */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border/40 text-xs">
                {(["7d", "30d", "90d", "all"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPeriod(p)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-2xs font-semibold transition-all cursor-pointer",
                      selectedPeriod === p
                        ? "bg-card text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {p === "all" ? "Semua" : p.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Sync Action Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleSyncSocialAccounts}
                isLoading={syncMutation.isPending}
                disabled={syncMutation.isPending || !clientId}
                className="gap-1.5 text-xs h-8 px-3 shadow-xs border-border/60 hover:bg-muted/40"
                title="Sinkronkan data akun media sosial dan perbarui metrik riil"
              >
                <Icons.refresh className={cn("size-3.5 text-primary", syncMutation.isPending && "animate-spin")} />
                {syncMutation.isPending ? (
                  <ShimmeringText text="Sinkronisasi..." className="text-xs" />
                ) : (
                  <span>Sinkronkan Akun</span>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-0">
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-muted/20 border border-border/30 text-xs">
            <div className="space-y-0.5">
              <span className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">
                Akun Terhubung
              </span>
              <div className="text-lg font-bold font-mono text-foreground flex items-center gap-1.5">
                <MetricTicker value={analytics?.connectedAccountsCount ?? 0} />
                <span className="text-2xs text-muted-foreground font-normal">akun aktif</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">
                Total Multi-Reach
              </span>
              <div className="text-lg font-bold font-mono text-foreground flex items-center gap-1">
                <MetricTicker value={analytics?.totalReach ?? 0} thousandSeparator="." />
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">
                Rata-rata ER Gabungan
              </span>
              <div className="text-lg font-bold font-mono text-primary flex items-center gap-1">
                <MetricTicker value={`${analytics?.overallEngagementRate ?? 0}%`} decimalSeparator="." />
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">
                Inquiries Terarah (WA/DM)
              </span>
              <div className="text-lg font-bold font-mono text-emerald-500 flex items-center gap-1">
                <MetricTicker value={analytics?.totalInquiries ?? 0} />
                <span className="text-2xs text-muted-foreground font-normal">leads</span>
              </div>
            </div>
          </div>

          {/* Platform Tabs Filter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-2">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: "all", label: "Semua Akun", count: platforms.length },
                  { id: "instagram", label: "Instagram", count: platforms.filter(p => p.platform.toLowerCase() === "instagram").length },
                  { id: "tiktok", label: "TikTok", count: platforms.filter(p => p.platform.toLowerCase() === "tiktok").length },
                  { id: "x", label: "X / Twitter", count: platforms.filter(p => ["x", "twitter"].includes(p.platform.toLowerCase())).length },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedPlatform(item.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                      selectedPlatform === item.id
                        ? "bg-foreground text-background font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <span>{item.label}</span>
                    <span className={cn(
                      "text-3xs px-1.5 py-0.2 rounded-full",
                      selectedPlatform === item.id
                        ? "bg-background/20 text-background"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>

              {analytics?.lastSyncedAt && (
                <span className="text-3xs text-muted-foreground hidden md:inline-block">
                  Diperbarui: {new Date(analytics.lastSyncedAt).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>

            {/* Platforms Cards Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 rounded-xl bg-muted/30 animate-pulse border border-border/30" />
                ))}
              </div>
            ) : filteredPlatforms.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-muted/10 border border-dashed border-border/40">
                <Icons.hub className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">Belum ada akun sosial di kategori ini</p>
                <p className="text-2xs text-muted-foreground mt-0.5">
                  Hubungkan akun media sosial klien via Pengaturan atau klik Sinkronkan Akun.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredPlatforms.map((plat) => {
                  const PlatformIcon = getPlatformIcon(plat.platform)
                  const theme = getPlatformTheme(plat.platform)

                  return (
                    <Card
                      key={plat.platform}
                      className={cn(
                        "bg-card/70 border rounded-xl p-3.5 space-y-3 transition-all hover:shadow-xs",
                        theme.border
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0", theme.bg, theme.text)}>
                            <PlatformIcon className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold capitalize text-foreground truncate">
                              {plat.platform}
                            </h4>
                            <p className="text-2xs text-muted-foreground font-mono truncate">
                              {plat.accountHandle || `@${plat.platform}_account`}
                            </p>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={cn(
                            "text-3xs uppercase font-semibold px-1.5 py-0.5",
                            plat.accountStatus === "terhubung"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : "bg-muted text-muted-foreground border-border/40"
                          )}
                        >
                          {plat.accountStatus === "terhubung" ? "Terhubung" : "Belum Konek"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30 text-center">
                        <div className="space-y-0.5">
                          <span className="text-3xs text-muted-foreground uppercase">Reach</span>
                          <p className="text-xs font-bold font-mono text-foreground">
                            <MetricTicker value={plat.totalReach} thousandSeparator="." />
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-3xs text-muted-foreground uppercase">ER Rate</span>
                          <p className="text-xs font-bold font-mono text-primary">
                            {plat.engagementRate}%
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-3xs text-muted-foreground uppercase">Inquiries</span>
                          <p className="text-xs font-bold font-mono text-emerald-500">
                            {plat.totalInquiries}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Deep-Dive Insights: Instagram & TikTok Dual Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            {/* Instagram Insights Deep Dive */}
            <Card className="bg-card/40 border border-pink-500/20 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-md bg-pink-500/10 text-pink-500 flex items-center justify-center">
                    <Icons.instagram className="size-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Instagram Deep Insights</h4>
                    <p className="text-3xs text-muted-foreground">Analisis retensi, format konten, dan DM direct leads</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-3xs font-mono bg-pink-500/5 text-pink-400 border-pink-500/20">
                  Meta Graph
                </Badge>
              </div>

              {/* Creative Format Distribution */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-2xs text-muted-foreground">
                  <span>Distribusi Format:</span>
                  <span className="font-mono text-foreground">
                    Reels ({igInsights?.reelsCount ?? 0}) &bull; Carousel ({igInsights?.carouselCount ?? 0}) &bull; Static ({igInsights?.staticCount ?? 0})
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                  <div
                    style={{
                      width: `${Math.max(5, ((igInsights?.reelsCount ?? 0) / Math.max(1, (igInsights?.reelsCount ?? 0) + (igInsights?.carouselCount ?? 0) + (igInsights?.staticCount ?? 0))) * 100)}%`
                    }}
                    className="bg-pink-500 transition-all"
                    title="Reels"
                  />
                  <div
                    style={{
                      width: `${Math.max(5, ((igInsights?.carouselCount ?? 0) / Math.max(1, (igInsights?.reelsCount ?? 0) + (igInsights?.carouselCount ?? 0) + (igInsights?.staticCount ?? 0))) * 100)}%`
                    }}
                    className="bg-purple-500 transition-all"
                    title="Carousel"
                  />
                  <div
                    style={{
                      width: `${Math.max(5, ((igInsights?.staticCount ?? 0) / Math.max(1, (igInsights?.reelsCount ?? 0) + (igInsights?.carouselCount ?? 0) + (igInsights?.staticCount ?? 0))) * 100)}%`
                    }}
                    className="bg-amber-500 transition-all"
                    title="Static"
                  />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/30 text-center">
                <div>
                  <span className="text-3xs text-muted-foreground block">Rata-rata Saves</span>
                  <span className="text-xs font-bold font-mono text-foreground">
                    <MetricTicker value={igInsights?.avgSaves ?? 0} />
                  </span>
                </div>
                <div>
                  <span className="text-3xs text-muted-foreground block">DM Inquiries</span>
                  <span className="text-xs font-bold font-mono text-emerald-500">
                    <MetricTicker value={igInsights?.dmInquiries ?? 0} />
                  </span>
                </div>
                <div>
                  <span className="text-3xs text-muted-foreground block">Rata-rata ER</span>
                  <span className="text-xs font-bold font-mono text-pink-400">
                    {igInsights?.avgEngagementRate ?? 0}%
                  </span>
                </div>
              </div>

              {igInsights?.topPostTitle && (
                <div className="p-2 rounded-lg bg-pink-500/5 border border-pink-500/10 text-2xs flex items-center justify-between gap-2">
                  <span className="text-muted-foreground truncate">Top Content:</span>
                  <span className="font-semibold text-foreground truncate">{igInsights.topPostTitle}</span>
                </div>
              )}
            </Card>

            {/* TikTok Insights Deep Dive */}
            <Card className="bg-card/40 border border-cyan-500/20 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-md bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Icons.tiktok className="size-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">TikTok Viral Insights</h4>
                    <p className="text-3xs text-muted-foreground">Analisis video views, share velocity, dan potensi FYP</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-3xs font-mono bg-cyan-500/5 text-cyan-400 border-cyan-500/20">
                  TikTok Business
                </Badge>
              </div>

              {/* Viral Potential Meter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-2xs">
                  <span className="text-muted-foreground">Skor Potensi Viral (Share Ratio):</span>
                  <span className={cn(
                    "font-bold font-mono",
                    (ttInsights?.viralPotentialScore ?? 0) >= 60 ? "text-emerald-400" : "text-cyan-400"
                  )}>
                    {ttInsights?.viralPotentialScore ?? 0} / 100
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, Math.max(5, ttInsights?.viralPotentialScore ?? 0))}%` }}
                    className={cn(
                      "h-full transition-all rounded-full",
                      (ttInsights?.viralPotentialScore ?? 0) >= 60 ? "bg-emerald-500" : "bg-cyan-500"
                    )}
                  />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/30 text-center">
                <div>
                  <span className="text-3xs text-muted-foreground block">Total Views</span>
                  <span className="text-xs font-bold font-mono text-foreground">
                    <MetricTicker value={ttInsights?.totalViews ?? 0} thousandSeparator="." />
                  </span>
                </div>
                <div>
                  <span className="text-3xs text-muted-foreground block">Rata-rata Shares</span>
                  <span className="text-xs font-bold font-mono text-cyan-400">
                    <MetricTicker value={ttInsights?.avgShares ?? 0} />
                  </span>
                </div>
                <div>
                  <span className="text-3xs text-muted-foreground block">WA Inquiries</span>
                  <span className="text-xs font-bold font-mono text-emerald-500">
                    <MetricTicker value={ttInsights?.waInquiries ?? 0} />
                  </span>
                </div>
              </div>

              {ttInsights?.topPostTitle && (
                <div className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-2xs flex items-center justify-between gap-2">
                  <span className="text-muted-foreground truncate">Top Video:</span>
                  <span className="font-semibold text-foreground truncate">{ttInsights.topPostTitle}</span>
                </div>
              )}
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
