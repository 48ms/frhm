"use client"

import React, { useMemo, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Data lifted verbatim from the Stitch MCP prototype
 * `033fb5596cc4441c8cd77031206b2e22.html` (chartDatasets).
 */
const CHART_DATA: Record<
  string,
  {
    peak: string
    metric: string
    label: string
    lineBlue: string
    lineLime: string
    area: string
    days: string[]
  }
> = {
  "7D": {
    peak: "Peak: Friday +34%",
    metric: "248.5K",
    label: "Interactions at 18:00 CEST",
    lineBlue:
      "M0,160 C80,140 140,50 220,90 C300,130 380,30 460,70 C540,110 580,20 600,40",
    lineLime:
      "M0,180 C90,160 160,110 240,130 C320,150 400,90 480,100 C550,110 580,80 600,90",
    area:
      "M0,160 C80,140 140,50 220,90 C300,130 380,30 460,70 C540,110 580,20 600,40 L600,200 L0,200 Z",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  "30D": {
    peak: "Peak: Week 3 +62%",
    metric: "1.18M",
    label: "Monthly Interaction Velocity",
    lineBlue:
      "M0,150 C100,110 180,140 260,60 C340,90 420,40 500,70 C540,50 580,30 600,20",
    lineLime:
      "M0,170 C90,140 180,120 270,110 C360,90 450,120 540,80 580,70 600,60",
    area:
      "M0,150 C100,110 180,140 260,60 C340,90 420,40 500,70 C540,50 580,30 600,20 L600,200 L0,200 Z",
    days: ["Week 1", "Week 2", "Week 3", "Week 4"],
  },
  "90D": {
    peak: "Peak: Q3 Surge +118%",
    metric: "4.92M",
    label: "Quarterly Total Impressions",
    lineBlue:
      "M0,170 C120,130 200,90 300,70 C400,100 480,30 540,40 C570,30 590,20 600,10",
    lineLime:
      "M0,185 C110,150 220,130 330,120 C440,80 510,70 560,60 590,50 600,45",
    area:
      "M0,170 C120,130 200,90 300,70 C400,100 480,30 540,40 C570,30 590,20 600,10 L600,200 L0,200 Z",
    days: ["June", "July", "August"],
  },
}

const TIMEFRAMES = Object.keys(CHART_DATA) as Array<string>

export function AudienceTrajectory() {
  const [tf, setTf] = useState("7D")
  const data = useMemo(() => CHART_DATA[tf] ?? CHART_DATA["7D"], [tf])

  return (
    <div className="p-6 rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <span className="text-xs font-bold text-[hsl(var(--admin-outline))] tracking-wider block">
            AUDIENCE TRAJECTORY
          </span>
          <h2 className="font-syne font-bold text-lg text-[hsl(var(--admin-on-surface))]">
            Performance &amp; Engagement Dynamics
          </h2>
        </div>
        <div className="inline-flex p-1 rounded-full bg-[hsl(var(--admin-surface-high))]/70 border border-[hsl(var(--admin-outline-variant))]/30">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                tf === t
                  ? "bg-white text-[hsl(var(--admin-on-surface))] shadow-sm"
                  : "text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))]"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative h-60 w-full bg-[hsl(var(--admin-surface-low))]/40 rounded-2xl p-4 border border-white/50 flex flex-col justify-between overflow-hidden cursor-crosshair">
        <div className="absolute inset-0 flex items-center justify-center opacity-70 pointer-events-none">
          <svg
            className="w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 600 200"
          >
            <defs>
              <linearGradient id="grad-wave-analytics" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4353FF" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#D4FF32" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={data.area} fill="url(#grad-wave-analytics)" />
            <path
              d={data.lineBlue}
              fill="none"
              stroke="#2333E7"
              strokeLinecap="round"
              strokeWidth="3"
            />
            <path
              d={data.lineLime}
              fill="none"
              stroke="#aed500"
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
          </svg>
        </div>

        {/* Axis indicators */}
        <div className="flex justify-between items-center relative z-10 text-xs text-[hsl(var(--admin-outline))] font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2333E7]" /> Impressions (Reach)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#aed500] border border-[hsl(var(--brand-accent))]" />{" "}
            Click Through &amp; Saves
          </span>
          <span className="bg-white px-2.5 py-0.5 rounded-full shadow-sm text-[hsl(var(--primary))] font-bold">
            {data.peak}
          </span>
        </div>

        {/* Center floating readout */}
        <div className="relative z-20 self-center bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg border border-white flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-[hsl(var(--admin-cobalt))] animate-ping" />
          <span className="font-syne font-bold text-[hsl(var(--admin-on-surface))]">
            {data.metric}
          </span>
          <span className="text-[hsl(var(--admin-outline))]">{data.label}</span>
        </div>

        {/* Timeline axis */}
        <div className="flex justify-between text-xs text-[hsl(var(--admin-outline))] relative z-10 pt-2 border-t border-[hsl(var(--admin-outline-variant))]/30 font-medium">
          {data.days.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
        <div className="p-3.5 rounded-xl bg-[hsl(var(--admin-surface-low))]/60 border border-white/60 hover:bg-white transition-all">
          <p className="text-[10px] font-bold text-[hsl(var(--admin-outline))] tracking-wider">
            TOP PERFORMING FORMAT
          </p>
          <p className="font-syne font-bold text-[hsl(var(--admin-on-surface))] text-base mt-1">
            Short Reels
          </p>
          <p className="text-xs text-[hsl(var(--primary))] font-semibold mt-0.5">
            8.4x retention multiplier
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-[hsl(var(--admin-surface-low))]/60 border border-white/60 hover:bg-white transition-all">
          <p className="text-[10px] font-bold text-[hsl(var(--admin-outline))] tracking-wider">
            VIRAL DRIFT SCORE
          </p>
          <p className="font-syne font-bold text-[hsl(var(--admin-on-surface))] text-base mt-1">
            94 / 100
          </p>
          <p className="text-xs text-[hsl(var(--admin-cobalt))] font-semibold mt-0.5">
            Algorithmic favoritism high
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-[hsl(var(--admin-surface-low))]/60 border border-white/60 hover:bg-white transition-all">
          <p className="text-[10px] font-bold text-[hsl(var(--admin-outline))] tracking-wider">
            AUDIENCE REACTION
          </p>
          <p className="font-syne font-bold text-[hsl(var(--admin-on-surface))] text-base mt-1">
            98.2% Positive
          </p>
          <p className="text-xs text-[hsl(var(--brand-accent-foreground))] font-bold mt-0.5">
            Sentiment peak
          </p>
        </div>
      </div>
    </div>
  )
}
