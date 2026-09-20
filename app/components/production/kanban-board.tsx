'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STATUSES = [
  { id: 'ideation', label: 'Ideation' },
  { id: 'scripting', label: 'Scripting' },
  { id: 'production', label: 'Production' },
  { id: 'editing', label: 'Editing' },
  { id: 'review', label: 'Review' },
  { id: 'published', label: 'Published' }
]

export function KanbanBoard({ initialItems, clients }: { initialItems: any[], clients: any[] }) {
  const [items, setItems] = useState(initialItems)
  const supabase = createClient()

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId
    
    // Optimistic update
    const updatedItems = items.map(item => 
      item.id === draggableId ? { ...item, status: newStatus } : item
    )
    setItems(updatedItems)

    // Persist to DB
    await supabase
      .from('content_items')
      .update({ status: newStatus })
      .eq('id', draggableId)
  }

  const getItemsByStatus = (status: string) => items.filter(i => i.status === status)

  const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'Unknown Client'

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {STATUSES.map(status => (
          <div key={status.id} className="flex flex-col w-80 shrink-0 bg-muted/40 rounded-xl">
            <div className="p-4 border-b">
              <h4 className="font-semibold">{status.label}</h4>
              <span className="text-xs text-muted-foreground">{getItemsByStatus(status.id).length} items</span>
            </div>
            <Droppable droppableId={status.id}>
              {(provided) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[150px]"
                >
                  {getItemsByStatus(status.id).map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Card className="shadow-sm cursor-grab active:cursor-grabbing">
                            <CardContent className="p-4 space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <p className="font-medium text-sm line-clamp-2">{item.title}</p>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-[10px]">
                                  {getClientName(item.client_id)}
                                </Badge>
                                {item.platform && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {item.platform}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
