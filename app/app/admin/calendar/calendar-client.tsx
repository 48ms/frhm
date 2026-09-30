"use client"

import { useMemo, useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { parseAsStringEnum, parseAsString, useQueryState } from "nuqs"
import { Icons } from "@/components/icons"
import { calendarService } from "@/features/calendar/service"
import { calendarKeys, scheduledPostsQueryOptions } from "@/features/calendar/queries"
import { CalendarView } from "@/components/calendar/calendar-view"
import { toast } from "sonner"
import { type ScheduledPost, type ScheduledPostUpdate } from "@/features/calendar/types"
import { PostDialog } from "@/components/calendar/post-dialog"
import { CalendarExportModal } from "@/components/calendar/calendar-export-modal"
import { cn } from "@/lib/utils"

export type ClientOption = { id: string; name: string }

const STATUS_FILTERS = ["all", "scheduled", "published", "draft", "failed", "cancelled"] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

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
    return upcoming[0] ?? null
  }, [posts, now])

  const remaining = useMemo(() => {
    if (!next) return null
    const diff = new Date(next.scheduled_at).getTime() - now
    if (diff <= 0) return null
    const h = Math.floor(diff / 3_600_000)
    const m = Math.floor((diff % 3_600_000) / 60_000)
    const s = Math.floor((diff % 60_000) / 1000)
    return {
      label: [h, m, s].map((n) => String(n).padStart(2, "0")).join(":"),
      title: next.title,
      platform: next.platform,
    }
  }, [next, now])

  return remaining
}

export function AdminCalendarClient({ clients }: { clients: ClientOption[] }) {
  const queryClient = useQueryClient()
  const [selectedClientId, setSelectedClientId] = useQueryState(
    "clientId",
    parseAsString.withDefault(clients[0]?.id ?? "")
  )
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum<StatusFilter>([...STATUS_FILTERS]).withDefault("all")
  )
  const [viewMode, setViewMode] = useQueryState(
    "view",
    parseAsStringEnum(["month", "week", "list"]).withDefault("month")
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | undefined>()
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const { data: posts = [] } = useQuery(scheduledPostsQueryOptions(selectedClientId))
  const release = useNextRelease(posts)

  const filteredPosts = useMemo(
    () => (statusFilter === "all" ? posts : posts.filter((p) => p.status === statusFilter)),
    [posts, statusFilter]
  )

  const activeClient = clients.find((c) => c.id === selectedClientId) ?? clients[0]

  const invalidatePosts = () => {
    queryClient.invalidateQueries({ queryKey: calendarKeys.list(selectedClientId) })
  }

  const handleAddPost = (date: Date) => {
    setInitialDate(date)
    setEditingPost(null)
    setDialogOpen(true)
  }

  const handleClientChange = (value: string) => {
    if (!value) return
    setSelectedClientId(value)
  }

  const handleSelectPost = (post: ScheduledPost) => {
    setEditingPost(post)
    setInitialDate(undefined)
    setDialogOpen(true)
  }

  const handleUpdatePost = async (postId: string, data: ScheduledPostUpdate) => {
    const queryKey = calendarKeys.list(selectedClientId)
    const previousPosts = queryClient.getQueryData<ScheduledPost[]>(queryKey) ?? []

    queryClient.setQueryData<ScheduledPost[]>(queryKey, (old = []) =>
      old.map((p) => (p.id === postId ? { ...p, ...data } : p))
    )

    try {
      await calendarService.movePost(postId, data)
    } catch (err) {
      console.error("Failed to update post:", err)
      queryClient.setQueryData(queryKey, previousPosts)
      toast.error("Gagal memindahkan post", {
        description: "Terjadi kesalahan jaringan atau sinkronisasi.",
      })
    }
  }

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
            <Icons.add className="size-[18px]" />
            New Post
          </button>
        </div>
      </div>

      {/* Sub-Header Control Bar: Views & Filters */}
      <div className="px-6 py-3.5 bg-[hsl(var(--admin-surface))]/60 backdrop-blur-md border border-[hsl(var(--admin-outline-variant))]/30 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-[hsl(var(--admin-surface-low))] p-1 rounded-full border border-[hsl(var(--admin-outline-variant))]/40 shadow-inner">
          <button
            onClick={() => setViewMode("month")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              viewMode === "month"
                ? "bg-[hsl(var(--admin-cobalt))] text-white shadow-sm"
                : "text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))]"
            )}
          >
            Month View
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              viewMode === "week"
                ? "bg-[hsl(var(--admin-cobalt))] text-white shadow-sm"
                : "text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))]"
            )}
          >
            Week View
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              viewMode === "list"
                ? "bg-[hsl(var(--admin-cobalt))] text-white shadow-sm"
                : "text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))]"
            )}
          >
            <Icons.activity className="size-4" />
            List / Gantt
          </button>
        </div>

        {/* Client Switcher & Status Filter */}
        <div className="flex items-center gap-3">
          <select
            value={selectedClientId}
            onChange={(e) => handleClientChange(e.target.value)}
            className="h-9 px-3 rounded-full bg-[hsl(var(--admin-surface-low))] border border-[hsl(var(--admin-outline-variant))]/40 text-xs font-bold text-[hsl(var(--admin-on-surface))] outline-none focus:border-[hsl(var(--admin-cobalt))]"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                Client: {c.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="h-9 px-3 rounded-full bg-[hsl(var(--admin-surface-low))] border border-[hsl(var(--admin-outline-variant))]/40 text-xs font-bold text-[hsl(var(--admin-on-surface))] outline-none focus:border-[hsl(var(--admin-cobalt))] capitalize"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Calendar + Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-7">
        {/* Left: Calendar Surface */}
        <div className="xl:col-span-8 space-y-7">
          <CalendarView
            posts={filteredPosts}
            role="admin"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onSelectPost={handleSelectPost}
            onAddPost={handleAddPost}
            onUpdatePost={handleUpdatePost}
          />
        </div>

        {/* Right: Today's Dispatches Drawer */}
        <div className="xl:col-span-4 space-y-6">
          <div className="p-5 rounded-3xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--brand-accent))] animate-ping" />
                <h3 className="font-syne font-bold text-[hsl(var(--admin-on-surface))] text-lg">
                  Today&apos;s Dispatches
                </h3>
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))] px-2.5 py-1 rounded-full">
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>

            {/* Countdown Pill, live ticking to the next scheduled release */}
            <div className="rounded-2xl bg-[hsl(var(--admin-cobalt))] text-white p-4 shadow-sm relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/70">
                    Next Release In
                  </span>
                  <span className="block font-syne font-extrabold text-2xl tracking-tight">
                    {release ? release.label : "-"}
                  </span>
                  {release && (
                    <span className="block text-[10px] text-white/80 truncate mt-0.5">
                      {release.title}
                    </span>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                  <Icons.rocket className="size-5" />
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </div>
            {!release && (
              <p className="text-[10px] text-[hsl(var(--admin-outline))] -mt-1">
                No upcoming scheduled releases for this client.
              </p>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-[hsl(var(--admin-surface-low))]/60 border border-white/60">
                <span className="text-2xl font-syne font-bold text-[hsl(var(--admin-on-surface))]">
                  {posts.length}
                </span>
                <p className="text-[10px] font-bold text-[hsl(var(--admin-outline))] uppercase tracking-wider mt-1">
                  Total Pipeline
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[hsl(var(--brand-accent))]/15 border border-[hsl(var(--brand-accent))]/30">
                <span className="text-2xl font-syne font-bold text-[hsl(var(--admin-on-surface))]">
                  100%
                </span>
                <p className="text-[10px] font-bold text-[hsl(var(--admin-outline))] uppercase tracking-wider mt-1">
                  Sync Health
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
        }}
        initialDate={initialDate}
        editingPost={editingPost}
        clientId={selectedClientId}
        onSave={invalidatePosts}
        onDelete={invalidatePosts}
      />
    </div>
  )
}
