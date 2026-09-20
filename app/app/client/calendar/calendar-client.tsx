'use client'

import { useState } from 'react'
import { CalendarView, type ScheduledPost } from '@/components/calendar/calendar-view'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ClientCalendarClientProps = {
  clientName: string
  fullName: string
  posts: ScheduledPost[]
}

const platformInfo: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  facebook: 'Facebook',
  x: 'X',
}

export function ClientCalendarClient({
  clientName,
  fullName,
  posts,
}: ClientCalendarClientProps) {
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  const visiblePosts = posts.filter(
    (p) =>
      (p.status === 'published' || p.status === 'scheduled') &&
      (selectedPlatform === 'all' || p.platform.toLowerCase() === selectedPlatform),
  )

  const now = new Date()
  const thisMonth = visiblePosts.filter((p) => {
    const d = new Date(p.scheduled_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const publishedCount = visiblePosts.filter((p) => p.status === 'published').length
  const scheduledCount = visiblePosts.filter((p) => p.status === 'scheduled').length

  const platformCounts: Record<string, number> = {}
  for (const p of visiblePosts) {
    platformCounts[p.platform] = (platformCounts[p.platform] ?? 0) + 1
  }
  const sortedPlatforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])

  const firstName = fullName.split(' ')[0] || ''

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {clientName}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          Halo{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Berikut jadwal postingan bulan ini.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <span className="inline-flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2">
          <span className="text-muted-foreground">Total:</span>
          <strong className="text-xl font-bold">{visiblePosts.length}</strong>
        </span>
        <span className="inline-flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2">
          <span className="text-muted-foreground">Published:</span>
          <strong className="text-xl font-bold text-green-600">{publishedCount}</strong>
        </span>
        <span className="inline-flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2">
          <span className="text-muted-foreground">Bulan ini:</span>
          <strong className="text-xl font-bold text-primary">{thisMonth.length}</strong>
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select value={selectedPlatform} onValueChange={(v) => setSelectedPlatform(v ?? 'all')}>
            <SelectTrigger className="h-11 rounded-xl w-44">
              <SelectValue placeholder="Filter Platform">
                {(val: string | null) => (val === 'all' || !val ? 'Semua Platform' : (platformInfo[val] ?? val))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Platform</SelectItem>
              {Object.entries(platformInfo).map(([id, label]) => (
                <SelectItem key={id} value={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'calendar' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            List
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Total {visiblePosts.length} postingan • {scheduledCount} menunggu
      </p>

      {sortedPlatforms.length > 0 && (
        <Card className="border rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Platform</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sortedPlatforms.map(([platform, count]) => {
              const pct = visiblePosts.length > 0 ? Math.round((count / visiblePosts.length) * 100) : 0
              return (
                <div key={platform} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-20 truncate">
                    {platformInfo[platform] ?? platform}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {count} ({pct}%)
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <CalendarView
        posts={visiblePosts}
        role="client"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </div>
  )
}
