"use client"

import React, { useState } from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { useActiveDashboard } from "./dashboard-data"
import { StitchAiHookModal } from "./ai-hook-modal"
import { ConnectChannelModal } from "@/components/social-accounts/connect-channel-modal"
import { useAppStore } from "@/lib/store/app-store"

export function DashboardStitchConnectedHub() {
  const { client, clientId, profile } = useActiveDashboard()
  
  // Optimasi ECC: Ambil list mentah saja, filter di level komponen agar getter store 
  // tidak loop re-render React (karena getter Zustand mereturn array referensi baru tiap call).
  const rawAccounts = useAppStore(s => s.accounts)
  const rawClients = useAppStore(s => s.socialClients)
  
  const accounts = rawAccounts.filter((a) => a.clientId === client.id)
  const clients = rawClients.map(c => ({
    ...c,
    accounts: rawAccounts.filter((a) => a.clientId === c.id)
  }))
  
  const [aiOpen, setAiOpen] = useState(false)
  const [connectOpen, setConnectOpen] = useState(false)
  const [disconnectId, setDisconnectId] = useState<string | null>(null)

  // (Removed local sync effect , useAppStore is always in sync)

  return (
    <div className="space-y-6">
      {/* Connected Hub Panel */}
      <div className="p-6 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/40 shadow-sm transition-all">
        <div className="space-y-3 border-b border-border/30 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-syne font-bold text-lg text-foreground">
                Connected Hub
              </h2>
              <p className="text-xs text-muted-foreground">
                {accounts.length} accounts connected
              </p>
            </div>
            <button
              onClick={() => setConnectOpen(true)}
              className="w-8 h-8 rounded-full bg-brand-accent text-brand-accent-foreground flex items-center justify-center hover:scale-105 active:scale-90 transition-transform shadow-sm cursor-pointer"
              title="Connect New Account for Active Client"
            >
              <Icons.add className="size-5" />
            </button>
          </div>

          {/* Client Info Capsule — read-only. Switching now lives in the sidebar WorkspaceSwitcher. */}
          <div className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-muted border border-border/40">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-brand-accent text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate leading-tight text-left">
                <span className="block text-[10px] font-bold text-muted-foreground">
                  Klien aktif
                </span>
                <span className="block text-xs font-bold text-foreground truncate">
                  {client.name}
                </span>
              </div>
            </div>
          </div>

          {/* Client Verification Note */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/70 border border-border/30 text-xs text-muted-foreground">
            <Icons.check className="size-4 text-brand-accent shrink-0" />
            <span className="truncate">
              Channels belong to{" "}
              <b className="text-foreground">{client.name.substring(0, 5)}</b>
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {accounts.map((ch) => (
            <div
              key={ch.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/60 border border-border/40 hover:bg-muted/50 hover:border-[hsl(var(--secondary))]/40 transition-all cursor-pointer group shadow-sm hover:shadow"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm font-bold group-hover:scale-105 transition-transform",
                  ch.bg
                )}>
                  <Icons.hub className="size-5" />
                </div>
                <div>
                  <h3 className="font-label-lg text-label-lg text-foreground font-bold leading-tight group-hover:text-secondary transition-colors">
                    {ch.platform}
                  </h3>
                  <p className="font-body-sm text-body-sm text-outline">
                    {ch.handle}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-label-caps font-bold",
                  ch.status === "SYNCED" || ch.status === "LIVE_SYNC"
                    ? "bg-brand-accent/20 text-brand-accent"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                )}>
                  {(ch.status === "SYNCED" || ch.status === "LIVE_SYNC") && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                  {ch.status.replace('_', ' ')}
                </span>
                {ch.fans && (
                  <p className="font-body-sm text-body-sm text-foreground font-semibold mt-1">
                    {ch.fans}
                  </p>
                )}
              </div>
              <button
                onClick={() => setDisconnectId(ch.id)}
                className="ml-2 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                title="Disconnect channel"
              >
                <Icons.close className="size-3.5" />
              </button>
            </div>
          ))}

          <button
            onClick={() => setConnectOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-2xl border border-dashed border-muted-foreground/30 text-[10px] font-bold text-muted-foreground hover:bg-card hover:border-muted-foreground/50 transition-all cursor-pointer"
          >
            <Icons.hub className="size-3.5" />
            Connect Channel to Client
          </button>
        </div>
      </div>

      {/* Studio Identity Card */}
      <div className="p-6 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/40 shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground">
            Identitas studio
          </span>
        </div>
        <div className="mt-4">
          <span className="block font-syne font-extrabold text-2xl text-foreground tracking-tight leading-none">
            {client.name.substring(0, 5).toUpperCase()}
          </span>
          <span className="block font-syne font-extrabold text-2xl text-brand-accent tracking-tight leading-none">
            SPACE.
          </span>
        </div>
        <div className="pt-6">
          <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/40 shadow-sm">
            <p className="font-syne font-bold text-sm text-foreground">
              Campaign Velocity: {profile.velocity}%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Multi-network algorithmic amplification active for {client.name.substring(0, 5)}.
            </p>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-brand-accent">
                Status: {profile.velocity >= 90 ? "Accelerating" : "Steady"}
              </span>
              <span
                aria-disabled="true"
                title="Campaign velocity breakdown is not built yet."
                className="px-2.5 py-0.5 rounded-full bg-muted text-foreground/70 text-[10px] font-semibold cursor-not-allowed"
              >
                Detail (Coming soon)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Hooks Generator Launchpad */}
      <div className="p-5 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/40 shadow-sm text-center">
        <div className="w-10 h-10 mx-auto rounded-full bg-brand-accent flex items-center justify-center text-brand-accent-foreground shadow-sm mb-2.5">
          <Icons.sparkles className="size-5" />
        </div>
        <h3 className="font-syne font-bold text-base text-foreground">
          Need AI Content Hooks?
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          Generate caption, klaster hashtag, dan konsep video untuk{" "}
          {client.name.substring(0, 5)}.
        </p>
        <button
          onClick={() => setAiOpen(true)}
          className="mt-3.5 w-full py-2 rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold shadow-sm hover:bg-brand-accent/80 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Icons.bot className="size-4" />
          Launch Studio AI
        </button>
      </div>

      {disconnectId && (
        <div className="fixed inset-0 z-[60] p-4 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setDisconnectId(null)}
          />
          <div className="relative w-full max-w-sm bg-card/95 backdrop-blur-2xl rounded-2xl border border-border/40 p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
              <Icons.warning className="size-6" />
            </div>
            <h3 className="font-syne font-bold text-foreground text-lg">
              Disconnect Channel?
            </h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to disconnect this channel? Data syncing will stop immediately.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDisconnectId(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-muted/70 transition-all shadow-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  useAppStore.getState().disconnectAccount(disconnectId)
                  setDisconnectId(null)
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all shadow-sm cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      <StitchAiHookModal open={aiOpen} onOpenChange={setAiOpen} clientName={client.name} clientId={clientId} />
      <ConnectChannelModal
        open={connectOpen}
        client={client}
        existingPlatforms={accounts.map((a) => a.platform)}
        onClose={() => setConnectOpen(false)}
      />
    </div>
  )
}
