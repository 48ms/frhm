"use client"

import * as React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "motion/react"

type Client = { id: string; name: string }
type Deliverable = {
  id: string
  title: string
  status: string
  type: string
  client_id: string
  updated_at: string
  clients: { name: string } | null
}

const COLUMNS = [
  { id: "draft", label: "Draft", color: "bg-zinc-100 dark:bg-zinc-800/50" },
  { id: "sent", label: "Terkirim", color: "bg-blue-50 dark:bg-blue-900/20" },
  { id: "revision_requested", label: "Minta Revisi", color: "bg-orange-50 dark:bg-orange-900/20" },
  { id: "approved", label: "Disetujui", color: "bg-green-50 dark:bg-green-900/20" },
]

export function KanbanBoard({
  initialDeliverables,
  clients,
}: {
  initialDeliverables: Deliverable[]
  clients: Client[]
}) {
  const [selectedClient, setSelectedClient] = useState<string>("all")

  // Filter deliverables
  const filtered = React.useMemo(() => {
    if (selectedClient === "all") return initialDeliverables
    return initialDeliverables.filter((d) => d.client_id === selectedClient)
  }, [initialDeliverables, selectedClient])

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-2 pb-2">
        <Select value={selectedClient} onValueChange={(val) => val && setSelectedClient(val)}>
          <SelectTrigger className="w-[250px] bg-background">
            <SelectValue placeholder="Filter by Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Client</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground ml-auto">
          Menampilkan {filtered.length} deliverable
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex flex-1 gap-4 overflow-x-auto pb-4 items-start scrollbar-hide">
        {COLUMNS.map((col) => {
          const colItems = filtered.filter((d) => d.status === col.id)

          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-[300px] flex flex-col max-h-full rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20 backdrop-blur-md border border-zinc-200/40 dark:border-zinc-800/40"
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`size-2.5 rounded-full ${col.id === 'approved' ? 'bg-brand-accent' : col.id === 'revision_requested' ? 'bg-orange-400' : col.id === 'sent' ? 'bg-blue-400' : 'bg-zinc-400'}`} />
                  <span className="font-semibold text-sm tracking-tight">{col.label}</span>
                </div>
                <Badge variant="secondary" className="rounded-full bg-background/80 shadow-sm tabular-nums">
                  {colItems.length}
                </Badge>
              </div>
              
              <div className="p-3 flex-1 overflow-y-auto space-y-3 scrollbar-hide">
                <AnimatePresence>
                  {colItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    >
                      <Card className="cursor-pointer border-none shadow-sm hover:shadow-md transition-all bg-background/90 backdrop-blur-xl group">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-[11px] font-semibold text-brand-accent tracking-wider uppercase">
                              {item.clients?.name ?? "Unknown"}
                            </div>
                            <span className="text-[10px] text-muted-foreground tabular-nums">
                              {new Date(item.updated_at).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          
                          <div className="font-medium text-sm leading-snug mb-3 group-hover:text-brand-accent transition-colors">
                            {item.title}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px] uppercase bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700">
                              {item.type}
                            </Badge>
                            
                            {/* Avatar placeholder atau action trigger */}
                            <div className="size-6 rounded-full bg-muted border border-background shadow-sm flex items-center justify-center">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {colItems.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground/60 py-8 font-medium">
                    Belum ada tugas
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
