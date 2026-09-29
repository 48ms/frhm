'use client'

import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { CalendarView } from '@/components/calendar/calendar-view'
import { PostDialog } from '@/components/calendar/post-dialog'
import { ContentProductionBoard } from '@/components/production/content-production-board'
import { EventWorkspaceBoard } from '@/components/events/event-workspace-board'
import { PlatformIcon } from '@/components/calendar/platform-icon'
import { STATUS_CONFIG, type ScheduledPost, type ScheduledPostUpdate } from '@/features/calendar/types'
import { calendarKeys, scheduledPostsQueryOptions } from '@/features/calendar/queries'
import { calendarService } from '@/features/calendar/service'
import { productionKeys, productionsQueryOptions } from '@/features/production/api/queries'

type PlanningTab = 'calendar' | 'kanban' | 'timeline' | 'event'
type StatusFilter = 'all' | 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled'

const PLANNING_TABS: PlanningTab[] = ['calendar', 'kanban', 'timeline', 'event']
const STATUS_FILTERS: StatusFilter[] = ['all', 'draft', 'scheduled', 'published', 'failed', 'cancelled']

const TAB_META: Record<PlanningTab, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  calendar: { label: 'Kalender', icon: Icons.calendar },
  kanban: { label: 'Kanban', icon: Icons.kanban },
  timeline: { label: 'Timeline', icon: Icons.activity },
  event: { label: 'Event', icon: Icons.location },
}

/**
 * Unified Planning View for a client.
 *
 * One page that answers "apa saja yang sedang dan akan dikerjakan?" across the
 * three things a social-media team juggles at once:
 *   - Kalender   → scheduled_posts (what will publish, when)
 *   - Kanban     → content_productions (what is being made, which stage)
 *   - Timeline   → both merged chronologically, so collisions are visible
 *   - Event      → events (campaigns/offline activations that content must support)
 *
 * Tab, view-mode, platform and status filters live in the URL (nuqs) so a
 * planner can share or bookmark an exact view.
 */
export function ClientPlanningBoard({ clientId }: { clientId: string }) {
  const queryClient = useQueryClient()

  const [params, setParams] = useQueryStates({
    tab: parseAsStringEnum<PlanningTab>(PLANNING_TABS).withDefault('calendar'),
    mode: parseAsStringEnum(['month', 'week', 'list']).withDefault('month'),
    platform: parseAsString.withDefault('all'),
    status: parseAsStringEnum<StatusFilter>(STATUS_FILTERS).withDefault('all'),
  })

  const { data: posts = [], isLoading: postsLoading } = useQuery(scheduledPostsQueryOptions(clientId))
  const { data: productions = [], isLoading: productionsLoading } = useQuery(productionsQueryOptions(clientId))

  const [dialogOpen, setDialogOpen] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | undefined>()
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null)

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (params.status !== 'all' && p.status !== params.status) return false
      if (params.platform !== 'all' && p.platform.toLowerCase() !== params.platform) return false
      return true
    })
  }, [posts, params.status, params.platform])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: calendarKeys.list(clientId) })
    queryClient.invalidateQueries({ queryKey: productionKeys.list(clientId) })
  }

  const handleAddPost = (date: Date) => {
    setInitialDate(date)
    setEditingPost(null)
    setDialogOpen(true)
  }

  const handleSelectPost = (post: ScheduledPost) => {
    setEditingPost(post)
    setInitialDate(undefined)
    setDialogOpen(true)
  }

  // Drag-and-drop reschedule with optimistic cache + rollback on failure.
  const handleUpdatePost = async (postId: string, data: ScheduledPostUpdate) => {
    const queryKey = calendarKeys.list(clientId)
    const previous = queryClient.getQueryData<ScheduledPost[]>(queryKey) ?? []

    queryClient.setQueryData<ScheduledPost[]>(queryKey, (old = []) =>
      old.map((p) => (p.id === postId ? { ...p, ...data } : p))
    )

    try {
      await calendarService.movePost(postId, data)
    } catch (err) {
      console.error('Failed to move post:', err)
      queryClient.setQueryData(queryKey, previous)
    }
  }

  // Merge posts + productions into a single chronological stream for the timeline.
  const timeline = useMemo(() => {
    const postEvents = filteredPosts.map((p) => ({
      id: `post-${p.id}`,
      kind: 'post' as const,
      date: p.scheduled_at,
      title: p.title,
      meta: p.platform,
      stage: p.status,
      href: null as string | null,
    }))
    const prodEvents = productions.map((p) => ({
      id: `prod-${p.id}`,
      kind: 'production' as const,
      date: p.due_date ?? p.created_at,
      title: p.title,
      meta: p.platform,
      stage: p.stage,
      href: null as string | null,
    }))
    return [...postEvents, ...prodEvents].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [filteredPosts, productions])

  const loading = postsLoading || productionsLoading
  const scheduledCount = posts.filter((p) => !p.is_placeholder).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planning</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Satu tampilan untuk kalender tayang, pipeline produksi, dan event.
            {' '}{scheduledCount} postingan · {productions.length} task produksi
          </p>
        </div>
        <Button onClick={() => { setInitialDate(undefined); setEditingPost(null); setDialogOpen(true) }}>
          <Icons.add className="mr-2 size-4" aria-hidden="true" />
          Jadwalkan Postingan
        </Button>
      </div>

      {/* Tab + filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex flex-wrap rounded-xl border border-neutral-200/50 bg-white/50 p-1 backdrop-blur-sm dark:border-neutral-800/50 dark:bg-neutral-900/50"
          role="tablist"
          aria-label="Tampilan planning"
        >
          {PLANNING_TABS.map((tab) => {
            const meta = TAB_META[tab]
            const Icon = meta.icon
            const active = params.tab === tab
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setParams({ tab })}
                className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors lg:min-h-9 lg:px-3 lg:py-1.5 ${
                  active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {meta.label}
              </button>
            )
          })}
        </div>

        {params.tab === 'calendar' && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter status"
              value={params.status}
              onChange={(e) => setParams({ status: e.target.value as StatusFilter })}
              className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'Semua status' : (STATUS_CONFIG[s]?.label ?? s)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground" role="status" aria-live="polite">
          Memuat planning…
        </div>
      ) : (
        <>
          {params.tab === 'calendar' && (
            <CalendarView
              posts={filteredPosts}
              role="admin"
              viewMode={params.mode}
              onViewModeChange={(m) => setParams({ mode: m })}
              onSelectPost={handleSelectPost}
              onAddPost={handleAddPost}
              onUpdatePost={handleUpdatePost}
            />
          )}

          {params.tab === 'kanban' && <ContentProductionBoard clientId={clientId} />}

          {params.tab === 'event' && <EventWorkspaceBoard clientId={clientId} />}

          {params.tab === 'timeline' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline Gabungan</CardTitle>
                <CardDescription>
                  Postingan terjadwal dan task produksi dalam satu alur waktu — supaya tabrakan jadwal terlihat.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada postingan atau task produksi.
                  </p>
                ) : (
                  <ol className="relative space-y-1 border-l border-border pl-4">
                    {timeline.map((item) => {
                      const isPost = item.kind === 'post'
                      return (
                        <li key={item.id} className="relative py-2">
                          <span
                            className={`absolute -left-[21px] top-4 size-2.5 rounded-full ring-2 ring-background ${
                              isPost ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                            aria-hidden="true"
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <time
                              dateTime={item.date}
                              className="w-24 shrink-0 text-xs font-mono text-muted-foreground"
                            >
                              {new Date(item.date).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </time>
                            {isPost ? (
                              <Icons.calendar className="size-3.5 shrink-0 text-blue-500" aria-hidden="true" />
                            ) : (
                              <Icons.kanban className="size-3.5 shrink-0 text-amber-500" aria-hidden="true" />
                            )}
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <PlatformIcon platform={item.meta} className="size-3.5" />
                              <span className="capitalize">{item.meta}</span>
                            </span>
                            <span className="rounded border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                              {item.stage}
                            </span>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <PostDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingPost(null)
          setInitialDate(undefined)
        }}
        initialDate={initialDate}
        editingPost={editingPost}
        clientId={clientId}
        onSave={invalidate}
        onDelete={invalidate}
      />
    </div>
  )
}
