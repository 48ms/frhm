"use client"

import React, { useMemo } from "react"
import { useQueryState, parseAsStringEnum } from "nuqs"
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { useActiveDashboard } from "./dashboard-data"
import { getPlatformMeta } from "./right-panel"
import { analyticsQueries } from "@/features/analytics/api/queries"
import type { PlatformMetricsSummary } from "@/features/analytics/api/types"
import { type Timeframe } from "@/features/dashboard/api/types"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "90d", label: "90D" },
]

const DAY_LABELS: Record<Timeframe, string[]> = {
  "7d": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "30d": ["W1", "W2", "W3", "W4", "W5", "W6", "W7"],
  "90d": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
}

export function DashboardStitchChart() {
  const { profile, client, clientId } = useActiveDashboard()
  const [tf, setTf] = useQueryState(
    "tf",
    parseAsStringEnum<Timeframe>(["7d", "30d", "90d"]).withDefault("30d")
  )

  // Query analitik multi-account faktual dari Supabase
  const { data: multiAccountData } = useQuery({
    ...analyticsQueries.multiAccount(clientId, tf),
    enabled: Boolean(clientId),
  })

  const channels = client.channels ?? []

  // Agregasi rincian performa per channel dengan fallback data kanal terhubung
  const platformSummaries = useMemo<PlatformMetricsSummary[]>(() => {
    if (multiAccountData?.platformList && multiAccountData.platformList.length > 0) {
      return multiAccountData.platformList
    }
    // Fallback jika belum ada post_metrics tapi kanal sudah tersambung
    return channels.map((ch) => ({
      platform: ch.platform,
      accountHandle: ch.handle,
      accountAvatar: ch.avatar_url || null,
      accountStatus: (ch.status === "terhubung" ? "terhubung" : "belum") as any,
      postCount: 0,
      totalReach: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalSaves: 0,
      totalClicks: 0,
      totalInquiries: 0,
      engagementRate: 0,
    }))
  }, [multiAccountData?.platformList, channels])

  const labels = DAY_LABELS[tf]

  // Map to Recharts format. Sparkline data comes from the DB metrics; the
  // fallback array keeps the chart drawable when a client has no metrics yet.
  const chartData = useMemo(() => {
    const reachData = profile.metrics[0]?.spark || [10, 20, 30, 40, 50, 60, 70]
    const engageData = profile.metrics[1]?.spark || [5, 10, 15, 20, 25, 30, 35]
    return labels.map((label, i) => ({
      name: label,
      reach: reachData[i] || 0,
      engage: engageData[i] || 0,
    }))
  }, [labels, profile.metrics])

  return (
    <div className="p-6 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/40 shadow-sm flex flex-col transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <span className="text-xs font-semibold text-muted-foreground block">
            Audience trajectory · {client.name}
          </span>
          <h2 className="font-sans font-bold text-base sm:text-lg text-foreground tracking-tight">
            Performance &amp; Engagement Dynamics
          </h2>
        </div>
        {/* Timeframe selector — Radix Animate UI Tabs, URL state via nuqs */}
        <Tabs
          value={tf}
          onValueChange={(val) => setTf(val as Timeframe)}
          className="w-auto"
        >
          <TabsList className="p-1 rounded-full bg-muted/70 border border-border/30 h-auto">
            {TIMEFRAMES.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                onClick={() => setTf(t.id)}
                className="px-3 py-1 rounded-full text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all min-h-11 cursor-pointer"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="w-full aspect-[16/9] max-h-[280px] min-h-[220px] bg-muted/20 rounded-2xl p-4 border border-border/40 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
              dy={10}
            />
            <YAxis 
              domain={[0, 'auto']}
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderRadius: '12px',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              itemStyle={{ fontWeight: 600, fontSize: '13px' }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="reach" 
              name="Impressions (Reach)"
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorReach)" 
            />
            <Area 
              type="monotone" 
              dataKey="engage" 
              name="Click Through & Saves"
              stroke="hsl(var(--brand-accent))" 
              strokeWidth={2.5}
              strokeDasharray="4 4"
              fill="none" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Axis Indicators */}
      <div className="flex justify-between items-center text-xs text-muted-foreground font-medium mt-4">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" /> Reach
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-accent border border-brand-accent/50" /> Engagement
          </span>
        </div>
        <span className="bg-background border border-border/40 px-2.5 py-0.5 rounded-full text-2xs font-bold text-foreground shadow-sm">
          {profile.peak_label}: {profile.peak_value}
        </span>
      </div>

      {/* Channel Performance Breakdown (Performa Tiap Media Sosial) */}
      <div className="mt-6 pt-5 border-t border-border/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div>
            <div className="flex items-center gap-2">
              <Icons.chartBar className="size-4 text-primary" />
              <h3 className="font-sans font-bold text-sm text-foreground tracking-tight">
                Performa Saluran Media Sosial
              </h3>
              <span className="text-3xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-accent/15 text-brand-accent border border-brand-accent/25">
                Multi-Channel
              </span>
            </div>
            <p className="text-2xs text-muted-foreground mt-0.5">
              Breakdown jangkauan, interaksi, dan volume postingan aktif periode {tf.toUpperCase()}.
            </p>
          </div>
          {platformSummaries.length > 0 && (
            <span className="text-2xs font-semibold text-muted-foreground self-start sm:self-auto">
              {platformSummaries.length} Akun Terpantau
            </span>
          )}
        </div>

        {platformSummaries.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 text-center py-5">
            <div className="w-9 h-9 rounded-full bg-muted/70 mx-auto flex items-center justify-center text-muted-foreground mb-2">
              <Icons.hub className="size-4" />
            </div>
            <p className="text-xs font-bold text-foreground">
              Belum Ada Saluran Terhubung
            </p>
            <p className="text-2xs text-muted-foreground max-w-sm mx-auto mt-1">
              Hubungkan akun sosial di panel Connected Hub di sebelah kanan untuk memantau performa per kanal secara terpusat.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {platformSummaries.map((item, idx) => {
              const meta = getPlatformMeta(item.platform)
              const PlatformIcon = meta.icon
              const isConnected = item.accountStatus === "terhubung"

              return (
                <motion.div
                  key={`${item.platform}-${idx}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 25, delay: idx * 0.05 }}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border/40 hover:bg-muted/60 hover:border-border/70 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground font-bold shrink-0 shadow-xs",
                        meta.bg
                      )}>
                        <PlatformIcon className="size-4" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-foreground truncate leading-tight">
                          {meta.label}
                        </h4>
                        <p className="text-2xs text-muted-foreground truncate font-mono">
                          {item.accountHandle || "Belum ada handle"}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold shrink-0",
                      isConnected 
                        ? "bg-brand-accent/20 text-brand-accent border border-brand-accent/30" 
                        : "bg-muted text-muted-foreground border border-border/40"
                    )}>
                      {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />}
                      {isConnected ? "Terhubung" : "Belum Aktif"}
                    </span>
                  </div>

                  {/* 3 Metrik Utama */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-border/30">
                    <div className="space-y-0.5">
                      <span className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        Reach / Views
                      </span>
                      <span className="text-xs font-bold text-foreground font-mono">
                        <MetricTicker value={item.totalReach || item.totalViews} />
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        Eng. Rate
                      </span>
                      <span className="text-xs font-bold text-foreground font-mono">
                        {item.engagementRate}%
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        Post
                      </span>
                      <span className="text-xs font-bold text-foreground font-mono">
                        <MetricTicker value={item.postCount} />
                      </span>
                    </div>
                  </div>

                  {/* Status Note jika post 0 */}
                  {item.postCount === 0 && (
                    <div className="mt-2 pt-1.5 border-t border-border/20 flex items-center gap-1.5 text-3xs text-muted-foreground">
                      <Icons.info className="size-3 text-muted-foreground shrink-0" />
                      <span className="truncate">Belum ada tayangan periode {tf.toUpperCase()}</span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Insight Cards (jika ada manual/profile insights) */}
      {profile.insights && profile.insights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4 pt-4 border-t border-border/30">
          {profile.insights.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24, delay: idx * 0.06 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="p-3.5 rounded-xl bg-muted/60 border border-border/40 hover:bg-card hover:shadow-sm transition-colors"
            >
              <p className="text-xs font-semibold text-muted-foreground">
                {card.label}
              </p>
              <p className="font-mono font-bold text-foreground text-base mt-1">
                {card.value}
              </p>
              <p className="text-xs font-semibold mt-0.5 text-brand-accent">
                {card.sub}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
