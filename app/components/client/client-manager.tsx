"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { socialQueries } from "@/features/social-accounts/api/queries"
import { useCreateClient } from "@/components/client/create-client-provider"
import { useQueryStates } from "nuqs"
import { clientsSearchParams } from "@/lib/searchparams"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { BrandBrainEditorDialog } from "@/components/ai/brand-brain-editor-dialog"
import { ClientPlaybooksDialog } from "@/components/client/client-playbooks-dialog"
import { ClientAccessDialog } from "@/components/client/client-access-dialog"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"

import Link from "next/link"
import { useAllSupportTickets } from "@/features/support/api/queries"
import { AdminSupportTicketsDialog } from "@/components/support/admin-support-tickets-dialog"

export function ClientManagerSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat daftar client workspace"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse"
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-40 rounded-2xl bg-card border border-border/50" />
      ))}
    </div>
  )
}

export function SupportTicketsHeaderButton() {
  const [open, setOpen] = React.useState(false)
  const { data: tickets = [] } = useAllSupportTickets()
  const activeCount = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2 cursor-pointer shadow-sm font-semibold rounded-xl border-border/60 hover:bg-muted/80 relative"
      >
        <Icons.inbox className="size-4 text-primary" />
        <span>Tiket Dukungan</span>
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-2xs font-bold leading-none text-primary-foreground bg-primary rounded-full">
            <MetricTicker value={activeCount} />
          </span>
        )}
      </Button>
      <AdminSupportTicketsDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export function AddClientHeaderButton() {
  const { openCreateClient } = useCreateClient()
  return (
    <Button
      type="button"
      onClick={openCreateClient}
      className="gap-2 cursor-pointer shadow-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
    >
      <Icons.add className="size-4" />
      <span>Tambah Client</span>
    </Button>
  )
}

export function ClientManager() {
  const [{ q }, setClientsState] = useQueryStates(clientsSearchParams, { shallow: true })
  const { data: clientsData } = useQuery({
    ...socialQueries.listClientsWithChannels(),
    placeholderData: [],
  })
  const clients = clientsData ?? []
  const { openCreateClient } = useCreateClient()
  const [selectedClientForEditor, setSelectedClientForEditor] = React.useState<{
    id: string
    name: string
  } | null>(null)
  const [selectedClientForPlaybooks, setSelectedClientForPlaybooks] = React.useState<{
    id: string
    name: string
  } | null>(null)
  const [selectedClientForAccess, setSelectedClientForAccess] = React.useState<{
    id: string
    name: string
  } | null>(null)
  const [selectedClientForTickets, setSelectedClientForTickets] = React.useState<{
    id: string
    name: string
  } | null>(null)

  const filteredClients = React.useMemo(() => {
    if (!q) return clients
    const query = q.toLowerCase()
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.contact_email || "").toLowerCase().includes(query)
    )
  }, [clients, q])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 max-w-sm">
        <div className="relative flex-1">
          <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari client..."
            value={q}
            onChange={(e) => void setClientsState({ q: e.target.value })}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>
        {q && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void setClientsState({ q: "" })}
            className="h-9 px-2 text-xs"
          >
            Reset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients?.map((client) => (
          <div
            key={client.id}
            data-client-id={client.id}
            className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/60 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-lg text-primary"
                aria-hidden
              >
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg truncate">{client.name}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {client.contact_email || "Belum ada email"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              <span className="text-2xs font-semibold text-muted-foreground flex items-center gap-1">
                <MetricTicker value={client.channels?.length || 0} /> Kanal Terhubung
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSelectedClientForPlaybooks({ id: client.id, name: client.name })
                  }
                  className="h-7 text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                >
                  <Icons.bookOpen className="size-3 text-primary" />
                  Playbooks
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSelectedClientForEditor({ id: client.id, name: client.name })
                  }
                  className="h-7 text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                >
                  <Icons.bot className="size-3 text-primary" />
                  Brand Brain
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSelectedClientForAccess({ id: client.id, name: client.name })
                  }
                  className="h-7 text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                >
                  <Icons.users className="size-3 text-primary" />
                  Akses Klien
                </Button>
                <Link
                  href={`/client/dashboard?clientId=${client.id}`}
                  className="h-7 px-2.5 text-xs font-bold rounded-full flex items-center gap-1.5 border border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                  title={`Buka Portal Klien ${client.name}`}
                >
                  <Icons.externalLink className="size-3 text-primary" />
                  Portal Klien
                </Link>
              </div>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={openCreateClient}
          className="p-6 h-auto min-h-32 rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center" aria-hidden>
            <Icons.add className="size-6 text-muted-foreground" />
          </div>
          <span className="font-bold text-sm">Add New Client</span>
        </Button>
      </div>

      {selectedClientForEditor && (
        <BrandBrainEditorDialog
          open={Boolean(selectedClientForEditor)}
          onOpenChange={(open) => !open && setSelectedClientForEditor(null)}
          clientId={selectedClientForEditor.id}
          clientName={selectedClientForEditor.name}
        />
      )}

      {selectedClientForPlaybooks && (
        <ClientPlaybooksDialog
          open={Boolean(selectedClientForPlaybooks)}
          onOpenChange={(open) => !open && setSelectedClientForPlaybooks(null)}
          clientId={selectedClientForPlaybooks.id}
          clientName={selectedClientForPlaybooks.name}
        />
      )}

      {selectedClientForAccess && (
        <ClientAccessDialog
          open={Boolean(selectedClientForAccess)}
          onOpenChange={(open) => !open && setSelectedClientForAccess(null)}
          clientId={selectedClientForAccess.id}
          clientName={selectedClientForAccess.name}
        />
      )}

      {selectedClientForTickets && (
        <AdminSupportTicketsDialog
          open={Boolean(selectedClientForTickets)}
          onOpenChange={(open) => !open && setSelectedClientForTickets(null)}
          initialClientId={selectedClientForTickets.id}
        />
      )}
    </div>
  )
}