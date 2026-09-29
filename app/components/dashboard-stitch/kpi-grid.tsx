"use client"

import React from "react"
import { Icons } from "@/components/icons"

const KPIS = [
  {
    label: "TOTAL REACH",
    icon: "trendingUp" as const,
    iconClass: "bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))]",
    value: "1.4M",
    growth: "+14.2%",
    caption: "vs previous 7 days for active client",
    bar: { width: "78%", className: "bg-[#2333E7]" },
  },
  {
    label: "SCHEDULED QUEUE",
    icon: "schedule" as const,
    iconClass: "bg-[hsl(var(--admin-cobalt))]/15 text-[hsl(var(--admin-cobalt))]",
    value: "3 Posts",
    growth: null,
    caption: "Ready across connected channels",
    breakdown: ["IG: 1", "TT: 1", "YT: 0", "LI: 1"],
  },
  {
    label: "AVG. ENGAGEMENT",
    icon: "thumb_up" as const,
    iconClass: "bg-[hsl(var(--admin-lavender))]/15 text-[hsl(var(--admin-lavender))]",
    value: "5.8%",
    growth: "+0.9%",
    caption: "High-velocity viral cohort benchmark",
    spark: ["h-1.5", "h-2.5", "h-2", "h-3", "h-3", "h-3"],
  },
  {
    label: "ACTIVE CAMPAIGNS",
    icon: "bolt" as const,
    iconClass: "bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))]",
    value: "7 Live",
    growth: null,
    caption: "Summer Drop • Brand Collab • B2B",
    bar: { width: "100%", className: "bg-[hsl(var(--brand-accent))]" },
    pulse: true,
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
            className="p-5 rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/80 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[hsl(var(--admin-outline))] tracking-wider">
                {kpi.label}
              </span>
              <div
                className={`w-8 h-8 rounded-full ${kpi.iconClass} flex items-center justify-center shadow-sm`}
              >
                {IconCmp && <IconCmp className="size-[18px]" />}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-syne font-bold text-2xl text-[hsl(var(--admin-on-surface))]">
                {kpi.value}
              </span>
              {kpi.growth && (
                <span className="text-xs text-[hsl(var(--primary))] font-bold bg-[hsl(var(--brand-accent))]/25 px-2 py-0.5 rounded-full">
                  {kpi.growth}
                </span>
              )}
              {kpi.pulse && (
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--brand-accent))] animate-ping ml-1" />
              )}
            </div>
            <p className="text-xs text-[hsl(var(--admin-outline))] mt-1">{kpi.caption}</p>

            {/* Channel breakdown pills */}
            {kpi.breakdown && (
              <div className="flex items-center gap-1.5 mt-3 text-xs">
                {kpi.breakdown.map((b) => (
                  <span
                    key={b}
                    className="px-2 py-0.5 rounded-full bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))] font-medium"
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}

            {/* Progress bar */}
            {kpi.bar && (
              <div className="w-full bg-[hsl(var(--admin-surface-high))] h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className={`${kpi.bar.className} h-full rounded-full transition-all duration-700`}
                  style={{ width: kpi.bar.width }}
                />
              </div>
            )}

            {/* Mini bar chart (engagement) — fixed heights from reference, capped at container */}
            {kpi.spark && (
              <div className="flex items-end gap-1 h-3 mt-3">
                {kpi.spark.map((h, i) => (
                  <div
                    key={i}
                    className={`w-1/6 rounded-t bg-[hsl(var(--admin-cobalt))] opacity-70 ${h}`}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}
