"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { useCreateClient } from "@/components/client/create-client-provider"
import { dashboardQueries } from "@/features/dashboard/api/queries"

export function WorkspaceSwitcher() {
  const { clients, clientId, setClientId } = useActiveDashboard()
  const { openCreateClient } = useCreateClient()
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)

  // Fallback if not found
  const activeClient = clients.find((c) => c.id === clientId) ?? clients[0]

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

  // Close dropdown on click outside or escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".workspace-switcher-container")) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown)
      document.addEventListener("mousedown", handleClick)
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClick)
    }
  }, [open])

  if (!activeClient) return null

  return (
    <div className="workspace-switcher-container relative w-full mb-6 z-50">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "w-full flex items-center justify-between p-2.5 rounded-2xl bg-card border border-border/40 hover:border-brand-accent/50 transition-all cursor-pointer shadow-sm group",
          open && "ring-2 ring-brand-accent/20 border-brand-accent/50"
        )}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-brand-accent text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            {activeClient.name.charAt(0).toUpperCase()}
          </div>
          <div className="truncate leading-tight text-left">
            <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
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
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute top-full left-0 mt-2 w-full bg-card/95 backdrop-blur-xl border border-border/40 shadow-xl rounded-2xl p-2 space-y-1 z-50"
        >
          <div className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">
            Switch Workspace
          </div>
          <div className="max-h-[300px] overflow-y-auto no-scrollbar">
            {clients.map((c) => (
              <button
                key={c.id}
                role="option"
                aria-selected={c.id === clientId}
                onMouseEnter={() => prefetchProfile(c.id)}
                onFocus={() => prefetchProfile(c.id)}
                onClick={() => {
                  setClientId(c.id)
                  setOpen(false)
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer text-left",
                  c.id === clientId
                    ? "bg-brand-accent/15 border border-brand-accent/30"
                    : "hover:bg-muted border border-transparent"
                )}
              >
                <div className="w-7 h-7 rounded-lg bg-brand-accent text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate leading-tight">
                  <span className="block text-xs font-bold text-foreground truncate">
                    {c.name}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">
                    {c.channels?.length || 0} channels
                  </span>
                </div>
                {c.id === clientId && (
                  <Icons.check className="size-4 text-brand-accent ml-auto" />
                )}
              </button>
            ))}
          </div>

          <div className="pt-2 mt-1 border-t border-border/40">
            <button
              onClick={() => {
                setOpen(false)
                openCreateClient()
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer text-left group"
            >
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-dashed border-muted-foreground/40 group-hover:border-foreground/50 transition-colors">
                <Icons.add className="size-4" />
              </div>
              <span className="text-xs font-semibold">New Workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
