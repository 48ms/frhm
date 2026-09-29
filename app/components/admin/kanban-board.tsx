"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "motion/react"
import { Icons } from '@/components/icons'

type Client = { id: string; name: string }
type Deliverable = {
  id: string
  title: string
  status: string
  type: string
  client_id: string
  updated_at: string
  clients: { name: string; contact_email?: string | null } | null | undefined
}

const COLUMNS = [
  { id: "draft", label: "Draft", dotColor: "bg-zinc-400" },
  { id: "sent", label: "Terkirim", dotColor: "bg-blue-500" },
  { id: "revision_requested", label: "Minta Revisi", dotColor: "bg-amber-500" },
  { id: "approved", label: "Disetujui", dotColor: "bg-emerald-500" },
]

export function KanbanBoard({
  initialDeliverables,
  clients,
}: {
  initialDeliverables: Deliverable[]
  clients: Client[]
}) {
  const [selectedClient, setSelectedClient] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  // Filter deliverables by both client and status per Spec §3
  const filtered = useMemo(() => {
    return initialDeliverables.filter((d) => {
      const matchClient = selectedClient === "all" || d.client_id === selectedClient
      const matchStatus = selectedStatus === "all" || d.status === selectedStatus
      return matchClient && matchStatus
    })
  }, [initialDeliverables, selectedClient, selectedStatus])

  const visibleColumns = useMemo(() => {
    if (selectedStatus === "all") return COLUMNS
    return COLUMNS.filter((col) => col.id === selectedStatus)
  }, [selectedStatus])

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
          <Icons.adjustments className="size-3.5" />
          Filter:
        </div>

        {/* Filter by Client */}
        <Select value={selectedClient} onValueChange={(val) => val && setSelectedClient(val)}>
          <SelectTrigger className="w-[190px] h-9 text-xs bg-background shadow-xs">
            <SelectValue placeholder="Semua Client">
              {selectedClient === "all"
                ? "Semua Client"
                : clients.find((c) => c.id === selectedClient)?.name ?? "Semua Client"}
            </SelectValue>
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

        {/* Filter by Status (per OpenSpec management/global-pipeline §3) */}
        <Select value={selectedStatus} onValueChange={(val) => val && setSelectedStatus(val)}>
          <SelectTrigger className="w-[160px] h-9 text-xs bg-background shadow-xs">
            <SelectValue placeholder="Semua Status">
              {selectedStatus === "all"
                ? "Semua Status"
                : COLUMNS.find((col) => col.id === selectedStatus)?.label ?? "Semua Status"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {COLUMNS.map((col) => (
              <SelectItem key={col.id} value={col.id}>
                {col.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="text-xs font-medium text-muted-foreground ml-auto tabular-nums">
          Menampilkan {filtered.length} deliverable
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex flex-1 gap-4 overflow-x-auto pb-4 items-start scrollbar-hide">
        {visibleColumns.map((col) => {
          const colItems = filtered.filter((d) => d.status === col.id)

          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-[300px] flex flex-col max-h-full rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 shadow-xs"
            >
              <div className="p-3.5 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`size-2.5 rounded-full ${col.dotColor}`} />
                  <span className="font-semibold text-xs tracking-wide uppercase text-foreground">{col.label}</span>
                </div>
                <Badge variant="secondary" className="rounded-full bg-background border border-border/50 shadow-xs text-xs tabular-nums px-2 py-0.5">
                  {colItems.length}
                </Badge>
              </div>
              
              <div className="p-3 flex-1 overflow-y-auto space-y-2.5 scrollbar-hide">
                <AnimatePresence>
                  {colItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    >
                      <Link href={`/admin/deliverables/${item.id}`} className="block focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
                        <Card className="cursor-pointer border border-border/50 shadow-xs hover:shadow-md hover:border-brand-accent/50 transition-all bg-background/95 group rounded-xl">
                          <CardContent className="p-3.5">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-[11px] font-bold text-brand-accent tracking-wide uppercase truncate">
                                {item.clients?.name ?? "Unknown"}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-medium tabular-nums shrink-0">
                                {new Date(item.updated_at).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
                              </span>
                            </div>
                            
                            <p className="font-semibold text-sm leading-snug mb-3 text-foreground group-hover:text-brand-accent transition-colors line-clamp-2">
                              {item.title}
                            </p>
                            
                            <div className="flex items-center justify-between pt-1 border-t border-border/30">
                              <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider bg-muted/40 border-border/50">
                                {item.type}
                              </Badge>
                              
                              <div className="size-6 rounded-md flex items-center justify-center text-muted-foreground group-hover:text-brand-accent group-hover:bg-brand-accent/10 transition-colors">
                                <Icons.arrowUpRight className="size-3.5" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {colItems.length === 0 && (
                  <div className="text-center py-10 flex flex-col items-center justify-center gap-1.5 text-muted-foreground/60">
                    <Icons.post className="size-5 opacity-40" />
                    <p className="text-xs font-medium">Belum ada deliverable</p>
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
