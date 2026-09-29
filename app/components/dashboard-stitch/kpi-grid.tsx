"use client"

import React from "react"
import { Icons } from "@/components/icons"

const KPIS = [
  {
    label: "TOTAL REACH",
    icon: "trendingUp" as const,
    iconClass: "bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))]",
    value: "1.4M",
    growth: "+14.2%",
    caption: "vs previous 7 days for active client",
  },
  {
    label: "SCHEDULED QUEUE",
    icon: "schedule" as const,
    iconClass: "bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))]",
    value: "3 Posts",
    growth: null,
    caption: "Ready across connected channels",
  },
  {
    label: "AVG. ENGAGEMENT",
    icon: "thumb_up" as const,
    iconClass: "bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))]",
    value: "5.8%",
    growth: "+0.9%",
    caption: "High-velocity viral cohort benchmark",
  },
  {
    label: "ACTIVE CAMPAIGNS",
    icon: "bolt" as const,
    iconClass: "bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))]",
    value: "7 Live",
    growth: null,
    caption: "Summer Drop • Brand Collab • B2B",
  },
]

export function DashboardStitchKpis() {
  return (
    <section
      aria-label="Key Performance Indicators"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {KPIS.map((kpi, idx) => {
        const IconCmp = Icons[kpi.icon]
        return (
          <div
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
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full">
                    {kpi.growth}
                  </span>
                )}
              </div>
              <p className="text-xs text-[hsl(var(--admin-outline))] mt-1">{kpi.caption}</p>
            </div>
          </div>
        )
      })}
    </section>
  )
}
