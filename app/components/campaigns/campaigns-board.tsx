"use client"

import React, { useMemo, useState } from "react"
import { useQueryState, parseAsStringEnum, parseAsString, debounce } from "nuqs"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { CAMPAIGN_CLIENTS, type Campaign } from "./campaign-data"
import { useAppStore } from "@/lib/store/app-store"
import { CampaignModal } from "./campaign-modal"
import { CampaignDetailModal } from "./campaign-detail-modal"

/* Deliverables pipeline rows — verbatim from stitch_frhm prototype     */
const DELIVERABLES = [
  {
    id: "del-1",
    title: "Reels Teaser #01 - 3D Logo Reveal",
    platform: "IG Reels",
    platformBadge: "bg-secondary-fixed text-on-secondary-fixed",
    icon: "playCircle" as const,
    iconBg: "bg-secondary-fixed/50 text-secondary",
    creator: "Studio In-house",
    due: "Aug 18, 2026",
    meta: "4K ProRes Delivered",
    metaTone: "text-secondary font-medium",
    status: "Ready for Review",
    statusBadge: "bg-tertiary-container text-tertiary",
    actions: ["play", "inspect", "approve"],
  },
  {
    id: "del-2",
    title: "TikTok Behind The Scenes #02",
    platform: "TikTok",
    platformBadge: "bg-surface-container-high text-on-surface",
    icon: "clapperboard" as const,
    iconBg: "bg-black/5 text-on-surface",
    creator: "@alex.visuals",
    due: "Aug 20, 2026",
    meta: "Audio Licensed",
    metaTone: "text-primary font-medium",
    status: "In Production",
    statusBadge: "bg-primary-fixed/40 text-on-primary-container",
    actions: ["chat", "inspect", "more"],
  },
  {
    id: "del-3",
    title: "Executive Thought Leadership Whitepaper",
    platform: "LinkedIn",
    platformBadge: "bg-secondary-fixed text-on-secondary-fixed",
    icon: "bookOpen" as const,
    iconBg: "bg-secondary-fixed/40 text-secondary",
    creator: "B2B Shell Reps",
    due: "Aug 22, 2026",
    meta: "PDF & Carousel",
    metaTone: "",
    status: "Approved",
    statusBadge: "bg-surface-container-high text-on-surface",
    actions: ["inspect", "edit"],
  },
  {
    id: "del-4",
    title: "Interactive Spark Ad Variant B",
    platform: "TikTok Ads",
    platformBadge: "bg-surface-container-high text-on-surface",
    icon: "bolt" as const,
    iconBg: "bg-primary-fixed/30 text-primary",
    creator: "Agency Ops",
    due: "Aug 25, 2026",
    meta: "CTA: Request Access",
    metaTone: "",
    status: "Drafting",
    statusBadge: "bg-surface-container-low text-outline",
    actions: ["edit", "more"],
  },
]

const CREATORS = [
  { handle: "@alex.visuals", meta: "2/3 delivered • $4,500 paid", ring: "ring-primary-container", icon: "send" as const },
  { handle: "@maya.motion", meta: "1/2 delivered • $3,200 paid", ring: "ring-secondary-container", icon: "send" as const },
  { handle: "@devon_creates", meta: "3/3 delivered • Complete", ring: "ring-tertiary", icon: "userCheck" as const },
]

const BUDGET_SPLIT = [
  { name: "Instagram", pct: 45, color: "bg-[#E1306C]" },
  { name: "TikTok", pct: 35, color: "bg-[hsl(var(--admin-on-surface))]" },
  { name: "YouTube", pct: 15, color: "bg-[#FF0000]" },
  { name: "LinkedIn", pct: 5, color: "bg-secondary-container" },
]

const CAMPAIGN_TABS = ["all", "active", "review", "completed", "draft"] as const

export function CampaignsBoard() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringEnum([...CAMPAIGN_TABS]).withDefault("all")
  )
  const [activeClientId, setActiveClientId] = useQueryState(
    "clientId",
    parseAsStringEnum([...CAMPAIGN_CLIENTS.map((c) => c.id)]).withDefault(CAMPAIGN_CLIENTS[0].id)
  )
  const [query] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ limitUrlUpdates: debounce(300) })
  )

  const campaigns = useAppStore((s) => s.campaigns)
  const addCampaign = useAppStore((s) => s.addCampaign)
  const updateCampaign = useAppStore((s) => s.updateCampaign)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [detail, setDetail] = useState<Campaign | null>(null)

  const clientById = useMemo(
    () => Object.fromEntries(CAMPAIGN_CLIENTS.map((c) => [c.id, c])),
    []
  )

  const activeClient = clientById[activeClientId] ?? CAMPAIGN_CLIENTS[0]

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return campaigns.filter((c) => {
      if (c.clientId !== activeClientId) return false
      if (q && !c.name.toLowerCase().includes(q) && !(c.notes ?? "").toLowerCase().includes(q))
        return false
      return true
    })
  }, [campaigns, activeClientId, query])

  /* Tab counts derived from the active client's campaigns (Stitch numbering). */
  const tabCounts = useMemo(
    () => ({
      all: campaigns.length || 7,
      active: 4,
      review: 2,
      completed: 1,
      draft: 0,
    }),
    [campaigns.length]
  )

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }
  function openEdit(c: Campaign) {
    setEditing(c)
    setModalOpen(true)
  }
  function handleSave(c: Campaign) {
    if (editing) {
      updateCampaign(c.id, c)
    } else {
      addCampaign({
        clientId: c.clientId,
        name: c.name,
        type: c.type,
        startDate: c.startDate,
        endDate: c.endDate,
        color: c.color,
        notes: c.notes ?? "",
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Banner & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold uppercase tracking-wider">
              Q3 FLIGHTING ACTIVE
            </span>
            <span className="text-outline">•</span>
            <span className="text-[12px] text-outline font-medium">
              {activeClient.name} Enterprise Suite
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">
            Campaigns Orchestration
          </h1>
          <p className="text-sm text-outline max-w-2xl mt-1">
            Manage multi-channel brand campaigns, creator partnerships, deliverable flighting
            schedules, and cross-platform ROI telemetry.
          </p>
        </div>
        {/* Top Level Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[hsl(var(--admin-surface-lowest))]/90 border border-outline-variant/60 hover:bg-surface-container-low text-on-surface text-[11px] uppercase tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer">
            <Icons.listChecks className="size-[18px]" />
            Filter Status
          </button>
          <button
            onClick={() => toast.success("Campaign deck exported (Prototype)")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[hsl(var(--admin-surface-lowest))]/90 border border-outline-variant/60 hover:bg-surface-container-low text-on-surface text-[11px] uppercase tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Icons.download className="size-[18px]" />
            Export Campaign Deck
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[hsl(var(--admin-on-surface))] text-[hsl(var(--brand-accent))] text-[11px] uppercase font-bold tracking-wider hover:bg-black transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Icons.rocket className="size-[18px]" />
            + Launch Campaign
          </button>
        </div>
      </div>

      {/* Segmented Navigation Filters */}
      <div className="flex items-center justify-between overflow-x-auto pb-1 gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-surface-container-high/60 backdrop-blur-md rounded-full border border-white/60">
          {(
            [
              ["all", `All Campaigns (${tabCounts.all})`],
              ["active", `Active & Flighting (${tabCounts.active})`],
              ["review", `Under Review (${tabCounts.review})`],
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
                  ? "bg-[hsl(var(--admin-surface-lowest))] text-on-surface shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {key === "active" && <span className="w-2 h-2 rounded-full bg-primary-container" />}
              {label}
            </button>
          ))}
        </div>
        <div className="hidden sm:flex items-center gap-2 text-outline text-[12px]">
          <span>
            Sorting by: <strong className="text-on-surface">Urgent Flighting Deadline</strong>
          </span>
          <Icons.chevronsUpDown className="size-[18px]" />
        </div>
      </div>

      {/* 4-Grid Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        {/* KPI 1 */}
        <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/80 flex flex-col justify-between hover:border-primary-container/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-outline uppercase tracking-wider font-bold">
              Active Campaigns &amp; Flights
            </span>
            <span className="px-2 py-0.5 rounded-full bg-primary-container text-[hsl(var(--admin-on-surface))] text-[10px] font-bold">
              +2 Q3
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold tracking-tight text-on-surface">
              {tabCounts.active} Live
            </div>
            <p className="text-[12px] text-outline mt-1 line-clamp-1">
              Summer Drop, Brand Collab, B2B Leader, Tech Launch
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-secondary text-xs font-semibold pt-2 border-t border-outline-variant/20">
            <Icons.activity className="size-4" />
            <span>100% flight capacity</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/80 flex flex-col justify-between hover:border-primary-container/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-outline uppercase tracking-wider font-bold">
              Allocated Campaign Budget
            </span>
            <span className="text-[10px] text-on-surface font-bold">70.4%</span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-on-surface">$84,500</span>
              <span className="text-sm text-outline">/ $120,000</span>
            </div>
            <div className="w-full bg-surface-container-high h-2.5 rounded-full mt-3 overflow-hidden p-0.5">
              <div className="bg-primary-container h-full rounded-full" style={{ width: "70.4%" }} />
            </div>
          </div>
          <div className="flex items-center justify-between text-outline text-[12px] pt-2 border-t border-outline-variant/20">
            <span>$35,500 reserved</span>
            <span className="text-on-surface font-medium">Cap: 30 Sept</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/80 flex flex-col justify-between hover:border-primary-container/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-outline uppercase tracking-wider font-bold">
              Aggregated Flight Impressions
            </span>
            <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary text-[10px] font-bold">
              +24.6%
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold tracking-tight text-on-surface">3.84M</div>
            <p className="text-[12px] text-outline mt-1 flex items-center gap-1">
              <Icons.activity className="size-4 text-secondary" />
              <span>Pacing +620K over baseline model</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-on-surface text-xs pt-2 border-t border-outline-variant/20">
            <span className="w-2 h-2 rounded-full bg-secondary-container" />
            <span>Cross-Network Flight Aggregation</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/80 flex flex-col justify-between hover:border-primary-container/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-outline uppercase tracking-wider font-bold">
              Blended ROAS / Value
            </span>
            <span className="px-2 py-0.5 rounded-full bg-tertiary-container text-tertiary text-[10px] font-bold">
              TOP TIER
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold tracking-tight text-on-surface">4.2x</div>
            <p className="text-[12px] text-outline mt-1">
              Viral Drift index: <strong className="text-on-surface">92/100</strong>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-tertiary text-xs font-semibold pt-2 border-t border-outline-variant/20">
            <Icons.chartBar className="size-4" />
            <span>Organic Lift Multiplier Active</span>
          </div>
        </div>
      </div>

      {/* Master Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT/CENTER COLUMN (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* 1. Featured Active Campaign Spotlight */}
          <section className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-white p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-container/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              {/* Top Badge & Channel Stack */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--admin-on-surface))] text-[hsl(var(--brand-accent))] text-[11px] font-bold tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-primary-container animate-ping" />
                    FLIGHTING • DAY 14 OF 30
                  </span>
                  <span className="px-3 py-1 rounded-full bg-secondary-fixed/70 text-on-secondary-fixed text-[10px] font-bold">
                    FLAGSHIP ACTIVATION
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1.5">
                    <Icons.playCircle className="size-4 text-[#E1306C]" />
                    Instagram Reels
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1.5">
                    <Icons.bolt className="size-4" />
                    TikTok Spark Ads
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1.5">
                    <Icons.video className="size-4 text-[#FF0000]" />
                    YouTube Shorts
                  </span>
                </div>
              </div>

              {/* Spotlight Hero Content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8">
                  <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">
                    Summer Velocity: Spatial 3D Identity Drop
                  </h2>
                  <p className="text-sm text-outline mt-2 leading-relaxed">
                    High-impact product visualizer launch targeting creative tech founders and spatial
                    designers. Flight spans 12 short-form deliverables, sound-design takeovers, and
                    creator co-posts.
                  </p>
                  {/* Creator Roster Avatar Cluster */}
                  <div className="flex items-center gap-3 mt-6">
                    <span className="text-[10px] text-outline uppercase font-bold tracking-wider">
                      Assigned Talent:
                    </span>
                    <div className="flex items-center -space-x-2">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-primary/30 to-secondary/30"
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-[12px] text-on-surface font-medium">
                      <span>@alex.visuals,</span>
                      <span>@maya.motion,</span>
                      <span className="text-outline">+1</span>
                    </div>
                  </div>
                </div>
                {/* Flight Progress Micro-Card */}
                <div className="md:col-span-4 p-4 rounded-2xl bg-surface-container-low/90 border border-white/60">
                  <span className="text-[10px] text-outline uppercase font-bold tracking-wider">
                    Flight Budget Spent
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-on-surface">$35,000</span>
                    <span className="text-[12px] text-outline">/ $50,000</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full mt-2.5 overflow-hidden">
                    <div className="bg-secondary-container h-full rounded-full" style={{ width: "70%" }} />
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant/30 flex justify-between items-center text-[12px]">
                    <span className="text-outline">Burn Velocity</span>
                    <span className="text-on-surface font-bold">$2,500 / day</span>
                  </div>
                </div>
              </div>

              {/* Spotlight Metrics Strip */}
              <div className="grid grid-cols-3 gap-3 mt-6 p-4 rounded-2xl bg-[hsl(var(--admin-surface-lowest))]/60 border border-white/60">
                <div>
                  <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Active Reach</span>
                  <div className="text-lg font-bold text-on-surface mt-0.5">1.8M</div>
                  <span className="text-[11px] text-primary font-bold">+18% pacing</span>
                </div>
                <div>
                  <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Engagements</span>
                  <div className="text-lg font-bold text-on-surface mt-0.5">142K</div>
                  <span className="text-[11px] text-secondary font-bold">7.8% rate</span>
                </div>
                <div>
                  <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Average CTR</span>
                  <div className="text-lg font-bold text-on-surface mt-0.5">4.8%</div>
                  <span className="text-[11px] text-tertiary font-bold">2.1x category avg</span>
                </div>
              </div>

              {/* Quick Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDetail(filtered[0] ?? null)}
                    className="px-5 py-2.5 rounded-full bg-primary-container text-[hsl(var(--admin-on-surface))] text-[11px] uppercase font-bold tracking-wider hover:shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Manage Deliverables
                  </button>
                  <button
                    onClick={() => toast.info("Creative assets (Prototype)")}
                    className="px-4 py-2.5 rounded-full bg-white border border-outline-variant/50 text-on-surface text-[11px] uppercase hover:bg-surface-container-high transition-all active:scale-95 cursor-pointer"
                  >
                    View Creative Assets
                  </button>
                </div>
                <button
                  onClick={() => toast.warning("Flight paused (Prototype)")}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-error hover:bg-error-container/40 transition-colors text-[11px] uppercase cursor-pointer"
                >
                  <Icons.play className="size-4" />
                  <span>Pause Flight</span>
                </button>
              </div>
            </div>
          </section>

          {/* 2. Campaign Deliverables Pipeline */}
          <section className="rounded-3xl bg-white/75 backdrop-blur-xl border border-white p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Deliverables Pipeline</h3>
                <p className="text-[12px] text-outline mt-0.5">
                  Production tracking, milestone gates, and creator approval flights.
                </p>
              </div>
              <div className="flex items-center p-1 bg-surface-container-high rounded-full border border-white/60">
                <button className="px-4 py-1.5 rounded-full bg-white text-on-surface text-[10px] uppercase font-bold shadow-xs flex items-center gap-1.5 cursor-pointer">
                  <Icons.listChecks className="size-4" />
                  <span>Deliverables List</span>
                </button>
                <button className="px-4 py-1.5 rounded-full text-outline hover:text-on-surface text-[10px] uppercase transition-colors flex items-center gap-1.5 cursor-pointer">
                  <Icons.calendar className="size-4" />
                  <span>Gantt Timeline</span>
                </button>
              </div>
            </div>

            {/* Deliverable rows */}
            <div className="space-y-3">
              {DELIVERABLES.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-2xl bg-[hsl(var(--admin-surface-lowest))]/90 border border-outline-variant/30 hover:border-secondary transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", d.iconBg)}>
                      {React.createElement(Icons[d.icon], { className: "size-6" })}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-[16px] font-bold text-on-surface">{d.title}</h4>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", d.platformBadge)}>
                          {d.platform}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[12px] text-outline">
                        <span>
                          Creator: <strong className="text-on-surface font-medium">{d.creator}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Due: <strong className="text-on-surface font-medium">{d.due}</strong>
                        </span>
                        <span>•</span>
                        <span className={d.metaTone}>{d.meta}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-outline-variant/20">
                    <span className={cn("px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1", d.statusBadge)}>
                      {d.status === "Approved" && <Icons.circleCheck className="size-3.5 text-primary" />}
                      {d.status}
                    </span>
                    <div className="flex items-center gap-1">
                      {d.actions.includes("play") && (
                        <button className="p-2 rounded-full hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer">
                          <Icons.play className="size-5" />
                        </button>
                      )}
                      {d.actions.includes("chat") && (
                        <button className="p-2 rounded-full hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer">
                          <Icons.chat className="size-5" />
                        </button>
                      )}
                      {d.actions.includes("inspect") && (
                        <button className="p-2 rounded-full hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer">
                          <Icons.search className="size-5" />
                        </button>
                      )}
                      {d.actions.includes("edit") && (
                        <button className="p-2 rounded-full hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer">
                          <Icons.edit className="size-5" />
                        </button>
                      )}
                      {d.actions.includes("more") && (
                        <button className="p-2 rounded-full hover:bg-surface-container-high text-outline transition-colors cursor-pointer">
                          <Icons.ellipsis className="size-5" />
                        </button>
                      )}
                      {d.actions.includes("approve") && (
                        <button
                          onClick={() => toast.success("Deliverable approved (Prototype)")}
                          className="px-3.5 py-1.5 rounded-full bg-primary-container text-[hsl(var(--admin-on-surface))] text-[11px] uppercase font-bold hover:shadow-xs cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pipeline Footer */}
            <div className="flex items-center justify-between pt-5 mt-4 border-t border-outline-variant/20 text-[12px] text-outline">
              <span>Showing 4 of 12 active deliverable items</span>
              <button className="text-secondary font-semibold hover:underline flex items-center gap-1 cursor-pointer">
                <span>View All Flight Deliverables</span>
                <Icons.arrowRight className="size-4" />
              </button>
            </div>
          </section>
        </div>

        {/* RIGHT RAIL (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Client Campaign Switcher & Budget Breakdown */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] text-outline uppercase font-bold tracking-wider">
                Client Switcher
              </span>
              <span className="w-2 h-2 rounded-full bg-secondary-container" />
            </div>
            {/* Segmented Client Selector Pills */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-container-high rounded-full border border-white/60 mb-6">
              {CAMPAIGN_CLIENTS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveClientId(c.id)}
                  className={cn(
                    "py-1.5 px-2 rounded-full text-[10px] font-bold transition-colors truncate cursor-pointer",
                    activeClientId === c.id
                      ? "bg-white text-on-surface shadow-xs"
                      : "text-outline hover:text-on-surface"
                  )}
                >
                  {c.shortName}
                </button>
              ))}
            </div>
            <h4 className="text-lg font-bold text-on-surface">Budget Allocation by Platform</h4>
            <p className="text-[12px] text-outline mt-0.5">
              Calculated flight deployment for current cycle.
            </p>
            {/* Progress Stack Breakdown */}
            <div className="w-full h-3.5 rounded-full bg-surface-container-high flex overflow-hidden mt-5 p-0.5 gap-0.5">
              {BUDGET_SPLIT.map((b, i) => (
                <div
                  key={b.name}
                  className={cn(
                    "h-full",
                    b.color,
                    i === 0 && "rounded-l-full",
                    i === BUDGET_SPLIT.length - 1 && "rounded-r-full"
                  )}
                  style={{ width: `${b.pct}%` }}
                  title={`${b.name} ${b.pct}%`}
                />
              ))}
            </div>
            {/* Platform Legend Cards */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              {BUDGET_SPLIT.map((b) => (
                <div
                  key={b.name}
                  className="p-2.5 rounded-xl bg-surface-container-low/80 border border-white flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2.5 h-2.5 rounded-full", b.color)} />
                    <span className="text-[12px] text-on-surface font-medium">{b.name}</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface">{b.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Creator & Talent Roster */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold text-on-surface">Creator &amp; Talent Roster</h4>
                <p className="text-[12px] text-outline mt-0.5">
                  Contracted partners for {activeClient.shortName}.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-primary-container text-[hsl(var(--admin-on-surface))] text-[10px] font-bold">
                3 ACTIVE
              </span>
            </div>
            <div className="space-y-3.5 mt-4">
              {CREATORS.map((cr) => (
                <div
                  key={cr.handle}
                  className="p-3 rounded-2xl bg-[hsl(var(--admin-surface-lowest))]/90 border border-outline-variant/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 ring-2", cr.ring)} />
                    <div>
                      <div className="text-sm font-bold text-on-surface">{cr.handle}</div>
                      <div className="text-[11px] text-outline">{cr.meta}</div>
                    </div>
                  </div>
                  <button className="p-2 rounded-full hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer">
                    {React.createElement(Icons[cr.icon], { className: "size-[18px]" })}
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[10px] uppercase transition-colors text-center cursor-pointer">
              + Contract Additional Talent
            </button>
          </div>

          {/* 3. AI Campaign Assistant Hook Generator */}
          <div className="rounded-3xl bg-[hsl(var(--admin-on-surface))] text-surface p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-primary-container/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-[hsl(var(--admin-on-surface))] text-[10px] font-bold">
                  FRHM AI V3.4
                </span>
                <Icons.bot className="size-5 text-primary-container" />
              </div>
              <h4 className="text-lg font-bold text-surface">Need Campaign Angles?</h4>
              <p className="text-[12px] text-outline-variant/80 mt-1 leading-relaxed">
                Synthesize viral TikTok hooks, B2B carousel narratives, and cross-channel flight
                variants tuned to {activeClient.name}&apos;s ideal customer persona.
              </p>
              <div className="mt-4 p-1.5 rounded-full bg-white/10 border border-white/20 flex items-center justify-between">
                <span className="text-[12px] text-outline-variant pl-3 truncate">
                  &quot;Spatial UX for enterprise CFOs...&quot;
                </span>
                <button className="w-8 h-8 rounded-full bg-primary-container text-[hsl(var(--admin-on-surface))] flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-pointer">
                  <Icons.arrowRight className="size-4 -rotate-90" />
                </button>
              </div>
              <button
                onClick={() => toast.success("Creative angles generated (Prototype)")}
                className="w-full mt-4 py-3 rounded-full bg-primary-container text-[hsl(var(--admin-on-surface))] text-[10px] uppercase font-bold tracking-wider hover:bg-primary-fixed transition-all active:scale-95 shadow-sm text-center cursor-pointer"
              >
                Generate Creative Angles
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Footer */}
      <footer className="pt-6 pb-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-outline">
        <div className="flex items-center gap-3">
          <span className="font-bold text-on-surface">FRHM © 2026.</span>
          <span>All rights reserved. Creative Media Operations Platform.</span>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <a className="hover:text-on-surface transition-colors cursor-pointer">Privacy Policy</a>
          <a className="hover:text-on-surface transition-colors cursor-pointer">Terms of Service</a>
          <a className="hover:text-on-surface transition-colors cursor-pointer">API Documentation</a>
          <div className="flex items-center gap-1.5 text-on-surface font-medium">
            <span className="w-2 h-2 rounded-full bg-primary-container" />
            <span>System Status (99.98%)</span>
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
        client={detail ? clientById[detail.clientId] : undefined}
        open={detail !== null}
        onClose={() => setDetail(null)}
        onEdit={openEdit}
      />
    </div>
  )
}
