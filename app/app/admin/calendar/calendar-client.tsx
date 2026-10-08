"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { parseAsStringEnum, parseAsString, useQueryState } from "nuqs"
import { Icons } from "@/components/icons"
import { toast } from "sonner"
import { PostDialog } from "@/components/calendar/post-dialog"
import { CalendarExportModal } from "@/components/calendar/calendar-export-modal"
import { BrainstormModal } from "@/components/calendar/brainstorm-modal"
import { BatchPlanModal } from "@/components/calendar/batch-plan-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { useScheduledPosts, useUpdateScheduledPost } from "@/features/scheduled-posts/api/queries"
import { useLatestPrediction } from "@/features/analytics/api/hooks"
import type { ScheduledPost } from "@/features/scheduled-posts/api/types"



/* Helpers                                                             */

/** Legacy pipeline fallback helper removed */

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
  const { clientId: selectedClientId, setClientId, client: activeClient, clients } = useActiveDashboard()

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
  const [brainstormOpen, setBrainstormOpen] = useState(false)
  const [batchPlanOpen, setBatchPlanOpen] = useState(false)

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

  // Posts are now loaded strictly from the factual database (useScheduledPosts)

  const {
    data: fetchedPosts = [],
    isPending: isPostsLoading,
    isError: isPostsError,
  } = useScheduledPosts(selectedClientId)
  const { mutate: updatePost } = useUpdateScheduledPost()
  const { data: prediction, isPending: isLoadingPrediction } = useLatestPrediction(selectedClientId)

  // Channels: data nyata dari client_channels via useActiveDashboard
  const connectedChannels = useMemo(
    () => (activeClient?.channels ?? []).filter((c) => c.status === "terhubung"),
    [activeClient?.channels]
  )
  const connectedCount = connectedChannels.length
  const connectedPlatforms = useMemo(
    () => [...new Set(connectedChannels.map((c) => c.platform))].join(", "),
    [connectedChannels]
  )
  
  const posts = useMemo<ScheduledPost[]>(() => {
    return [...fetchedPosts]
  }, [fetchedPosts])

  const release = useNextRelease(posts)

  const filteredPosts = useMemo(
    () =>
      platformFilter === "all" ? posts : posts.filter((p) => p.platform === platformFilter),
    [posts, platformFilter]
  )

  /* Calendar cursor (month/week navigation anchor) */
  const [cursor, setCursor] = useState(() => new Date())

  /* Week grid computation (7 days around cursor) */
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

  /* Month grid computation */
  const monthDays = useMemo(() => {
    const y = cursor.getFullYear()
    const m = cursor.getMonth()
    const firstDay = new Date(y, m, 1)
    const firstDayIndex = (firstDay.getDay() + 6) % 7 // Monday=0
    const totalDays = new Date(y, m + 1, 0).getDate()
    
    const days: Date[] = []
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(y, m, i))
    }
    return { firstDayIndex, days }
  }, [cursor])

  const monthLabel = useMemo(
    () =>
      cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [cursor]
  )

  /* Navigation: month mode moves by month, week mode moves by 7 days */
  const goPrev = useCallback(() => {
    setCursor((c) =>
      viewMode === "month"
        ? new Date(c.getFullYear(), c.getMonth() - 1, 1)
        : new Date(c.getFullYear(), c.getMonth(), c.getDate() - 7)
    )
  }, [viewMode])

  const goNext = useCallback(() => {
    setCursor((c) =>
      viewMode === "month"
        ? new Date(c.getFullYear(), c.getMonth() + 1, 1)
        : new Date(c.getFullYear(), c.getMonth(), c.getDate() + 7)
    )
  }, [viewMode])

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
      {/* Loading state */}
      {isPostsLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <span className="size-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-on-surface-variant font-medium">Memuat jadwal posting...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {isPostsError && (
        <div className="rounded-2xl border border-error/30 bg-error/5 p-6 space-y-3">
          <div className="flex items-center gap-2 text-error font-semibold">
            <Icons.alertCircle className="size-5" />
            <span>Gagal memuat jadwal</span>
          </div>
          <p className="text-sm text-on-surface-variant">Tidak bisa mengambil data posting. Periksa koneksi atau coba lagi.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-full bg-error text-on-error text-sm font-bold hover:bg-error/90 transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Main content (hanya tampilkan bila tidak loading/error) */}
      {!isPostsLoading && !isPostsError && (
      <>
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
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-primary/30 bg-primary-container/40 text-on-primary-container text-xs font-bold hover:bg-primary-container/60 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95">
              <Icons.sparkles className="size-[18px]" />
              AI Copilot
              <Icons.chevronDown className="size-3.5 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
              <DropdownMenuLabel className="text-xs text-on-primary-container font-bold flex items-center gap-2">
                <Icons.sparkles className="size-3.5" /> Frahma AI Actions
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setBrainstormOpen(true)}
                className="rounded-lg cursor-pointer py-2 text-xs font-medium"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-on-surface">Brainstorm Ideas</span>
                  <span className="text-[10px] text-on-surface-variant">Generate single content ideas</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setBatchPlanOpen(true)}
                className="rounded-lg cursor-pointer py-2 text-xs font-medium"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-on-surface">Auto-Fill Batch Plan</span>
                  <span className="text-[10px] text-on-surface-variant">Generate a full month of posts at once</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <BrainstormModal clientId={selectedClientId} open={brainstormOpen} onOpenChange={setBrainstormOpen} hideTrigger />
          <BatchPlanModal clientId={selectedClientId} open={batchPlanOpen} onOpenChange={setBatchPlanOpen} hideTrigger />

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
            onClick={goPrev}
            className="w-8 h-8 rounded-full border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-lowest))] flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
            aria-label={viewMode === "month" ? "Previous month" : "Previous week"}
          >
            <Icons.chevronLeft className="size-[18px]" />
          </button>
          <div className="flex items-center gap-2">
            <Icons.calendar className="size-5 text-secondary" />
            <span className="admin-headline-md font-bold text-on-surface">
              {viewMode === "month" ? monthLabel : `${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            </span>
          </div>
          <button
            onClick={goNext}
            className="w-8 h-8 rounded-full border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-lowest))] flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
            aria-label={viewMode === "month" ? "Next month" : "Next week"}
          >
            <Icons.chevronRight className="size-[18px]" />
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-[10px] font-bold hover:bg-surface-variant transition-colors"
          >
            Today
          </button>
        </div>

        {/* Platform Filter Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-on-surface-variant mr-1">
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
        <div className="bg-surface-container rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] text-on-surface-variant font-bold">
              Scheduled Flights (Month)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-on-surface">{filteredPosts.length} Posts</span>
              <span className="inline-flex items-center text-[12px] font-bold text-primary bg-primary-container/40 px-2 py-0.5 rounded-full">
                {filteredPosts.filter((p) => p.status === "published").length} published
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-container/30 flex items-center justify-center text-primary shrink-0">
            <Icons.rocket className="size-6" />
          </div>
        </div>

        {/* Metric 2: Slots Status */}
        <div className="bg-surface-container rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-on-surface-variant font-bold">
              Slots Status Pipeline
            </span>
            <span className="text-[10px] text-secondary font-bold">{filteredPosts.length} TOTAL</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {(() => {
              const publishedCount = filteredPosts.filter((p) => p.status === "published").length
              const scheduledCount = filteredPosts.filter((p) => p.status === "scheduled").length
              const draftCount = filteredPosts.filter((p) => p.status === "draft").length
              const total = filteredPosts.length || 1
              return (
                <>
                  <div className="flex-1 bg-surface-container-high h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-primary h-full" style={{ width: `${(publishedCount / total) * 100}%` }} title={`${publishedCount} Published`} />
                    <div className="bg-[#f59e0b] h-full" style={{ width: `${(scheduledCount / total) * 100}%` }} title={`${scheduledCount} Scheduled`} />
                    <div className="bg-outline-variant h-full" style={{ width: `${(draftCount / total) * 100}%` }} title={`${draftCount} Drafts`} />
                  </div>
                  <span className="text-[11px] font-bold text-on-surface-variant">{filteredPosts.length}</span>
                </>
              )
            })()}
          </div>
          <div className="flex justify-between text-[11px] text-on-surface-variant pt-0.5">
            <span className="flex items-center gap-1 font-semibold text-on-surface">
              <span className="w-2 h-2 rounded-full bg-primary" /> {filteredPosts.filter((p) => p.status === "published").length} Published
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> {filteredPosts.filter((p) => p.status === "scheduled").length} Scheduled
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-outline-variant" /> {filteredPosts.filter((p) => p.status === "draft").length} Drafts
            </span>
          </div>
        </div>

        {/* Metric 3: Next Up / Upcoming Slot (data nyata dari scheduled posts) */}
        <div className="admin-glass rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-on-surface-variant font-bold">
              Next Up
            </span>
            <p className="text-base font-bold text-on-surface truncate max-w-[180px]">
              {release ? release.label : "No flight scheduled"}
            </p>
            <p className="text-[11px] text-on-surface-variant flex items-center gap-1 truncate">
              <Icons.clock className="size-3.5 shrink-0" />
              {release ? `${release.platform} · ${release.title}` : "Schedule a post to fill this slot"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
            <Icons.clock className="size-6" />
          </div>
        </div>

        {/* Metric 4: Social Channels Status (data nyata dari client_channels) */}
        <div className="bg-surface-container rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-on-surface-variant font-bold">
              Social Channels
            </span>
            <p className="text-base font-bold text-on-surface flex items-center gap-2">
              <span>{connectedCount} Connected</span>
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  connectedCount > 0 ? "bg-emerald-500" : "bg-outline-variant"
                )}
              />
            </p>
            <p className="text-[11px] text-on-surface-variant truncate">
              {connectedCount > 0
                ? `${connectedPlatforms} ready to publish`
                : "No social account connected yet"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface shrink-0">
            <Icons.share className="size-6" />
          </div>
        </div>
      </div>

      {/* Dual-Stage Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Calendar Interface: 8 cols */}
        <div className="xl:col-span-8 space-y-4">
          <div className="admin-glass rounded-3xl p-5 shadow-sm overflow-hidden" data-calendar>

            {/* ===== MONTH VIEW ===== */}
            {viewMode === "month" && (
              <>
                <div className="grid grid-cols-7 gap-1.5 mb-3 pb-3 border-b border-outline-variant/30 text-center">
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                    <div key={d} className="text-[10px] text-on-surface-variant font-bold">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: monthDays.firstDayIndex }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="min-h-[6rem] rounded-xl bg-surface-container-lowest/30 border border-transparent" />
                  ))}
                  {monthDays.days.map((d) => {
                    const dayPosts = postsByDay.get(d.toDateString()) ?? []
                    const todayObj = new Date()
                    const isToday = d.getDate() === todayObj.getDate() && d.getMonth() === todayObj.getMonth() && d.getFullYear() === todayObj.getFullYear()
                    return (
                      <div
                        key={d.toISOString()}
                        className={cn(
                          "min-h-[6rem] rounded-xl p-1.5 border flex flex-col gap-1 transition-all group",
                          isToday
                            ? "bg-surface-container-lowest/90 border-secondary/40"
                            : "bg-surface-container-lowest/50 border-outline-variant/20 hover:border-outline"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-[10px] font-bold rounded-full size-5 flex items-center justify-center",
                            isToday ? "bg-secondary text-on-secondary" : "text-on-surface-variant"
                          )}>
                            {d.getDate()}
                          </span>
                          {dayPosts.length > 0 && (
                            <span className="text-[9px] font-bold text-on-surface-variant">{dayPosts.length}</span>
                          )}
                        </div>
                        <div className="space-y-1 overflow-hidden">
                          {dayPosts.slice(0, 2).map((p) => {
                            const meta = PLATFORM_META[p.platform] ?? PLATFORM_META.instagram
                            return (
                              <button
                                key={p.id}
                                onClick={() => handleSelectPost(p)}
                                className="w-full flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-left bg-surface-container-lowest border border-outline-variant/30 hover:border-secondary transition-all cursor-pointer truncate"
                              >
                                <span className={cn("size-1.5 rounded-full shrink-0", STATUS_META[p.status]?.dot ?? "bg-outline")} />
                                <span className="truncate text-on-surface">{p.title || p.content?.slice(0, 16)}</span>
                              </button>
                            )
                          })}
                          {dayPosts.length > 2 && (
                            <p className="text-[9px] text-outline text-center font-medium">
                              +{dayPosts.length - 2} more
                            </p>
                          )}
                        </div>
                        {dayPosts.length === 0 && (
                          <button
                            onClick={() => handleAddPost(d)}
                            className="mt-auto w-full py-0.5 rounded-md border border-dashed border-outline-variant/40 text-outline hover:text-secondary hover:border-secondary transition-all text-[9px] font-bold flex items-center justify-center gap-0.5 cursor-pointer"
                          >
                            <Icons.add className="size-3" /> Add
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* ===== WEEK VIEW (existing grid) ===== */}
            {viewMode === "week" && (
            <>
            {/* Calendar Day Header */}
            <div className="grid grid-cols-7 gap-2 mb-3 pb-3 border-b border-outline-variant/30 text-center">
              {weekDays.map((d, i) => (
                <div
                  key={i}
                  className="text-[10px] text-on-surface-variant font-bold"
                >
                  {d.toLocaleDateString("en-US", { weekday: "short" })}{" "}
                  <span className={cn(d.getDate() === new Date().getDate() ? "text-secondary" : "")}>{d.getDate()}</span>
                </div>
              ))}
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 gap-2 min-h-[560px]">
              {weekDays.map((d, i) => {
                const dayPosts = postsByDay.get(d.toDateString()) ?? []
                const todayObj = new Date()
                const isToday = d.getDate() === todayObj.getDate() && d.getMonth() === todayObj.getMonth() && d.getFullYear() === todayObj.getFullYear()
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
                        <span className="text-[11px] font-bold">
                          {isDarkFlight ? "Dark Flight" : "Free Dispatch Slot"}
                        </span>
                        {isDarkFlight && (
                          <span className="text-[10px] text-outline mt-0.5">No scheduled posts</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddPost(d)}
                        className="w-full py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary transition-all text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
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
                          "text-[10px] font-bold ",
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
                            className="rounded-xl p-2.5 border border-outline-variant/30 hover:shadow-md transition-all cursor-pointer bg-surface-container-lowest"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ",
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
                                "relative rounded-lg overflow-hidden h-20 mb-2 bg-surface-container",
                                p.platform === "linkedin" ? "bg-[#1e293b] text-white" : ""
                              )}
                            >
                              <div className="p-2 h-full flex flex-col justify-between">
                                <p className="text-[11px] font-bold leading-tight line-clamp-2">
                                  {p.title}
                                </p>
                                <p className="text-[10px] opacity-70 line-clamp-2 mt-1">{p.content}</p>
                              </div>
                            </div>
                            <p className="text-[12px] font-bold text-on-surface line-clamp-2 leading-tight">
                              {p.title}
                            </p>
                            <div className="mt-2 pt-1.5 border-t border-outline-variant/20 flex items-center justify-between">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 text-[10px] font-bold  px-1.5 py-0.5 rounded-full",
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
                      className="w-full mt-2 py-1 rounded-lg border border-dashed border-outline-variant/50 text-outline hover:text-on-surface hover:border-secondary hover:bg-surface-container transition-all text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Icons.add className="size-3.5" /> Add slot
                    </button>
                  </div>
                )
              })}
            </div>
            </>
            )}

            {/* ===== LIST VIEW ===== */}
            {viewMode === "list" && (
              <div className="space-y-2">
                {filteredPosts.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <p className="text-sm font-bold text-on-surface">No posts match the filters.</p>
                    <p className="text-xs text-on-surface-variant">Adjust your filters or schedule a new post.</p>
                  </div>
                ) : (
                  [...filteredPosts]
                    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                    .map((p) => {
                      const meta = PLATFORM_META[p.platform] ?? PLATFORM_META.instagram
                      const st = STATUS_META[p.status] ?? STATUS_META.scheduled
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleSelectPost(p)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest/60 border border-outline-variant/30 hover:border-secondary transition-all text-left cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                            <Icons.video className="size-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block text-xs font-bold text-on-surface truncate">
                              {p.title || p.content?.slice(0, 24)}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold", meta.badge)}>
                                {meta.label}
                              </span>
                              <span className="text-[10px] text-on-surface-variant">
                                {new Date(p.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                                {new Date(p.scheduled_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                          <span className={cn("shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full", st.pill)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} /> {st.label}
                          </span>
                        </button>
                      )
                    })
                )}
              </div>
            )}

            {/* Next Week Preview Bar */}
            <div className="mt-4 pt-3 border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-on-surface-variant font-bold">
                  Upcoming:
                </span>
                {posts.slice(0, 2).map((p, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-lowest border border-outline-variant/30 text-[12px] text-on-surface font-semibold max-w-[250px] truncate">
                    <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                    <span className="truncate">{p.title || p.content?.slice(0,20)}</span>
                  </span>
                ))}
              </div>
              <button
                onClick={() => setViewMode("month")}
                className="text-[10px] text-secondary hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <span>View Full Month Matrix</span>
                <Icons.arrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dispatch Queue & Approval Drawer: 4 cols */}
        <div className="xl:col-span-4 space-y-6">
          {/* Drawer Card: Today's Dispatches & Live Countdown */}
          <div className="bg-surface-container rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-on-surface">Today&apos;s Dispatches</h3>
              </div>
              <span className="text-[10px] bg-secondary-fixed text-secondary px-2.5 py-1 rounded-full font-bold">
                {todayStr}
              </span>
            </div>

            {/* Countdown Pill */}
            <div className="rounded-2xl bg-secondary-container text-on-secondary-container p-4 shadow-sm relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[9px] text-secondary-fixed-dim font-bold">
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
                <div className="w-12 h-12 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0">
                  <Icons.clock className="size-6" />
                </div>
              </div>
              {/* Fast Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/20 relative z-10">
                <span
                  aria-disabled="true"
                  className="bg-surface-container-high text-foreground/70 py-1.5 rounded-full text-[11px] font-semibold text-center cursor-not-allowed"
                >
                  Force Publish (Coming soon)
                </span>
                <span
                  aria-disabled="true"
                  className="bg-surface-container-high text-foreground/70 py-1.5 rounded-full text-[11px] font-semibold text-center cursor-not-allowed"
                >
                  Edit Media (Coming soon)
                </span>
                <span
                  aria-disabled="true"
                  className="bg-surface-container-high text-foreground/70 py-1.5 rounded-full text-[11px] font-semibold text-center cursor-not-allowed"
                >
                  Reschedule (Coming soon)
                </span>
              </div>
            </div>

            {/* Detailed Dispatch Metadata Card */}
            <div className="bg-surface-container-low rounded-2xl p-3.5 border border-outline-variant/40 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                  <Icons.video className="size-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-on-surface truncate">
                    {release?.title ?? "No upcoming posts"}
                  </p>
                  <p className="text-[11px] text-on-surface-variant truncate">
                    Scheduled for delivery
                  </p>
                </div>
              </div>
              <div className="text-[12px] text-on-surface-variant bg-surface-container/60 p-2.5 rounded-xl">
                <span className="font-bold text-on-surface">Content:</span> {release?.title || "No data"}
              </div>
            </div>
          </div>

          {/* Drawer Card: Deliverable Approval Gate */}
          <div className="bg-surface-container rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f59e0b] text-[20px]">
                  <Icons.alertCircle className="size-5 text-[#f59e0b]" />
                </span>
                <h3 className="text-lg font-bold text-on-surface">Approval Gate</h3>
              </div>
              <span className="text-[10px] bg-error-container text-error px-2 py-0.5 rounded-full font-bold">
                {posts.filter(p => p.status === "draft").length} Awaiting
              </span>
            </div>

            {posts.filter(p => p.status === "draft").length === 0 && (
              <p className="text-[12px] text-on-surface-variant text-center py-4">
                Tidak ada draft yang menunggu persetujuan.
              </p>
            )}

            {posts.filter(p => p.status === "draft").map((draft) => {
               const meta = PLATFORM_META[draft.platform] ?? PLATFORM_META.instagram
               return (
                <div key={draft.id} className="bg-surface-container-low rounded-2xl p-3.5 border border-outline-variant/30 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold ", meta.badge)}>
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">Due {new Date(draft.scheduled_at).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-[13px] font-bold text-on-surface">{draft.title || "No title"}</h4>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                      <Icons.page className="size-5 text-on-surface-variant" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/20">
                    <span
                      aria-disabled="true"
                      title="Revision requests are handled by your agency team over email for now."
                      className="flex-1 bg-surface-container-high text-foreground/70 py-1.5 rounded-full text-[10px] font-bold text-center cursor-not-allowed"
                    >
                      Request Revision (Coming soon)
                    </span>
                    <button
                      onClick={() =>
                        updatePost(
                          { id: draft.id, clientId: selectedClientId, status: "scheduled" },
                          {
                            onSuccess: () =>
                              toast.success("Approved", {
                                description: "The post is now scheduled on the calendar.",
                              }),
                            onError: () => toast.error("Could not approve the post. Please try again."),
                          }
                        )
                      }
                      className="flex-1 bg-primary-container hover:bg-primary-fixed text-on-primary-container py-1.5 rounded-full text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Approve
                    </button>
                  </div>
                </div>
               )
            })}
          </div>

          {/* AI Optimization Recommendation Card */}
          <div className="rounded-3xl p-5 bg-surface-container border border-primary/20 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold">
              {/* antislop-exception R-04: explicitly AI feature (Prediction) */}
              <Icons.bot className="size-5" />
              <span className="text-[10px] font-bold">Studio AI Prediction</span>
            </div>
            
            {isLoadingPrediction ? (
              <div className="py-4 flex justify-center">
                <Icons.spinner className="size-5 animate-spin text-primary" />
              </div>
            ) : prediction ? (
              <>
                <p className="text-[13px] font-bold text-on-surface leading-snug">
                  Target for {new Date(prediction.target_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  Predictive telemetry forecasts{" "}
                  <strong className="text-primary font-bold">{prediction.forecasted_reach.toLocaleString()} reach</strong> and{" "}
                  <strong className="text-primary font-bold">{prediction.estimated_roi_multiplier}x ROI multiplier</strong>{" "}
                  based on current engagement trends (confidence: {Math.round(prediction.confidence_score * 100)}%).
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-bold text-on-surface leading-snug">
                  Waiting for enough data
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  Prediction requires at least a week of telemetry data to establish a baseline.
                </p>
              </>
            )}

            <span
              aria-disabled="true"
              className="w-full bg-surface-container-high text-foreground/70 text-[11px] py-2.5 rounded-full font-semibold transition-all flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              <Icons.refresh className="size-4" />
              <span>Apply Suggestion (Coming soon)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Client Quick Switcher & Audit Footer */}
      <footer className="pt-6 pb-4 border-t border-outline-variant/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container rounded-2xl px-6 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] text-on-surface-variant font-bold">
              Agency Client Switcher:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setClientId(c.id)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer",
                    selectedClientId === c.id
                      ? "bg-primary-container text-on-primary-container shadow-xs flex items-center gap-1.5"
                      : "bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant/30"
                  )}
                >
                  {selectedClientId === c.id && <span className="w-2 h-2 rounded-full bg-primary" />}
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          {/* System Status Indicator */}
          <div className="flex items-center gap-4 text-[11px] text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <Icons.clock className="size-3.5" />
              <span>
                Scheduled posts sync via the publish worker
              </span>
            </div>
          </div>
        </div>
        {/* Copyright & Platform Stamp */}
        <div className="flex flex-wrap items-center justify-between text-[12px] text-on-surface-variant px-2">
          <p>FRHM © 2026. All rights reserved. Creative Media Operations Platform.</p>
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
      </>
      )}
    </div>
  )
}
