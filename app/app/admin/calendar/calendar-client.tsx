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
} from "@/components/animate-ui/components/radix/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/animate-ui/components/radix/alert-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { cn } from "@/lib/utils"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { useScheduledPosts, useUpdateScheduledPost } from "@/features/scheduled-posts/api/queries"
import { useLatestPrediction } from "@/features/analytics/api/hooks"
import type { ScheduledPost } from "@/features/scheduled-posts/api/types"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"



/* Helpers                                                             */

/** Legacy pipeline fallback helper removed */

const PLATFORM_META: Record<
  string,
  { label: string; icon: keyof typeof Icons; badge: string }
> = {
  instagram: { label: "REELS", icon: "video", badge: "bg-[hsl(var(--platform-instagram)/.1)] text-[hsl(var(--platform-instagram))]" },
  tiktok: { label: "TIKTOK", icon: "play", badge: "bg-[hsl(var(--platform-tiktok)/.1)] text-[hsl(var(--platform-tiktok))]" },
  shorts: { label: "SHORTS", icon: "video", badge: "bg-[hsl(var(--platform-youtube)/.1)] text-[hsl(var(--platform-youtube))]" },
  linkedin: { label: "LINKEDIN", icon: "bookOpen", badge: "bg-[hsl(var(--platform-linkedin)/.1)] text-[hsl(var(--platform-linkedin))]" },
}

const STATUS_META: Record<string, { label: string; pill: string; dot: string }> = {
  scheduled: {
    label: "Scheduled",
    pill: "bg-secondary/15 text-secondary",
    dot: "bg-secondary",
  },
  published: {
    label: "Approved",
    pill: "bg-primary-container text-primary",
    dot: "bg-primary",
  },
  draft: {
    label: "Draft",
    pill: "bg-card text-muted-foreground",
    dot: "bg-border",
  },
}

/** Ticking countdown to the next scheduled post. */
function useNextRelease(posts: ScheduledPost[]) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const next = useMemo(() => {
    if (!now) return posts[0] ?? null
    const upcoming = posts
      .filter((p) => p.status === "scheduled" && new Date(p.scheduled_at).getTime() > now)
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    return upcoming[0] ?? posts[0] ?? null
  }, [posts, now])

  const remaining = useMemo(() => {
    if (!next || !now) return null
    const diff = new Date(next.scheduled_at).getTime() - now
    const clamped = diff <= 0 ? 0 : diff
    const h = Math.floor(clamped / 3_600_000)
    const m = Math.floor((clamped % 3_600_000) / 60_000)
    const s = Math.floor((clamped % 60_000) / 1000)
    return {
      id: next.id,
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
  const [captionParam, setCaptionParam] = useQueryState("caption", parseAsString.withDefault(""))
  const [titleParam, setTitleParam] = useQueryState("title", parseAsString.withDefault(""))
  const [composeNew, setComposeNew] = useQueryState("new", parseAsString.withDefault(""))
  const [exportParam, setExportParam] = useQueryState("export", parseAsString.withDefault(""))

  const [dialogOpen, setDialogOpen] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | undefined>()
  const [initialTitle, setInitialTitle] = useState("")
  const [initialCaption, setInitialCaption] = useState("")
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [brainstormOpen, setBrainstormOpen] = useState(false)
  const [batchPlanOpen, setBatchPlanOpen] = useState(false)

  // Arriving from Media Library ("Use in Post") or AI Hook Modal: open the compose dialog with
  // the chosen asset and caption pre-filled, then clear the transient query params.
  useEffect(() => {
    if (composeNew === "1") {
      setEditingPost(null)
      setInitialDate(new Date())
      if (titleParam) {
        setInitialTitle(titleParam)
        void setTitleParam("")
      }
      if (captionParam) {
        setInitialCaption(captionParam)
        void setCaptionParam("")
      }
      setDialogOpen(true)
      void setComposeNew("")
    }
  }, [composeNew, setComposeNew, titleParam, setTitleParam, captionParam, setCaptionParam])

  // Deep-link `?export=1` (dari tombol "Quick Export" di header global):
  // buka modal ekspor kalender, lalu bersihkan param.
  useEffect(() => {
    if (exportParam === "1") {
      setExportOpen(true)
      void setExportParam("")
    }
  }, [exportParam, setExportParam])

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

  /* Icon for the soonest post, matching its real platform (not a generic video glyph). */
  const ReleaseIcon = Icons[(PLATFORM_META[release?.platform ?? ""] ?? PLATFORM_META.instagram).icon]

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

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const todayStr = useMemo(() => {
    if (!mounted) return ""
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }, [mounted])

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

  /* Drag & drop reschedule: dragging a post card onto another day cell moves its
   * scheduled_at to that day, preserving the original time of day. This is the
   * interaction the header promises; without it, changing a post's date meant
   * opening the composer and re-picking the date by hand.
   *
   * Keyboard/screen-reader users cannot drag, so the same move is also exposed
   * through a per-card menu ("Geser 1 hari" / "Geser 7 hari") that calls
   * movePostByDays. Both paths funnel through applyPostMove. */
  const [draggingPostId, setDraggingPostId] = useState<string | null>(null)
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null)

  /* Shared move routine: writes scheduled_at for `post`, preserving the
   * original time of day, with loading/success/error feedback. */
  const applyPostMove = useCallback(
    (post: ScheduledPost, targetDate: Date) => {
      const original = new Date(post.scheduled_at)
      const moved = new Date(targetDate)
      moved.setHours(original.getHours(), original.getMinutes(), 0, 0)
      if (moved.getTime() === original.getTime()) return

      const toastId = toast.loading("Sinkronisasi jadwal...")
      updatePost(
        { id: post.id, clientId: selectedClientId, scheduled_at: moved.toISOString() },
        {
          onSuccess: () => {
            toast.dismiss(toastId)
            toast.success("Jadwal dipindahkan.", {
              description: `${post.title} → ${moved.toLocaleDateString("id-ID", { day: "numeric", month: "long" })}`,
            })
          },
          onError: () => {
            toast.dismiss(toastId)
            toast.error("Gagal memindahkan jadwal. Coba lagi.")
          },
        }
      )
    },
    [selectedClientId, updatePost]
  )

  /* Keyboard-accessible equivalent of a drag: shift a post by N days. */
  const movePostByDays = useCallback(
    (post: ScheduledPost, days: number) => {
      const target = new Date(post.scheduled_at)
      target.setDate(target.getDate() + days)
      applyPostMove(post, target)
    },
    [applyPostMove]
  )

  const handlePostDragStart = useCallback((post: ScheduledPost, e: React.DragEvent) => {
    setDraggingPostId(post.id)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", post.id)
  }, [])

  const handlePostDragEnd = useCallback(() => {
    setDraggingPostId(null)
    setDragOverDate(null)
  }, [])

  const handleCellDragOver = useCallback(
    (date: Date, e: React.DragEvent) => {
      // Only react to an internal post drag, not stray external drags.
      if (!draggingPostId) return
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      setDragOverDate(date)
    },
    [draggingPostId]
  )

  /* `dragleave` also fires when the pointer crosses into a child element, which
   * made the drop-target highlight flicker while dragging over a cell that
   * already had post cards. Only clear when the pointer truly left the cell. */
  const handleCellDragLeave = useCallback((e: React.DragEvent) => {
    const isChild = e.currentTarget.contains(e.relatedTarget as Node | null)
    if (isChild) return
    setDragOverDate(null)
  }, [])

  const handleCellDrop = useCallback(
    (date: Date, e: React.DragEvent) => {
      e.preventDefault()
      const postId = e.dataTransfer.getData("text/plain") || draggingPostId
      setDragOverDate(null)
      setDraggingPostId(null)
      if (!postId) return

      const post = posts.find((p) => p.id === postId)
      if (!post) return

      applyPostMove(post, date)
    },
    [draggingPostId, posts, applyPostMove]
  )

  const handleSelectPost = useCallback((post: ScheduledPost) => {
    setEditingPost(post)
    setInitialDate(undefined)
    setDialogOpen(true)
  }, [])

  const handleEditMedia = useCallback(() => {
    // Pick the soonest scheduled post; fall back to the first post in view.
    const post = posts
      .filter((p) => p.status === "scheduled")
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]
      ?? posts[0]
    if (!post) {
      toast.error("Tidak ada post untuk diedit medianya")
      return
    }
    setEditingPost(post)
    setInitialDate(undefined)
    setDialogOpen(true)
  }, [posts])

  /* Reschedule: shift the release's scheduled_at forward by 1 day, preserving time of day. */
  const handleRescheduleRelease = useCallback(() => {
    if (!release) return
    const post = posts.find((p) => p.id === release.id)
    if (!post) return
    const target = new Date(post.scheduled_at)
    target.setDate(target.getDate() + 1)
    applyPostMove(post, target)
  }, [release, posts, applyPostMove])

  return (
    <PageContainer
      pageTitle="Multi-Channel Dispatch Schedule"
      pageDescription="Drag & drop posts across multi-channel publication schedule."
      pageHeaderAction={
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
                  <span className="font-bold text-card-foreground">Brainstorm Ideas</span>
                  <span className="text-2xs text-muted-foreground">Generate single content ideas</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setBatchPlanOpen(true)}
                className="rounded-lg cursor-pointer py-2 text-xs font-medium"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-card-foreground">Auto-Fill Batch Plan</span>
                  <span className="text-2xs text-muted-foreground">Generate a full month of posts at once</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            aria-label="Quick Export"
            className="flex items-center gap-1.5 px-3 py-1.5 lg:px-3.5 rounded-full border border-border/50 bg-[hsl(var(--admin-surface-lowest))] text-[hsl(var(--admin-on-surface))] text-xs font-semibold hover:bg-[hsl(var(--admin-surface-high))] transition-all active:scale-95 cursor-pointer h-auto"
          >
            <Icons.download className="size-4" />
            <span className="hidden sm:inline">Quick Export</span>
          </Button>
          <Button
            size="sm"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer h-auto"
            onClick={() => handleAddPost(new Date())}
          >
            <Icons.send className="size-[18px]" />
            Schedule New Dispatch
          </Button>
        </div>
      }
      className="space-y-6"
    >
      {/* Loading state */}
      {isPostsLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <span className="size-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Memuat jadwal posting...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {isPostsError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-3">
          <div className="flex items-center gap-2 text-destructive font-semibold">
            <Icons.alertCircle className="size-5" />
            <span>Gagal memuat jadwal</span>
          </div>
          <p className="text-sm text-muted-foreground">Tidak bisa mengambil data posting. Periksa koneksi atau coba lagi.</p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer"
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Main content (hanya tampilkan bila tidak loading/error) */}
      {!isPostsLoading && !isPostsError && (
      <>
      <BrainstormModal clientId={selectedClientId} open={brainstormOpen} onOpenChange={setBrainstormOpen} hideTrigger />
      <BatchPlanModal open={batchPlanOpen} onOpenChange={setBatchPlanOpen} hideTrigger />

      {/* Sub-Header Control Bar */}
      <div className="px-6 py-3.5 bg-[hsl(var(--admin-surface))]/60 backdrop-blur-md border border-[hsl(var(--admin-outline-variant))]/30 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
        {/* View Switcher */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList
            highlightClassName="rounded-full bg-secondary text-on-secondary shadow-xs"
            className="bg-[hsl(var(--admin-surface-low))] p-1 rounded-full border border-[hsl(var(--admin-outline-variant))]/40 shadow-inner h-auto"
          >
            {VIEW_TABS.map((v) => (
              <TabsTrigger
                key={v}
                value={v}
                className="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 data-[state=active]:text-on-secondary data-[state=active]:font-extrabold min-h-11"
              >
                {v === "list" && <Icons.activity className="size-4" />}
                {v === "month" ? "Month View" : v === "week" ? "Week View" : "List / Gantt Timeline"}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Navigation & Month Selector */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={goPrev}
            className="size-8 rounded-full border border-border/40 bg-[hsl(var(--admin-surface-lowest))] flex items-center justify-center text-card-foreground hover:bg-card/60 hover:border-border transition-colors cursor-pointer"
            aria-label={viewMode === "month" ? "Previous month" : "Previous week"}
          >
            <Icons.chevronLeft className="size-[18px]" />
          </Button>
          <div className="flex items-center gap-2">
            <Icons.calendar className="size-5 text-secondary" />
            <span suppressHydrationWarning className="admin-headline-md font-bold text-card-foreground">
              {viewMode === "month" ? monthLabel : `${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={goNext}
            className="size-8 rounded-full border border-border/40 bg-[hsl(var(--admin-surface-lowest))] flex items-center justify-center text-card-foreground hover:bg-card/60 hover:border-border transition-colors cursor-pointer"
            aria-label={viewMode === "month" ? "Next month" : "Next week"}
          >
            <Icons.chevronRight className="size-[18px]" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setCursor(new Date())}
            className="px-3 py-1 rounded-full bg-card/60 text-card-foreground text-2xs font-bold hover:bg-muted transition-colors cursor-pointer h-auto"
          >
            Today
          </Button>
        </div>

        {/* Platform Filter Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-2xs font-bold text-muted-foreground mr-1">
            Platform:
          </span>
          <Tabs value={platformFilter} onValueChange={(p) => setPlatformFilter(p as any)}>
            <TabsList
              highlightClassName="rounded-full bg-card-foreground text-card shadow-xs"
              className="p-1 bg-[hsl(var(--admin-surface-low))] border border-[hsl(var(--admin-outline-variant))]/40 rounded-full gap-1 h-auto"
            >
              {PLATFORM_FILTERS.map((p) => (
                <TabsTrigger
                  key={p}
                  value={p}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 capitalize cursor-pointer data-[state=active]:text-card min-h-11"
                >
                  {p === "all" ? "All (5)" : p}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Top Metric Strip / Flight Pace Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1: Scheduled Flights */}
        <div className="bg-card/60 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-2xs text-muted-foreground font-bold">
              Scheduled Flights (Month)
            </span>
            <div className="flex items-baseline gap-2">
              <MetricTicker value={`${filteredPosts.length} Posts`} className="text-2xl font-bold text-card-foreground" />
              <span className="inline-flex items-center text-xs font-bold text-primary bg-primary-container/40 px-2 py-0.5 rounded-full">
                <MetricTicker value={`${filteredPosts.filter((p) => p.status === "published").length}`} className="mr-1" /> published
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-container/30 flex items-center justify-center text-primary shrink-0">
            <Icons.rocket className="size-6" />
          </div>
        </div>

        {/* Metric 2: Slots Status */}
        <div className="bg-card/60 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-2xs text-muted-foreground font-bold">
              Slots Status Pipeline
            </span>
            <span className="text-2xs text-secondary font-bold flex items-center gap-1">
              <MetricTicker value={filteredPosts.length} /> TOTAL
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {(() => {
              const publishedCount = filteredPosts.filter((p) => p.status === "published").length
              const scheduledCount = filteredPosts.filter((p) => p.status === "scheduled").length
              const draftCount = filteredPosts.filter((p) => p.status === "draft").length
              const total = filteredPosts.length || 1
              return (
                <>
                  <div className="flex-1 bg-card/60 h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-primary h-full" style={{ width: `${(publishedCount / total) * 100}%` }} title={`${publishedCount} Published`} />
                    <div className="bg-secondary h-full" style={{ width: `${(scheduledCount / total) * 100}%` }} title={`${scheduledCount} Scheduled`} />
                    <div className="bg-border h-full" style={{ width: `${(draftCount / total) * 100}%` }} title={`${draftCount} Drafts`} />
                  </div>
                  <MetricTicker value={filteredPosts.length} className="text-1xs font-bold text-muted-foreground" />
                </>
              )
            })()}
          </div>
          <div className="flex justify-between text-1xs text-muted-foreground pt-0.5">
            <span className="flex items-center gap-1 font-semibold text-card-foreground">
              <span className="w-2 h-2 rounded-full bg-primary" /> <MetricTicker value={filteredPosts.filter((p) => p.status === "published").length} /> Published
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary" /> <MetricTicker value={filteredPosts.filter((p) => p.status === "scheduled").length} /> Scheduled
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-border" /> <MetricTicker value={filteredPosts.filter((p) => p.status === "draft").length} /> Drafts
            </span>
          </div>
        </div>

        {/* Metric 3: Next Up / Upcoming Slot (data nyata dari scheduled posts) */}
        <div className="admin-glass rounded-2xl p-4 flex items-center justify-between ring-1 ring-primary/30">
          <div className="space-y-1">
            <span className="text-2xs text-muted-foreground font-bold">
              Next Up
            </span>
            <p suppressHydrationWarning className="text-base font-bold text-card-foreground truncate max-w-[180px]">
              {release ? release.label : "No flight scheduled"}
            </p>
            <p className="text-1xs text-muted-foreground flex items-center gap-1 truncate">
              <Icons.clock className="size-3.5 shrink-0" />
              {release ? `${release.platform} · ${release.title}` : "Schedule a post to fill this slot"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center text-secondary shrink-0">
            <Icons.clock className="size-6" />
          </div>
        </div>

        {/* Metric 4: Social Channels Status (data nyata dari client_channels) */}
        <div className="bg-card/60 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-2xs text-muted-foreground font-bold">
              Social Channels
            </span>
            <p className="text-base font-bold text-card-foreground flex items-center gap-2">
              <span className="flex items-center gap-1"><MetricTicker value={connectedCount} /> Connected</span>
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  connectedCount > 0 ? "bg-[hsl(var(--success))]" : "bg-border"
                )}
              />
            </p>
            <p className="text-1xs text-muted-foreground truncate">
              {connectedCount > 0
                ? `${connectedPlatforms} ready to publish`
                : "No social account connected yet"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-card/60 flex items-center justify-center text-card-foreground shrink-0">
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
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-3 pb-3 border-b border-border/30 text-center">
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                    <div key={d} className="text-2xs text-muted-foreground font-bold">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {Array.from({ length: monthDays.firstDayIndex }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="min-h-[6rem] rounded-xl bg-card/30 border border-transparent" />
                  ))}
                  {monthDays.days.map((d) => {
                    const dayPosts = postsByDay.get(d.toDateString()) ?? []
                    const todayObj = new Date()
                    const isToday = d.getDate() === todayObj.getDate() && d.getMonth() === todayObj.getMonth() && d.getFullYear() === todayObj.getFullYear()
                    const isDragOver = dragOverDate?.toDateString() === d.toDateString()
                    return (
                      <div
                        key={d.toISOString()}
                        onDragOver={(e) => {
                          e.preventDefault()
                          handleCellDragOver(d, e)
                        }}
                        onDragLeave={handleCellDragLeave}
                        onDrop={(e) => handleCellDrop(d, e)}
                        className={cn(
                          "min-h-[6rem] rounded-xl p-1 sm:p-1.5 border flex flex-col gap-1 transition-all group",
                          isToday
                            ? "bg-card/90 border-secondary/40"
                            : "bg-card/50 border-border/20 hover:border-border",
                          isDragOver && "border-primary ring-2 ring-primary/30 bg-primary/5"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-2xs font-bold rounded-full size-5 flex items-center justify-center",
                            isToday ? "bg-secondary text-on-secondary" : "text-muted-foreground"
                          )}>
                            {d.getDate()}
                          </span>
                          {dayPosts.length > 0 && (
                            <span className="text-2xs font-bold text-muted-foreground">{dayPosts.length}</span>
                          )}
                        </div>
                        <div className="space-y-1 overflow-hidden">
                          {dayPosts.slice(0, 2).map((p) => {
                            const meta = PLATFORM_META[p.platform] ?? PLATFORM_META.instagram
                            return (
                              <button
                                key={p.id}
                                draggable
                                onDragStart={(e) => handlePostDragStart(p, e)}
                                onDragEnd={handlePostDragEnd}
                                onClick={() => handleSelectPost(p)}
                                aria-label={`${p.title || "Postingan"}, ${meta.label}. Tekan Enter untuk membuka.`}
                                className={cn(
                                  "w-full flex items-center gap-1 px-1.5 py-0.5 rounded-md text-2xs font-bold text-left bg-card border border-border/30 hover:border-secondary transition-all cursor-grab active:cursor-grabbing truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                  draggingPostId === p.id && "opacity-40"
                                )}
                              >
                                <span className={cn("size-1.5 rounded-full shrink-0", STATUS_META[p.status]?.dot ?? "bg-border")} />
                                <span className="truncate text-card-foreground">{p.title || p.content?.slice(0, 16)}</span>
                              </button>
                            )
                          })}
                          {dayPosts.length > 2 && (
                            <p className="text-2xs text-border text-center font-medium">
                              <span aria-hidden="true">+{dayPosts.length - 2} more</span>
                              <span className="sr-only">
                                {dayPosts.length - 2} postingan lagi pada hari ini
                              </span>
                            </p>
                          )}
                        </div>
                        {dayPosts.length === 0 && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddPost(d)
                            }}
                            className="mt-auto w-full py-1 h-auto rounded-md border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary transition-all text-2xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Icons.add className="size-3" /> Add Post
                          </Button>
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
            <div className="grid grid-cols-7 gap-2 mb-3 pb-3 border-b border-border/30 text-center">
              {weekDays.map((d, i) => (
                <div
                  key={i}
                  className="text-2xs text-muted-foreground font-bold"
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
                const isDragOver = dragOverDate?.toDateString() === d.toDateString()

                if (dayPosts.length === 0) {
                  return (
                    <div
                      key={i}
                      onDragOver={(e) => {
                        e.preventDefault()
                        handleCellDragOver(d, e)
                      }}
                      onDragLeave={handleCellDragLeave}
                      onDrop={(e) => handleCellDrop(d, e)}
                      className={cn(
                        "rounded-2xl p-2.5 border flex flex-col justify-between group transition-all",
                        isDarkFlight
                          ? "bg-card/40 border-border/20"
                          : "bg-card/60 border-border/30 hover:border-border",
                        isDragOver && "border-primary ring-2 ring-primary/30 bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground font-bold">{d.getDate()}</span>
                        <span className="text-2xs text-border">Open</span>
                      </div>
                      <div className="h-full flex flex-col items-center justify-center py-8 text-center text-border group-hover:text-muted-foreground">
                        <span className="text-1xs font-bold">
                          {isDarkFlight ? "Dark Flight" : "Free Dispatch Slot"}
                        </span>
                        {isDarkFlight && (
                          <span className="text-2xs text-border mt-0.5">No scheduled posts</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleAddPost(d)}
                        className="w-full py-1.5 h-auto rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary transition-all text-1xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                      >
                        <Icons.add className="size-3.5" /> Quick Slot
                      </Button>
                    </div>
                  )
                }

                return (
                  <div
                    key={i}
                    onDragOver={(e) => {
                      e.preventDefault()
                      handleCellDragOver(d, e)
                    }}
                    onDragLeave={handleCellDragLeave}
                    onDrop={(e) => handleCellDrop(d, e)}
                    className={cn(
                      "rounded-2xl p-2.5 border-2 flex flex-col justify-between group transition-all",
                      isToday
                        ? "bg-card/90 border-secondary/40 shadow-xs hover:border-secondary"
                        : "bg-card/60 border-border/30 hover:border-border",
                      isDragOver && "border-primary ring-2 ring-primary/30 bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      {isToday ? (
                        <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary text-xs flex items-center justify-center font-bold">
                          {d.getDate()}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-bold">{d.getDate()}</span>
                      )}
                      <span
                        className={cn(
                          "text-2xs font-bold hidden sm:inline",
                          isToday ? "text-secondary" : "text-muted-foreground"
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
                        const PlatformIcon = Icons[meta.icon]
                        const time = new Date(p.scheduled_at).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        return (
                          <div
                            key={p.id}
                            draggable
                            onDragStart={(e) => handlePostDragStart(p, e)}
                            onDragEnd={handlePostDragEnd}
                            onClick={() => handleSelectPost(p)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                handleSelectPost(p)
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`${p.title || "Postingan"}, ${meta.label}, ${time}. Tekan Enter untuk membuka.`}
                            className={cn(
                              "rounded-xl p-2.5 border transition-all cursor-grab active:cursor-grabbing bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                              p.status === "draft"
                                ? "border-dashed border-border/60 hover:border-border"
                                : "border-border/30 hover:border-secondary/50 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
                              draggingPostId === p.id && "opacity-40"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold ",
                                  meta.badge
                                )}
                              >
                                <PlatformIcon className="size-3" /> {meta.label}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <span suppressHydrationWarning className="text-1xs text-muted-foreground font-medium">{time}</span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    aria-label={`Opsi untuk ${p.title || "postingan ini"}`}
                                    onClick={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="p-0.5 rounded-md text-muted-foreground hover:bg-card/60 hover:text-card-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                  >
                                    <Icons.ellipsis className="size-3.5" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel>Pindahkan jadwal</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => movePostByDays(p, -1)}>
                                      <Icons.chevronLeft className="size-4" /> Geser 1 hari lebih awal
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => movePostByDays(p, 1)}>
                                      <Icons.chevronRight className="size-4" /> Geser 1 hari lebih lambat
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => movePostByDays(p, -7)}>
                                      <Icons.chevronsLeft className="size-4" /> Geser 1 minggu lebih awal
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => movePostByDays(p, 7)}>
                                      <Icons.chevronsRight className="size-4" /> Geser 1 minggu lebih lambat
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleSelectPost(p)}>
                                      <Icons.edit className="size-4" /> Buka editor
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            {/* Thumbnail / media block: title only, keeps the card scannable.
                             * The caption lives once, in the footer snippet below. */}
                            <div
                              className={cn(
                                "relative rounded-lg overflow-hidden h-20 mb-2 bg-card/60 flex items-center",
                                p.platform === "linkedin" ? "bg-[hsl(var(--platform-linkedin))] text-white" : ""
                              )}
                            >
                              <div className="p-2 h-full flex items-center">
                                <p className="text-1xs font-bold leading-tight line-clamp-3">
                                  {p.title}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 pt-1.5 border-t border-border/20 flex items-center justify-between">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 text-2xs font-bold  px-1.5 py-0.5 rounded-full",
                                  st.pill
                                )}
                              >
                                <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} /> {st.label}
                              </span>
                              <span className="text-2xs text-muted-foreground">
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
                      className="w-full mt-2 py-1 rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary transition-all text-1xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-11"
                    >
                      <Icons.add className="size-3.5" /> Add Post
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
                    <p className="text-sm font-bold text-card-foreground">No posts match the filters.</p>
                    <p className="text-xs text-muted-foreground">Adjust your filters or schedule a new post.</p>
                  </div>
                ) : (
                  [...filteredPosts]
                    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                    .map((p) => {
                      const meta = PLATFORM_META[p.platform] ?? PLATFORM_META.instagram
                      const st = STATUS_META[p.status] ?? STATUS_META.scheduled
                      const ListIcon = Icons[meta.icon]
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleSelectPost(p)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card/60 border border-border/30 hover:border-secondary transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <div className="w-10 h-10 rounded-xl bg-card/60 flex items-center justify-center shrink-0">
                            <ListIcon className="size-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block text-xs font-bold text-card-foreground truncate">
                              {p.title || p.content?.slice(0, 24)}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-2xs font-bold", meta.badge)}>
                                {meta.label}
                              </span>
                              <span suppressHydrationWarning className="text-2xs text-muted-foreground">
                                {new Date(p.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                                {new Date(p.scheduled_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                          <span className={cn("shrink-0 inline-flex items-center gap-1 text-2xs font-bold px-1.5 py-0.5 rounded-full", st.pill)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} /> {st.label}
                          </span>
                        </button>
                      )
                    })
                )}
              </div>
            )}

            {/* Next Week Preview Bar */}
            <div className="mt-4 pt-3 border-t border-border/30 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xs text-muted-foreground font-bold">
                  Upcoming:
                </span>
                {posts.slice(0, 2).map((p, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-card border border-border/30 text-xs text-card-foreground font-semibold max-w-[250px] truncate">
                    <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                    <span className="truncate">{p.title || p.content?.slice(0,20)}</span>
                  </span>
                ))}
              </div>
              <Button
                variant="link"
                size="sm"
                onClick={() => setViewMode("month")}
                className="text-2xs text-secondary hover:underline flex items-center gap-1 font-bold cursor-pointer p-0 h-auto"
              >
                <span>View Full Month Matrix</span>
                <Icons.arrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Dispatch Queue & Approval Drawer: 4 cols */}
        <div className="xl:col-span-4 space-y-6">
          {/* Drawer Card: Today's Dispatches & Live Countdown */}
          <div className="bg-card/60 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-card-foreground">Today&apos;s Dispatches</h3>
              </div>
              <span suppressHydrationWarning className="text-2xs bg-secondary/15 text-secondary px-2.5 py-1 rounded-full font-bold">
                {todayStr}
              </span>
            </div>

            {/* Countdown Pill */}
            <div className="rounded-2xl bg-secondary-container text-on-secondary-container p-4 shadow-sm relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-2xs text-secondary-foreground font-bold">
                    Next Flight Countdown
                  </span>
                  <p suppressHydrationWarning className="text-2xl font-bold tracking-tight text-white mt-0.5 tabular-nums">
                    {release ? release.label : "-"}
                  </p>
                  <p className="text-1xs text-on-secondary-container mt-1 flex items-center gap-1.5 truncate">
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      disabled={!release}
                      className="bg-card/60 hover:bg-muted text-foreground py-1.5 rounded-full text-1xs font-semibold text-center transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-11"
                    >
                      Force Publish
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Publish Now?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will force-publish &quot;{release?.title}&quot; immediately. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batalkan</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          release &&
                          updatePost(
                            { id: release.id, clientId: selectedClientId, status: "published" },
                            {
                              onSuccess: () => toast.success("Published", { description: `"${release.title}" is now live.` }),
                              onError: () => toast.error("Gagal publish postingan."),
                            }
                          )
                        }
                      >
                        Publikasikan Sekarang
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleEditMedia}
                  className="bg-primary-container hover:bg-primary-fixed text-on-primary-container py-1.5 rounded-full text-1xs font-semibold text-center transition-all shadow-xs cursor-pointer h-auto"
                >
                  Edit Media
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleRescheduleRelease}
                  disabled={!release}
                  className="bg-card/60 hover:bg-card/60/80 text-foreground py-1.5 rounded-full text-1xs font-semibold text-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-auto"
                >
                  Reschedule (+1 day)
                </Button>
              </div>
            </div>

            {/* Detailed Dispatch Metadata Card */}
            <div className="bg-card/60 rounded-2xl p-3.5 border border-border/40 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-card/60 flex items-center justify-center shrink-0">
                  <ReleaseIcon className="size-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs-plus font-bold text-card-foreground truncate">
                    {release?.title ?? "No upcoming posts"}
                  </p>
                  <p className="text-1xs text-muted-foreground truncate">
                    Scheduled for delivery
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-card/60/60 p-2.5 rounded-xl">
                <span className="font-bold text-card-foreground">Content:</span> {release?.title || "No data"}
              </div>
            </div>
          </div>

          {/* Drawer Card: Deliverable Approval Gate */}
          <div className="bg-card/60 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icons.alertCircle className="size-5 text-warning" />
                <h3 className="text-lg font-bold text-card-foreground">Approval Gate</h3>
              </div>
              <span className="text-2xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-bold">
                {posts.filter(p => p.status === "draft").length} Awaiting
              </span>
            </div>

            {posts.filter(p => p.status === "draft").length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Tidak ada draft yang menunggu persetujuan.
              </p>
            )}

            {posts.filter(p => p.status === "draft").map((draft) => {
               const meta = PLATFORM_META[draft.platform] ?? PLATFORM_META.instagram
               return (
                <div key={draft.id} className="bg-card/60 rounded-2xl p-3.5 border border-border/30 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={cn("px-2 py-0.5 rounded-full text-2xs font-bold ", meta.badge)}>
                          {meta.label}
                        </span>
                        <span className="text-1xs text-muted-foreground">Due {new Date(draft.scheduled_at).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-xs-plus font-bold text-card-foreground">{draft.title || "No title"}</h4>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-card/60 flex items-center justify-center shrink-0">
                      <Icons.page className="size-5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() =>
                        updatePost(
                          { id: draft.id, clientId: selectedClientId, status: "draft" },
                          {
                            onSuccess: () => toast.info("Revision requested", { description: "Email notification sent to agency team." }),
                            onError: () => toast.error("Gagal mengirim request revisi."),
                          }
                        )
                      }
                      className="flex-1 bg-card/60 hover:bg-muted text-foreground py-1.5 rounded-full text-2xs font-bold text-center transition-all shadow-xs cursor-pointer h-auto"
                    >
                      Request Revision
                    </Button>
                    <Button
                      variant="default"
                      size="xs"
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
                      className="flex-1 bg-primary-container hover:bg-primary-fixed text-on-primary-container py-1.5 rounded-full text-2xs font-bold transition-all shadow-xs cursor-pointer h-auto"
                    >
                      Approve
                    </Button>
                  </div>
                </div>
               )
            })}
          </div>

          {/* AI Optimization Recommendation Card */}
          <div className="rounded-3xl p-5 bg-card/60 border border-primary/20 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold">
              {/* antislop-exception R-04: explicitly AI feature (Prediction) */}
              <Icons.bot className="size-5" />
              <span className="text-2xs font-bold">Studio AI Prediction</span>
            </div>
            
            {isLoadingPrediction ? (
              <div className="py-4 flex justify-center">
                <Icons.spinner className="size-5 animate-spin text-primary" />
              </div>
            ) : prediction ? (
              <>
                <p className="text-xs-plus font-bold text-card-foreground leading-snug">
                  Target for {new Date(prediction.target_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <p className="text-1xs text-muted-foreground">
                  Predictive telemetry forecasts{" "}
                  <strong className="text-primary font-bold">{prediction.forecasted_reach.toLocaleString()} reach</strong> and{" "}
                  <strong className="text-primary font-bold">{prediction.estimated_roi_multiplier}x ROI multiplier</strong>{" "}
                  based on current engagement trends (confidence: {Math.round(prediction.confidence_score * 100)}%).
                </p>
              </>
            ) : (
              <>
                <p className="text-xs-plus font-bold text-card-foreground leading-snug">
                  Waiting for enough data
                </p>
                <p className="text-1xs text-muted-foreground">
                  Prediction requires at least a week of telemetry data to establish a baseline.
                </p>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Suggestion feature", { description: "Content suggestions require a higher tiered subscription." })}
              className="w-full bg-card/60 hover:bg-muted text-foreground text-1xs py-2.5 rounded-full font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs h-auto"
            >
              <Icons.refresh className="size-4" />
              <span>Apply Suggestion</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Client Quick Switcher & Audit Footer */}
      <footer className="pt-6 pb-4 border-t border-border/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-card/60 rounded-2xl px-6 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xs text-muted-foreground font-bold">
              Agency Client Switcher:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {clients.map((c) => (
                <Button
                  key={c.id}
                  variant="ghost"
                  size="xs"
                  onClick={() => setClientId(c.id)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer h-auto",
                    selectedClientId === c.id
                      ? "bg-primary-container text-on-primary-container shadow-xs flex items-center gap-1.5 hover:bg-primary-container/90"
                      : "bg-card hover:bg-card/60 text-card-foreground border border-border/30"
                  )}
                >
                  {selectedClientId === c.id && <span className="w-2 h-2 rounded-full bg-primary" />}
                  {c.name}
                </Button>
              ))}
            </div>
          </div>
          {/* System Status Indicator */}
          <div className="flex items-center gap-4 text-1xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Icons.clock className="size-3.5" />
              <span>
                Scheduled posts sync via the publish worker
              </span>
            </div>
          </div>
        </div>
        {/* Copyright & Platform Stamp */}
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground px-2">
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
          void setCaptionParam("")
          void setTitleParam("")
          setInitialCaption("")
          setInitialTitle("")
        }}
        initialDate={initialDate}
        editingPost={editingPost}
        clientId={selectedClientId}
        initialTitle={initialTitle || undefined}
        initialMediaUrl={mediaUrl || undefined}
        initialContent={initialCaption || undefined}
        onSave={() => {
          toast.success("Refreshed")
        }}
        onDelete={() => {
          toast.success("Refreshed")
        }}
      />
      </>
      )}
    </PageContainer>
  )
}
