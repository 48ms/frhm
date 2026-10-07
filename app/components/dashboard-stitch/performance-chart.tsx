"use client"

import React, { useMemo } from "react"
import { useQueryState, parseAsStringEnum } from "nuqs"
import { cn } from "@/lib/utils"
import { useActiveDashboard } from "./dashboard-data"
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
  const { profile, client } = useActiveDashboard()
  const [tf, setTf] = useQueryState(
    "tf",
    parseAsStringEnum<Timeframe>(["7d", "30d", "90d"]).withDefault("30d")
  )

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
    <div className="p-6 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/40 shadow-sm flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <span className="text-xs font-semibold text-muted-foreground block">
            Audience trajectory · {client.name.substring(0, 5)}
          </span>
          <h2 className="font-syne font-bold text-lg text-foreground">
            Performance &amp; Engagement Dynamics
          </h2>
        </div>
        {/* Timeframe selector , URL state via nuqs */}
        <div className="inline-flex p-1 rounded-full bg-muted/70 border border-border/30">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTf(t.id)}
              aria-pressed={tf === t.id}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                tf === t.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full min-h-[240px] bg-muted/20 rounded-2xl p-4 border border-border/40 relative">
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
        <span className="bg-background border border-border/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-foreground shadow-sm">
          {profile.peak_label}: {profile.peak_value}
        </span>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
        {profile.insights.map((card, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-muted/60 border border-border/40 hover:bg-card hover:shadow-sm transition-all"
          >
            <p className="text-xs font-semibold text-muted-foreground">
              {card.label}
            </p>
            <p className="font-syne font-bold text-foreground text-base mt-1">
              {card.value}
            </p>
            <p className="text-xs font-semibold mt-0.5 text-brand-accent">
              {card.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
