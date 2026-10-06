"use client"

import React, { useMemo, useState } from "react"
import { useQueryState, parseAsStringEnum, parseAsString, debounce } from "nuqs"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import {
  campaignQueries,
  useCreateCampaign,
  useUpdateCampaign,
} from "@/features/campaigns/api/queries"
import { contentProductionQueries, useUpdateContentProduction } from "@/features/content-production/api/queries"
import { erpQueries } from "@/features/erp/api/queries"
import type { Campaign } from "@/features/campaigns/api/types"
import type { ContentProduction, ContentStage } from "@/features/content-production/api/types"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { CampaignModal } from "./campaign-modal"
import { CampaignDetailModal } from "./campaign-detail-modal"

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
  upcoming: { label: "Upcoming", badge: "bg-blue-500/10 text-blue-600" },
  completed: { label: "Completed", badge: "bg-emerald-500/10 text-emerald-600" },
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
    icon: Icons.playCircle,
    badge: "bg-pink-500/10 text-pink-600",
    iconBg: "bg-pink-500/10 text-pink-600",
  },
  "ig reels": {
    label: "IG Reels",
    icon: Icons.playCircle,
    badge: "bg-pink-500/10 text-pink-600",
    iconBg: "bg-pink-500/10 text-pink-600",
  },
  tiktok: {
    label: "TikTok",
    icon: Icons.bolt,
    badge: "bg-muted text-foreground",
    iconBg: "bg-brand-accent/10 text-brand-accent",
  },
  youtube: {
    label: "YouTube",
    icon: Icons.video,
    badge: "bg-red-500/10 text-red-600",
    iconBg: "bg-red-500/10 text-red-600",
  },
  linkedin: {
    label: "LinkedIn",
    icon: Icons.bookOpen,
    badge: "bg-blue-500/10 text-blue-600",
    iconBg: "bg-blue-500/10 text-blue-600",
  },
  facebook: {
    label: "Facebook",
    icon: Icons.video,
    badge: "bg-blue-500/10 text-blue-600",
    iconBg: "bg-blue-500/10 text-blue-600",
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

const STAGE_META: Record<ContentStage, { label: string; badge: string }> = {
  idea: { label: "Idea", badge: "bg-muted text-muted-foreground" },
  script: { label: "Scripting", badge: "bg-violet-500/10 text-violet-600" },
  shooting: { label: "Shooting", badge: "bg-orange-500/10 text-orange-600" },
  editing: { label: "Editing", badge: "bg-blue-500/10 text-blue-600" },
  design: { label: "Design", badge: "bg-blue-500/10 text-blue-600" },
  caption: { label: "Captioning", badge: "bg-brand-accent/10 text-brand-accent" },
  review: { label: "Ready for Review", badge: "bg-brand-accent/10 text-brand-accent" },
  ready: { label: "Approved", badge: "bg-emerald-500/10 text-emerald-600" },
}

const PALETTE = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-amber-500",
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

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [detail, setDetail] = useState<Campaign | null>(null)

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
    setModalOpen(true)
  }
  function openEdit(c: Campaign) {
    setEditing(c)
    setModalOpen(true)
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
    <div className="space-y-8">
      {/* Header Banner & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="admin-badge admin-badge-cobalt">CAMPAIGN CONTROL</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground font-medium">
              {activeClient.name} Workspace
            </span>
          </div>
          <h1 className="text-3xl font-extrabold font-syne tracking-tight text-foreground">
            Campaigns Orchestration
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            Manage multi-channel brand campaigns, creator partnerships, deliverable flighting
            schedules, and cross-platform ROI telemetry.
          </p>
        </div>
        {/* Top Level Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button className="admin-pill admin-pill-ghost flex items-center gap-2 border">
            <Icons.listChecks className="size-4" />
            Filter Status
          </button>
          <button
            onClick={() => toast.success("Campaign deck exported (Coming Soon)")}
            className="admin-pill admin-pill-ghost flex items-center gap-2 border"
          >
            <Icons.download className="size-4" />
            Export Campaign Deck
          </button>
          <button
            onClick={openCreate}
            className="admin-pill admin-pill-primary flex items-center gap-2 shadow-md"
          >
            <Icons.rocket className="size-4 text-lime-300" />
            Launch Campaign
          </button>
        </div>
      </div>

      {/* Segmented Navigation Filters */}
      <div className="flex items-center justify-between overflow-x-auto pb-1 gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-secondary/30 rounded-full border border-border/20">
          {(
            [
              ["all", `All Campaigns (${tabCounts.all})`],
              ["active", `Active & Flighting (${tabCounts.active})`],
              ["review", `Upcoming (${tabCounts.review})`],
              ["completed", `Completed (${tabCounts.completed})`],
              ["draft", `Draft (${tabCounts.draft})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                tab === key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              )}
            >
              {key === "active" && <span className="w-2 h-2 rounded-full bg-lime-400" />}
              {label}
            </button>
          ))}
        </div>
        <div className="hidden sm:flex items-center gap-2 text-muted-foreground text-xs">
          <span>
            {filtered.length} of {campaigns.length} campaigns shown
          </span>
        </div>
      </div>

      {/* 4-Grid Top Telemetry KPI Cards (factual) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        {/* KPI 1 — Active campaigns */}
        <div className="p-5 admin-card admin-card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="admin-section-label">Active Campaigns &amp; Flights</span>
            <span className="admin-badge admin-badge-lime">{tabCounts.active} Live</span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-extrabold font-syne tracking-tight text-foreground">
              {tabCounts.active} Live
            </div>
            <p className="text-[12px] text-muted-foreground mt-1 line-clamp-1">
              {activeCampaignNames.length ? activeCampaignNames.join(", ") : "No active flights"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold pt-2 border-t border-border/20">
            <Icons.activity className="size-4" />
            <span>{campaigns.length} total campaigns tracked</span>
          </div>
        </div>

        {/* KPI 2 — Allocated budget */}
        <div className="p-5 admin-card admin-card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="admin-section-label">Allocated Campaign Budget</span>
            <span className="text-[10px] text-foreground font-bold">
              {budgetStats.pct.toFixed(1)}%
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-syne tracking-tight text-foreground">
                {formatCurrency(budgetStats.spent)}
              </span>
              <span className="text-sm text-muted-foreground">
                / {formatCurrency(budgetStats.total)}
              </span>
            </div>
            <div className="w-full bg-muted h-2.5 rounded-full mt-3 overflow-hidden p-0.5 border border-border/30">
              <div
                className="bg-lime-400 h-full rounded-full"
                style={{ width: `${Math.min(100, budgetStats.pct)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-muted-foreground text-[12px] pt-2 border-t border-border/20">
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
            <span className="admin-badge admin-badge-cobalt">{adSpend.length} logs</span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-extrabold font-syne tracking-tight text-foreground">
              {formatCurrency(adStats.spend)}
            </div>
            <p className="text-[12px] text-muted-foreground mt-1 flex items-center gap-1">
              <Icons.activity className="size-4 text-blue-500" />
              <span>{formatCompact(adStats.clicks)} tracked clicks</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-foreground text-xs pt-2 border-t border-border/20">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
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
            <div className="text-2xl font-extrabold font-syne tracking-tight text-foreground">
              {adStats.cpc > 0 ? `$${adStats.cpc.toFixed(2)}` : "—"}
            </div>
            <p className="text-[12px] text-muted-foreground mt-1">
              {adStats.clicks > 0 ? "Derived from real ad spend logs" : "No ad spend recorded"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-orange-500 text-xs font-semibold pt-2 border-t border-border/20">
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
          <section className="admin-card p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              {featured ? (
                <>
                  {/* Top Badge & Channel Stack */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="admin-badge admin-badge-lime">
                        <span className="w-2 h-2 rounded-full bg-lime-600 animate-ping" />
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
                      <h2 className="text-2xl font-extrabold font-syne text-foreground tracking-tight">
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
                                  className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-lime-400/30 to-blue-500/30"
                                />
                              ))}
                            </div>
                            <div className="flex items-center gap-1 text-[12px] text-foreground font-medium">
                              <span>{kols.slice(0, 2).map((k) => k.name).join(", ")}</span>
                              {kols.length > 2 && (
                                <span className="text-muted-foreground">+{kols.length - 2}</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-[12px] text-muted-foreground">
                            No talent contracted
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Flight Progress Micro-Card */}
                    <div className="md:col-span-4 p-4 rounded-2xl bg-muted/40 border border-border/50">
                      <span className="admin-section-label">Budget Spent (current cycle)</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-bold font-syne text-foreground">
                          {formatCurrency(budgetStats.spent)}
                        </span>
                        <span className="text-[12px] text-muted-foreground">
                          / {formatCurrency(budgetStats.total)}
                        </span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full mt-2.5 overflow-hidden border border-border/30">
                        <div
                          className="bg-lime-400 h-full rounded-full"
                          style={{ width: `${Math.min(100, budgetStats.pct)}%` }}
                        />
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/40 flex justify-between items-center text-[12px]">
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
                      <div className="text-lg font-bold font-syne text-foreground mt-0.5">
                        {featuredFlight ? `${featuredFlight.pct.toFixed(0)}%` : "Evergreen"}
                      </div>
                      <span className="text-[11px] text-lime-600 font-bold">
                        {featuredFlight ? "elapsed" : "no fixed window"}
                      </span>
                    </div>
                    <div>
                      <span className="admin-section-label block">Tracked Clicks</span>
                      <div className="text-lg font-bold font-syne text-foreground mt-0.5">
                        {formatCompact(adStats.clicks)}
                      </div>
                      <span className="text-[11px] text-blue-600 font-bold">
                        from {adSpend.length} logs
                      </span>
                    </div>
                    <div>
                      <span className="admin-section-label block">Deliverables</span>
                      <div className="text-lg font-bold font-syne text-foreground mt-0.5">
                        {productions.length}
                      </div>
                      <span className="text-[11px] text-orange-600 font-bold">
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
                  <h2 className="text-lg font-bold font-syne text-foreground">
                    No campaigns yet
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Launch the first campaign for {activeClient.name} to track flighting, budget,
                    deliverables, and talent in one place.
                  </p>
                  <button onClick={openCreate} className="admin-pill admin-pill-primary mt-1">
                    <Icons.rocket className="size-4 text-lime-300" />
                    Launch Campaign
                  </button>
                </div>
              )}

              {/* Quick Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-border/30">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDetail(featured)}
                    disabled={!featured}
                    className="admin-pill admin-pill-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Manage Deliverables
                  </button>
                  <button
                    onClick={() => toast.info("Creative assets (Coming Soon)")}
                    className="admin-pill admin-pill-ghost border border-border/50"
                  >
                    View Creative Assets
                  </button>
                </div>
                <button
                  onClick={() => toast.warning("Flight paused (Coming Soon)")}
                  disabled={!featured}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-destructive hover:bg-destructive/10 transition-colors text-[11px] uppercase font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icons.play className="size-4" />
                  <span>Pause Flight</span>
                </button>
              </div>
            </div>
          </section>

          {/* 2. Campaign Deliverables Pipeline (factual: content_productions) */}
          <section className="admin-card p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-extrabold font-syne text-foreground">
                  Deliverables Pipeline
                </h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Production tracking, milestone gates, and creator approval flights.
                </p>
              </div>
              <div className="flex items-center p-1 bg-secondary/30 rounded-full border border-border/20">
                <button className="px-4 py-1.5 rounded-full bg-card text-foreground text-[10px] uppercase font-bold shadow-sm flex items-center gap-1.5 cursor-pointer">
                  <Icons.listChecks className="size-4" />
                  <span>Deliverables List</span>
                </button>
                <button className="px-4 py-1.5 rounded-full text-muted-foreground hover:text-foreground text-[10px] uppercase transition-colors flex items-center gap-1.5 cursor-pointer">
                  <Icons.calendar className="size-4" />
                  <span>Gantt Timeline</span>
                </button>
              </div>
            </div>

            {/* Deliverable rows */}
            {productions.length ? (
              <div className="space-y-3">
                {productions.slice(0, 8).map((d) => {
                  const pm = platformMeta(d.platform)
                  const sm = STAGE_META[d.stage] ?? STAGE_META.idea
                  return (
                    <div
                      key={d.id}
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
                            <h4 className="text-[16px] font-bold text-foreground">{d.title}</h4>
                            <span className={cn("admin-badge", pm.badge)}>{pm.label}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[12px] text-muted-foreground">
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
                            <Icons.circleCheck className="size-3.5 text-emerald-500" />
                          )}
                          {sm.label}
                        </span>
                        <div className="flex items-center gap-1">
                          <button className="p-2 rounded-full hover:bg-muted text-foreground transition-colors cursor-pointer">
                            <Icons.search className="size-5" />
                          </button>
                          {d.stage === "review" && (
                            <button
                              onClick={() => approveProduction(d)}
                              disabled={updateProduction.isPending}
                              className="admin-pill admin-pill-primary text-[10px] px-3 py-1.5 min-w-0 disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10 gap-2 rounded-2xl border border-dashed border-border/50">
                <Icons.listChecks className="size-6 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">No deliverables in production</p>
                <p className="text-[12px] text-muted-foreground max-w-sm">
                  Production cards created in the content pipeline will appear here with their
                  real stage, assignee, and due date.
                </p>
              </div>
            )}

            {/* Pipeline Footer */}
            <div className="flex items-center justify-between pt-5 mt-4 border-t border-border/20 text-[12px] text-muted-foreground">
              <span>
                Showing {Math.min(productions.length, 8)} of {productions.length} deliverable items
              </span>
            </div>
          </section>
        </div>

        {/* RIGHT RAIL (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Client Campaign Switcher & Budget Breakdown */}
          <div className="admin-card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="admin-section-label">Client Switcher</span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            {/* Segmented Client Selector Pills */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-secondary/30 rounded-full border border-border/20 mb-6">
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setClientId(c.id)}
                  className={cn(
                    "py-1.5 px-2 rounded-full text-[10px] font-bold transition-colors truncate cursor-pointer",
                    activeClientId === c.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <h4 className="text-lg font-bold font-syne text-foreground">
              Budget Allocation by Category
            </h4>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {budget ? `Recorded expenses for ${formatMonth(budget.month)}.` : "No budget set for the current cycle."}
            </p>
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
                        <span className="text-[12px] text-foreground font-medium truncate">
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
                <p className="text-[12px] text-muted-foreground">
                  No expenses recorded for this client yet.
                </p>
              </div>
            )}
          </div>

          {/* 2. Creator & Talent Roster (factual: kols) */}
          <div className="admin-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold font-syne text-foreground">
                  Creator &amp; Talent Roster
                </h4>
                <p className="text-[12px] text-muted-foreground mt-0.5">
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-400/30 to-blue-500/30 ring-2 ring-blue-400/50 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-foreground truncate">
                            {cr.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {metaParts.length ? metaParts.join(" • ") : "No details"}
                          </div>
                        </div>
                      </div>
                      <button className="p-2 rounded-full hover:bg-muted text-foreground transition-colors cursor-pointer shrink-0">
                        <Icons.send className="size-[18px]" />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-border/50 p-4 text-center">
                <p className="text-[12px] text-muted-foreground">
                  No creators or talent contracted for this client.
                </p>
              </div>
            )}
            <button className="w-full mt-4 py-2.5 rounded-full bg-muted/60 hover:bg-muted text-foreground text-[10px] uppercase font-bold transition-colors text-center cursor-pointer">
              + Contract Additional Talent
            </button>
          </div>

          {/* 3. AI Campaign Assistant Hook Generator */}
          <div className="admin-card bg-foreground text-background p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-lime-400/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="admin-badge bg-background text-foreground">FRHM AI V3.4</span>
                <Icons.bot className="size-5 text-lime-400" />
              </div>
              <h4 className="text-lg font-bold font-syne text-background">Need Campaign Angles?</h4>
              <p className="text-[12px] text-background/80 mt-1 leading-relaxed">
                Synthesize viral TikTok hooks, B2B carousel narratives, and cross-channel flight
                variants tuned to {activeClient.name}&apos;s ideal customer persona.
              </p>
              <div className="mt-4 p-1.5 rounded-full bg-background/10 border border-background/20 flex items-center justify-between">
                <span className="text-[12px] text-background/70 pl-3 truncate">
                  &quot;Spatial UX for enterprise CFOs...&quot;
                </span>
                <button className="w-8 h-8 rounded-full bg-lime-400 text-black flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-pointer">
                  <Icons.arrowRight className="size-4 -rotate-90" />
                </button>
              </div>
              <button
                onClick={() => toast.success("Creative angles generated (Coming Soon)")}
                className="w-full mt-4 py-3 rounded-full bg-lime-400 text-black text-[10px] uppercase font-bold tracking-wider hover:bg-lime-500 transition-all active:scale-95 shadow-sm text-center cursor-pointer"
              >
                Generate Creative Angles
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Footer */}
      <footer className="pt-6 pb-4 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="font-bold text-foreground">FRHM © 2026.</span>
          <span>All rights reserved. Creative Media Operations Platform.</span>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <a className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</a>
          <a className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</a>
          <a className="hover:text-foreground transition-colors cursor-pointer">API Documentation</a>
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            <span className="w-2 h-2 rounded-full bg-lime-400" />
            <span>System Status</span>
          </div>
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
    </div>
  )
}
