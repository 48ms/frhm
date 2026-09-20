"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDownIcon, ChevronUpIcon, BarChart3Icon, TrendingUpIcon, CalendarIcon } from "lucide-react"

export interface ClientBriefing {
  clientId: string
  clientName: string
  postsThisWeek: number
  totalReach: number
  engagementRate: number
  topPostTitle: string | null
  topPostReach: number
  scheduledNextWeek: number
}

interface WeeklyBriefingProps {
  briefings: ClientBriefing[]
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
  if (num >= 1000) return (num / 1000).toFixed(1) + "K"
  return num.toString()
}

export function WeeklyBriefingWidget({ briefings }: WeeklyBriefingProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleCollapse = (clientId: string) => {
    setCollapsed((prev) => ({ ...prev, [clientId]: !prev[clientId] }))
  }

  if (!briefings || briefings.length === 0) return null

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3Icon className="size-4 text-primary" />
            Weekly Briefing Performance
          </CardTitle>
          <CardDescription>
            Ringkasan 7 hari terakhir & rencana minggu depan per klien
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {briefings.map((b) => {
          const isCollapsed = collapsed[b.clientId] ?? false
          return (
            <div
              key={b.clientId}
              className="rounded-xl border bg-card p-3 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-sm truncate">{b.clientName}</span>
                  <Badge variant="outline" className="text-[10px] font-normal shrink-0">
                    {b.postsThisWeek} post minggu ini
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={() => toggleCollapse(b.clientId)}
                >
                  {isCollapsed ? (
                    <ChevronDownIcon className="size-4" />
                  ) : (
                    <ChevronUpIcon className="size-4" />
                  )}
                  <span className="sr-only">Toggle briefing</span>
                </Button>
              </div>

              {!isCollapsed && (
                <div className="mt-3 pt-3 border-t grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                  <div className="flex flex-col gap-0.5 bg-muted/40 p-2.5 rounded-lg">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUpIcon className="size-3 text-primary" /> Reach Minggu Ini
                    </span>
                    <span className="font-semibold text-sm">{formatNumber(b.totalReach)}</span>
                  </div>

                  <div className="flex flex-col gap-0.5 bg-muted/40 p-2.5 rounded-lg">
                    <span className="text-muted-foreground">Engagement Rate</span>
                    <span className="font-semibold text-sm">{b.engagementRate.toFixed(1)}%</span>
                  </div>

                  <div className="flex flex-col gap-0.5 bg-muted/40 p-2.5 rounded-lg sm:col-span-2 lg:col-span-1">
                    <span className="text-muted-foreground truncate">Top Content</span>
                    <span className="font-semibold text-xs truncate">
                      {b.topPostTitle ? `"${b.topPostTitle}"` : "Belum ada"}
                    </span>
                    {b.topPostReach > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatNumber(b.topPostReach)} reach
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5 bg-muted/40 p-2.5 rounded-lg">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="size-3 text-emerald-600" /> Terjadwal Mgg Depan
                    </span>
                    <span className="font-semibold text-sm text-emerald-600">
                      {b.scheduledNextWeek} konten
                    </span>
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