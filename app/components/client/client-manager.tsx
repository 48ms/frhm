"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { socialQueries } from "@/features/social-accounts/api/queries"
import { useCreateClient } from "@/components/client/create-client-provider"
import { Icons } from "@/components/icons"

export function ClientManager() {
  const { data: clients, isLoading } = useQuery(socialQueries.listClientsWithChannels())
  const { openCreateClient } = useCreateClient()

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Memuat daftar client workspace"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse"
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-card border border-border/50" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients?.map((client) => (
          <div
            key={client.id}
            className="p-6 rounded-2xl bg-card border border-border/50 hover:border-brand-accent/60 transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center font-bold text-lg text-brand-accent"
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
          </div>
        ))}

        <button
          onClick={openCreateClient}
          className="p-6 min-h-32 rounded-2xl border-2 border-dashed border-border/50 hover:border-brand-accent/50 hover:bg-brand-accent/5 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center" aria-hidden>
            <Icons.add className="size-6 text-muted-foreground" />
          </div>
          <span className="font-bold text-sm">Add New Client</span>
        </button>
      </div>
    </div>
  )
}