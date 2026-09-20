import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/production/kanban-board'
import { CalendarView } from '@/components/production/calendar-view'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const dynamic = 'force-dynamic'

export default async function ProductionPage() {
  const supabase = await createClient()

  const { data: contentItems } = await supabase
    .from('content_items')
    .select(`
      *,
      campaigns(id, name)
    `)
    .order('created_at', { ascending: false })

  const { data: kols } = await supabase
    .from('kols')
    .select('id, name, rate_card, client_id')

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Content Production</h3>
        <p className="text-sm text-muted-foreground">Manage content creation, scheduling, and Kanban board.</p>
      </div>
      
      <Tabs defaultValue="kanban" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit">
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="flex-1 mt-4 min-h-0">
          <KanbanBoard 
            initialItems={contentItems || []} 
            clients={clients || []} 
          />
        </TabsContent>
        <TabsContent value="calendar" className="flex-1 mt-4 min-h-0">
          <CalendarView 
            initialItems={contentItems || []} 
            clients={clients || []} 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
