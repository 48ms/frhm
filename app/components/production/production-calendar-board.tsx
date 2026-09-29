'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarView } from '@/components/calendar/calendar-view'
import { PostDialog } from '@/components/calendar/post-dialog'
import { ScheduledPost, ScheduledPostUpdate } from '@/features/calendar/types'
import { scheduledPostsQueryOptions, calendarKeys } from '@/features/calendar/queries'
import { calendarService } from '@/features/calendar/service'

/**
 * Production Calendar — the "Kalender" sub-tab of the client's Produksi tab.
 *
 * Reads `scheduled_posts` (the real calendar table) rather than the legacy
 * `platform_posts` chain that the previous OmniCalendarBoard depended on. That
 * chain needs `content_assets` rows which are never written by the production
 * flow, so the calendar always rendered empty.
 *
 * Tasks scheduled from the Kanban board carry `production_id`, so each event
 * here can be traced back to the production task that created it.
 */
export function ProductionCalendarBoard({ clientId }: { clientId: string }) {
  const queryClient = useQueryClient()

  const { data: posts = [], isLoading } = useQuery(scheduledPostsQueryOptions(clientId))

  const [dialogOpen, setDialogOpen] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | undefined>()
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month')

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: calendarKeys.list(clientId) })
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

  // Drag-and-drop reschedule: optimistic cache update, revert on failure.
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
      toast.error('Gagal memindahkan jadwal', {
        description: 'Perubahan tanggal tidak tersimpan.',
      })
    }
  }

  const scheduledCount = posts.filter((p) => !p.is_placeholder).length
  const fromProduction = posts.filter((p) => p.production_id).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Icons.calendar className="size-5 text-primary" aria-hidden="true" />
            Kalender Konten
          </h3>
          <p className="text-xs text-muted-foreground">
            Jadwal tayang konten lintas platform. {scheduledCount} postingan
            {fromProduction > 0 && ` · ${fromProduction} dari task produksi`}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setInitialDate(undefined)
            setEditingPost(null)
            setDialogOpen(true)
          }}
        >
          <Icons.add className="mr-2 size-4" aria-hidden="true" />
          Jadwalkan Postingan
        </Button>
      </div>

      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-0">
          {isLoading ? (
            <div role="status" aria-live="polite" className="space-y-3">
              <span className="sr-only">Memuat kalender…</span>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 28 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-md" />
                ))}
              </div>
            </div>
          ) : (
            <CalendarView
              posts={posts}
              role="admin"
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onSelectPost={handleSelectPost}
              onAddPost={handleAddPost}
              onUpdatePost={handleUpdatePost}
            />
          )}
        </CardContent>
      </Card>

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
