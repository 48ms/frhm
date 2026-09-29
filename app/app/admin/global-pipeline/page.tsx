import Link from "next/link"
import type { ComponentProps } from "react"
import { createClient } from "@/lib/supabase/server"
import { KanbanBoard } from "@/components/admin/kanban-board"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import type { DeliverableWithClient } from "@/features/deliverables/api/types"

export const dynamic = "force-dynamic"

export default async function GlobalPipelinePage() {
  const supabase = await createClient()

  // 1. Ambil daftar klien riil untuk filter
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .not("name", "ilike", "Test%")
    .not("name", "ilike", "probe%")
    .order("name")

  const realClientIds = (clients ?? []).map((c) => c.id)

  // 2. Ambil deliverable milik klien riil
  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("id, title, status, type, client_id, updated_at, clients(name)")
    .in("client_id", realClientIds.length > 0 ? realClientIds : ["00000000-0000-0000-0000-000000000000"])
    .order("updated_at", { ascending: false })

  return (
    <PageContainer
      pageTitle="Global Pipeline"
      pageDescription="Pantau seluruh deliverable lintas klien dalam papan kanban real-time"
      pageHeaderAction={
        <Link href="/admin/deliverables/new">
          <Button size="sm" className="h-9 px-4 text-xs font-semibold shadow-xs">
            <Icons.add className="size-4 mr-1.5" />
            Deliverable Baru
          </Button>
        </Link>
      }
    >
      <div className="flex-1 overflow-hidden">
        <KanbanBoard 
          initialDeliverables={(deliverables as unknown as ComponentProps<typeof KanbanBoard>["initialDeliverables"]) ?? []} 
          clients={clients ?? []} 
        />
      </div>
    </PageContainer>
  )
}
