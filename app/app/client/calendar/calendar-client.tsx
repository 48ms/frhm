'use client'

import { useQueryState, parseAsString } from 'nuqs'
import { CalendarView } from '@/components/calendar/calendar-view'
import { type ScheduledPost } from '@/features/calendar/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/layout/page-container'
import { EmptyState, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Icons } from '@/components/icons'

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

const calendarInfoContent = {
  title: 'Panduan Kalender Konten',
  sections: [
    {
      title: 'Tampilan Jadwal',
      description:
        'Gunakan tombol Calendar dan List di kanan atas untuk beralih mode visual bulanan atau daftar berurutan.',
    },
    {
      title: 'Filter Platform',
      description:
        'Pilih platform spesifik (Instagram, TikTok, dll) untuk memfilter konten yang relevan.',
    },
    {
      title: 'Status Publikasi',
      description:
        'Konten berstatus Terjadwal akan otomatis tayang sesuai tanggal. Konten Published telah sukses tayang.',
    },
  ],
}

export function ClientCalendarClient({
  clientName,
  fullName,
  posts,
}: ClientCalendarClientProps) {
  const [selectedPlatform, setSelectedPlatform] = useQueryState(
    'platform',
    parseAsString.withDefault('all').withOptions({ shallow: true })
  )
  const [viewModeRaw, setViewModeRaw] = useQueryState(
    'view',
    parseAsString.withDefault('calendar').withOptions({ shallow: true })
  )

  const viewMode: 'month' | 'week' | 'list' =
    viewModeRaw === 'list' ? 'list' : viewModeRaw === 'week' ? 'week' : 'month'

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
    <PageContainer
      pageTitle={`Kalender Konten • ${clientName}`}
      pageDescription={`Halo${firstName ? ` ${firstName}` : ''}, berikut jadwal publikasi multi-platform konten brand Anda.`}
      infoContent={calendarInfoContent}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="inline-flex items-center gap-2.5 rounded-lg bg-card border border-border/80 px-3.5 py-2 shadow-xs">
            <span className="text-xs text-muted-foreground font-medium">Total:</span>
            <strong className="text-lg font-bold tabular-nums">{visiblePosts.length}</strong>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-lg bg-card border border-border/80 px-3.5 py-2 shadow-xs">
            <span className="text-xs text-muted-foreground font-medium">Published:</span>
            <strong className="text-lg font-bold tabular-nums text-success">{publishedCount}</strong>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-lg bg-card border border-border/80 px-3.5 py-2 shadow-xs">
            <span className="text-xs text-muted-foreground font-medium">Bulan Ini:</span>
            <strong className="text-lg font-bold tabular-nums text-primary">{thisMonth.length}</strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Select value={selectedPlatform} onValueChange={(v) => setSelectedPlatform(v ?? 'all')}>
              <SelectTrigger className="h-10 sm:h-9 rounded-xl w-44">
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
              onClick={() => setViewModeRaw('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'month' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setViewModeRaw('list')}
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

        {visiblePosts.length === 0 ? (
          <EmptyState className="my-8">
            <EmptyMedia variant="icon">
              <Icons.calendar className="size-6 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>Tidak ada jadwal postingan</EmptyTitle>
            <EmptyDescription>
              {selectedPlatform !== 'all'
                ? `Belum ada konten terjadwal atau dipublikasikan untuk platform ${platformInfo[selectedPlatform] ?? selectedPlatform}.`
                : 'Belum ada konten yang dijadwalkan untuk brand Anda saat ini.'}
            </EmptyDescription>
          </EmptyState>
        ) : (
          <CalendarView
            posts={visiblePosts}
            role="client"
            viewMode={viewMode}
            onViewModeChange={(m) => setViewModeRaw(m)}
          />
        )}
      </div>
    </PageContainer>
  )
}
