import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/production/kanban-board'
import { CalendarView } from '@/components/production/calendar-view'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageContainer } from '@/components/layout/page-container'

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

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')

  return (
    <PageContainer
      pageTitle="Content Production"
      pageDescription="Kelola pembuatan konten, jadwal kalender editorial, dan papan Kanban produksi."
    >
      <div className="space-y-4 flex flex-col flex-1 min-h-0">
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
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  )
}
