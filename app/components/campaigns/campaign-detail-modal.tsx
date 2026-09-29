"use client"

import React, { useState } from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { CAMPAIGN_TYPE_META, type Campaign, type CampaignClient } from "./campaign-data"

/** Deterministic daily performance series so the chart is stable per campaign. */
function dailySeries(c: Campaign): number[] {
  const seed = c.id.split("").reduce((n, ch) => n + ch.charCodeAt(0), 0)
  return Array.from({ length: 14 }, (_, i) => {
    const base = 40 + ((seed * (i + 3)) % 55)
    const wave = Math.sin((i + seed % 7) / 2) * 12
    return Math.max(8, Math.min(100, Math.round(base + wave)))
  })
}

export function CampaignDetailModal({
  campaign,
  client,
  open,
  onClose,
  onEdit,
}: {
  campaign: Campaign | null
  client: CampaignClient | undefined
  open: boolean
  onClose: () => void
  onEdit: (c: Campaign) => void
}) {
  const [tab, setTab] = useState<"overview" | "performance">("overview")
  if (!open || !campaign || !client) return null

  const meta = CAMPAIGN_TYPE_META[campaign.type]
  const series = dailySeries(campaign)
  const max = Math.max(...series)

  const stats = [
    { label: "Reach", value: campaign.reach, delta: client.reachGrowth },
    { label: "Posts", value: String(campaign.posts), delta: "+3 this week" },
    { label: "Progress", value: `${campaign.progress}%`, delta: "on track" },
    { label: "Engagement", value: "6.2%", delta: "+0.8pt" },
  ]

  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[hsl(var(--admin-on-surface))]/40 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/80 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[hsl(var(--admin-outline-variant))]/30 pb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: campaign.color }}
            >
              <Icons.campaign className="size-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-syne font-bold text-[hsl(var(--admin-on-surface))] text-sm truncate">
                {campaign.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-[hsl(var(--admin-outline))]">
                  {client.name}
                </span>
                <span className={cn("admin-badge ml-1", meta.badge)}>{meta.label}</span>
              </div>
            </div>
          </div>
          <button
            className="p-1 rounded-full hover:bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))] transition-all cursor-pointer shrink-0"
            onClick={onClose}
          >
            <Icons.close className="size-[18px]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="inline-flex p-1 rounded-full bg-[hsl(var(--admin-surface-high))]/70 border border-[hsl(var(--admin-outline-variant))]/30">
          {(["overview", "performance"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer capitalize",
                tab === t
                  ? "bg-white text-[hsl(var(--admin-on-surface))] shadow-sm"
                  : "text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))]"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="p-3 rounded-xl bg-[hsl(var(--admin-surface-low))]/60 border border-white/60 text-center"
                >
                  <span className="admin-stat-value block text-lg text-[hsl(var(--admin-on-surface))]">
                    {s.value}
                  </span>
                  <span className="block text-[9px] font-bold text-[hsl(var(--admin-outline))] uppercase tracking-wider">
                    {s.label}
                  </span>
                  <span className="block text-[9px] text-emerald-600 font-semibold mt-0.5">
                    {s.delta}
                  </span>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
                <span className="text-[hsl(var(--admin-outline))] uppercase tracking-wider">
                  Overall Progress
                </span>
                <span className="text-[hsl(var(--admin-on-surface))]">
                  {campaign.progress}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[hsl(var(--admin-surface-high))] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${campaign.progress}%`, backgroundColor: campaign.color }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[hsl(var(--admin-surface-low))]/50 border border-[hsl(var(--admin-outline-variant))]/30">
              <span className="block text-[10px] font-bold text-[hsl(var(--admin-outline))] uppercase tracking-wide mb-1">
                Objective
              </span>
              <p className="text-[11px] text-[hsl(var(--admin-on-surface))]">
                {campaign.notes}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] py-2 border-t border-[hsl(var(--admin-outline-variant))]/20">
              <span className="text-[hsl(var(--admin-outline))]">Campaign window</span>
              <span className="font-semibold text-[hsl(var(--admin-on-surface))]">
                {campaign.startDate} → {campaign.endDate}
              </span>
            </div>
          </>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-[hsl(var(--admin-outline))] uppercase tracking-wider">
                Daily Reach · last 14 days
              </span>
              <span className="text-[10px] font-bold text-emerald-600">
                {client.reachGrowth} growth
              </span>
            </div>
            <div className="h-40 w-full bg-[hsl(var(--admin-surface-low))]/40 rounded-2xl border border-white/50 p-3 flex items-end gap-1.5">
              {series.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md transition-all hover:opacity-80"
                  style={{
                    height: `${(v / max) * 100}%`,
                    backgroundColor: campaign.color,
                    opacity: 0.4 + (v / max) * 0.6,
                  }}
                  title={`Day ${i + 1}: ${v}K`}
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2.5 mt-4">
              {[
                { label: "Best Day", value: `${max}K`, sub: "Peak reach" },
                { label: "Avg / Day", value: `${Math.round(series.reduce((a, b) => a + b, 0) / series.length)}K`, sub: "Sustained" },
                { label: "Total", value: campaign.reach, sub: "Cumulative" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="p-3 rounded-xl bg-[hsl(var(--admin-surface-low))]/60 border border-white/60 text-center"
                >
                  <span className="admin-stat-value block text-base text-[hsl(var(--admin-on-surface))]">
                    {s.value}
                  </span>
                  <span className="block text-[9px] font-bold text-[hsl(var(--admin-outline))] uppercase tracking-wider">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[hsl(var(--admin-outline-variant))]/20">
          <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[hsl(var(--admin-outline-variant))]/40 text-xs font-semibold text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-low))] transition-all cursor-pointer">
            <Icons.ios_share className="size-3.5" />
            Export
          </button>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-full text-xs font-semibold text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-high))] transition-all cursor-pointer"
              onClick={onClose}
            >
              Close
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--admin-cobalt))] text-white text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              onClick={() => {
                onClose()
                onEdit(campaign)
              }}
            >
              <Icons.edit className="size-3.5" />
              Edit Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
