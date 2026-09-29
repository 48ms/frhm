'use client'

import { useState } from 'react'
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core'

import { Icons } from '@/components/icons'
import { ScheduledPost, PLATFORMS, ScheduledPostUpdate } from '@/features/calendar/types'
import { getDotColor } from '@/features/calendar/utils'
import { cn } from '@/lib/utils'

export type CalendarViewMode = 'month' | 'week' | 'list'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))]',
  scheduled: 'bg-[hsl(var(--admin-cobalt))]/15 text-[hsl(var(--admin-cobalt))]',
  published: 'bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))]',
  failed: 'bg-[#ba1a1a]/15 text-[#ba1a1a]',
  cancelled: 'bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))]',
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function PlatformChip({ platform }: { platform: string }) {
  const info = PLATFORMS[platform]
  const IconCmp = info ? (Icons as Record<string, React.ComponentType<{ className?: string }>>)[info.icon] : null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
        info?.bg ?? 'bg-[hsl(var(--admin-surface-high))]',
        'text-white'
      )}
    >
      {IconCmp ? <IconCmp className="size-2.5" /> : null}
      {info?.name ?? platform}
    </span>
  )
}

function DraggablePostItem({ post, children }: { post: ScheduledPost; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.id,
    data: post,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(1.05)`, zIndex: 999 }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'relative cursor-grab active:cursor-grabbing transition-shadow',
        isDragging && 'opacity-90 shadow-2xl ring-2 ring-[hsl(var(--admin-cobalt))]/50 rounded-lg'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

function DroppableDayCell({
  dateIso,
  isSelected,
  isToday,
  onClick,
  children,
}: {
  dateIso: string
  isSelected: boolean
  isToday: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `day-${dateIso}`, data: { dateIso } })

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick()
      }}
      className={cn(
        'min-h-[7rem] p-2 rounded-xl border text-left flex flex-col gap-1.5 transition-all group cursor-pointer',
        isOver
          ? 'border-[hsl(var(--brand-accent))] ring-2 ring-[hsl(var(--brand-accent))]/40 bg-[hsl(var(--brand-accent))]/10'
          : isSelected
          ? 'border-[hsl(var(--admin-cobalt))] ring-2 ring-[hsl(var(--admin-cobalt))]/20 bg-[hsl(var(--admin-cobalt))]/5'
          : isToday
          ? 'border-[hsl(var(--brand-accent))]/50 bg-[hsl(var(--brand-accent))]/5'
          : 'border-[hsl(var(--admin-outline-variant))]/40 hover:border-[hsl(var(--admin-cobalt))]/40 bg-[hsl(var(--admin-surface-lowest))]/60'
      )}
    >
      {children}
    </div>
  )
}

export function CalendarView({
  posts,
  role = 'admin',
  onSelectPost,
  onAddPost,
  onUpdatePost,
  viewMode = 'month',
}: {
  posts: ScheduledPost[]
  role?: 'admin' | 'client'
  onSelectPost?: (post: ScheduledPost) => void
  onAddPost?: (date: Date) => void
  onUpdatePost?: (postId: string, data: ScheduledPostUpdate) => Promise<void>
  viewMode?: CalendarViewMode
  onViewModeChange?: (mode: CalendarViewMode) => void
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(() => new Date().getDate())

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || !onUpdatePost) return
    const postId = String(active.id)
    const newDateIso = over.data.current?.dateIso
    if (!newDateIso) return
    const post = posts.find((p) => p.id === postId)
    if (!post) return
    const oldDate = new Date(post.scheduled_at)
    const newDate = new Date(newDateIso)
    newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), oldDate.getSeconds())
    await onUpdatePost(postId, { scheduled_at: newDate.toISOString() })
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7 // Monday-first
  const totalDays = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }
  const goToday = () => {
    const t = new Date()
    setCurrentDate(new Date(t.getFullYear(), t.getMonth(), 1))
    setSelectedDay(t.getDate())
  }

  const filteredPosts = posts.filter((p) => {
    const d = new Date(p.scheduled_at)
    return viewMode === 'list' || (d.getFullYear() === year && d.getMonth() === month)
  })

  const sortedPosts = [...filteredPosts].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  )

  const postsByDay: Record<number, ScheduledPost[]> = {}
  for (const post of filteredPosts) {
    const day = new Date(post.scheduled_at).getDate()
    if (!postsByDay[day]) postsByDay[day] = []
    postsByDay[day].push(post)
  }

  const selectedDayPosts = selectedDay ? postsByDay[selectedDay] ?? [] : []

  // Week view: derive the week around the selected day
  const weekStart = (() => {
    const base = selectedDay ? new Date(year, month, selectedDay) : currentDate
    const dow = (base.getDay() + 6) % 7
    const start = new Date(base)
    start.setDate(base.getDate() - dow)
    return start
  })()
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const renderPostBadge = (p: ScheduledPost) => (
    <DraggablePostItem key={p.id} post={p}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onSelectPost?.(p)
        }}
        className="w-full flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[10px] font-semibold text-left bg-[hsl(var(--admin-surface-lowest))]/80 border border-[hsl(var(--admin-outline-variant))]/30 hover:border-[hsl(var(--admin-cobalt))]/50 transition-all"
      >
        <span className={cn('size-1.5 rounded-full shrink-0', getDotColor(p))} />
        <span className="truncate flex-1 text-[hsl(var(--admin-on-surface))]">
          {p.is_placeholder ? p.reserved_for ?? 'Slot kosong' : p.title}
        </span>
      </button>
    </DraggablePostItem>
  )

  return (
    <div className="space-y-6">
      {/* Month navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-full border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-lowest))] flex items-center justify-center text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-high))] transition-colors cursor-pointer"
            aria-label="Previous month"
          >
            <Icons.chevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2 min-w-44 justify-center">
            <Icons.calendar_month className="size-4 text-[hsl(var(--admin-outline))]" />
            <h2 className="text-lg font-syne font-bold tracking-tight text-[hsl(var(--admin-on-surface))]">
              {MONTH_NAMES[month]} {year}
            </h2>
          </div>
          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-full border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-lowest))] flex items-center justify-center text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-high))] transition-colors cursor-pointer"
            aria-label="Next month"
          >
            <Icons.chevronRight className="size-4" />
          </button>
          <button
            onClick={goToday}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-[hsl(var(--admin-outline))]">
          <span className="font-bold">{sortedPosts.length} posts</span>
          <span className="text-[hsl(var(--brand-accent))] font-bold">+14% pace</span>
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <DndContext id="frhm-calendar-dnd" sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/80 shadow-sm p-4 sm:p-6">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="min-w-[680px]">
                <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
                  {DAY_SHORT.map((d, idx) => (
                    <div
                      key={d}
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wider py-2',
                        idx >= 5 ? 'text-[hsl(var(--admin-outline))]' : 'text-[hsl(var(--admin-on-surface))]'
                      )}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: firstDayIndex }).map((_, idx) => (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[7rem] rounded-xl bg-[hsl(var(--admin-surface-low))]/30 border border-transparent opacity-40"
                    />
                  ))}
                  {Array.from({ length: totalDays }).map((_, idx) => {
                    const day = idx + 1
                    const dayPosts = postsByDay[day] ?? []
                    const isSelected = selectedDay === day
                    const isToday =
                      day === new Date().getDate() &&
                      month === new Date().getMonth() &&
                      year === new Date().getFullYear()
                    const dateIso = new Date(year, month, day).toISOString()

                    return (
                      <DroppableDayCell
                        key={day}
                        dateIso={dateIso}
                        isSelected={isSelected}
                        isToday={isToday}
                        onClick={() => setSelectedDay(day)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={cn(
                              'text-xs font-bold rounded-full size-6 flex items-center justify-center',
                              isToday
                                ? 'bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))]'
                                : isSelected
                                ? 'bg-[hsl(var(--admin-cobalt))] text-white'
                                : 'text-[hsl(var(--admin-outline))] group-hover:text-[hsl(var(--admin-on-surface))]'
                            )}
                          >
                            {day}
                          </span>
                          {dayPosts.length > 0 && (
                            <span className="text-[9px] font-bold text-[hsl(var(--admin-outline))]">
                              {dayPosts.length}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 overflow-hidden w-full">
                          {dayPosts.slice(0, 2).map((p) => renderPostBadge(p))}
                          {dayPosts.length > 2 && (
                            <p className="text-[9px] text-[hsl(var(--admin-outline))] font-medium text-center">
                              +{dayPosts.length - 2} more
                            </p>
                          )}
                        </div>
                      </DroppableDayCell>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </DndContext>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/80 shadow-sm p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((d, i) => {
              const dayPosts = posts.filter((p) => {
                const pd = new Date(p.scheduled_at)
                return (
                  pd.getFullYear() === d.getFullYear() &&
                  pd.getMonth() === d.getMonth() &&
                  pd.getDate() === d.getDate()
                )
              })
              const isToday = d.toDateString() === new Date().toDateString()
              return (
                <div key={i} className="flex flex-col gap-2">
                  <div className="text-center">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--admin-outline))]">
                      {DAY_SHORT[i]}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center justify-center size-7 rounded-full text-xs font-bold mt-1',
                        isToday
                          ? 'bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))]'
                          : 'text-[hsl(var(--admin-on-surface))]'
                      )}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1.5 min-h-[16rem] p-1.5 rounded-xl bg-[hsl(var(--admin-surface-lowest))]/50 border border-[hsl(var(--admin-outline-variant))]/30">
                    {dayPosts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onSelectPost?.(p)}
                        className="w-full text-left p-2 rounded-lg bg-[hsl(var(--admin-surface-lowest))]/80 border border-[hsl(var(--admin-outline-variant))]/30 hover:border-[hsl(var(--admin-cobalt))]/50 transition-all"
                      >
                        <PlatformChip platform={p.platform} />
                        <span className="block text-[11px] font-semibold text-[hsl(var(--admin-on-surface))] mt-1 line-clamp-2">
                          {p.title}
                        </span>
                        <span className="block text-[9px] text-[hsl(var(--admin-outline))] mt-0.5">
                          {fmtTime(p.scheduled_at)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* List / Gantt View */}
      {viewMode === 'list' && (
        <div className="rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/80 shadow-sm p-6">
          <div className="flex items-center justify-between border-b border-[hsl(var(--admin-outline-variant))]/30 pb-4 mb-4">
            <div>
              <h3 className="font-syne font-bold text-[hsl(var(--admin-on-surface))]">
                Scheduled Flights (Month)
              </h3>
              <p className="text-xs text-[hsl(var(--admin-outline))]">
                {sortedPosts.length} posts in the dispatch timeline
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--brand-accent))]">
              +14% pace
            </span>
          </div>
          <div className="space-y-2">
            {sortedPosts.length === 0 ? (
              <p className="py-8 text-center text-sm text-[hsl(var(--admin-outline))]">
                No posts match the current filter.
              </p>
            ) : (
              sortedPosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => onSelectPost?.(post)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--admin-surface-lowest))]/60 border border-[hsl(var(--admin-outline-variant))]/30 hover:border-[hsl(var(--admin-cobalt))]/50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-[hsl(var(--admin-surface-low))] flex items-center justify-center shrink-0">
                    <Icons.clapperboard className="size-5 text-[hsl(var(--admin-cobalt))]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-[hsl(var(--admin-on-surface))] truncate">
                      {post.title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <PlatformChip platform={post.platform} />
                      <span className="text-[10px] text-[hsl(var(--admin-outline))]">
                        {new Date(post.scheduled_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        · {fmtTime(post.scheduled_at)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0',
                      STATUS_STYLES[post.status] ?? STATUS_STYLES.draft
                    )}
                  >
                    {post.status}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Selected Day Panel (month view) */}
      {viewMode === 'month' && (
        <div className="rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/80 shadow-sm flex flex-col">
          <div className="p-4 border-b border-[hsl(var(--admin-outline-variant))]/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-syne font-bold text-sm text-[hsl(var(--admin-on-surface))]">
                  {selectedDay ? `${selectedDay} ${MONTH_NAMES[month]} ${year}` : 'Select a date'}
                </h3>
                <p className="text-xs text-[hsl(var(--admin-outline))]">
                  {selectedDayPosts.length} posts scheduled
                </p>
              </div>
              {role === 'admin' && selectedDay && onAddPost && (
                <button
                  onClick={() => onAddPost(new Date(year, month, selectedDay))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-[11px] font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Icons.add className="size-3.5" />
                  Add slot
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 p-4 space-y-2 overflow-auto max-h-[32rem]">
            {!selectedDay ? (
              <p className="py-8 text-center text-sm text-[hsl(var(--admin-outline))]">
                Click a date on the calendar to see its posts.
              </p>
            ) : selectedDayPosts.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm text-[hsl(var(--admin-outline))]">
                  No posts on this date.
                </p>
                {role === 'admin' && onAddPost && (
                  <button
                    onClick={() => onAddPost(new Date(year, month, selectedDay))}
                    className="px-3 py-1.5 rounded-full border border-dashed border-[hsl(var(--admin-cobalt))]/50 text-[hsl(var(--admin-cobalt))] text-xs font-semibold hover:bg-[hsl(var(--admin-cobalt))]/5 transition-all cursor-pointer"
                  >
                    + Schedule post
                  </button>
                )}
              </div>
            ) : (
              selectedDayPosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => onSelectPost?.(post)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--admin-surface-lowest))]/60 border border-[hsl(var(--admin-outline-variant))]/30 hover:border-[hsl(var(--admin-cobalt))]/50 transition-all text-left"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-[hsl(var(--admin-on-surface))] truncate">
                      {post.title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <PlatformChip platform={post.platform} />
                      <span className="text-[10px] text-[hsl(var(--admin-outline))]">
                        {fmtTime(post.scheduled_at)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0',
                      STATUS_STYLES[post.status] ?? STATUS_STYLES.draft
                    )}
                  >
                    {post.status}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
