"use client"

import React from "react"
import { motion, type Variants } from "motion/react"
import { Icons } from "@/components/icons"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { useActiveDashboard } from "./dashboard-data"
import { useScheduledPosts } from "@/features/scheduled-posts/api/queries"

export function DashboardStitchKpis() {
  const { client, profile } = useActiveDashboard()
  const { data: posts = [] } = useScheduledPosts(client.id)
  const scheduledCount = posts.filter((p) => p.status === "scheduled").length

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
      }
    }
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    }
  }

  const metrics = profile.metrics ?? []
  const m0 = metrics[0] ?? { value: "0", delta: "N/A", trend: "neutral" as const }
  const m1 = metrics[1] ?? { value: "0%", delta: "N/A", trend: "neutral" as const }
  const m2 = metrics[2] ?? { value: "0", delta: "N/A", trend: "neutral" as const }

  const kpis = [
    {
      label: "Total reach",
      icon: "trendingUp" as const,
      iconClass: "bg-brand-accent/10 text-brand-accent",
      value: m0.value,
      growth: m0.delta,
      growthUp: m0.trend === "up",
      isNeutral: m0.trend === "neutral",
      caption: `vs previous period · ${client.name}`,
      signalTag: "Distribution (METER)",
    },
    {
      label: "Scheduled queue",
      icon: "schedule" as const,
      iconClass: "bg-brand-accent/10 text-brand-accent",
      value: `${scheduledCount} Posts`,
      growth: null,
      growthUp: true,
      isNeutral: false,
      caption: `${posts.length} total in pipeline`,
      signalTag: "Pipeline Health",
    },
    {
      label: "Avg. engagement",
      icon: "thumb_up" as const,
      iconClass: "bg-brand-accent/10 text-brand-accent",
      value: m1.value,
      growth: m1.delta,
      growthUp: m1.trend === "up",
      isNeutral: m1.trend === "neutral",
      caption: "Rolling average across connected channels",
      signalTag: "High Signal: Saves & Shares",
    },
    {
      label: "Total engagement",
      icon: "bolt" as const,
      iconClass: "bg-brand-accent/10 text-brand-accent",
      value: m2.value,
      growth: m2.delta,
      growthUp: m2.trend === "up",
      isNeutral: m2.trend === "neutral",
      caption: `${profile.velocity}% campaign velocity`,
      signalTag: "Attention & Action Depth",
    },
  ]

  return (
    <div className="space-y-3">
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        aria-label="Key Performance Indicators"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {kpis.map((kpi, idx) => {
          const IconCmp = Icons[kpi.icon]
          return (
            <motion.div
              variants={item}
              key={idx}
              whileHover={{ scale: 1.02, y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="p-5 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/40 shadow-sm transition-colors hover:shadow-md flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    {kpi.label}
                  </span>
                  <span className="text-3xs font-mono font-medium text-brand-accent/90">
                    {kpi.signalTag}
                  </span>
                </div>
                <div
                  className={`w-8 h-8 rounded-full ${kpi.iconClass} flex items-center justify-center shadow-sm shrink-0`}
                >
                  {IconCmp && <IconCmp className="size-[18px]" />}
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <MetricTicker
                    value={kpi.value}
                    className="font-mono font-bold text-2xl text-foreground tracking-tight"
                  />
                  {kpi.growth && (
                    <span
                      className={
                        kpi.isNeutral || kpi.growth === "N/A"
                          ? "text-xs font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/40"
                          : kpi.growthUp
                          ? "text-xs font-bold px-2 py-0.5 rounded-full bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border border-[hsl(var(--success))]/20"
                          : "text-xs font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20"
                      }
                    >
                      {kpi.growth}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.caption}</p>
              </div>
            </motion.div>
          )
        })}
      </motion.section>

      {/* METER Signal Focus Bar (Anti-Vanity 2026) */}
      <div className="p-3 rounded-xl bg-card/70 backdrop-blur-md border border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-brand-accent/15 text-brand-accent shrink-0">
            <Icons.target className="size-3.5" />
          </span>
          <div className="text-2xs leading-relaxed">
            <span className="font-bold text-foreground">METER Signal Focus (Anti-Vanity):</span>
            <span className="text-muted-foreground ml-1.5">
              Instagram: <b className="text-foreground">Saves &amp; Sends</b> &bull; TikTok: <b className="text-foreground">Shares &amp; Completion</b> &bull; LinkedIn: <b className="text-foreground">Dwell &amp; ER by reach</b>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-3xs text-muted-foreground self-end md:self-auto font-medium">
          <Icons.checkCircle className="size-3 text-brand-accent shrink-0" />
          <span>Faktual PostgreSQL &bull; Tanpa Fabricated Metrics</span>
        </div>
      </div>
    </div>
  )
}
