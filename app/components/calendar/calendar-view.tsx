'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from '@/registry/icons/arrow-left'
import { ArrowRight } from '@/registry/icons/arrow-right'
import { DndContext, useSensor, useSensors, PointerSensor, TouchSensor, useDraggable, useDroppable } from '@dnd-kit/core'

export type ScheduledPost = {
  id: string
  client_id: string
  deliverable_id: string | null
  title: string
  content: string
  platform: string
  scheduled_at: string
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled'
  notes: string | null
  is_reserved: boolean
  is_placeholder: boolean
  reserved_for: string | null
  reserved_until: string | null
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  campaign_tag?: string | null
  production_id?: string | null
  skill_output_id?: string | null
  deliverables?: { title: string; type: string; status: string } | null
}

export type PlatformInfo = {
  id: string
  name: string
  color: string
}

const PLATFORMS: Record<string, { name: string; color: string; bg: string }> = {
  instagram: { name: 'Instagram', color: 'text-pink-600', bg: 'bg-pink-500/10 border-pink-500/30' },
  tiktok: { name: 'TikTok', color: 'text-neutral-900 dark:text-neutral-100', bg: 'bg-neutral-500/10 border-neutral-500/30' },
  linkedin: { name: 'LinkedIn', color: 'text-blue-600', bg: 'bg-blue-500/10 border-blue-500/30' },
  youtube: { name: 'YouTube', color: 'text-red-600', bg: 'bg-red-500/10 border-red-500/30' },
  facebook: { name: 'Facebook', color: 'text-blue-700', bg: 'bg-blue-600/10 border-blue-600/30' },
  x: { name: 'X / Twitter', color: 'text-neutral-800 dark:text-neutral-200', bg: 'bg-neutral-800/10 border-neutral-800/30' },
}

// Status dot colors per platform+status
const STATUS_DOT: Record<string, Record<string, string>> = {
  instagram: { published: 'bg-pink-500', scheduled: 'bg-pink-400', draft: 'bg-pink-300', failed: 'bg-red-500', cancelled: 'bg-neutral-400' },
  tiktok: { published: 'bg-neutral-800 dark:bg-neutral-200', scheduled: 'bg-neutral-600', draft: 'bg-neutral-400', failed: 'bg-red-500', cancelled: 'bg-neutral-400' },
  linkedin: { published: 'bg-blue-600', scheduled: 'bg-blue-500', draft: 'bg-blue-300', failed: 'bg-red-500', cancelled: 'bg-neutral-400' },
  youtube: { published: 'bg-red-600', scheduled: 'bg-red-500', draft: 'bg-red-300', failed: 'bg-red-500', cancelled: 'bg-neutral-400' },
  facebook: { published: 'bg-blue-700', scheduled: 'bg-blue-600', draft: 'bg-blue-400', failed: 'bg-red-500', cancelled: 'bg-neutral-400' },
  x: { published: 'bg-neutral-800 dark:bg-neutral-200', scheduled: 'bg-neutral-600', draft: 'bg-neutral-400', failed: 'bg-red-500', cancelled: 'bg-neutral-400' },
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  published: { label: 'Published', badge: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30', dot: 'bg-green-500' },
  scheduled: { label: 'Terjadwal', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  draft: { label: 'Draft', badge: 'bg-neutral-500/15 text-neutral-700 dark:text-neutral-400 border-neutral-500/30', dot: 'bg-neutral-400' },
  failed: { label: 'Gagal', badge: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30', dot: 'bg-red-500' },
  cancelled: { label: 'Batal', badge: 'bg-neutral-400/15 text-neutral-500 border-neutral-400/30', dot: 'bg-neutral-300' },
}

function getDotColor(post: ScheduledPost): string {
  return (STATUS_DOT[post.platform]?.[post.status] ?? STATUS_CONFIG[post.status]?.dot ?? 'bg-neutral-400')
}

// Brand SVG logos for platforms
export function PlatformIcon({ platform, className = 'size-4' }: { platform: string; className?: string }) {
  const p = platform.toLowerCase()
  if (p === 'instagram') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    )
  }
  if (p === 'tiktok') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V5.8a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 12a6.34 6.34 0 0 0 10.86 4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.86z" />
      </svg>
    )
  }
  if (p === 'linkedin') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    )
  }
  if (p === 'youtube') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  }
  if (p === 'facebook') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    )
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function DraggablePostItem({ post, children }: { post: ScheduledPost; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.id,
    data: post,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
      onClick={(e) => {
        // Prevent drag events from interfering with click (if any)
        e.stopPropagation()
      }}
    >
      {children}
    </div>
  )
}

function DroppableDayCell({
  day,
  dateIso,
  isSelected,
  isToday,
  onClick,
  children,
}: {
  day: number
  dateIso: string
  isSelected: boolean
  isToday: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${dateIso}`,
    data: { dateIso },
  })

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick()
      }}
      className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-lg border text-left flex flex-col justify-between transition-all group cursor-pointer ${
        isOver
          ? 'border-green-500 ring-2 ring-green-500/40 bg-green-500/10'
          : isSelected
          ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
          : isToday
          ? 'border-blue-500/50 bg-blue-500/5'
          : 'border-border/60 hover:border-border hover:bg-muted/30 bg-card'
      }`}
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
  viewMode = 'calendar',
  onViewModeChange,
}: {
  posts: ScheduledPost[]
  role?: 'admin' | 'client'
  onSelectPost?: (post: ScheduledPost) => void
  onAddPost?: (date: Date) => void
  onUpdatePost?: (postId: string, data: Partial<ScheduledPost>) => Promise<void>
  viewMode?: 'calendar' | 'list'
  onViewModeChange?: (mode: 'calendar' | 'list') => void
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(() => new Date().getDate())
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  )

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    
    if (!over) return

    const postId = active.id
    const newDateIso = over.data.current?.dateIso
    
    if (newDateIso) {
      // Find the post and invoke an update callback if we passed one down,
      // or we can handle it via onUpdatePost in props.
      // For now, we will assume there is an onUpdatePost prop or we update local state.
      // Since posts is passed as prop, we'll invoke a callback if provided.
      if (onUpdatePost) {
        const post = posts.find((p) => p.id === postId)
        if (post) {
          // Construct new ISO string keeping the time but changing the date
          const oldDate = new Date(post.scheduled_at)
          const newDate = new Date(newDateIso)
          newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), oldDate.getSeconds())
          
          await onUpdatePost(postId, { scheduled_at: newDate.toISOString() })
        }
      }
    }
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayIndex = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()

  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  const filteredPosts = posts.filter((p) => {
    const d = new Date(p.scheduled_at)
    const matchesMonth = viewMode === 'list' || (d.getFullYear() === year && d.getMonth() === month)
    const matchesPlatform = selectedPlatform === 'all' || p.platform.toLowerCase() === selectedPlatform
    return matchesMonth && matchesPlatform
  })

  const sortedPosts = [...filteredPosts].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  const postsByDay: Record<number, ScheduledPost[]> = {}
  for (const post of filteredPosts) {
    const day = new Date(post.scheduled_at).getDate()
    if (!postsByDay[day]) postsByDay[day] = []
    postsByDay[day].push(post)
  }

  const selectedDayPosts = selectedDay ? (postsByDay[selectedDay] ?? []) : []

  const timeStr = (iso: string) =>
    new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-6">
      {/* Header controls + View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-11 w-11 lg:h-9 lg:w-9" disabled={viewMode === 'list'} aria-label="Bulan sebelumnya">
            <ArrowLeft className="size-4" />
          </Button>
          <h2 className="text-xl font-bold tracking-tight min-w-44 text-center">
            {MONTH_NAMES[month]} {year}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-11 w-11 lg:h-9 lg:w-9" disabled={viewMode === 'list'} aria-label="Bulan berikutnya">
            <ArrowRight className="size-4" />
          </Button>
        </div>

        {/* Mobile: List/Calendar tab switch */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl" role="tablist" aria-label="Tampilan kalender">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'calendar'}
            onClick={() => onViewModeChange?.('calendar')}
            className={`min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${viewMode === 'calendar' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Kalender
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'list'}
            onClick={() => onViewModeChange?.('list')}
            className={`min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Daftar
          </button>
        </div>

        {/* Platform filter pills (calendar only) */}
        {viewMode === 'calendar' && (
          <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1 rounded-xl" role="group" aria-label="Filter platform">
            <button
              type="button"
              onClick={() => setSelectedPlatform('all')}
              className={`min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedPlatform === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Semua Platform
            </button>
            {Object.entries(PLATFORMS).map(([id, info]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedPlatform(id)}
                className={`min-h-[44px] sm:min-h-0 flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedPlatform === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <PlatformIcon platform={id} className="size-3.5" />
                <span>{info.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conditional render: Calendar Grid vs List */}
      {viewMode === 'calendar' ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <Card>
          <CardContent className="p-4 sm:p-6">
            {/* Day headers (Min - Sab) */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, idx) => (
                <div
                  key={d}
                  className={`text-xs font-semibold py-2 ${idx === 0 || idx === 6 ? 'text-muted-foreground' : 'text-foreground'}`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-lg bg-muted/20 border border-transparent opacity-40" />
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
                    day={day}
                    dateIso={dateIso}
                    isSelected={isSelected}
                    isToday={isToday}
                    onClick={() => setSelectedDay(day)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-semibold rounded-full size-6 flex items-center justify-center ${isToday ? 'bg-primary text-primary-foreground' : isSelected ? 'bg-muted text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}
                      >
                        {day}
                      </span>
                      {dayPosts.length > 0 && (
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {dayPosts.length}
                        </span>
                      )}
                    </div>
                    {/* Post badges summary in cell, dot colored per platform+status */}
                    <div className="space-y-1 overflow-hidden w-full">
                      {dayPosts.slice(0, 2).map((p) => (
                        <DraggablePostItem key={p.id} post={p}>
                          <div
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] truncate border ${
                              p.is_placeholder
                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400'
                                : PLATFORMS[p.platform]?.bg ?? 'bg-muted'
                            }`}
                          >
                            <span className={`size-1.5 rounded-full shrink-0 ${getDotColor(p)}`} />
                            {p.is_placeholder ? (
                              <span className="truncate flex-1">
                                {p.reserved_for ?? 'Slot kosong'}
                              </span>
                            ) : p.title.length > 12 ? (
                              `${p.title.slice(0, 12)}…`
                            ) : (
                              p.title
                            )}
                          </div>
                        </DraggablePostItem>
                      ))}
                      {dayPosts.length > 2 && (
                        <p className="text-[9px] text-muted-foreground font-medium text-center">
                          +{dayPosts.length - 2} lagi
                        </p>
                      )}
                    </div>
                  </DroppableDayCell>
                )
              })}
            </div>
          </CardContent>
        </Card>
        </DndContext>
      ) : (
        // List View
        <Card>
          <CardHeader>
            <CardTitle>Semua Postingan Terjadwal</CardTitle>
            <CardDescription>{sortedPosts.length} postingan ditemukan untuk bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedPosts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Tidak ada postingan yang cocok dengan filter.
                </p>
              ) : (
                sortedPosts.map((post) => {
                  const statusCfg = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.scheduled
                  const platformInfo = PLATFORMS[post.platform]
                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => onSelectPost?.(post)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-4 group ${post.is_placeholder ? 'border-purple-500/40 bg-purple-500/5 hover:border-purple-500/60' : 'border-border/80 hover:border-primary/50 bg-card hover:bg-muted/30'}`}
                    >
                      <div className="flex items-center justify-center w-10 shrink-0">
                        <span className={`size-4 rounded-full ${getDotColor(post)}`} />
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <PlatformIcon platform={post.platform} className="size-4" />
                        <span className="text-xs font-semibold capitalize hidden sm:inline">
                          {platformInfo?.name ?? post.platform}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{timeStr(post.scheduled_at)}</span>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors truncate">
                          {post.is_placeholder ? (post.reserved_for ?? 'Slot tersedia') : post.title}
                        </p>
                        {(post.campaign_tag || post.priority) && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {post.priority && post.priority !== 'normal' && (
                              <span className={`text-[9px] font-bold uppercase px-1 rounded-sm ${
                                post.priority === 'urgent' ? 'bg-red-500 text-white' : 
                                post.priority === 'high' ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'
                              }`}>
                                {post.priority}
                              </span>
                            )}
                            {post.campaign_tag && (
                              <span className="text-[10px] text-muted-foreground truncate">
                                {post.campaign_tag}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {post.is_placeholder && (
                        <Badge variant="secondary" className="ml-auto text-[10px] px-2 py-0 border-purple-500/30">
                          Reserved
                        </Badge>
                      )}
                      {!post.is_placeholder && (
                        <Badge className={`ml-auto text-[10px] px-2 py-0.5 border ${statusCfg.badge}`}>
                          {statusCfg.label}
                        </Badge>
                      )}
                      {(post.production_id || post.skill_output_id) && (
                        <div className="flex items-center gap-1 ml-2">
                          {post.production_id && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                              Prod
                            </Badge>
                          )}
                          {post.skill_output_id && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                              Skill
                            </Badge>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Day Panel */}
      {viewMode === 'calendar' && (
        <Card className="flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {selectedDay ? `${selectedDay} ${MONTH_NAMES[month]} ${year}` : 'Pilih Tanggal'}
                </CardTitle>
                <CardDescription>
                  {selectedDayPosts.length} postingan terjadwal
                </CardDescription>
              </div>
              {role === 'admin' && selectedDay && onAddPost && (
                <Button size="sm" onClick={() => onAddPost(new Date(year, month, selectedDay))} className="h-11 sm:h-9 px-3 text-xs">
                  + Tambah
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 space-y-3 overflow-auto max-h-[32rem]">
            {!selectedDay ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Klik tanggal di kalender untuk melihat daftar postingan.
              </p>
            ) : selectedDayPosts.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Tidak ada postingan di tanggal ini.
                </p>
                {role === 'admin' && onAddPost && (
                  <Button variant="outline" size="sm" onClick={() => onAddPost(new Date(year, month, selectedDay))} className="h-11 sm:h-9">
                    + Jadwalkan Postingan
                  </Button>
                )}
              </div>
            ) : (
              selectedDayPosts.map((post) => {
                const statusCfg = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.scheduled
                const platformInfo = PLATFORMS[post.platform]
                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => onSelectPost?.(post)}
                    className={`w-full text-left p-3 rounded-xl border text-left flex flex-col gap-2 group ${
                      post.is_placeholder
                        ? 'border-purple-500/40 bg-purple-500/5 hover:border-purple-500/60'
                        : 'border-border/80 hover:border-primary/50 bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <PlatformIcon platform={post.platform} className="size-4" />
                        <span className="text-xs font-semibold capitalize">
                          {platformInfo?.name ?? post.platform}
                        </span>
                        <span className="text-xs text-muted-foreground">• {timeStr(post.scheduled_at)} WIB</span>
                        {post.is_placeholder && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 border-purple-500/30">
                            Reserved
                          </Badge>
                        )}
                      </div>
                      {!post.is_placeholder && (
                        <Badge className={`text-[10px] px-2 py-0.5 border ${statusCfg.badge}`}>
                          {statusCfg.label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                      {post.is_placeholder ? (post.reserved_for ?? 'Slot tersedia') : post.title}
                    </p>
                    {post.is_placeholder && post.reserved_for && (
                      <p className="text-[11px] text-purple-600 dark:text-purple-400">
                        Untuk kampanye: {post.reserved_for}
                      </p>
                    )}
                    {!post.is_placeholder && post.content && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {post.content}
                      </p>
                    )}
                    {post.deliverables?.title && (
                      <p className="text-[10px] text-muted-foreground/80 bg-muted px-2 py-1 rounded">
                        Deliverable: {post.deliverables.title}
                      </p>
                    )}
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
