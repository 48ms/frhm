"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { useCreateClient } from "@/components/client/create-client-provider"
import { dashboardQueries } from "@/features/dashboard/api/queries"
import { Button } from "@/components/ui/button"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu"

export function WorkspaceSwitcher({
  className,
  collapsed = false,
}: {
  className?: string
  collapsed?: boolean
} = {}) {
  const router = useRouter()
  const { clients, clientId, setClientId } = useActiveDashboard()
  const { openCreateClient } = useCreateClient()
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)

  const [searchQuery, setSearchQuery] = React.useState("")

  // Fallback if not found
  const activeClient = clients.find((c) => c.id === clientId) ?? clients[0]

  const filteredClients = React.useMemo(() => {
    if (!searchQuery.trim()) return clients
    const q = searchQuery.toLowerCase().trim()
    return clients.filter((c) => c.name.toLowerCase().includes(q))
  }, [clients, searchQuery])

  // OPTIMISTIC PREFETCH: saat kursor menyentuh salah satu klien, kita siapkan
  // data profilnya di cache SEBELUM klik. Karena query profil tidak suspend
  // (placeholderData), data siap ini akan langsung tampil → switch terasa instan
  // tanpa "flash of zeros". Kegagalan prefetch diabaikan (best-effort).
  const prefetchProfile = React.useCallback(
    (id: string) => {
      if (id === clientId) return
      void queryClient.prefetchQuery(dashboardQueries.profile(id))
    },
    [clientId, queryClient]
  )

  if (!activeClient) return null

  return (
    <div className={cn("workspace-switcher-container relative w-full z-50", className ?? "mb-6")}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          {collapsed ? (
            <Button
              type="button"
              variant="outline"
              aria-label={`Current workspace: ${activeClient.name}`}
              className={cn(
                "w-8 h-8 p-0 rounded-xl bg-brand-accent text-primary-foreground font-bold text-xs flex items-center justify-center mx-auto shadow-sm cursor-pointer border border-border/20 hover:border-brand-accent/50 transition-all",
                open && "ring-2 ring-brand-accent/20 border-brand-accent/50"
              )}
            >
              {activeClient.name.charAt(0).toUpperCase()}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              aria-label={`Current workspace: ${activeClient.name}`}
              className={cn(
                "w-full h-auto flex items-center justify-between p-2.5 rounded-2xl bg-card border border-border/40 hover:border-brand-accent/50 transition-all cursor-pointer shadow-sm group select-none text-left",
                open && "ring-2 ring-brand-accent/20 border-brand-accent/50"
              )}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-brand-accent text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-border/20">
                  {activeClient.name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate leading-tight text-left">
                  <span className="block text-2xs font-bold text-muted-foreground uppercase tracking-wider">
                    Workspace
                  </span>
                  <span className="block text-sm font-bold text-foreground truncate">
                    {activeClient.name}
                  </span>
                </div>
              </div>
              <Icons.chevronDown
                className={cn(
                  "size-4 text-muted-foreground group-hover:text-foreground transition-transform shrink-0",
                  open && "rotate-180"
                )}
              />
            </Button>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={collapsed ? "start" : "start"}
          side={collapsed ? "right" : "bottom"}
          sideOffset={8}
          className={cn(
            "bg-card/95 backdrop-blur-xl border border-border/40 shadow-xl rounded-2xl p-1.5 space-y-0.5 z-50",
            collapsed ? "w-64" : "w-[var(--radix-dropdown-menu-trigger-width,16rem)] min-w-[15rem]"
          )}
        >
          <DropdownMenuLabel className="text-2xs font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">
            Switch Workspace
          </DropdownMenuLabel>

          {clients.length > 3 && (
            <div className="px-1.5 pb-1.5 pt-0.5">
              <div className="relative">
                <Icons.search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari workspace..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full h-7 pl-8 pr-2.5 text-xs rounded-lg bg-muted/60 border border-border/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-accent/50"
                />
              </div>
            </div>
          )}

          <div className="max-h-[260px] overflow-y-auto no-scrollbar space-y-0.5">
            {filteredClients.length === 0 ? (
              <div className="p-3 text-center text-2xs text-muted-foreground">
                Tidak ada workspace &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredClients.map((c) => {
                const isSelected = c.id === clientId
                return (
                  <DropdownMenuItem
                    key={c.id}
                    onMouseEnter={() => prefetchProfile(c.id)}
                    onFocus={() => prefetchProfile(c.id)}
                    onClick={() => {
                      setClientId(c.id)
                      setOpen(false)
                      setSearchQuery("")
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer text-left",
                      isSelected
                        ? "bg-brand-accent/15 border border-brand-accent/30 font-semibold"
                        : "hover:bg-muted border border-transparent"
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg bg-brand-accent text-primary-foreground flex items-center justify-center font-bold text-2xs shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate leading-tight flex-1 min-w-0">
                      <span className="block text-xs font-bold text-foreground truncate">
                        {c.name}
                      </span>
                      <span className="block text-2xs text-muted-foreground flex items-center gap-1">
                        <MetricTicker value={c.channels?.length || 0} /> channels
                      </span>
                    </div>
                    {isSelected && (
                      <Icons.check className="size-4 text-brand-accent shrink-0 ml-auto" />
                    )}
                  </DropdownMenuItem>
                )
              })
            )}
          </div>

          <DropdownMenuSeparator className="my-1 border-border/40" />

          <DropdownMenuItem
            onClick={() => {
              setOpen(false)
              openCreateClient()
            }}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer text-left group"
          >
            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-dashed border-muted-foreground/40 group-hover:border-foreground/50 transition-colors">
              <Icons.add className="size-4" />
            </div>
            <div className="truncate leading-tight flex-1 min-w-0">
              <span className="block text-xs font-semibold text-foreground">Tambah Client Baru</span>
              <span className="block text-2xs text-muted-foreground">Setup workspace & brand</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              setOpen(false)
              router.push("/admin/clients")
            }}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer text-left group"
          >
            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Icons.layers className="size-4 text-muted-foreground" />
            </div>
            <div className="truncate leading-tight flex-1 min-w-0">
              <span className="block text-xs font-semibold text-foreground">Semua Client</span>
              <span className="block text-2xs text-muted-foreground">Kelola portofolio workspace</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

