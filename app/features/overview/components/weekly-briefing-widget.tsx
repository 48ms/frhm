"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import type { ClientWeeklyBriefing } from "../api/types"

export type ClientBriefing = ClientWeeklyBriefing

interface WeeklyBriefingProps {
  briefings: ClientWeeklyBriefing[]
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
  if (num >= 1000) return (num / 1000).toFixed(1) + "K"
  return num.toString()
}

export function WeeklyBriefingWidget({ briefings }: WeeklyBriefingProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    briefings.forEach((b) => {
      initial[b.clientId] = true
    })
    return initial
  })

  const toggleExpand = (clientId: string) => {
    setExpanded((prev) => ({ ...prev, [clientId]: !prev[clientId] }))
  }

  if (!briefings || briefings.length === 0) {
    return null
  }

  return (
    <Card className="rounded-2xl border-border/40 shadow-sm bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Icons.barChart className="size-4 text-brand-accent" />
              Weekly Briefing Performance
            </CardTitle>
            <CardDescription className="text-xs font-medium mt-1">
              Ringkasan 7 hari terakhir &amp; rencana minggu depan per klien
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        {briefings.map((b) => {
          const isExpanded = expanded[b.clientId] ?? false
          return (
            <div
              key={b.clientId}
              className="rounded-xl border border-border/50 bg-background/60 p-4 transition-all hover:border-brand-accent/30"
            >
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => toggleExpand(b.clientId)}
              >
                <div className="flex items-center gap-2.5">
                  <h4 className="font-bold text-sm">{b.clientName}</h4>
                  <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground">
                    {b.postsThisWeek} post minggu ini
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="size-7">
                  {isExpanded ? (
                    <Icons.chevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <Icons.chevronDown className="size-4 text-muted-foreground" />
                  )}
                </Button>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-border/40 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-card p-3 border border-border/30">
                    <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <Icons.trendingUp className="size-3 text-brand-accent" />
                      Reach Minggu Ini
                    </p>
                    <p className="text-lg font-bold mt-1 text-foreground">
                      {formatNumber(b.totalReach)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-card p-3 border border-border/30">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Engagement Rate
                    </p>
                    <p className="text-lg font-bold mt-1 text-foreground">
                      {b.engagementRate.toFixed(1)}%
                    </p>
                  </div>

                  <div className="rounded-lg bg-card p-3 border border-border/30 sm:col-span-2 lg:col-span-1">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Top Content
                    </p>
                    {b.topPostTitle ? (
                      <div className="mt-1">
                        <p className="text-xs font-semibold truncate text-foreground" title={b.topPostTitle}>
                          &quot;{b.topPostTitle}&quot;
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatNumber(b.topPostReach)} reach
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Belum ada post publish
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg bg-card p-3 border border-border/30">
                    <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <Icons.calendar className="size-3 text-blue-500" />
                      Terjadwal Mgg Depan
                    </p>
                    <p className="text-lg font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                      {b.scheduledNextWeek} konten
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
