import { createClient } from "@/lib/supabase/server"
import { KanbanBoard } from "@/components/admin/kanban-board"

export const dynamic = "force-dynamic"

export default async function GlobalPipelinePage() {
  const supabase = await createClient()

  // 1. Ambil daftar klien untuk filter
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .order("name")

  // 2. Ambil semua deliverable lintas klien
  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("id, title, status, type, client_id, updated_at, clients(name)")
    .order("updated_at", { ascending: false })

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-none p-6 pb-2">
        <h1 className="text-2xl font-bold tracking-tight">Global Pipeline</h1>
        <p className="text-sm text-muted-foreground">Pantau seluruh deliverable lintas klien secara real-time</p>
      </div>
      <div className="flex-1 p-6 pt-0 overflow-hidden">
        <KanbanBoard 
          initialDeliverables={(deliverables as any) ?? []} 
          clients={clients ?? []} 
        />
      </div>
    </div>
  )
}
