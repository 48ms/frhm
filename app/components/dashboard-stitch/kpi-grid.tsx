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

  const kpis = [
    {
      label: "TOTAL REACH",
      icon: "trendingUp" as const,
      iconClass: "bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))]",
      value: profile.metrics[0].value,
      growth: profile.metrics[0].delta,
      growthUp: profile.metrics[0].trend === "up",
      caption: `vs previous period · ${client.shortName}`,
    },
    {
      label: "SCHEDULED QUEUE",
      icon: "schedule" as const,
      iconClass: "bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))]",
      value: `${client.accounts.length + 1} Posts`,
      growth: null,
      growthUp: true,
      caption: "Ready across connected channels",
    },
    {
      label: "AVG. ENGAGEMENT",
      icon: "thumb_up" as const,
      iconClass: "bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))]",
      value: profile.metrics[1].value,
      growth: profile.metrics[1].delta,
      growthUp: profile.metrics[1].trend === "up",
      caption: "High-velocity viral cohort benchmark",
    },
    {
      label: "CONTENT VELOCITY",
      icon: "bolt" as const,
      iconClass: "bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))]",
      value: profile.metrics[2].value,
      growth: profile.metrics[2].delta,
      growthUp: profile.metrics[2].trend === "up",
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
            className="p-5 rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/80 shadow-sm transition-all hover:shadow-md flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[hsl(var(--admin-outline))] tracking-wider">
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
                <span className="font-syne font-bold text-2xl text-[hsl(var(--admin-on-surface))]">
                  {kpi.value}
                </span>
                {kpi.growth && (
                  <span
                    className={
                      kpi.growthUp
                        ? "text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full"
                        : "text-xs text-rose-700 font-bold bg-rose-50 border border-rose-200/50 px-2 py-0.5 rounded-full"
                    }
                  >
                    {kpi.growth}
                  </span>
                )}
              </div>
              <p className="text-xs text-[hsl(var(--admin-outline))] mt-1">{kpi.caption}</p>
            </div>
          </motion.div>
        )
      })}
    </motion.section>
  )
}
