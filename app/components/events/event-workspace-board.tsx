'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlusIcon, CalendarIcon, MapPinIcon, Loader2Icon } from 'lucide-react'
import { EventChecklist } from './event-checklist'
import { CreateEventModal } from './create-event-modal'

type Event = {
  id: string
  name: string
  description: string | null
  event_date: string
  location: string | null
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled'
}

export function EventWorkspaceBoard({ clientId }: { clientId: string }) {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select('id, name, description, event_date, location, status')
      .eq('client_id', clientId)
      .order('event_date', { ascending: false })
    if (data) setEvents(data as Event[])
    setLoading(false)
  }, [clientId])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const selectedEvent = events.find((e) => e.id === selectedEventId)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Event Workspace</CardTitle>
          <CardDescription>Kelola acara, checklist, vendor, dan post-mortem event</CardDescription>
        </div>
        <CreateEventModal clientId={clientId} onSuccess={fetchEvents}>
          <Button size="sm" className="h-9">
            <PlusIcon className="size-4 mr-2" /> Buat Event
          </Button>
        </CreateEventModal>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
            <Loader2Icon className="size-4 animate-spin" /> Memuat event...
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
            <CalendarIcon className="size-8" />
            <p className="text-sm">Belum ada event yang dibuat.</p>
          </div>
        ) : selectedEvent ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedEvent.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="size-3" />
                    {new Date(selectedEvent.event_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  {selectedEvent.location && (
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="size-3" />
                      {selectedEvent.location}
                    </span>
                  )}
                </div>
                <Badge variant={selectedEvent.status === 'completed' ? 'default' : selectedEvent.status === 'cancelled' ? 'destructive' : 'secondary'} className="mt-2">
                  {selectedEvent.status}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedEventId(null)}>
                ← Kembali ke daftar
              </Button>
            </div>
            <Tabs defaultValue="checklist">
              <TabsList className="mb-4">
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
                <TabsTrigger value="rundown">Rundown</TabsTrigger>
                <TabsTrigger value="vendors">Vendors</TabsTrigger>
                <TabsTrigger value="postmortem">Post-Mortem</TabsTrigger>
              </TabsList>
              <TabsContent value="checklist">
                <EventChecklist eventId={selectedEvent.id} />
              </TabsContent>
              <TabsContent value="rundown">
                <div className="p-4 border rounded-md text-sm text-muted-foreground">
                  {selectedEvent.description || 'Tidak ada rundown.'}
                </div>
              </TabsContent>
              <TabsContent value="vendors">
                <div className="p-4 border rounded-md text-sm text-muted-foreground">
                  Vendor management segera hadir.
                </div>
              </TabsContent>
              <TabsContent value="postmortem">
                <div className="p-4 border rounded-md text-sm text-muted-foreground">
                  Post-mortem segera hadir.
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className="flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{event.name}</span>
                  <Badge variant={event.status === 'completed' ? 'default' : event.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-[10px]">
                    {event.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarIcon className="size-3" />
                  {new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {event.location && (
                    <>
                      <MapPinIcon className="size-3" />
                      {event.location}
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
