"use client"

import * as React from "react"
import { useQueryState, parseAsStringEnum, parseAsString, debounce } from "nuqs"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/icons"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/animate-ui/components/radix/dropdown-menu"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { motion } from "motion/react"

export interface CampaignItem {
  id: string
  name: string
  type: string
  start_date: string | null
  end_date: string | null
  color: string | null
  notes: string | null
  client_id: string
  clientName: string
  status: "active" | "completed" | "upcoming"
  stats: {
    reach: number
    engagement: number
    clicks: number
    inquiries: number
    contentCount: number
  }
}

interface CampaignAnalyticsViewProps {
  campaigns: CampaignItem[]
  clients: { id: string; name: string }[]
}

function formatNumber(num: number): string {
  if (!num || isNaN(num)) return "0"
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M"
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "k"
  return num.toLocaleString("id-ID")
}

function formatPeriod(start: string | null, end: string | null): string {
  if (!start && !end) return "Periode fleksibel"
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
  if (start && end) {
    const s = new Date(start).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
    const e = new Date(end).toLocaleDateString("id-ID", opts)
    return `${s} – ${e}`
  }
  if (start) return `Mulai ${new Date(start).toLocaleDateString("id-ID", opts)}`
  return `Hingga ${new Date(end!).toLocaleDateString("id-ID", opts)}`
}

export function CampaignAnalyticsView({ campaigns, clients }: CampaignAnalyticsViewProps) {
  const [statusFilter, setStatusFilter] = useQueryState("status", parseAsStringEnum(["all", "active", "completed"]).withDefault("all"))
  const [clientFilter, setClientFilter] = useQueryState("client", parseAsString.withDefault("all"))
  const [searchQuery, setSearchQuery] = useQueryState("q", parseAsString.withDefault("").withOptions({ limitUrlUpdates: debounce(300) }))

  const activeCount = campaigns.filter(c => c.status === "active").length
  const completedCount = campaigns.filter(c => c.status === "completed").length

  const filteredCampaigns = React.useMemo(() => {
    return campaigns.filter(c => {
      // Filter status
      if (statusFilter !== "all" && c.status !== statusFilter) return false

      // Filter client
      if (clientFilter !== "all" && c.client_id !== clientFilter) return false

      // Filter search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchName = c.name.toLowerCase().includes(query)
        const matchClient = c.clientName.toLowerCase().includes(query)
        const matchNotes = c.notes?.toLowerCase().includes(query)
        if (!matchName && !matchClient && !matchNotes) return false
      }

      return true
    })
  }, [campaigns, statusFilter, clientFilter, searchQuery])

  const hasActiveFilters = statusFilter !== "all" || clientFilter !== "all" || searchQuery.trim() !== ""

  const resetFilters = () => {
    setStatusFilter("all")
    setClientFilter("all")
    setSearchQuery("")
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header bar with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        {/* Status Filter Tabs */}
        <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
          <TabsList
            className="h-8 p-1 bg-muted/60 rounded-lg border border-border/40 text-xs"
            highlightClassName="bg-card shadow-xs rounded-md"
          >
            <TabsTrigger value="all" className="px-3 py-1 text-xs font-medium rounded-md">
              Semua ({campaigns.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[hsl(var(--success))]"></span>
              Aktif ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="completed" className="px-3 py-1 text-xs font-medium rounded-md">
              Selesai ({completedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Client Selector & Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Client Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-8 pl-8 pr-3 text-xs font-medium bg-background hover:bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer flex items-center gap-1.5 relative"
              >
                <Icons.adjustments className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <span>
                  {clientFilter === "all"
                    ? "Semua Client"
                    : clients.find((cl) => cl.id === clientFilter)?.name ?? "Semua Client"}
                </span>
                <Icons.chevronDown className="size-3 text-muted-foreground ml-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 max-h-60 overflow-y-auto">
              <DropdownMenuItem onClick={() => setClientFilter("all")}>
                Semua Client
              </DropdownMenuItem>
              {clients.map((cl) => (
                <DropdownMenuItem key={cl.id} onClick={() => setClientFilter(cl.id)}>
                  {cl.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Icons.search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Cari campaign..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              title="Reset Filter"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 border border-border/60 rounded-lg hover:bg-muted/50 transition-colors shrink-0"
            >
              <Icons.refresh className="size-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Grid of Campaign Cards */}
      {filteredCampaigns.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-muted/20">
          <CardContent className="py-14 text-center text-muted-foreground flex flex-col items-center justify-center">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-2.5">
              <Icons.search className="size-4 text-foreground/70" />
            </div>
            <p className="font-medium text-foreground text-sm">Tidak ada campaign yang cocok</p>
            <p className="text-xs mt-1 text-muted-foreground max-w-xs">
              Ubah kriteria pencarian atau pilih tab status lain untuk melihat campaign.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 text-xs font-medium text-brand-accent hover:underline flex items-center gap-1"
              >
                <Icons.refresh className="size-3" />
                Kembalikan semua filter
              </button>
            )}
          </CardContent>
        </Card>
      ) : (        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
          }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2"
        >
          {filteredCampaigns.map((c) => {
            const isActive = c.status === "active"
            const isCompleted = c.status === "completed"
            const inquiryRate = c.stats.clicks > 0 
              ? ((c.stats.inquiries / c.stats.clicks) * 100).toFixed(1)
              : null

            return (
              <motion.div
                key={c.id}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 350, damping: 25 } },
                }}
              >
                <Card 
                  className="admin-card transition-all duration-200 hover:shadow-md group flex flex-col justify-between h-full"
                >
                  <CardHeader className="pb-3 border-b border-border/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link 
                            href={`/admin/clients/${c.client_id}`}
                            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                          >
                            {c.clientName}
                            <Icons.arrowUpRight className="size-3 opacity-60 group-hover:opacity-100" />
                          </Link>
                          <Badge variant="outline" className="text-2xs py-0 px-1.5 font-normal">
                            {c.type === "promo" ? "Promo" : c.type === "event" ? "Event" : "Campaign"}
                          </Badge>
                        </div>
                        <CardTitle className="text-base font-semibold mt-1 group-hover:text-brand-accent transition-colors truncate">
                          {c.name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1 flex items-center gap-1.5 text-muted-foreground">
                          <Icons.calendar className="size-3.5 shrink-0" />
                          {formatPeriod(c.start_date, c.end_date)}
                        </CardDescription>
                      </div>

                      <Badge 
                        variant={isActive ? "default" : isCompleted ? "secondary" : "outline"} 
                        className={`shrink-0 text-xs ${
                          isActive 
                            ? "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.9)] text-[hsl(var(--success-foreground))] font-medium shadow-xs" 
                            : isCompleted 
                            ? "bg-muted text-muted-foreground" 
                            : "text-muted-foreground"
                        }`}
                      >
                        {isActive ? "Aktif" : isCompleted ? "Selesai" : "Akan Datang"}
                      </Badge>
                    </div>

                    {c.notes && (
                      <p className="text-xs text-muted-foreground/85 line-clamp-2 mt-2 pt-2 border-t border-border/30">
                        {c.notes}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-muted-foreground text-2xs font-semibold">Konten</p>
                        <p className="font-semibold text-base tabular-nums">
                          <MetricTicker value={c.stats.contentCount} />
                        </p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-muted-foreground text-2xs font-semibold">Reach</p>
                        <p className="font-semibold text-base tabular-nums">
                          <MetricTicker value={c.stats.reach} />
                        </p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-muted-foreground text-2xs font-semibold">Engagement</p>
                        <p className="font-semibold text-base tabular-nums">
                          <MetricTicker value={c.stats.engagement} />
                        </p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-muted-foreground text-2xs font-semibold">Clicks / Inquiry</p>
                        <p className="font-bold text-base text-brand-accent tabular-nums flex items-baseline gap-1">
                          <MetricTicker value={c.stats.clicks} />
                          <span className="text-foreground/70 text-xs font-normal">/</span>
                          <MetricTicker value={c.stats.inquiries} />
                        </p>
                      </div>
                    </div>

                    {inquiryRate && (
                      <div className="mt-3 pt-2.5 border-t border-border/30 flex items-center justify-between text-1xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Icons.flame className="size-3 text-brand-accent" />
                          Inquiry Conversion Rate
                        </span>
                        <span className="font-semibold text-foreground tabular-nums">
                          {inquiryRate}%
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
