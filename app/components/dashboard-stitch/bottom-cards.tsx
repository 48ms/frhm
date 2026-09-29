"use client"

import React from "react"
import { Icons } from "@/components/icons"

const CARDS = [
  {
    label: "TOP PERFORMING FORMAT",
    value: "Reels",
    sub: "42% of total engagement",
    icon: "sparkles" as const,
  },
  {
    label: "VIRAL DRIFT SCORE",
    value: "87/100",
    sub: "High velocity detected",
    icon: "trendingUp" as const,
  },
  {
    label: "AUDIENCE REACTION",
    value: "Positive",
    sub: "Based on 1.2k comments",
    icon: "heart" as const,
  },
]

export function DashboardStitchBottomCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {CARDS.map((card, idx) => {
        const IconCmp = Icons[card.icon]
        return (
          <div
            key={idx}
            className="p-5 rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-[hsl(var(--admin-outline-variant))]/30 shadow-sm flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-[hsl(var(--admin-outline))] uppercase">
                {card.label}
              </span>
              {IconCmp && <span className="text-[#4353ff]"><IconCmp className="size-4" /></span>}
            </div>
            <span className="text-xl font-bold tracking-tight text-[hsl(var(--admin-on-surface))]">
              {card.value}
            </span>
            <span className="text-[10px] font-medium text-[hsl(var(--admin-outline))]">
              {card.sub}
            </span>
          </div>
        )
      })}
    </div>
  )
}
