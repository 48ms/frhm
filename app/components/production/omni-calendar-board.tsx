'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, 
  isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday
} from 'date-fns'
import { id } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react'
import { PlatformIcon } from '@/components/calendar/calendar-view'
import type { RealtimeChannel } from '@supabase/supabase-js'

type PlatformPost = {
  id: string
  platform: string
  format: string
  scheduled_at: string
  status: string
  asset: {
    title: string
  }
}

function getPlatformIcon(platform: string) {
  return <PlatformIcon platform={platform} className="size-3" />
}

function getPlatformColor(platform: string) {
  switch (platform?.toLowerCase()) {
    case 'instagram': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200'
    case 'linkedin': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200'
    case 'twitter': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200'
    case 'tiktok': return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
    case 'facebook': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export function OmniCalendarBoard({ clientId }: { clientId: string }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [posts, setPosts] = useState<PlatformPost[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      try {
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id')
          .eq('client_id', clientId)
          
        if (!campaigns || campaigns.length === 0) {
          setPosts([])
          return
        }
        
        const campaignIds = campaigns.map(c => c.id)

        const { data: assets } = await supabase
          .from('content_assets')
          .select('id, title')
          .in('campaign_id', campaignIds)
          
        if (!assets || assets.length === 0) {
          setPosts([])
          return
        }

        const assetIds = assets.map(a => a.id)
        const assetMap = new Map(assets.map(a => [a.id, a]))

        const { data: platformPosts } = await supabase
          .from('platform_posts')
          .select('id, asset_id, platform, format, scheduled_at, status')
          .in('asset_id', assetIds)
          .not('scheduled_at', 'is', null)

        if (platformPosts) {
          const formattedPosts = platformPosts.map(p => ({
            id: p.id,
            platform: p.platform,
            format: p.format,
            scheduled_at: p.scheduled_at,
            status: p.status,
            asset: {
              title: assetMap.get(p.asset_id)?.title || 'Untitled'
            }
          }))
          setPosts(formattedPosts)
        }
      } catch (error) {
        console.error('Error fetching calendar data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()

    channelRef.current = supabase
      .channel('platform-posts-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'platform_posts' },
        () => {
          fetchPosts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channelRef.current!)
    }
  }, [clientId, supabase])

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  // Generate calendar grid
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const dateFormat = "d"
  const rows = []
  let days = []
  let day = startDate
  let formattedDate = ""

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat)
      const cloneDay = day
      
      // Find posts for this day
      const dayPosts = posts.filter(post => 
        isSameDay(parseISO(post.scheduled_at), cloneDay)
      )

      days.push(
        <div 
          key={day.toString()} 
          className={`min-h-[120px] p-2 border-r border-b border-border transition-colors ${
            !isSameMonth(day, monthStart) 
              ? 'bg-muted/30 text-muted-foreground' 
              : isToday(day) ? 'bg-primary/5' : 'bg-background hover:bg-muted/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${isToday(day) ? 'bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full' : ''}`}>
              {formattedDate}
            </span>
            {dayPosts.length > 0 && (
              <span className="text-xs text-muted-foreground">{dayPosts.length} post</span>
            )}
          </div>
          
          <div className="mt-2 space-y-1.5 flex flex-col">
            {dayPosts.map(post => (
              <div 
                key={post.id} 
                className={`text-xs p-1.5 rounded-md border flex items-start gap-1.5 cursor-pointer hover:opacity-80 transition-opacity shadow-sm ${getPlatformColor(post.platform)}`}
                title={post.asset.title}
              >
                <div className="mt-0.5 opacity-80">{getPlatformIcon(post.platform)}</div>
                <div className="flex-1 truncate font-medium">
                  {post.asset.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
      day = addDays(day, 1)
    }
    rows.push(
      <div className="grid grid-cols-7" key={day.toString()}>
        {days}
      </div>
    )
    days = []
  }

  const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-2 pb-6 border-b">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <CalendarIcon className="size-5 text-primary" />
            Omni-Channel Calendar
          </CardTitle>
          <CardDescription>
            Jadwal tayang konten lintas platform.
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToToday}>Hari Ini</Button>
          <div className="flex items-center space-x-1 ml-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <div className="font-semibold min-w-[140px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: id })}
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {loading ? (
          <div className="h-[600px] flex items-center justify-center text-muted-foreground">
            Memuat kalender...
          </div>
        ) : (
          <div className="w-full">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/40">
              {weekDays.map(day => (
                <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar Body */}
            <div className="flex flex-col bg-background">
              {rows}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
