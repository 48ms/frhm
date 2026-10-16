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
import { EditClientDialog } from "@/components/client/edit-client-dialog"
import { DeleteClientDialog } from "@/components/client/delete-client-dialog"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { AnimateIcon } from "@/components/animate-ui/icons/icon"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/animate-ui/components/radix/dropdown-menu"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/animate-ui/components/radix/tooltip"

import Link from "next/link"
import { useAllSupportTickets } from "@/features/support/api/queries"
import { AdminSupportTicketsDialog } from "@/components/support/admin-support-tickets-dialog"
import type { ClientWithChannels } from "@/features/social-accounts/api/types"

export function ClientManagerSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat daftar client workspace"
      className="space-y-6 animate-pulse"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-card border border-border/40" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-56 rounded-2xl bg-card border border-border/40" />
        ))}
      </div>
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
  const clients = (clientsData ?? []) as ClientWithChannels[]
  const supportTicketsQuery = useAllSupportTickets()
  const tickets = supportTicketsQuery?.data ?? []
  const { openCreateClient } = useCreateClient()

  const [selectedClientForEdit, setSelectedClientForEdit] = React.useState<ClientWithChannels | null>(null)
  const [selectedClientForDelete, setSelectedClientForDelete] = React.useState<ClientWithChannels | null>(null)
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
        (c.contact_email || "").toLowerCase().includes(query) ||
        (c.brand_profile?.who || "").toLowerCase().includes(query) ||
        ((c.brand_profile as Record<string, unknown>)?.niche as string || "").toLowerCase().includes(query)
    )
  }, [clients, q])

  // Hitungan metrik ringkasan portofolio
  const totalChannelsCount = React.useMemo(() => {
    return clients.reduce((acc, c) => acc + (c.channels?.length || 0), 0)
  }, [clients])

  const activeTicketsCount = React.useMemo(() => {
    return tickets.filter((t) => t.status === "open" || t.status === "in_progress").length
  }, [tickets])

  const profiledCount = React.useMemo(() => {
    return clients.filter((c) => {
      const bp = c.brand_profile as Record<string, unknown> | undefined
      return Boolean(bp?.who || bp?.niche || (bp?.pillars as string[])?.length)
    }).length
  }, [clients])

  return (
    <div className="space-y-6">
      {/* 1. Header Portfolio Metrics Bar (Animate UI MetricTicker) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/40 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Total Workspaces</p>
            <div className="text-2xl font-bold text-foreground mt-0.5">
              <MetricTicker value={clients.length} />
            </div>
          </div>
          <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Icons.building className="size-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/40 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Kanal Aktif</p>
            <div className="text-2xl font-bold text-foreground mt-0.5">
              <MetricTicker value={totalChannelsCount} />
            </div>
          </div>
          <div className="size-10 rounded-xl bg-[hsl(var(--admin-cobalt))]/10 border border-[hsl(var(--admin-cobalt))]/20 flex items-center justify-center text-[hsl(var(--admin-cobalt))]">
            <Icons.share className="size-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/40 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Tiket Terbuka</p>
            <div className="text-2xl font-bold text-foreground mt-0.5">
              <MetricTicker value={activeTicketsCount} />
            </div>
          </div>
          <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Icons.inbox className="size-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/40 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Profil Terpetakan</p>
            <div className="text-2xl font-bold text-foreground mt-0.5">
              <MetricTicker value={profiledCount} />
              <span className="text-xs font-normal text-muted-foreground ml-1">/ {clients.length}</span>
            </div>
          </div>
          <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Icons.bot className="size-5" />
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari client..."
              value={q}
              onChange={(e) => void setClientsState({ q: e.target.value })}
              className="pl-9 h-9 text-xs rounded-xl border-border/50 bg-background/50 focus:bg-background"
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

        <div className="text-2xs font-semibold text-muted-foreground flex items-center gap-1.5 self-end sm:self-auto">
          <span>Menampilkan</span>
          <strong className="text-foreground">{filteredClients.length}</strong>
          <span>dari {clients.length} client workspaces</span>
        </div>
      </div>

      {/* 3. Client Workspaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
          const bp = (client.brand_profile as Record<string, unknown>) || {}
          const nicheTag = typeof bp.niche === "string" ? bp.niche : null
          const channelList = client.channels || []
          const initial = (client.name?.charAt(0) || "C").toUpperCase()

          return (
            <div
              key={client.id}
              data-client-id={client.id}
              className="p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all flex flex-col justify-between shadow-xs hover:shadow-md group relative"
            >
              <div>
                {/* Card Top: Avatar, Name, Niche Badge & Dropdown Menu */}
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-base text-primary shrink-0 shadow-2xs"
                      aria-hidden
                    >
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors">
                          {client.name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <Icons.mail className="size-3 shrink-0 text-muted-foreground/70" />
                        <span>{client.contact_email || "Belum ada email"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions Dropdown Menu (Radix UI) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                        aria-label={`Menu tindakan untuk ${client.name}`}
                      >
                        <Icons.dotsVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-xl border-border/40">
                      <DropdownMenuItem
                        onClick={() => setSelectedClientForEdit(client)}
                        className="text-xs cursor-pointer gap-2 py-1.5"
                      >
                        <Icons.edit className="size-3.5 text-primary" />
                        <span>Edit Data Client</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSelectedClientForAccess({ id: client.id, name: client.name })}
                        className="text-xs cursor-pointer gap-2 py-1.5"
                      >
                        <Icons.users className="size-3.5 text-primary" />
                        <span>Kelola Akses Portal</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSelectedClientForEditor({ id: client.id, name: client.name })}
                        className="text-xs cursor-pointer gap-2 py-1.5"
                      >
                        <Icons.bot className="size-3.5 text-primary" />
                        <span>Brand Brain (AI)</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSelectedClientForPlaybooks({ id: client.id, name: client.name })}
                        className="text-xs cursor-pointer gap-2 py-1.5"
                      >
                        <Icons.bookOpen className="size-3.5 text-primary" />
                        <span>Katalog Playbooks</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1 border-border/40" />
                      <DropdownMenuItem
                        onClick={() => window.open(`/client/dashboard?clientId=${client.id}`, "_blank")}
                        className="text-xs cursor-pointer gap-2 py-1.5"
                      >
                        <Icons.externalLink className="size-3.5 text-primary" />
                        <span>Buka Portal Klien ↗</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1 border-border/40" />
                      <DropdownMenuItem
                        onClick={() => setSelectedClientForDelete(client)}
                        className="text-xs cursor-pointer gap-2 py-1.5 text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Icons.trash className="size-3.5" />
                        <span>Hapus Workspace</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Card Meta: Niche Tag, Phone, Channels badges */}
                <div className="space-y-2.5 pb-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {nicheTag ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {nicheTag}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-normal text-muted-foreground/70 bg-muted/50 border border-border/40">
                        Niche Umum
                      </span>
                    )}

                    {client.contact_phone && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs text-muted-foreground bg-muted/50">
                        <Icons.phone className="size-2.5" />
                        <span>{client.contact_phone}</span>
                      </span>
                    )}
                  </div>

                  {/* Connected channels pill row */}
                  <div className="flex items-center justify-between text-2xs text-muted-foreground pt-1">
                    <span className="font-semibold flex items-center gap-1">
                      <MetricTicker value={channelList.length} /> Kanal Terhubung
                    </span>
                    <div className="flex items-center gap-1">
                      {channelList.length > 0 ? (
                        channelList.map((ch) => (
                          <span
                            key={ch.id}
                            className="size-5 rounded-md bg-muted/80 border border-border/50 flex items-center justify-center text-3xs font-bold uppercase text-foreground/80"
                            title={`${ch.platform}: ${ch.handle || "Terhubung"}`}
                          >
                            {ch.platform.charAt(0)}
                          </span>
                        ))
                      ) : (
                        <span className="text-3xs text-muted-foreground/60 italic">Belum ada akun sosial</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: Quick Actions (Lega & Rapi) */}
              <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedClientForPlaybooks({ id: client.id, name: client.name })}
                    className="h-7 px-2 text-2xs font-bold rounded-lg flex items-center gap-1 cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                  >
                    <Icons.bookOpen className="size-3 text-primary" />
                    <span>Playbooks</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedClientForEditor({ id: client.id, name: client.name })}
                    className="h-7 px-2 text-2xs font-bold rounded-lg flex items-center gap-1 cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                  >
                    <Icons.bot className="size-3 text-primary" />
                    <span>Brand Brain</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedClientForAccess({ id: client.id, name: client.name })}
                    className="h-7 px-2 text-2xs font-bold rounded-lg flex items-center gap-1 cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                  >
                    <Icons.users className="size-3 text-primary" />
                    <span>Akses Klien</span>
                  </Button>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedClientForEdit(client)}
                        className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                        aria-label={`Edit ${client.name}`}
                      >
                        <Icons.pencil className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Edit Data Workspace</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/client/dashboard?clientId=${client.id}`}
                        className="size-7 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors border border-border/40"
                        title={`Buka Portal Klien ${client.name}`}
                        aria-label="Portal Klien"
                      >
                        <Icons.externalLink className="size-3.5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="top">Buka Portal Klien</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedClientForDelete(client)}
                        className="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        aria-label={`Hapus ${client.name}`}
                      >
                        <Icons.trash className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Hapus Client</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          )
        })}

        {/* Add New Client Card Button */}
        <Button
          variant="outline"
          onClick={openCreateClient}
          className="p-6 h-auto min-h-48 rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/60 hover:bg-primary/5 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="size-12 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-105 group-hover:bg-primary/10 transition-all" aria-hidden>
            <Icons.add className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="text-center">
            <span className="font-bold text-sm text-foreground block">Add New Client</span>
            <span className="text-2xs text-muted-foreground mt-0.5 block">Buat profil brand & workspace klien baru</span>
          </div>
        </Button>
      </div>

      {/* Modal Dialogs */}
      {selectedClientForEdit && (
        <EditClientDialog
          open={Boolean(selectedClientForEdit)}
          onOpenChange={(open) => !open && setSelectedClientForEdit(null)}
          client={selectedClientForEdit}
        />
      )}

      {selectedClientForDelete && (
        <DeleteClientDialog
          open={Boolean(selectedClientForDelete)}
          onOpenChange={(open) => !open && setSelectedClientForDelete(null)}
          client={selectedClientForDelete}
        />
      )}

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