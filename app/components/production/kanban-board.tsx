'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, type OnDragEndResponder } from '@hello-pangea/dnd'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Icons } from '@/components/icons'
import { toast } from 'sonner'

const STATUSES = [
  { id: 'idea', label: 'Ideasi', color: 'bg-blue-500' },
  { id: 'script', label: 'Script', color: 'bg-yellow-500' },
  { id: 'shooting', label: 'Shooting', color: 'bg-orange-500' },
  { id: 'editing', label: 'Editing', color: 'bg-purple-500' },
  { id: 'review', label: 'Review', color: 'bg-pink-500' },
  { id: 'ready', label: 'Siap Post', color: 'bg-green-500' },
]

export type KanbanItem = {
  id: string
  title: string
  stage: string
  client_id: string
  platform?: string
  [key: string]: unknown
}

export type KanbanClient = {
  id: string
  name: string
  [key: string]: unknown
}

export function KanbanBoard({ initialItems, clients }: { initialItems: KanbanItem[], clients: KanbanClient[] }) {
  const [items, setItems] = useState<KanbanItem[]>(initialItems)

  const onDragEnd: OnDragEndResponder = async (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStage = destination.droppableId

    // Optimistic update
    const updatedItems = items.map(item =>
      item.id === draggableId ? { ...item, stage: newStage } : item
    )
    setItems(updatedItems)

    // Persist via API
    try {
      const res = await fetch('/api/admin/content-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draggableId, stage: newStage }),
      })
      if (!res.ok) throw new Error('Failed to persist stage change')
      toast.success('Stage berhasil diperbarui')
    } catch (err) {
      console.error('Failed to update stage:', err)
      toast.error('Gagal menyimpan perubahan stage.')
      setItems(items) // revert
    }
  }

  const getItemsByStage = (stage: string) => items.filter(i => i.stage === stage)

  const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'Unknown Client'

  // Empty state — a kanban of six blank columns communicates nothing to the user.
  if (items.length === 0) {
    return (
      <EmptyState className="h-full border-dashed bg-card/40">
        <EmptyMedia variant="icon">
          <Icons.layers className="size-5" />
        </EmptyMedia>
        <EmptyTitle>Belum Ada Konten Produksi</EmptyTitle>
        <EmptyDescription className="max-w-md">
          Papan Kanban akan terisi otomatis begitu ada konten yang dibuat untuk klien.
          Buka workspace klien lalu tambahkan konten baru untuk memulai alur produksi.
        </EmptyDescription>
      </EmptyState>
    )
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        className="flex h-full min-w-0 gap-4 overflow-x-auto pb-4"
        style={{ touchAction: 'pan-x' }}
      >
        {STATUSES.map(status => (
          <section
            key={status.id}
            aria-label={`Kolom ${status.label}`}
            className="flex max-h-full min-h-0 w-80 shrink-0 flex-col overflow-hidden rounded-xl border bg-muted/30"
          >
            <header className="flex items-center gap-2 border-b bg-background/50 px-4 py-3">
              <span aria-hidden="true" className={`size-2 rounded-full ${status.color}`} />
              <h4 className="text-sm font-semibold">{status.label}</h4>
              <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                {getItemsByStage(status.id).length}
              </Badge>
            </header>
            <Droppable droppableId={status.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  role="list"
                  aria-label={`Daftar konten ${status.label}`}
                  className={`min-h-[200px] flex-1 space-y-2 overflow-y-auto p-2 transition-colors ${
                    snapshot.isDraggingOver ? 'bg-primary/5' : ''
                  }`}
                >
                  {getItemsByStage(status.id).map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          role="listitem"
                          aria-label={`Konten: ${item.title}`}
                          className={`transition-shadow ${
                            snapshot.isDragging ? 'z-10 rotate-1 opacity-90' : ''
                          }`}
                        >
                          <Card className="cursor-grab shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing">
                            <CardContent className="flex items-start gap-2 p-3">
                              <p className="line-clamp-2 flex-1 text-sm font-medium">{item.title}</p>
                              <Icons.gripVertical aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                            </CardContent>
                            <div className="flex flex-wrap gap-1 px-3 pb-3">
                              <Badge variant="outline" className="text-[10px]">
                                {getClientName(item.client_id)}
                              </Badge>
                              {item.platform && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {item.platform}
                                </Badge>
                              )}
                            </div>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </section>
        ))}
      </div>
    </DragDropContext>
  )
}
