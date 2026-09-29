"use client"

import React from "react"
import { useQueryState, parseAsStringEnum } from "nuqs"
import { cn } from "@/lib/utils"
import { useActiveDashboard, type Timeframe } from "./dashboard-data"

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
  const { profile, client } = useActiveDashboard()
  const [tf, setTf] = useQueryState(
    "tf",
    parseAsStringEnum<Timeframe>(["7d", "30d", "90d"]).withDefault("30d")
  )

  const chart = profile.charts[tf]

  return (
    <div className="p-6 rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <span className="text-xs font-bold text-[hsl(var(--admin-outline))] tracking-wider block">
            AUDIENCE TRAJECTORY · {client.shortName.toUpperCase()}
          </span>
          <h2 className="font-syne font-bold text-lg text-[hsl(var(--admin-on-surface))]">
            Performance &amp; Engagement Dynamics
          </h2>
        </div>
        {/* Timeframe selector — URL state via nuqs */}
        <div className="inline-flex p-1 rounded-full bg-[hsl(var(--admin-surface-high))]/70 border border-[hsl(var(--admin-outline-variant))]/30">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTf(t.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                tf === t.id
                  ? "bg-white text-[hsl(var(--admin-on-surface))] shadow-sm"
                  : "text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart Area — bezier waves, path swaps with client + timeframe */}
      <div className="relative h-60 w-full bg-[hsl(var(--admin-surface-low))]/40 rounded-2xl p-4 border border-white/50 flex flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-70 pointer-events-none">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 200">
            <defs>
              <linearGradient id="grad-wave" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4353FF" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#D4FF32" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={`${chart.reach} L600,200 L0,200 Z`} fill="url(#grad-wave)" />
            <path
              d={chart.reach}
              fill="none"
              stroke="#2333E7"
              strokeLinecap="round"
              strokeWidth="3"
            />
            <path
              d={chart.engage}
              fill="none"
              stroke="#aed500"
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
          </svg>
        </div>

        {/* Axis Indicators */}
        <div className="flex justify-between items-center relative z-10 text-xs text-[hsl(var(--admin-outline))] font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2333E7]" /> Impressions (Reach)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#aed500] border border-[hsl(var(--brand-accent))]" />{" "}
            Click Through &amp; Saves
          </span>
          <span className="bg-white px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[hsl(var(--admin-on-surface))] shadow-sm">
            {profile.peakLabel}
          </span>
        </div>

        {/* Value readout */}
        <div className="relative z-10 flex justify-end pr-4">
          <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border border-white/80">
            <span className="block text-[10px] font-bold text-[hsl(var(--admin-outline))]">
              {profile.peakValue}
            </span>
            <span className="block text-[9px] text-[hsl(var(--admin-outline))]">
              Interactions at peak · {tf.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Period labels */}
        <div className="flex justify-between items-center relative z-10 text-xs text-[hsl(var(--admin-outline))] font-medium">
          {DAY_LABELS[tf].map((d, i) => (
            <span
              key={d}
              className={i === 4 ? "text-[hsl(var(--brand-accent-foreground))] font-bold" : ""}
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Insight Cards — driven by the active client profile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
        {profile.insights.map((card, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-[hsl(var(--admin-surface-low))]/60 border border-white/60 hover:bg-white transition-all"
          >
            <p className="text-[10px] font-bold text-[hsl(var(--admin-outline))] tracking-wider">
              {card.label}
            </p>
            <p className="font-syne font-bold text-[hsl(var(--admin-on-surface))] text-base mt-1">
              {card.value}
            </p>
            <p className="text-xs font-semibold mt-0.5 text-[hsl(var(--admin-cobalt))]">
              {card.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
