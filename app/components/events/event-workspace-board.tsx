'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { CreateEventModal } from './create-event-modal'
import { EventChecklist } from './event-checklist'

type Event = {
  id: string
  name: string
  description: string | null
  event_date: string
  location: string | null
  status: string
}

interface EventWorkspaceBoardProps {
  clientId: string
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  planned: 'outline',
  'in-progress': 'default',
  completed: 'secondary',
  cancelled: 'destructive',
}

const statusLabel: Record<string, string> = {
  planned: 'Direncanakan',
  'in-progress': 'Berlangsung',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

export function EventWorkspaceBoard({ clientId }: EventWorkspaceBoardProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase
      .from('events')
      .select('id, name, description, event_date, location, status')
      .eq('client_id', clientId)
      .order('event_date', { ascending: false })

    setEvents(data as Event[] ?? [])
    setLoading(false)
  }, [clientId, supabase])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const selectedEvent = events.find(e => e.id === selectedEventId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
        Memuat data event...
      </div>
    )
  }

  // Event detail view
  if (selectedEvent) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedEventId(null)}>
          ← Kembali ke daftar event
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{selectedEvent.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Icons.calendar className="h-3.5 w-3.5" />
                  {new Date(selectedEvent.event_date).toLocaleDateString('id-ID', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </CardDescription>
              </div>
              <Badge variant={statusVariant[selectedEvent.status] ?? 'outline'}>
                {statusLabel[selectedEvent.status] ?? selectedEvent.status}
              </Badge>
            </div>
            {selectedEvent.location && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icons.mapPin className="h-3.5 w-3.5" />
                {selectedEvent.location}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {selectedEvent.description && (
              <p className="text-sm mb-6">{selectedEvent.description}</p>
            )}

            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Icons.circleCheck className="h-4 w-4" />
              Checklist Event
            </h3>
            <EventChecklist eventId={selectedEvent.id} clientId={clientId} />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Event list view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Event</h3>
          <p className="text-sm text-muted-foreground">
            {events.length === 0 ? 'Belum ada event.' : `${events.length} event terdaftar.`}
          </p>
        </div>
        <CreateEventModal clientId={clientId} onSuccess={fetchEvents}>
          <Button size="sm">
            <Icons.add className="h-4 w-4 mr-1.5" />
            Tambah Event
          </Button>
        </CreateEventModal>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Icons.calendar className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Belum ada event untuk klien ini.</p>
            <p className="text-xs text-muted-foreground mt-1">Klik &quot;Tambah Event&quot; untuk membuat event baru.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {events.map(event => (
            <Card
              key={event.id}
              className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all"
              onClick={() => setSelectedEventId(event.id)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{event.name}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Icons.calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {new Date(event.event_date).toLocaleDateString('id-ID', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                    {event.location && (
                      <>
                        <span>·</span>
                        <Icons.mapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant={statusVariant[event.status] ?? 'outline'} className="ml-3 shrink-0">
                  {statusLabel[event.status] ?? event.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
