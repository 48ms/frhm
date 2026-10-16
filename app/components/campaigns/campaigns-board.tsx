"use client"

import React, { useMemo, useState } from "react"
import { useQueryState, parseAsStringEnum, parseAsString, debounce } from "nuqs"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { withViewTransition, campaignTransitionName } from "@/lib/view-transition"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu"
import {
  campaignQueries,
  useCreateCampaign,
  useUpdateCampaign,
} from "@/features/campaigns/api/queries"
import { contentProductionQueries, useUpdateContentProduction, useCreateContentProduction } from "@/features/content-production/api/queries"
import { erpQueries } from "@/features/erp/api/queries"
import type { Campaign } from "@/features/campaigns/api/types"
import type { ContentProduction, ContentStage } from "@/features/content-production/api/types"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { CampaignModal } from "./campaign-modal"
import { CampaignDetailModal } from "./campaign-detail-modal"
import { AddAdSpendLogForm } from "@/components/expenses/add-ad-spend-log-form"
import { CreateExpenseForm } from "@/components/expenses/create-expense-form"
import { StitchAiHookModal } from "@/components/dashboard-stitch/ai-hook-modal"
import { PageContainer } from "@/components/layout/page-container"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "motion/react"

/* ------------------------------------------------------------------ */
/* Factual derivations & presentation metadata                         */
/* ------------------------------------------------------------------ */

const CAMPAIGN_TABS = ["all", "active", "review", "completed", "draft"] as const
type CampaignTab = (typeof CAMPAIGN_TABS)[number]

type CampaignStatus = "active" | "upcoming" | "completed" | "draft"

/** Status derived purely from the campaign's real dates (no mock state). */
function getCampaignStatus(c: Pick<Campaign, "start_date" | "end_date">): CampaignStatus {
  const { start_date, end_date } = c
  if (!start_date && !end_date) return "draft"
  const now = Date.now()
  if (end_date) {
    const end = new Date(`${end_date}T23:59:59`).getTime()
    if (end < now) return "completed"
  }
  if (start_date) {
    const start = new Date(`${start_date}T00:00:00`).getTime()
    if (start > now) return "upcoming"
  }
  return "active"
}

const STATUS_META: Record<CampaignStatus, { label: string; badge: string }> = {
  active: { label: "Active", badge: "bg-brand-accent/10 text-brand-accent" },
  upcoming: { label: "Upcoming", badge: "bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))]" },
  completed: { label: "Completed", badge: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" },
  draft: { label: "Draft", badge: "bg-muted text-muted-foreground" },
}

/** Maps a campaign status onto the URL tab key (see CAMPAIGN_TABS). */
function statusToTab(s: CampaignStatus): CampaignTab {
  return s === "upcoming" ? "review" : s
}

const PLATFORM_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; badge: string; iconBg: string }
> = {
  instagram: {
    label: "Instagram",
    icon: Icons.instagram,
    badge: "bg-[hsl(var(--platform-instagram)/0.1)] text-[hsl(var(--platform-instagram))]",
    iconBg: "bg-[hsl(var(--platform-instagram)/0.1)] text-[hsl(var(--platform-instagram))]",
  },
  "ig reels": {
    label: "IG Reels",
    icon: Icons.instagram,
    badge: "bg-[hsl(var(--platform-instagram)/0.1)] text-[hsl(var(--platform-instagram))]",
    iconBg: "bg-[hsl(var(--platform-instagram)/0.1)] text-[hsl(var(--platform-instagram))]",
  },
  tiktok: {
    label: "TikTok",
    icon: Icons.tiktok,
    badge: "bg-muted text-foreground",
    iconBg: "bg-brand-accent/10 text-brand-accent",
  },
  youtube: {
    label: "YouTube",
    icon: Icons.youtube,
    badge: "bg-[hsl(var(--platform-youtube))]/10 text-[hsl(var(--platform-youtube))]",
    iconBg: "bg-[hsl(var(--platform-youtube))]/10 text-[hsl(var(--platform-youtube))]",
  },
  linkedin: {
    label: "LinkedIn",
    icon: Icons.linkedin,
    badge: "bg-[hsl(var(--platform-linkedin))]/10 text-[hsl(var(--platform-linkedin))]",
    iconBg: "bg-[hsl(var(--platform-linkedin))]/10 text-[hsl(var(--platform-linkedin))]",
  },
  facebook: {
    label: "Facebook",
    icon: Icons.facebook,
    badge: "bg-[hsl(var(--platform-facebook))]/10 text-[hsl(var(--platform-facebook))]",
    iconBg: "bg-[hsl(var(--platform-facebook))]/10 text-[hsl(var(--platform-facebook))]",
  },
  twitter: {
    label: "Twitter / X",
    icon: Icons.twitter,
    badge: "bg-[hsl(var(--platform-twitter))]/10 text-[hsl(var(--platform-twitter))]",
    iconBg: "bg-[hsl(var(--platform-twitter))]/10 text-[hsl(var(--platform-twitter))]",
  },
}

function platformMeta(platform: string | null | undefined) {
  const key = (platform ?? "").trim().toLowerCase()
  return (
    PLATFORM_META[key] ?? {
      label: platform?.trim() || "Unassigned",
      icon: Icons.campaign,
      badge: "bg-muted text-muted-foreground",
      iconBg: "bg-muted text-muted-foreground",
    }
  )
}

/**
 * Stage colors from the logo palette (DESIGN.md §2), not library defaults.
 * Lightness/chroma differ per stage so status reads without hue alone:
 * neutral canvas → brand-blue production → green approval. Idea stays muted
 * because it carries no state yet.
 */
const STAGE_META: Record<ContentStage, { label: string; badge: string }> = {
  idea: { label: "Idea", badge: "bg-muted text-muted-foreground" },
  script: { label: "Scripting", badge: "bg-brand-yellow/15 text-brand-yellow dark:text-brand-yellow" },
  shooting: { label: "Shooting", badge: "bg-brand-red/15 text-brand-red dark:text-brand-red" },
  editing: { label: "Editing", badge: "bg-brand-blue/15 text-brand-blue dark:text-brand-blue" },
  design: { label: "Design", badge: "bg-brand-blue/15 text-brand-blue dark:text-brand-blue" },
  caption: { label: "Captioning", badge: "bg-brand-accent/10 text-brand-accent" },
  review: { label: "Ready for Review", badge: "bg-brand-accent/10 text-brand-accent" },
  ready: { label: "Approved", badge: "bg-brand-green/15 text-brand-green dark:text-brand-green" },
}

/* Categorical chart/assignee colors. Logo hues first, then a neutral for the
   overflow slot — the ramp stays Frhm and categories stay distinguishable by
   lightness, not just hue. */
const PALETTE = [
  "bg-brand-blue",
  "bg-brand-green",
  "bg-brand-yellow",
  "bg-brand-red",
  "bg-foreground/70",
]

function formatCurrency(n: number): string {
  if (!Number.isFinite(n)) return "$0"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)
}

function formatCompact(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "No date"
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(d.getTime())) return "No date"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatMonth(value: string | null | undefined): string {
  if (!value) return "—"
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

/**
 * Timeline view untuk content_productions (mode Gantt).
 * Rentang dihitung dari due_date awal sampai akhir; bar di-posisikan
 * proporsional terhadap rentang faktual, bukan angka rekaan.
 */
function GanttTimeline({
  productions,
  platformMeta,
}: {
  productions: ContentProduction[]
  platformMeta: (platform: string) => { label: string; badge: string }
}) {
  const withDates = productions.filter((p) => p.due_date)
  const earliest = withDates.length
    ? withDates.reduce(
        (min, p) => (p.due_date! < min ? p.due_date! : min),
        withDates[0].due_date!
      )
    : null
  const latest = withDates.length
    ? withDates.reduce(
        (max, p) => (p.due_date! > max ? p.due_date! : max),
        withDates[0].due_date!
      )
    : null

  if (!earliest || !latest) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Gantt timeline butuh due date. Setidaknya satu deliverable punya due date untuk
          menampilkan timeline.
        </p>
      </div>
    )
  }

  const startMs = new Date(earliest + "T00:00:00").getTime()
  const endMs = new Date(latest + "T23:59:59").getTime()
  const totalMs = Math.max(1, endMs - startMs)

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 space-y-1 overflow-x-auto">
      <div className="flex justify-between text-2xs text-muted-foreground font-medium px-1 pb-1">
        <span>{formatMonth(earliest)}</span>
        <span>{formatMonth(latest)}</span>
      </div>
      {withDates.map((d, i) => {
        const sm = STAGE_META[d.stage] ?? STAGE_META.idea
        const pm = platformMeta(d.platform)
        const dueMs = new Date(d.due_date! + "T00:00:00").getTime()
        const left = Math.max(0, ((dueMs - startMs) / totalMs) * 100)
        const barColor = PALETTE[i % PALETTE.length]
        return (
          <div
            key={d.id}
            className="flex items-center gap-3 px-1 py-1.5 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className="w-32 shrink-0 truncate text-xs font-medium text-foreground" title={d.title}>
              {d.title}
            </div>
            <div className="relative flex-1 h-7 min-w-[180px] rounded-md bg-muted/40 border border-border/30">
              <div
                className={`absolute top-1/2 -translate-y-1/2 h-3.5 rounded-full ${barColor} shadow-sm`}
                style={{ left: `${Math.min(left, 96)}%`, width: "4%" }}
                title={`${d.title} · ${sm.label} · due ${formatDate(d.due_date)}`}
              />
            </div>
            <span className={cn("admin-badge shrink-0", sm.badge)}>{sm.label}</span>
            <span className={cn("admin-badge shrink-0", pm.badge)}>{pm.label}</span>
          </div>
        )
      })}
      {productions.length > withDates.length && (
        <p className="text-1xs text-muted-foreground pt-1">
          {productions.length - withDates.length} deliverable tanpa due date tidak ditampilkan.
        </p>
      )}
    </div>
  )
}

/** Flight progress derived from the campaign's real start/end dates. */
function flightProgress(c: Campaign | null) {
  if (!c?.start_date || !c?.end_date) return null
  const start = new Date(`${c.start_date}T00:00:00`).getTime()
  const end = new Date(`${c.end_date}T23:59:59`).getTime()
  const span = Math.max(1, end - start)
  const now = Date.now()
  const totalDays = Math.max(1, Math.round(span / 86_400_000))
  const day = Math.min(totalDays, Math.max(1, Math.round((now - start) / 86_400_000) + 1))
  const pct = Math.min(100, Math.max(0, ((now - start) / span) * 100))
  return { day, totalDays, pct }
}

/* ------------------------------------------------------------------ */

export function CampaignsBoard() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringEnum([...CAMPAIGN_TABS]).withDefault("all")
  )
  const [query] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ limitUrlUpdates: debounce(300) })
  )
  const [viewMode, setViewMode] = useState<"list" | "gantt">("list")
  const [aiHookOpen, setAiHookOpen] = useState(false)

  // Sumber client + clientId aktif dari Supabase (useActiveDashboard).
  const { clientId: activeClientId, setClientId, client: activeClient, clients } =
    useActiveDashboard()

  // PENTING (fakta): gunakan `useQuery` (BUKAN `useSuspenseQuery`) karena
  // `activeClientId` dihitung dari daftar klien asli DB dan bisa berbeda dari
  // key hasil prefetch server (berbasis URL state). useQuery menampilkan data
  // yang tersedia tanpa suspend, fetch tambahan berjalan di effect.
  const { data: campaignsData } = useQuery({
    ...campaignQueries.listByClient(activeClientId),
    enabled: Boolean(activeClientId),
  })
  const campaigns = campaignsData ?? []

  const { data: productionsData } = useQuery({
    ...contentProductionQueries.listByClient(activeClientId),
    enabled: Boolean(activeClientId),
  })
  const productions = productionsData ?? []

  const { data: budgetsData } = useQuery({
    ...erpQueries.listBudgetsByClient(activeClientId),
    enabled: Boolean(activeClientId),
  })
  const budgets = budgetsData ?? []

  const { data: expensesData } = useQuery({
    ...erpQueries.listExpensesByClient(activeClientId),
    enabled: Boolean(activeClientId),
  })
  const expenses = expensesData ?? []

  const { data: adSpendData } = useQuery({
    ...erpQueries.listAdSpendByClient(activeClientId),
    enabled: Boolean(activeClientId),
  })
  const adSpend = adSpendData ?? []

  const { data: kolsData } = useQuery({
    ...erpQueries.listKOLsByClient(activeClientId),
    enabled: Boolean(activeClientId),
  })
  const kols = kolsData ?? []

  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign()
  const updateProduction = useUpdateContentProduction()
  const createProduction = useCreateContentProduction()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [detail, setDetail] = useState<Campaign | null>(null)
  const [expenseFormOpen, setExpenseFormOpen] = useState(false)
  const [adSpendFormOpen, setAdSpendFormOpen] = useState(false)
  const [newProdOpen, setNewProdOpen] = useState(false)
  const [newProdTitle, setNewProdTitle] = useState("")
  const [newProdPlatform, setNewProdPlatform] = useState("instagram")
  const [newProdAssignee, setNewProdAssignee] = useState("")
  const [newProdDue, setNewProdDue] = useState("")

  // Deep-link `?new=1` (mis. dari tombol "Create Campaign" di header global):
  // buka modal create sekali saat param muncul, lalu bersihkan agar refresh
  // berikutnya tidak membuka modal lagi.
  const [newParam, setNewParam] = useQueryState("new", parseAsString)
  React.useEffect(() => {
    if (newParam === "1") {
      setEditing(null)
      setModalOpen(true)
      void setNewParam(null)
    }
  }, [newParam, setNewParam])

  /* ---------------- Campaign filtering & factual tab counts ---------------- */
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return campaigns.filter((c) => {
      if (c.client_id !== activeClientId) return false
      if (tab !== "all" && statusToTab(getCampaignStatus(c)) !== tab) return false
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !(c.notes ?? "").toLowerCase().includes(q)
      )
        return false
      return true
    })
  }, [campaigns, activeClientId, query, tab])

  const tabCounts = useMemo(() => {
    const counts: Record<CampaignTab, number> = {
      all: campaigns.length,
      active: 0,
      review: 0,
      completed: 0,
      draft: 0,
    }
    for (const c of campaigns) counts[statusToTab(getCampaignStatus(c))] += 1
    return counts
  }, [campaigns])

  /* ---------------- Budget (factual from client_budgets + expenses) ---------------- */
  const budget = useMemo(() => {
    if (!budgets.length) return null
    const now = new Date()
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    return budgets.find((b) => (b.month ?? "").startsWith(ym)) ?? budgets[0]
  }, [budgets])

  const budgetStats = useMemo(() => {
    const total = Number(budget?.total_budget) || 0
    const remaining = Number(budget?.remaining_balance) || 0
    const spent = Math.max(0, total - remaining)
    const pct = total > 0 ? (spent / total) * 100 : 0
    return { total, remaining, spent, pct }
  }, [budget])

  /* ---------------- Ad spend KPIs (factual from ad_spend_logs) ---------------- */
  const adStats = useMemo(() => {
    let spend = 0
    let clicks = 0
    for (const a of adSpend) {
      spend += Number(a.spend) || 0
      clicks += Number(a.clicks) || 0
    }
    const cpc = clicks > 0 ? spend / clicks : 0
    return { spend, clicks, cpc }
  }, [adSpend])

  /* ---------------- Expense breakdown by real category ---------------- */
  const categorySplit = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of expenses) {
      const cat = (e.category ?? "").trim() || "Uncategorized"
      map.set(cat, (map.get(cat) ?? 0) + (Number(e.amount) || 0))
    }
    const total = [...map.values()].reduce((a, b) => a + b, 0)
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, amount], i) => ({
        name,
        amount,
        pct: total > 0 ? (amount / total) * 100 : 0,
        color: PALETTE[i % PALETTE.length],
      }))
  }, [expenses])

  /* ---------------- Featured campaign (first active, else first) ---------------- */
  const featured = useMemo(() => {
    const active = campaigns.filter((c) => getCampaignStatus(c) === "active")
    return active[0] ?? campaigns[0] ?? null
  }, [campaigns])

  const featuredFlight = useMemo(() => flightProgress(featured), [featured])

  const activeCampaignNames = useMemo(
    () =>
      campaigns
        .filter((c) => getCampaignStatus(c) === "active")
        .map((c) => c.name)
        .slice(0, 4),
    [campaigns]
  )

  function openCreate() {
    setEditing(null)
    withViewTransition(() => setModalOpen(true))
  }
  function openEdit(c: Campaign) {
    setEditing(c)
    withViewTransition(() => setModalOpen(true))
  }
  async function handleSave(c: Campaign) {
    try {
      if (editing) {
        await updateCampaign.mutateAsync({
          id: c.id,
          patch: {
            client_id: c.client_id,
            name: c.name,
            type: c.type,
            start_date: c.start_date,
            end_date: c.end_date,
            color: c.color,
            notes: c.notes ?? "",
          },
        })
        toast.success("Campaign updated")
      } else {
        await createCampaign.mutateAsync({
          client_id: c.client_id,
          name: c.name,
          type: c.type,
          start_date: c.start_date,
          end_date: c.end_date,
          color: c.color,
          notes: c.notes ?? "",
        })
        toast.success("Campaign launched")
      }
    } catch (err) {
      toast.error("Failed to save campaign", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  async function approveProduction(d: ContentProduction) {
    try {
      await updateProduction.mutateAsync({ id: d.id, patch: { stage: "ready" } })
      toast.success("Deliverable approved")
    } catch (err) {
      toast.error("Failed to approve deliverable", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  return (
    <PageContainer
      pageTitle="Campaigns Orchestration"
      pageDescription={`Manage multi-channel brand campaigns, creator partnerships, deliverable flighting schedules, and cross-platform ROI telemetry for ${activeClient.name}.`}
      pageHeaderAction={
        <div className="flex flex-wrap items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="admin-pill admin-pill-ghost flex items-center gap-2 border cursor-pointer">
                <Icons.listChecks className="size-4" />
                Filter Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuRadioGroup value={tab} onValueChange={(value) => setTab(value as CampaignTab)}>
                {CAMPAIGN_TABS.map((t) => (
                  <DropdownMenuRadioItem key={t} value={t} className="cursor-pointer">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <span
            aria-disabled="true"
            className="admin-pill admin-pill-ghost flex items-center gap-2 border opacity-60"
          >
            <Icons.download className="size-4" />
            Export Campaign Deck (Coming soon)
          </span>
          <Button
            type="button"
            onClick={openCreate}
            className="admin-pill admin-pill-primary flex items-center gap-2 shadow-md cursor-pointer border-0"
          >
            <Icons.rocket className="size-4 text-[hsl(var(--admin-lime))]" />
            Launch Campaign
          </Button>
        </div>
      }
      className="space-y-8"
    >

      {/* Segmented Navigation Filters */}
      <div className="flex items-center justify-between overflow-x-auto pb-1 gap-4">
        <Tabs value={tab} onValueChange={(val) => setTab(val as CampaignTab)}>
          <TabsList
            className="flex items-center gap-1 p-1 bg-secondary/30 rounded-full border border-border/20 h-auto"
            highlightClassName="bg-card text-foreground shadow-sm rounded-full"
          >
            {(
              [
                ["all", "All Campaigns", tabCounts.all],
                ["active", "Active & Flighting", tabCounts.active],
                ["review", "Upcoming", tabCounts.review],
                ["completed", "Completed", tabCounts.completed],
                ["draft", "Draft", tabCounts.draft],
              ] as const
            ).map(([key, label, count]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="px-4 py-1.5 min-h-11 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap data-[state=active]:text-foreground text-muted-foreground hover:text-foreground"
              >
                {key === "active" && <span className="w-2 h-2 rounded-full bg-[hsl(var(--admin-lime))]" />}
                <span>{label}</span>
                <span className="opacity-75 font-mono text-2xs">(<MetricTicker value={count} />)</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="hidden sm:flex items-center gap-2 text-muted-foreground text-xs">
          <span>
            <MetricTicker value={filtered.length} /> of <MetricTicker value={campaigns.length} /> campaigns shown
          </span>
        </div>
      </div>

      {/* 4-Grid Top Telemetry KPI Cards (factual) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        {/* KPI 1 — Active campaigns */}
        <div className="p-5 admin-card admin-card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="admin-section-label">Active Campaigns &amp; Flights</span>
            <span className="admin-badge admin-badge-lime"><MetricTicker value={tabCounts.active} /> Live</span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground flex items-center gap-1.5">
              <MetricTicker value={tabCounts.active} /> Live
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {activeCampaignNames.length ? activeCampaignNames.join(", ") : "No active flights"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[hsl(var(--admin-cobalt))] text-xs font-semibold pt-2 border-t border-border/20">
            <Icons.activity className="size-4" />
            <span><MetricTicker value={campaigns.length} /> total campaigns tracked</span>
          </div>
        </div>

        {/* KPI 2 — Allocated budget */}
        <div className="p-5 admin-card admin-card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="admin-section-label">Allocated Campaign Budget</span>
            <span className="text-2xs text-foreground font-bold">
              <MetricTicker value={`${budgetStats.pct.toFixed(1)}%`} />
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
                {formatCurrency(budgetStats.spent)}
              </span>
              <span className="text-sm text-muted-foreground">
                / {formatCurrency(budgetStats.total)}
              </span>
            </div>
            <div className="w-full bg-muted h-2.5 rounded-full mt-3 overflow-hidden p-0.5 border border-border/30">
              <div
                className="bg-[hsl(var(--admin-lime))] h-full rounded-full"
                style={{ width: `${Math.min(100, budgetStats.pct)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-muted-foreground text-xs pt-2 border-t border-border/20">
            <span>{formatCurrency(budgetStats.remaining)} remaining</span>
            <span className="text-foreground font-medium">
              {budget ? formatMonth(budget.month) : "No budget set"}
            </span>
          </div>
        </div>

        {/* KPI 3 — Ad spend invested */}
        <div className="p-5 admin-card admin-card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="admin-section-label">Ad Spend Invested</span>
            <span className="admin-badge admin-badge-cobalt"><MetricTicker value={adSpend.length} /> logs</span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
              {formatCurrency(adStats.spend)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Icons.activity className="size-4 text-[hsl(var(--admin-cobalt))]" />
              <span>{formatCompact(adStats.clicks)} tracked clicks</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-foreground text-xs pt-2 border-t border-border/20">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--admin-cobalt))]" />
            <span>Cross-Network Flight Aggregation</span>
          </div>
        </div>

        {/* KPI 4 — Blended CPC */}
        <div className="p-5 admin-card admin-card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="admin-section-label">Blended Cost / Click</span>
            <span className="admin-badge admin-badge-surface">
              {adStats.cpc > 0 && adStats.cpc < 1 ? "EFFICIENT" : "BASELINE"}
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
              {adStats.cpc > 0 ? <MetricTicker value={`$${adStats.cpc.toFixed(2)}`} /> : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {adStats.clicks > 0 ? "Derived from real ad spend logs" : "No ad spend recorded"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[hsl(var(--warning))] text-xs font-semibold pt-2 border-t border-border/20">
            <Icons.chartBar className="size-4" />
            <span>Spend ÷ Clicks across logged campaigns</span>
          </div>
        </div>
      </div>

      {/* Master Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT/CENTER COLUMN (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* 1. Featured Active Campaign Spotlight */}
          <section
            className="admin-card p-6 lg:p-8 relative overflow-hidden"
            style={
              {
                viewTransitionName: detail
                  ? undefined
                  : featured
                    ? campaignTransitionName(featured.id)
                    : undefined,
              } as React.CSSProperties
            }
          >
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-[hsl(var(--admin-lime)/0.1)] rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              {featured ? (
                <>
                  {/* Top Badge & Channel Stack */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="admin-badge admin-badge-lime">
                        <span className="w-2 h-2 rounded-full bg-[hsl(var(--admin-lime-ink))]" />
                        {featuredFlight
                          ? `FLIGHTING • DAY ${featuredFlight.day} OF ${featuredFlight.totalDays}`
                          : "EVERGREEN • NO FIXED FLIGHT"}
                      </span>
                      <span className="admin-badge admin-badge-cobalt">
                        {STATUS_META[getCampaignStatus(featured)].label.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="admin-chip">
                        <Icons.calendar className="size-4" />
                        {formatDate(featured.start_date)} → {formatDate(featured.end_date)}
                      </span>
                    </div>
                  </div>

                  {/* Spotlight Hero Content */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-8">
                      <h2 className="text-2xl font-bold font-sans text-foreground tracking-tight">
                        {featured.name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {featured.notes?.trim() ||
                          "No objectives captured yet for this campaign. Add notes from the campaign editor to document target audience, key messages, and flight goals."}
                      </p>
                      <div className="flex items-center gap-3 mt-6">
                        <span className="admin-section-label">Assigned Talent:</span>
                        {kols.length ? (
                          <>
                            <div className="flex items-center -space-x-2">
                              {kols.slice(0, 3).map((k) => (
                                <div
                                  key={k.id}
                                  className="w-8 h-8 rounded-full border-2 border-background bg-muted"
                                />
                              ))}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-foreground font-medium">
                              <span>{kols.slice(0, 2).map((k) => k.name).join(", ")}</span>
                              {kols.length > 2 && (
                                <span className="text-muted-foreground">+{kols.length - 2}</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No talent contracted
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Flight Progress Micro-Card */}
                    <div className="md:col-span-4 p-4 rounded-2xl bg-muted/40 border border-border/50">
                      <span className="admin-section-label">Budget Spent (current cycle)</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-bold font-mono text-foreground">
                          {formatCurrency(budgetStats.spent)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / {formatCurrency(budgetStats.total)}
                        </span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full mt-2.5 overflow-hidden border border-border/30">
                        <div
                          className="bg-[hsl(var(--admin-lime))] h-full rounded-full"
                          style={{ width: `${Math.min(100, budgetStats.pct)}%` }}
                        />
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/40 flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Ad Spend Logged</span>
                        <span className="text-foreground font-bold">
                          {formatCurrency(adStats.spend)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Spotlight Metrics Strip */}
                  <div className="grid grid-cols-3 gap-3 mt-6 p-4 rounded-2xl bg-card/60 border border-border/40">
                    <div>
                      <span className="admin-section-label block">Flight Progress</span>
                      <div className="text-lg font-bold font-mono text-foreground mt-0.5">
                        {featuredFlight ? `${featuredFlight.pct.toFixed(0)}%` : "Evergreen"}
                      </div>
                      <span className="text-1xs text-[hsl(var(--admin-lime-ink))] font-bold">
                        {featuredFlight ? "elapsed" : "no fixed window"}
                      </span>
                    </div>
                    <div>
                      <span className="admin-section-label block">Tracked Clicks</span>
                      <div className="text-lg font-bold font-mono text-foreground mt-0.5">
                        {formatCompact(adStats.clicks)}
                      </div>
                      <span className="text-1xs text-[hsl(var(--admin-cobalt))] font-bold">
                        from {adSpend.length} logs
                      </span>
                    </div>
                    <div>
                      <span className="admin-section-label block">Deliverables</span>
                      <div className="text-lg font-bold font-mono text-foreground mt-0.5">
                        {productions.length}
                      </div>
                      <span className="text-1xs text-[hsl(var(--warning))] font-bold">
                        {productions.filter((p) => p.stage === "ready").length} approved
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                    <Icons.campaign className="size-7" />
                  </div>
                  <h2 className="text-lg font-bold font-sans text-foreground">
                    No campaigns yet
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Launch the first campaign for {activeClient.name} to track flighting, budget,
                    deliverables, and talent in one place.
                  </p>
                  <Button onClick={openCreate} className="admin-pill admin-pill-primary mt-1">
                    <Icons.rocket className="size-4 text-[hsl(var(--admin-lime))]" />
                    Launch Campaign
                  </Button>
                </div>
              )}

              {/* Quick Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-border/30">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() =>
                      withViewTransition(() => setDetail(featured))
                    }
                    disabled={!featured}
                    className="admin-pill admin-pill-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Manage Deliverables
                  </Button>
                  <span
                    aria-disabled="true"
                    title="Creative assets live in the Media Library."
                    className="admin-pill admin-pill-ghost border border-border/50 opacity-60"
                  >
                    View Creative Assets (Coming soon)
                  </span>
                </div>
                <span
                  aria-disabled="true"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-muted-foreground bg-muted/50 text-xs font-semibold border border-border opacity-60"
                >
                  <Icons.play className="size-4" />
                  <span>Pause Flight (Coming soon)</span>
                </span>
              </div>
            </div>
          </section>

          {/* 2. Campaign Deliverables Pipeline (factual: content_productions) */}
          <section className="admin-card p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold font-sans text-foreground">
                  Deliverables Pipeline
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Production tracking, milestone gates, and creator approval flights.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewProdOpen(true)}
                  className="h-9 text-xs rounded-full border-border/50 gap-1.5 cursor-pointer"
                >
                  <Icons.add className="size-3.5" /> New Deliverable
                </Button>
                <Tabs value={viewMode} onValueChange={(val) => setViewMode(val as "list" | "gantt")}>
                  <TabsList
                    className="flex items-center p-1 bg-secondary/30 rounded-full border border-border/20 h-auto"
                    highlightClassName="bg-card text-foreground shadow-sm rounded-full"
                  >
                    <TabsTrigger
                      value="list"
                      className="px-4 py-1.5 min-h-11 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer data-[state=active]:text-foreground text-muted-foreground hover:text-foreground"
                    >
                      <Icons.listChecks className="size-4" />
                      <span>Deliverables List</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="gantt"
                      className="px-4 py-1.5 min-h-11 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer data-[state=active]:text-foreground text-muted-foreground hover:text-foreground"
                    >
                      <Icons.calendar className="size-4" />
                      <span>Gantt Timeline</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Deliverable rows */}
            {productions.length ? (
              viewMode === "gantt" ? (
                <GanttTimeline productions={productions} platformMeta={platformMeta} />
              ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
                }}
                className="space-y-3"
              >
                {productions.slice(0, 8).map((d) => {
                  const pm = platformMeta(d.platform)
                  const sm = STAGE_META[d.stage] ?? STAGE_META.idea
                  return (
                    <motion.div
                      key={d.id}
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } },
                      }}
                      className="p-4 rounded-2xl bg-card/60 border border-border/40 hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                            pm.iconBg
                          )}
                        >
                          {React.createElement(pm.icon, { className: "size-6" })}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-foreground">{d.title}</h4>
                            <span className={cn("admin-badge", pm.badge)}>{pm.label}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                            <span>
                              Assignee:{" "}
                              <strong className="text-foreground font-medium">
                                {d.assignee?.trim() || "Unassigned"}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Due:{" "}
                              <strong className="text-foreground font-medium">
                                {formatDate(d.due_date)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span className="text-foreground font-medium">
                              {d.assets?.length
                                ? `${d.assets.length} asset${d.assets.length > 1 ? "s" : ""}`
                                : "No assets"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-border/20">
                        <span className={cn("admin-badge", sm.badge)}>
                          {d.stage === "ready" && (
                            <Icons.circleCheck className="size-3.5 text-[hsl(var(--success))]" />
                          )}
                          {sm.label}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Salin detail deliverable ${d.title}`}
                            onClick={() => {
                              const summary = [
                                `Deliverable: ${d.title}`,
                                `Platform: ${pm.label}`,
                                `Stage: ${sm.label}`,
                                `Assignee: ${d.assignee?.trim() || "Unassigned"}`,
                                `Due: ${formatDate(d.due_date)}`,
                                `Assets: ${d.assets?.length ?? 0}`,
                              ].join("\n")
                              void navigator.clipboard
                                ?.writeText(summary)
                                .then(() => toast.success("Detail deliverable disalin ke clipboard."))
                                .catch(() => toast.error("Gagal menyalin detail deliverable."))
                            }}
                            className="p-2 rounded-full hover:bg-muted text-foreground transition-colors cursor-pointer"
                          >
                            <Icons.search className="size-5" />
                          </Button>
                          {d.stage === "review" && (
                            <Button
                              onClick={() => approveProduction(d)}
                              isLoading={updateProduction.isPending}
                              className="admin-pill admin-pill-primary text-2xs px-3 py-1.5 min-w-0"
                            >
                              Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10 gap-2 rounded-2xl border border-dashed border-border/50">
                <Icons.listChecks className="size-6 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">No deliverables in production</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Production cards created in the content pipeline will appear here with their
                  real stage, assignee, and due date.
                </p>
              </div>
            )}

            {/* Pipeline Footer */}
            <div className="flex items-center justify-between pt-5 mt-4 border-t border-border/20 text-xs text-muted-foreground">
              <span>
                Showing {Math.min(productions.length, 8)} of {productions.length} deliverable items
              </span>
            </div>
          </section>

          {/* New Deliverable Inline Form */}
          {newProdOpen && (
            <section className="admin-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-foreground">Tambah Deliverable Baru</h3>
                <Button type="button" variant="ghost" size="icon" onClick={() => setNewProdOpen(false)} className="cursor-pointer">
                  <Icons.close className="size-4" />
                </Button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!newProdTitle.trim()) return
                  createProduction.mutate(
                    {
                      client_id: activeClientId,
                      title: newProdTitle.trim(),
                      platform: newProdPlatform,
                      stage: "idea",
                      priority: "normal",
                      assignee: newProdAssignee.trim() || null,
                      due_date: newProdDue ? new Date(newProdDue).toISOString() : null,
                      assets: [],
                      notes: null,
                    },
                    {
                      onSuccess: () => {
                        setNewProdOpen(false)
                        setNewProdTitle("")
                        setNewProdPlatform("instagram")
                        setNewProdAssignee("")
                        setNewProdDue("")
                      },
                    }
                  )
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="np-title" className="text-xs font-semibold text-foreground">
                      Judul Deliverable
                    </label>
                    <Input
                      id="np-title"
                      value={newProdTitle}
                      onChange={(e) => setNewProdTitle(e.target.value)}
                      placeholder="Contoh: IG Reels - Promo Q4"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="np-platform" className="text-xs font-semibold text-foreground">
                      Platform
                    </label>
                    <select
                      id="np-platform"
                      value={newProdPlatform}
                      onChange={(e) => setNewProdPlatform(e.target.value)}
                      className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="tiktok">TikTok</option>
                      <option value="youtube">YouTube</option>
                      <option value="linkedin">LinkedIn</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="np-assignee" className="text-xs font-semibold text-foreground">
                      Assignee
                    </label>
                    <Input
                      id="np-assignee"
                      value={newProdAssignee}
                      onChange={(e) => setNewProdAssignee(e.target.value)}
                      placeholder="Nama kreator/tim"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="np-due" className="text-xs font-semibold text-foreground">
                      Due Date
                    </label>
                    <Input
                      id="np-due"
                      type="date"
                      value={newProdDue}
                      onChange={(e) => setNewProdDue(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setNewProdOpen(false)} className="cursor-pointer">
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={createProduction.isPending}
                    className="admin-pill admin-pill-primary cursor-pointer"
                  >
                    {createProduction.isPending ? (
                      <Icons.spinner className="size-4 animate-spin mr-2" />
                    ) : (
                      <Icons.add className="size-4 mr-2" />
                    )}
                    Simpan Deliverable
                  </Button>
                </div>
              </form>
            </section>
          )}
        </div>

        {/* RIGHT RAIL (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Client Campaign Switcher & Budget Breakdown */}
          <div className="admin-card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="admin-section-label">Ad Spend Invested</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdSpendFormOpen((v) => !v)}
                className="h-7 text-xs rounded-lg border-border/50 gap-1.5 cursor-pointer"
              >
                <Icons.add className="size-3" /> Log Spend
              </Button>
            </div>

            {adSpendFormOpen && (
              <div className="mb-4">
                <AddAdSpendLogForm
                  clientId={activeClientId}
                  onSuccess={() => setAdSpendFormOpen(false)}
                />
              </div>
            )}
            <span className="admin-badge admin-badge-cobalt">
              <MetricTicker value={adSpend.length} /> logs
            </span>
            {/* Segmented Client Selector Pills */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-secondary/30 rounded-full border border-border/20 mb-6">
              {clients.map((c) => (
                <Button
                  key={c.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setClientId(c.id)}
                  className={cn(
                    "py-1.5 px-2 rounded-full text-2xs font-bold transition-colors truncate cursor-pointer h-auto",
                    activeClientId === c.id
                      ? "bg-card text-foreground shadow-sm hover:bg-card"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c.name}
                </Button>
              ))}
            </div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-lg font-bold font-sans text-foreground">
                  Budget Allocation by Category
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {budget ? `Recorded expenses for ${formatMonth(budget.month)}.` : "No budget set for the current cycle."}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExpenseFormOpen((v) => !v)}
                className="shrink-0 h-8 text-xs rounded-xl border-border/50 gap-1.5 cursor-pointer"
              >
                <Icons.add className="size-3.5" />
                Catat Expense
              </Button>
            </div>

            {expenseFormOpen && (
              <div className="mt-4">
                <CreateExpenseForm
                  clientId={activeClientId}
                  budgetId={budget?.id ?? null}
                  onSuccess={() => setExpenseFormOpen(false)}
                />
              </div>
            )}

            {/* Progress Stack Breakdown */}
            {categorySplit.length ? (
              <>
                <div className="w-full h-3.5 rounded-full bg-muted flex overflow-hidden mt-5 p-0.5 gap-0.5 border border-border/30">
                  {categorySplit.map((b, i) => (
                    <div
                      key={b.name}
                      className={cn(
                        "h-full",
                        b.color,
                        i === 0 && "rounded-l-full",
                        i === categorySplit.length - 1 && "rounded-r-full"
                      )}
                      style={{ width: `${b.pct}%` }}
                      title={`${b.name} ${b.pct.toFixed(0)}%`}
                    />
                  ))}
                </div>
                {/* Category Legend Cards */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                  {categorySplit.map((b) => (
                    <div
                      key={b.name}
                      className="p-2.5 rounded-xl bg-card/60 border border-border/40 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", b.color)} />
                        <span className="text-xs text-foreground font-medium truncate">
                          {b.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {b.pct.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-border/50 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  No expenses recorded for this client yet.
                </p>
              </div>
            )}
          </div>

          {/* 2. Creator & Talent Roster (factual: kols) */}
          <div className="admin-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold font-sans text-foreground">
                  Creator &amp; Talent Roster
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Contracted partners for {activeClient.name}.
                </p>
              </div>
              <span className="admin-badge admin-badge-lime">{kols.length} ACTIVE</span>
            </div>
            {kols.length ? (
              <div className="space-y-3.5 mt-4">
                {kols.map((cr) => {
                  const metaParts = [
                    cr.niche?.trim(),
                    cr.platforms?.length ? cr.platforms.join(" • ") : null,
                    cr.rate_card ? `${formatCurrency(Number(cr.rate_card))} rate` : null,
                  ].filter(Boolean) as string[]
                  return (
                    <div
                      key={cr.id}
                      className="p-3 rounded-2xl bg-card/60 border border-border/40 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-muted ring-2 ring-[hsl(var(--admin-cobalt)/50)] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-foreground truncate">
                            {cr.name}
                          </div>
                          <div className="text-1xs text-muted-foreground truncate">
                            {metaParts.length ? metaParts.join(" • ") : "No details"}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Hubungi kreator ${cr.name}`}
                        title={cr.contact_info?.trim() || "Kontak belum tersedia"}
                        onClick={() => {
                          const contact = cr.contact_info?.trim()
                          if (contact) {
                            void navigator.clipboard
                              ?.writeText(contact)
                              .then(() => toast.success(`Kontak ${cr.name} disalin.`, { description: contact }))
                              .catch(() => toast.error("Gagal menyalin kontak kreator."))
                          } else {
                            toast.info(`${cr.name} belum punya kontak tersimpan.`, {
                              description: "Lengkapi Contact Info di modul ERP → KOLs.",
                            })
                          }
                        }}
                        className="size-8 rounded-full hover:bg-muted text-foreground transition-colors cursor-pointer shrink-0"
                      >
                        <Icons.send className="size-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-border/50 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  No creators or talent contracted for this client.
                </p>
              </div>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={() => toast.info("Modul Kontrak Talent/KOL dibuka.", { description: "Gunakan menu ERP -> KOLs untuk manajemen penuh." })}
              className="w-full mt-4 rounded-full text-xs font-semibold"
            >
               + Contract Additional Talent
             </Button>
          </div>

          {/* 3. AI Campaign Assistant Hook Generator */}
          <div className="admin-card bg-foreground text-background p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[hsl(var(--admin-lime)/0.2)] rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="admin-badge bg-background text-foreground">FRHM AI V3.4</span>
                <Icons.bot className="size-5 text-[hsl(var(--admin-lime))]" />
              </div>
              <h4 className="text-lg font-bold font-sans text-background">Need Campaign Angles?</h4>
              <p className="text-xs text-background/80 mt-1 leading-relaxed">
                Synthesize viral TikTok hooks, B2B carousel narratives, and cross-channel flight
                variants tuned to {activeClient.name}&apos;s ideal customer persona.
              </p>
              <div className="mt-4 p-1.5 rounded-full bg-background/10 border border-background/20 flex items-center justify-between">
                <span className="text-xs text-background/70 pl-3 truncate">
                  &quot;Spatial UX for enterprise CFOs...&quot;
                </span>
                <Button
                  type="button"
                  size="icon"
                  aria-label="Buka AI Hook Generator"
                  onClick={() => setAiHookOpen(true)}
                  className="w-9 h-9 rounded-full bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-ink))] flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-pointer hover:opacity-90"
                >
                  <Icons.arrowRight className="size-4 -rotate-90" />
                </Button>
              </div>
              <span
                aria-disabled="true"
                className="w-full mt-4 py-3 rounded-full bg-muted/50 text-muted-foreground text-xs font-semibold text-center border border-border opacity-60"
              >
                Generate Creative Angles (Coming soon)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Footer */}
      <footer className="pt-6 pb-4 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="font-bold text-foreground">FRHM © 2026.</span>
          <span>All rights reserved. Creative Media Operations Platform.</span>
        </div>
        <div className="flex items-center gap-1.5 text-foreground font-medium">
          <span className="w-2 h-2 rounded-full bg-[hsl(var(--admin-lime))]" />
          <span>System Status</span>
        </div>
      </footer>

      <CampaignModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
      <CampaignDetailModal
        campaign={detail}
        client={activeClient}
        open={detail !== null}
        onClose={() => setDetail(null)}
        onEdit={openEdit}
      />
      <StitchAiHookModal
        open={aiHookOpen}
        onOpenChange={setAiHookOpen}
        clientName={activeClient.name}
        clientId={activeClientId}
      />
    </PageContainer>
  )
}
