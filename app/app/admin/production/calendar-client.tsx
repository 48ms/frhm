'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KanbanBoard, type KanbanItem, type KanbanClient } from '@/components/production/kanban-board'
import { CalendarView, type ContentItem } from '@/components/production/calendar-view'
import { ContentFormModal } from '@/components/production/content-form-modal'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

// Query key factory
const productionKeys = {
  all: ['production'] as const,
  items: () => productionKeys.all,
  clients: () => ['clients'],
}

// Fetch functions
async function fetchContentItems() {
  const res = await fetch('/api/admin/content-items')
  if (!res.ok) throw new Error('Failed to fetch content items')
  const data = await res.json()
  return data.contentItems ?? []
}

async function fetchClients() {
  const res = await fetch('/api/admin/clients')
  if (!res.ok) throw new Error('Failed to fetch clients')
  const data = await res.json()
  return data.clients ?? []
}

// Main production dashboard client component
export default function ProductionDashboard() {
  const [modalOpen, setModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: contentItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: productionKeys.items(),
    queryFn: fetchContentItems,
    staleTime: 1000 * 60 * 2, // 2 min cache
  })

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: productionKeys.clients(),
    queryFn: fetchClients,
    staleTime: 1000 * 60 * 5, // 5 min cache
  })

  const isLoading = itemsLoading || clientsLoading

  // Refetch query on modal close (after create/update/delete)
  useEffect(() => {
    if (!modalOpen) {
      queryClient.invalidateQueries({ queryKey: productionKeys.items() })
    }
  }, [modalOpen, queryClient])

  // Type casts
  const kanbanItems: KanbanItem[] = contentItems.map((item: any) => ({
    id: item.id,
    title: item.title,
    stage: item.stage ?? 'idea', // fallback for legacy data
    client_id: item.client_id,
    platform: item.platform,
  }))

  const kanbanClients: KanbanClient[] = clients.map((c: any) => ({
    id: c.id,
    name: c.name,
  }))

  const calendarItems: ContentItem[] = contentItems.map((item: any) => ({
    id: item.id,
    title: item.title,
    target_date: item.target_date,
  }))

  return (
    <Tabs defaultValue="kanban" className="flex h-full min-h-0 flex-col">
      <TabsList className="w-fit">
        <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
      </TabsList>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Skeleton className="h-8 w-8 animate-spin rounded-full" />
        </div>
      ) : (
        <>
          <TabsContent value="kanban" className="flex-1 overflow-x-auto">
            <KanbanBoard initialItems={kanbanItems} clients={kanbanClients} />
          </TabsContent>
          <TabsContent value="calendar" className="flex-1">
            <CalendarView initialItems={calendarItems} />
          </TabsContent>
        </>
      )}

      {/* Create Modal */}
      <ContentFormModal
        clientId=""
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => setModalOpen(false)}
      />
    </Tabs>
  )
}
