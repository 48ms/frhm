'use client'

import { useState } from 'react'
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar'
import { format } from 'date-fns/format'
import { parse } from 'date-fns/parse'
import { startOfWeek } from 'date-fns/startOfWeek'
import { getDay } from 'date-fns/getDay'
import { enUS } from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import withDragAndDrop, { withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const DnDCalendar = withDragAndDrop(Calendar)

export function CalendarView({ initialItems, clients }: { initialItems: any[], clients: any[] }) {
  // Transform initialItems into calendar events
  const [events, setEvents] = useState<Event[]>(
    initialItems
      .filter(item => item.publish_date) // Only items with a publish date
      .map(item => ({
        id: item.id,
        title: item.title,
        start: new Date(item.publish_date),
        end: new Date(item.publish_date),
        resource: item, // store full item for custom rendering if needed
      }))
  )

  const onEventDrop: withDragAndDropProps['onEventDrop'] = async ({ event, start, end }) => {
    // Optimistic update
    const updatedEvents = events.map(e =>
      (e as any).id === (event as any).id ? { ...e, start: new Date(start as Date), end: new Date(end as Date) } : e
    )
    setEvents(updatedEvents)

    // Persist via API
    const publishDate = (start as Date).toISOString()
    const res = await fetch('/api/admin/content-items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: (event as any).id, publish_date: publishDate }),
    })
    if (!res.ok) {
      toast.error('Gagal menyimpan jadwal publish.')
      setEvents(events) // revert
    }
  }

  return (
    <Card className="h-full w-full p-4">
      <DnDCalendar
        localizer={localizer}
        events={events}
        onEventDrop={onEventDrop}
        resizable={false} // Content items usually just have a single publish date, no duration
        style={{ height: '100%', minHeight: 600 }}
        views={['month', 'week', 'day']}
        defaultView="month"
      />
    </Card>
  )
}
