"use client"

import React from "react"
import { motion } from "motion/react"
import { Icons } from "@/components/icons"
import { useActiveDashboard } from "./dashboard-data"

export function DashboardStitchKpis() {
  const { client, profile } = useActiveDashboard()

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
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
      caption: `vs previous period · ${client.name.substring(0, 5)}`,
    },
    {
      label: "Scheduled queue",
      icon: "schedule" as const,
      iconClass: "bg-brand-accent/10 text-brand-accent",
      value: `${client.channels?.length ?? 0} Posts`,
      growth: null,
      growthUp: true,
      caption: "Across connected channels",
    },
    {
      label: "Avg. engagement",
      icon: "thumb_up" as const,
      iconClass: "bg-brand-accent/10 text-brand-accent",
      value: m1.value,
      growth: m1.delta,
      growthUp: m1.trend === "up",
      caption: "Rolling average across connected channels",
    },
    {
      label: "Content velocity",
      icon: "bolt" as const,
      iconClass: "bg-brand-accent/10 text-brand-accent",
      value: m2.value,
      growth: m2.delta,
      growthUp: m2.trend === "up",
      caption: `${profile.velocity}% campaign velocity`,
    },
  ]

  return (
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
            className="p-5 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/40 shadow-sm transition-all hover:shadow-md flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-muted-foreground">
                {kpi.label}
              </span>
              <div
                className={`w-8 h-8 rounded-full ${kpi.iconClass} flex items-center justify-center shadow-sm`}
              >
                {IconCmp && <IconCmp className="size-[18px]" />}
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-syne font-bold text-2xl text-foreground">
                  {kpi.value}
                </span>
                {kpi.growth && (
                  <span
                    className={
                      kpi.growthUp
                        ? "text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
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
  )
}
