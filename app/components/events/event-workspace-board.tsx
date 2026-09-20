'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { PlusIcon, CalendarIcon } from 'lucide-react'
import { EventChecklist } from './event-checklist'
import { CreateEventModal } from './create-event-modal'

export function EventWorkspaceBoard({ clientId }: { clientId: string }) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  
  // For now, placeholder UI since we haven't built the fetch logic
  const events = [] // We will fetch this

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Event Workspace</CardTitle>
          <CardDescription>Kelola acara, rundown, vendor, dan checklist event</CardDescription>
        </div>
        <CreateEventModal clientId={clientId}>
          <Button size="sm" className="h-9">
            <PlusIcon className="size-4 mr-2" /> Buat Event
          </Button>
        </CreateEventModal>
      </CardHeader>
      <CardContent>
        {selectedEventId ? (
          <Tabs defaultValue="rundown">
            <TabsList className="mb-4">
              <TabsTrigger value="rundown">Rundown</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="postmortem">Post-Mortem</TabsTrigger>
            </TabsList>
            <TabsContent value="rundown">
              <div className="p-4 border rounded-md">Rundown content goes here</div>
            </TabsContent>
            <TabsContent value="checklist">
              <EventChecklist eventId={selectedEventId} />
            </TabsContent>
            <TabsContent value="vendors">
              <div className="p-4 border rounded-md">Vendors content goes here</div>
            </TabsContent>
            <TabsContent value="postmortem">
              <div className="p-4 border rounded-md">Post-Mortem content goes here</div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
            <CalendarIcon className="size-8" />
            <p className="text-sm">Belum ada event yang dipilih atau dibuat.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
