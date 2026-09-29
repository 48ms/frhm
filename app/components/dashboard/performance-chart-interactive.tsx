'use client'

import { useState } from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

// Data structure mirroring the interactive prototype's datasets
const DATASETS = {
  "7D": {
    peak: "Peak: Friday +34%",
    metric: "248.5K",
    label: "Interactions at 18:00 CEST",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    highlightIndex: [4, 6],
  },
  "30D": {
    peak: "Peak: Week 3 +62%",
    metric: "1.18M",
    label: "Monthly Interaction Velocity",
    days: ["Week 1", "Week 2", "Week 3", "Week 4"],
    highlightIndex: [2],
  },
  "90D": {
    peak: "Peak: Q3 Surge +118%",
    metric: "4.92M",
    label: "Quarterly Total Impressions",
    days: ["June", "July", "August"],
    highlightIndex: [2],
  },
} as const

export function DashboardPerformanceChartInteractive() {
  const [timeframe, setTimeframe] = useState<keyof typeof DATASETS>("7D")
  const data = DATASETS[timeframe]

  return (
    <div className="rounded-2xl border border-white/80 bg-lum-surface-lowest/85 p-6 shadow-sm backdrop-blur-xl">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <span className="block text-xs font-bold tracking-wider text-lum-outline">
            AUDIENCE TRAJECTORY
          </span>
          <h2 className="font-display text-lg font-bold text-lum-on-surface">
            Performance &amp; Engagement Dynamics
          </h2>
        </div>
        
        {/* Timeframe Pill Switcher */}
        <div className="inline-flex rounded-full border border-lum-outline-variant/30 bg-lum-surface-high/70 p-1">
          {Object.keys(DATASETS).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf as keyof typeof DATASETS)}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-full transition-all",
                timeframe === tf
                  ? "bg-lum-surface-lowest text-lum-on-surface shadow-sm"
                  : "text-lum-outline hover:text-lum-on-surface"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Stage */}
      <div className="group relative flex h-60 w-full cursor-crosshair flex-col justify-between overflow-hidden rounded-2xl border border-white/50 bg-lum-surface-low/40 p-4">
        
        {/* Metric Value Overlay */}
        <div className="relative z-20 flex items-center gap-2 self-center rounded-full border border-white bg-lum-surface-lowest/95 px-4 py-1.5 text-xs shadow-lg backdrop-blur-md">
          <span className="size-2 animate-ping rounded-full bg-lum-cobalt-light" />
          <span className="font-display font-bold text-lum-on-surface">{data.metric}</span>
          <span className="text-lum-outline">{data.label}</span>
        </div>

        {/* X-Axis */}
        <div className="relative z-10 flex justify-between border-t border-lum-outline-variant/30 pt-2 text-xs font-medium text-lum-outline">
          {data.days.map((day, i) => (
            <span
              key={day}
              className={cn(
                "transition-colors hover:text-lum-cobalt",
                (data.highlightIndex as readonly number[]).includes(i) ? "font-bold text-lum-primary-deep" : ""
              )}
            >
              {day}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 text-center">
        <span className="rounded-full bg-lum-surface-container px-3 py-1 text-xs font-bold text-lum-cobalt shadow-sm">
          {data.peak}
        </span>
      </div>
    </div>
  )
}
