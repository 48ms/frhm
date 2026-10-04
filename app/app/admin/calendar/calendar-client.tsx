"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { parseAsStringEnum, parseAsString, useQueryState } from "nuqs"
import { Icons } from "@/components/icons"
import { toast } from "sonner"
import { type ScheduledPost, PLATFORMS } from "@/features/calendar/types"
import { PostDialog } from "@/components/calendar/post-dialog"
import { CalendarExportModal } from "@/components/calendar/calendar-export-modal"
import { cn } from "@/lib/utils"
import { useAppStore, type PipelinePost } from "@/lib/store/app-store"
import { SOCIAL_CLIENTS } from "@/components/social-accounts/social-data"

/* Seed data lifted verbatim from stitch_frhm Dispatch Hub prototype   */
const STITCH_POSTS: ScheduledPost[] = [
  {
    id: "stitch-1",
    client_id: "client-shell",
    deliverable_id: "#SPAT-8829",
    title: "Spatial Identity Teaser #04",
    content:
      '"The boundaries between organic brand form and spatial architecture are evaporating. Welcome to the new era of..."',
    platform: "instagram",
    scheduled_at: "2026-08-17T10:30:00+07:00",
    status: "scheduled",
    notes: "@shell.creative",
    is_reserved: false,
    is_placeholder: false,
    reserved_for: null,
    reserved_until: null,
  },
  {
    id: "stitch-2",
    client_id: "client-shell",
    deliverable_id: null,
    title: "Berlin Fashion Week Jump Cuts #02",
    content: "@alex.v",
    platform: "tiktok",
    scheduled_at: "2026-08-18T16:00:00+07:00",
    status: "draft",
    notes: "TIKTOK BTS",
    is_reserved: false,
    is_placeholder: false,
    reserved_for: null,
    reserved_until: null,
  },
  {
    id: "stitch-3",
    client_id: "client-shell",
    deliverable_id: null,
    title: "3D Product Glassmorphism Breakdown",
    content: "",
    platform: "shorts",
    scheduled_at: "2026-08-19T19:00:00+07:00",
    status: "scheduled",
    notes: "",
    is_reserved: false,
    is_placeholder: false,
    reserved_for: null,
    reserved_until: null,
  },
  {
    id: "stitch-4",
    client_id: "client-shell",
    deliverable_id: null,
    title: "Executive Thought Leadership",
    content: "Whitepaper Vol.4 — 12 Slides Carousel (PDF). Exec Sign-off.",
    platform: "linkedin",
    scheduled_at: "2026-08-21T09:00:00+07:00",
    status: "published",
    notes: "LINKEDIN",
    is_reserved: false,
    is_placeholder: false,
    reserved_for: null,
    reserved_until: null,
  },
  {
    id: "stitch-5",
    client_id: "client-shell",
    deliverable_id: null,
    title: "Interactive UX for Enterprise CFOs",
    content: "Copy hook pending A/B variant review",
    platform: "tiktok",
    scheduled_at: "2026-08-22T20:00:00+07:00",
    status: "draft",
    notes: "SPARK AD",
    is_reserved: false,
    is_placeholder: false,
    reserved_for: null,
    reserved_until: null,
  },
]

/* Helpers                                                             */

/** Adapt a store PipelinePost to the CalendarView's ScheduledPost shape. */
function toScheduledPost(p: PipelinePost): ScheduledPost {
  const channel = p.platform || "instagram"
  const platform = Object.keys(PLATFORMS).includes(channel) ? channel : "instagram"
  const status: ScheduledPost["status"] =
    p.status === "review" || p.status === "draft"
      ? "draft"
      : p.status === "published" || p.status === "approved"
      ? "published"
      : "scheduled"
  return {
    id: p.id,
    client_id: p.clientId,
    deliverable_id: null,
    title: p.title,
    content: p.caption,
    platform,
    scheduled_at: p.scheduledAt,
    status,
    notes: null,
    is_reserved: false,
    is_placeholder: false,
    reserved_for: null,
    reserved_until: null,
  }
}

const PLATFORM_META: Record<
  string,
  { label: string; icon: keyof typeof Icons; badge: string }
> = {
  instagram: { label: "REELS", icon: "video", badge: "bg-[#fce7f3] text-[#be185d]" },
  tiktok: { label: "TIKTOK", icon: "play", badge: "bg-[hsl(var(--admin-surface-highest,0_0%_25%))] text-on-surface" },
  shorts: { label: "SHORTS", icon: "video", badge: "bg-[#fee2e2] text-[#b91c1c]" },
  linkedin: { label: "LINKEDIN", icon: "bookOpen", badge: "bg-[#dbeafe] text-[#1d4ed8]" },
}

const STATUS_META: Record<string, { label: string; pill: string; dot: string }> = {
  scheduled: {
    label: "Scheduled",
    pill: "bg-secondary-fixed text-secondary",
    dot: "bg-secondary",
  },
  published: {
    label: "Approved",
    pill: "bg-primary-container text-primary",
    dot: "bg-primary",
  },
  draft: {
    label: "Draft",
    pill: "bg-surface-container-highest text-on-surface-variant",
    dot: "bg-outline",
  },
}

/** Ticking countdown to the next scheduled post. */
function useNextRelease(posts: ScheduledPost[]) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const next = useMemo(() => {
    const upcoming = posts
      .filter((p) => p.status === "scheduled" && new Date(p.scheduled_at).getTime() > now)
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    return upcoming[0] ?? posts[0] ?? null
  }, [posts, now])

  const remaining = useMemo(() => {
    if (!next) return null
    const diff = new Date(next.scheduled_at).getTime() - now
    const clamped = diff <= 0 ? 0 : diff
    const h = Math.floor(clamped / 3_600_000)
    const m = Math.floor((clamped % 3_600_000) / 60_000)
    const s = Math.floor((clamped % 60_000) / 1000)
    return {
      label: [h, m, s].map((n) => String(n).padStart(2, "0")).join(" : "),
      title: next.title,
      platform: next.platform,
    }
  }, [next, now])

  return remaining
}

const VIEW_TABS = ["month", "week", "list"] as const
const PLATFORM_FILTERS = ["all", "instagram", "tiktok", "shorts", "linkedin"] as const

export function AdminCalendarClient() {
  // Zustand store: posts per clientId
  const allPosts = useAppStore((s) => s.posts)

  const clients = useMemo(
    () => SOCIAL_CLIENTS.map((c) => ({ id: c.id, name: c.name })),
    []
  )

  const [selectedClientId, setSelectedClientId] = useQueryState(
    "clientId",
    parseAsString.withDefault(SOCIAL_CLIENTS[0].id)
  )
  const [platformFilter, setPlatformFilter] = useQueryState(
    "platform",
    parseAsStringEnum([...PLATFORM_FILTERS]).withDefault("all")
  )
  const [viewMode, setViewMode] = useQueryState(
    "view",
    parseAsStringEnum([...VIEW_TABS]).withDefault("month")
  )
  const [mediaUrl, setMediaUrl] = useQueryState("mediaUrl", parseAsString.withDefault(""))
  const [composeNew, setComposeNew] = useQueryState("new", parseAsString.withDefault(""))

  const [dialogOpen, setDialogOpen] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | undefined>()
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  // Arriving from Media Library ("Use in Post"): open the compose dialog with
  // the chosen asset pre-filled, then clear the transient query params.
  useEffect(() => {
    if (composeNew === "1") {
      setEditingPost(null)
      setInitialDate(new Date())
      setDialogOpen(true)
      void setComposeNew("")
    }
  }, [composeNew, setComposeNew])

  // Merge store posts with the Stitch prototype seed so the board is never empty.
  const posts = useMemo<ScheduledPost[]>(() => {
    const storePosts = allPosts
      .filter((p) => p.clientId === selectedClientId)
      .map(toScheduledPost)
    const seed = STITCH_POSTS.filter((p) => p.client_id === selectedClientId)
    return [...storePosts, ...seed]
  }, [allPosts, selectedClientId])

  const release = useNextRelease(posts)

  const filteredPosts = useMemo(
    () =>
      platformFilter === "all" ? posts : posts.filter((p) => p.platform === platformFilter),
    [posts, platformFilter]
  )

  const activeClient = clients.find((c) => c.id === selectedClientId) ?? clients[0]

  /* week grid computation (Stitch sprint week) */
  const [cursor, setCursor] = useState(() => new Date(2026, 7, 17))

  const weekDays = useMemo(() => {
    const start = new Date(cursor)
    const day = (start.getDay() + 6) % 7 // Monday=0
    start.setDate(start.getDate() - day)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [cursor])

  const monthLabel = useMemo(
    () =>
      cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [cursor]
  )

  const todayStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const postsByDay = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>()
    for (const p of filteredPosts) {
      const key = new Date(p.scheduled_at).toDateString()
      const arr = map.get(key) ?? []
      arr.push(p)
      map.set(key, arr)
    }
    return map
  }, [filteredPosts])

  /* actions */
  const handleAddPost = useCallback((date: Date) => {
    setInitialDate(date)
    setEditingPost(null)
    setDialogOpen(true)
  }, [])

  const handleSelectPost = useCallback((post: ScheduledPost) => {
    setEditingPost(post)
    setInitialDate(undefined)
    setDialogOpen(true)
  }, [])

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="admin-section-label">Content Calendar</span>
          <h1 className="admin-headline-xl text-[hsl(var(--admin-on-surface))] mt-1">
            Multi-Channel Dispatch Schedule
          </h1>
          <p className="text-sm text-[hsl(var(--admin-outline))] mt-1">
            Drag &amp; drop post scheduling for {activeClient?.name}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExportOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[hsl(var(--admin-outline-variant))]/50 bg-[hsl(var(--admin-surface-lowest))] text-[hsl(var(--admin-on-surface))] text-xs font-semibold hover:bg-[hsl(var(--admin-surface-high))] transition-all active:scale-95 cursor-pointer"
          >
            <Icons.download className="size-4" />
            Quick Export
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            onClick={() => handleAddPost(new Date())}
          >
            <Icons.send className="size-[18px]" />
            Schedule New Dispatch
          </button>
        </div>
      </div>

      {/* Sub-Header Control Bar */}
      <div className="px-6 py-3.5 bg-[hsl(var(--admin-surface))]/60 backdrop-blur-md border border-[hsl(var(--admin-outline-variant))]/30 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-[hsl(var(--admin-surface-low))] p-1 rounded-full border border-[hsl(var(--admin-outline-variant))]/40 shadow-inner">
          {VIEW_TABS.map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === v
                  ? "bg-secondary text-on-secondary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {v === "list" && <Icons.activity className="size-4" />}
              {v === "month" ? "Month View" : v === "week" ? "Week View" : "List / Gantt Timeline"}
            </button>
          ))}
        </div>

        {/* Navigation & Month Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth(), c.getDate() - 7))}
            className="w-8 h-8 rounded-full border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-lowest))] flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
            aria-label="Previous week"
          >
            <Icons.chevronLeft className="size-[18px]" />
          </button>
          <div className="flex items-center gap-2">
            <Icons.calendar className="size-5 text-secondary" />
            <span className="admin-headline-md font-bold text-on-surface">{monthLabel}</span>
          </div>
          <button
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth(), c.getDate() + 7))}
            className="w-8 h-8 rounded-full border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-lowest))] flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
            aria-label="Next week"
          >
            <Icons.chevronRight className="size-[18px]" />
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-[10px] font-bold uppercase tracking-wider hover:bg-surface-variant transition-colors"
          >
            Today
          </button>
        </div>

        {/* Platform Filter Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mr-1">
            Platform:
          </span>
          {PLATFORM_FILTERS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 capitalize cursor-pointer",
                platformFilter === p
                  ? "bg-on-surface text-surface"
                  : "bg-[hsl(var(--admin-surface-lowest))] border border-outline-variant/30 text-on-surface hover:border-secondary"
              )}
            >
              {p === "all" ? "All (5)" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Top Metric Strip / Flight Pace Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1: Scheduled Flights */}
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] uppercase text-on-surface-variant tracking-wider font-bold">
              Scheduled Flights (Month)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-on-surface">{filteredPosts.length} Posts</span>
              <span className="inline-flex items-center text-[12px] font-bold text-primary bg-primary-container/40 px-2 py-0.5 rounded-full">
                <Icons.chartBar className="size-3.5" /> +14% pace
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-container/30 flex items-center justify-center text-primary shrink-0">
            <Icons.rocket className="size-6" />
          </div>
        </div>

        {/* Metric 2: Slots Status */}
        <div className="glass-panel rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase text-on-surface-variant tracking-wider font-bold">
              Slots Status Pipeline
            </span>
            <span className="text-[10px] text-secondary font-bold uppercase">{filteredPosts.length} TOTAL</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 bg-surface-container-high h-2.5 rounded-full overflow-hidden flex">
              <div className="bg-primary h-full" style={{ width: "74%" }} title="28 Approved" />
              <div className="bg-[#f59e0b] h-full" style={{ width: "16%" }} title="6 Needs Approval" />
              <div className="bg-outline-variant h-full" style={{ width: "10%" }} title="4 Drafts" />
            </div>
          </div>
          <div className="flex justify-between text-[11px] text-on-surface-variant pt-0.5">
            <span className="flex items-center gap-1 font-semibold text-on-surface">
              <span className="w-2 h-2 rounded-full bg-primary" /> 28 Approved
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> 6 Pending
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-outline-variant" /> 4 Drafts
            </span>
          </div>
        </div>

        {/* Metric 3: Peak Dispatch Timeslots */}
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase text-on-surface-variant tracking-wider font-bold">
              Peak Velocity Timeslot
            </span>
            <p className="text-base font-bold text-on-surface">18:00 – 20:30 WIB</p>
            <p className="text-[11px] text-secondary font-semibold flex items-center gap-1">
              <Icons.bolt className="size-3.5" /> TikTok &amp; Reels Velocity Index 94/100
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
            <Icons.monitoring className="size-6" />
          </div>
        </div>

        {/* Metric 4: API Sync Health */}
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border-l-4 border-l-primary">
          <div className="space-y-1">
            <span className="text-[10px] uppercase text-on-surface-variant tracking-wider font-bold">
              Auto-Publish Sync Health
            </span>
            <p className="text-base font-bold text-on-surface flex items-center gap-2">
              <span>100% Operational</span>
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            </p>
            <p className="text-[11px] text-on-surface-variant truncate">Meta Graph API &amp; TikTok Cloud Live</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface shrink-0">
            <Icons.circleCheck className="size-6" />
          </div>
        </div>
      </div>

      {/* Dual-Stage Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Calendar Interface: 8 cols */}
        <div className="xl:col-span-8 space-y-4">
          <div className="glass-panel rounded-3xl p-5 shadow-sm overflow-hidden" data-calendar>
            {/* Calendar Day Header */}
            <div className="grid grid-cols-7 gap-2 mb-3 pb-3 border-b border-outline-variant/30 text-center">
              {weekDays.map((d, i) => (
                <div
                  key={i}
                  className="text-[10px] uppercase text-on-surface-variant tracking-wider font-bold"
                >
                  {d.toLocaleDateString("en-US", { weekday: "short" })}{" "}
                  <span className={cn(d.getDate() === 17 ? "text-secondary" : "")}>{d.getDate()}</span>
                </div>
              ))}
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 gap-2 min-h-[560px]">
              {weekDays.map((d, i) => {
                const dayPosts = postsByDay.get(d.toDateString()) ?? []
                const isToday = d.getDate() === 17 && d.getMonth() === 6 + 1
                const isDarkFlight = i === 6 // Sunday

                if (dayPosts.length === 0) {
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-2xl p-2.5 border flex flex-col justify-between group transition-all",
                        isDarkFlight
                          ? "bg-surface-container-lowest/40 border-outline-variant/20"
                          : "bg-surface-container-lowest/60 border-outline-variant/30 hover:border-outline"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-on-surface-variant font-bold">{d.getDate()}</span>
                        <span className="text-[10px] text-outline">Open</span>
                      </div>
                      <div className="h-full flex flex-col items-center justify-center py-8 text-center text-outline-variant group-hover:text-on-surface-variant">
                        <span className="text-[28px] mb-1">{isDarkFlight ? "🌙" : "+"}</span>
                        <span className="text-[11px] uppercase font-bold">
                          {isDarkFlight ? "Dark Flight" : "Free Dispatch Slot"}
                        </span>
                        {!isDarkFlight && (
                          <span className="text-[10px] text-outline mt-1">Recommended: 14:00</span>
                        )}
                        {isDarkFlight && (
                          <span className="text-[10px] text-outline mt-0.5">Audience Cooling</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddPost(d)}
                        className="w-full py-1.5 rounded-lg border border-dashed border-outline-variant/60 text-on-surface-variant hover:text-secondary hover:border-secondary hover:bg-surface-container-lowest transition-all text-[11px] uppercase font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Icons.add className="size-3.5" /> Quick Slot
                      </button>
                    </div>
                  )
                }

                return (
                  <div
                    key={i}
                    className={cn(
                      "rounded-2xl p-2.5 border-2 flex flex-col justify-between group transition-all",
                      isToday
                        ? "bg-surface-container-lowest/90 border-secondary/40 shadow-xs hover:border-secondary"
                        : "bg-surface-container-lowest/60 border-outline-variant/30 hover:border-outline"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      {isToday ? (
                        <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary text-[12px] flex items-center justify-center font-bold">
                          {d.getDate()}
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface-variant font-bold">{d.getDate()}</span>
                      )}
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase",
                          isToday ? "text-secondary" : "text-on-surface-variant"
                        )}
                      >
                        {isToday ? "TODAY" : `${dayPosts.length} post${dayPosts.length > 1 ? "s" : ""}`}
                      </span>
                    </div>

                    {/* Post cards */}
                    <div className="space-y-2">
                      {dayPosts.map((p) => {
                        const meta = PLATFORM_META[p.platform] ?? PLATFORM_META.instagram
                        const st = STATUS_META[p.status] ?? STATUS_META.scheduled
                        const time = new Date(p.scheduled_at).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleSelectPost(p)}
                            className="glass-card-nested rounded-xl p-2.5 border border-outline-variant/30 hover:shadow-md transition-all cursor-pointer bg-surface-container-lowest"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                                  meta.badge
                                )}
                              >
                                <Icons.video className="size-3" /> {meta.label}
                              </span>
                              <span className="text-[11px] text-on-surface-variant font-medium">{time}</span>
                            </div>
                            {/* Thumbnail / media block */}
                            <div
                              className={cn(
                                "relative rounded-lg overflow-hidden h-20 mb-2",
                                p.platform === "linkedin" ? "bg-[#1e293b] p-2 flex flex-col justify-between text-white" : "bg-surface-container"
                              )}
                            >
                              {p.platform === "linkedin" ? (
                                <>
                                  <span className="text-[10px] uppercase tracking-wider text-primary-container font-bold">
                                    Whitepaper Vol.4
                                  </span>
                                  <p className="text-[11px] font-bold leading-tight">
                                    The Death of Bland Corporate Branding
                                  </p>
                                  <span className="text-[9px] text-slate-300">12 Slides Carousel (PDF)</span>
                                </>
                              ) : p.platform === "tiktok" && p.status === "draft" ? (
                                <div className="p-2 bg-surface-container-high h-full">
                                  <p className="text-[11px] font-bold text-on-surface leading-tight line-clamp-2">
                                    {p.title}
                                  </p>
                                  <p className="text-[10px] text-outline mt-1">{p.content}</p>
                                </div>
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-transparent flex items-center justify-center">
                                  <Icons.play className="size-6 text-on-surface-variant/40" />
                                </div>
                              )}
                            </div>
                            <p className="text-[12px] font-bold text-on-surface line-clamp-2 leading-tight">
                              {p.title}
                            </p>
                            <div className="mt-2 pt-1.5 border-t border-outline-variant/20 flex items-center justify-between">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full",
                                  st.pill
                                )}
                              >
                                <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} /> {st.label}
                              </span>
                              <span className="text-[10px] text-on-surface-variant">
                                {p.notes ?? p.content?.slice(0, 12)}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Add Slot Prompt */}
                    <button
                      onClick={() => handleAddPost(d)}
                      className="w-full mt-2 py-1 rounded-lg border border-dashed border-outline-variant/50 text-outline hover:text-on-surface hover:border-secondary hover:bg-surface-container transition-all text-[11px] uppercase font-bold flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Icons.add className="size-3.5" /> Add slot
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Next Week Preview Bar */}
            <div className="mt-4 pt-3 border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase text-on-surface-variant font-bold tracking-wider">
                  Next Week Teaser:
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-lowest border border-outline-variant/30 text-[12px] text-on-surface font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#E1306C]" /> Aug 24: Design System 2.0 Token Architecture
                  (Instagram)
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-lowest border border-outline-variant/30 text-[12px] text-on-surface font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#0077B5]" /> Aug 26: Agency Keynote Live Stream (LinkedIn)
                </span>
              </div>
              <button className="text-[10px] text-secondary hover:underline uppercase flex items-center gap-1 font-bold cursor-pointer">
                <span>View Full Month Matrix</span>
                <Icons.arrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dispatch Queue & Approval Drawer: 4 cols */}
        <div className="xl:col-span-4 space-y-6">
          {/* Drawer Card: Today's Dispatches & Live Countdown */}
          <div className="glass-panel rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping" />
                <h3 className="text-lg font-bold text-on-surface">Today&apos;s Dispatches</h3>
              </div>
              <span className="text-[10px] uppercase bg-secondary-fixed text-secondary px-2.5 py-1 rounded-full font-bold">
                {todayStr}
              </span>
            </div>

            {/* Countdown Pill */}
            <div className="rounded-2xl bg-secondary-container text-on-secondary-container p-4 shadow-sm relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[9px] uppercase tracking-wider text-secondary-fixed-dim font-bold">
                    Next Flight Countdown
                  </span>
                  <p className="text-2xl font-bold tracking-tight text-white mt-0.5 tabular-nums">
                    {release ? release.label : "-"}
                  </p>
                  <p className="text-[11px] text-on-secondary-container mt-1 flex items-center gap-1.5 truncate">
                    <Icons.bolt className="size-4" />
                    {release ? `${release.platform} · ${release.title}` : "No upcoming flights"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                  <Icons.clock className="size-6" />
                </div>
              </div>
              {/* Fast Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/20 relative z-10">
                <button
                  onClick={() => toast.success("Force publish queued (Prototype)")}
                  className="bg-primary-container text-on-primary-container py-1.5 rounded-full text-[10px] uppercase font-bold hover:bg-primary-fixed transition-colors text-center cursor-pointer"
                >
                  Force Publish
                </button>
                <button
                  onClick={() => toast.info("Media editor (Prototype)")}
                  className="bg-white/20 hover:bg-white/30 text-white py-1.5 rounded-full text-[10px] uppercase font-bold transition-colors text-center cursor-pointer"
                >
                  Edit Media
                </button>
                <button
                  onClick={() => toast.info("Reschedule (Prototype)")}
                  className="bg-white/20 hover:bg-white/30 text-white py-1.5 rounded-full text-[10px] uppercase font-bold transition-colors text-center cursor-pointer"
                >
                  Reschedule
                </button>
              </div>
            </div>

            {/* Detailed Dispatch Metadata Card */}
            <div className="glass-card-nested rounded-2xl p-3.5 border border-outline-variant/40 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
                  <Icons.video className="size-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-on-surface truncate">
                    {release?.title ?? "Spatial Identity Teaser #04"}
                  </p>
                  <p className="text-[11px] text-on-surface-variant truncate">
                    Deliverable ID: #SPAT-8829
                  </p>
                </div>
              </div>
              <div className="text-[12px] text-on-surface-variant bg-surface-container/60 p-2.5 rounded-xl">
                <span className="font-bold text-on-surface">Caption Hook:</span> &quot;The boundaries between organic
                brand form and spatial architecture are evaporating. Welcome to the new era of...&quot;
              </div>
            </div>
          </div>

          {/* Drawer Card: Deliverable Approval Gate */}
          <div className="glass-panel rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f59e0b] text-[20px]">
                  <Icons.alertCircle className="size-5 text-[#f59e0b]" />
                </span>
                <h3 className="text-lg font-bold text-on-surface">Approval Gate</h3>
              </div>
              <span className="text-[10px] uppercase bg-error-container text-error px-2 py-0.5 rounded-full font-bold">
                2 Awaiting
              </span>
            </div>

            {/* Pending Item 1 */}
            <div className="glass-card-nested rounded-2xl p-3.5 border border-outline-variant/30 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface text-[9px] font-bold">
                      TIKTOK BTS
                    </span>
                    <span className="text-[11px] text-on-surface-variant">Due Tomorrow</span>
                  </div>
                  <h4 className="text-[13px] font-bold text-on-surface">Berlin Fashion Week Jump Cuts</h4>
                </div>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center shrink-0">
                  <Icons.clapperboard className="size-5 text-on-surface-variant" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  onClick={() => toast.info("Revision requested (Prototype)")}
                  className="flex-1 bg-surface-container-high hover:bg-surface-variant text-on-surface py-1.5 rounded-full text-[10px] uppercase font-bold transition-all cursor-pointer"
                >
                  Request Revision
                </button>
                <button
                  onClick={() => toast.success("Deliverable approved (Prototype)")}
                  className="flex-1 bg-primary-container hover:bg-primary-fixed text-on-primary-container py-1.5 rounded-full text-[10px] uppercase font-bold transition-all shadow-xs cursor-pointer"
                >
                  Approve Deliverable
                </button>
              </div>
            </div>

            {/* Pending Item 2 */}
            <div className="glass-card-nested rounded-2xl p-3.5 border border-outline-variant/30 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-[#dbeafe] text-[#1d4ed8] text-[9px] font-bold">
                      LINKEDIN
                    </span>
                    <span className="text-[11px] text-on-surface-variant">Due Aug 21</span>
                  </div>
                  <h4 className="text-[13px] font-bold text-on-surface">Whitepaper Carousel Copy Slide #8</h4>
                </div>
                <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
                  <Icons.bookOpen className="size-5" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  onClick={() => toast.info("Diff inspector (Prototype)")}
                  className="flex-1 bg-surface-container-high hover:bg-surface-variant text-on-surface py-1.5 rounded-full text-[10px] uppercase font-bold transition-all cursor-pointer"
                >
                  Inspect Diff
                </button>
                <button
                  onClick={() => toast.success("Deliverable approved (Prototype)")}
                  className="flex-1 bg-primary-container hover:bg-primary-fixed text-on-primary-container py-1.5 rounded-full text-[10px] uppercase font-bold transition-all shadow-xs cursor-pointer"
                >
                  Approve Deliverable
                </button>
              </div>
            </div>
          </div>

          {/* AI Optimization Recommendation Card */}
          <div className="rounded-3xl p-5 bg-gradient-to-br from-[#d4ff32]/30 via-surface-container-low to-surface-container border border-primary/30 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Icons.bot className="size-5" />
              <span className="text-[10px] uppercase tracking-wider font-bold">Studio AI Prediction</span>
            </div>
            <p className="text-[13px] font-bold text-on-surface leading-snug">
              Reschedule TikTok Spark Ad to Friday 19:30 WIB
            </p>
            <p className="text-[11px] text-on-surface-variant">
              Predictive audience telemetry indicates a{" "}
              <strong className="text-primary font-bold">+28% higher organic viral velocity</strong> for enterprise
              tech content during that exact window.
            </p>
            <button
              onClick={() => toast.success("Suggestion applied (Prototype)")}
              className="w-full bg-primary-container hover:bg-primary-fixed text-on-primary-container text-[10px] uppercase py-2.5 rounded-full font-bold tracking-wider transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Icons.refresh className="size-4" />
              <span>Apply Suggestion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Client Quick Switcher & Audit Footer */}
      <footer className="pt-6 pb-4 border-t border-outline-variant/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 glass-panel rounded-2xl px-6 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] uppercase text-on-surface-variant font-bold tracking-wider">
              Agency Client Switcher:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {SOCIAL_CLIENTS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer",
                    selectedClientId === c.id
                      ? "bg-primary-container text-on-primary-container shadow-xs flex items-center gap-1.5"
                      : "bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant/30"
                  )}
                >
                  {selectedClientId === c.id && <span className="w-2 h-2 rounded-full bg-primary" />}
                  {c.shortName}
                </button>
              ))}
            </div>
          </div>
          {/* System Status Indicator */}
          <div className="flex items-center gap-4 text-[11px] text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>
                Global Dispatch Engine: <strong>99.98% Uptime</strong>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Icons.shield className="size-4 text-secondary" />
              <span>Audit Log #9940 Verified</span>
            </div>
          </div>
        </div>
        {/* Copyright & Platform Stamp */}
        <div className="flex flex-wrap items-center justify-between text-[12px] text-on-surface-variant px-2">
          <p>FRHM © 2026. All rights reserved. Creative Media Operations Platform.</p>
          <div className="flex items-center gap-4">
            <a className="hover:underline cursor-pointer">Privacy Architecture</a>
            <span>•</span>
            <a className="hover:underline cursor-pointer">Security Protocols</a>
            <span>•</span>
            <a className="hover:underline cursor-pointer">API Documentation (v4.2)</a>
          </div>
        </div>
      </footer>

      <CalendarExportModal
        open={exportOpen}
        posts={posts}
        clientName={activeClient?.name ?? ""}
        onClose={() => setExportOpen(false)}
      />
      <PostDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingPost(null)
          setInitialDate(undefined)
          void setMediaUrl("")
        }}
        initialDate={initialDate}
        editingPost={editingPost}
        clientId={selectedClientId}
        initialMediaUrl={mediaUrl || undefined}
        onSave={() => {
          toast.success("Refreshed")
        }}
        onDelete={() => {
          toast.success("Refreshed")
        }}
      />
    </div>
  )
}
