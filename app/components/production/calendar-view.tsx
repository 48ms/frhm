'use client'

import { useState } from 'react'
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar'
import { format } from 'date-fns/format'
import { parse } from 'date-fns/parse'
import { startOfWeek } from 'date-fns/startOfWeek'
import { getDay } from 'date-fns/getDay'
import { enUS } from 'date-fns/locale/en-US'
import { id as idLocale } from 'date-fns/locale/id'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import withDragAndDrop, { withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { Card } from '@/components/ui/card'
import { EmptyState, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Icons } from '@/components/icons'
import { toast } from 'sonner'

const locales = {
  'en-US': enUS,
  'id-ID': idLocale,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
})

// Indonesian copy for react-big-calendar's built-in chrome (toolbar, headers).
const messages = {
  today: 'Hari Ini',
  previous: 'Sebelumnya',
  next: 'Berikutnya',
  month: 'Bulan',
  week: 'Minggu',
  day: 'Hari',
  agenda: 'Agenda',
  date: 'Tanggal',
  time: 'Waktu',
  event: 'Konten',
  noEventsInRange: 'Tidak ada konten pada rentang tanggal ini.',
  showMore: (total: number) => `+${total} konten lainnya`,
}

const DnDCalendar = withDragAndDrop(Calendar)

export type ContentItem = {
  id: string
  title: string
  target_date: string | null
  [key: string]: unknown
}

export function CalendarView({ initialItems }: { initialItems: ContentItem[] }) {
  // Transform initialItems into calendar events using target_date
  const [events, setEvents] = useState<Event[]>(
    initialItems
      .filter(item => item.target_date) // Only items with a target_date
      .map(item => ({
        id: item.id,
        title: item.title,
        start: new Date(item.target_date as string),
        end: new Date(item.target_date as string),
        resource: item,
      }))
  )

  const onEventDrop: withDragAndDropProps['onEventDrop'] = async ({ event, start, end }) => {
    // Optimistic update
    const updatedEvents = events.map(e =>
      (e as Event & { id?: string }).id === (event as Event & { id?: string }).id ? { ...e, start: new Date(start as Date), end: new Date(end as Date) } : e
    )
    setEvents(updatedEvents)

    // Persist via API
    const publishDate = (start as Date).toISOString()
    const res = await fetch('/api/admin/content-items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: (event as Event & { id?: string }).id, target_date: publishDate }),
    })
    if (!res.ok) {
      toast.error('Gagal menyimpan jadwal publish.')
      setEvents(events) // revert
    }
  }

  // Empty state — an empty month grid gives no direction on how to populate it.
  if (events.length === 0) {
    return (
      <EmptyState className="h-full border-dashed bg-card/40">
        <EmptyMedia variant="icon">
          <Icons.calendar className="size-5" />
        </EmptyMedia>
        <EmptyTitle>Belum Ada Jadwal Tayang</EmptyTitle>
        <EmptyDescription className="max-w-md">
          Kalender editorial akan menampilkan konten yang punya tanggal tayang.
          Tetapkan tanggal pada konten di workspace klien untuk melihatnya di sini.
        </EmptyDescription>
      </EmptyState>
    )
  }

  return (
    <Card className="h-full w-full p-4">
      <DnDCalendar
        localizer={localizer}
        culture="id-ID"
        messages={messages}
        events={events}
        onEventDrop={onEventDrop}
        resizable={false}
        style={{ height: '100%', minHeight: 600 }}
        views={['month', 'week', 'day']}
        defaultView="month"
      />
    </Card>
  )
}
