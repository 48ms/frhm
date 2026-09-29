"use client"

import React, { useState } from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { useActiveDashboard } from "./dashboard-data"
import { StitchAiHookModal } from "./ai-hook-modal"
import { ConnectChannelModal } from "@/components/social-accounts/connect-channel-modal"

function platformIcon(name: string) {
  const key = name.toLowerCase().includes("instagram")
    ? "photo_camera"
    : name.toLowerCase().includes("tiktok")
    ? "music_note"
    : name.toLowerCase().includes("youtube")
    ? "smart_display"
    : name.toLowerCase().includes("linkedin")
    ? "work"
    : "hub"
  const Cmp = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[key]
  return Cmp ? <Cmp className="size-5" /> : <Icons.hub className="size-5" />
}

export function DashboardStitchConnectedHub() {
  const { client, clients, clientId, setClientId, profile } = useActiveDashboard()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [connectOpen, setConnectOpen] = useState(false)
  const [accounts, setAccounts] = useState(client.accounts)

  // Keep the local account list in sync when the active client changes.
  React.useEffect(() => {
    setAccounts(client.accounts)
  }, [client])

  return (
    <div className="space-y-6">
      {/* Connected Hub Panel */}
      <div className="p-6 rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/90 shadow-sm transition-all">
        <div className="space-y-3 border-b border-[hsl(var(--admin-outline-variant))]/30 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-syne font-bold text-lg text-[hsl(var(--admin-on-surface))]">
                Connected Hub
              </h2>
              <p className="text-xs text-[hsl(var(--admin-outline))]">
                {accounts.length} accounts connected
              </p>
            </div>
            <button
              onClick={() => setConnectOpen(true)}
              className="w-8 h-8 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] flex items-center justify-center hover:scale-105 active:scale-90 transition-transform shadow-sm cursor-pointer"
              title="Connect New Account for Active Client"
            >
              <Icons.add className="size-5" />
            </button>
          </div>

          {/* Client Switcher Capsule — syncs the whole dashboard via URL */}
          <div className="relative">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-[hsl(var(--admin-surface-low))] border border-[hsl(var(--admin-outline-variant))]/40 hover:border-[hsl(var(--admin-cobalt))]/50 transition-all cursor-pointer shadow-sm group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-[hsl(var(--admin-cobalt))] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {client.initials}
                </div>
                <div className="truncate leading-tight text-left">
                  <span className="block text-[10px] font-bold text-[hsl(var(--admin-outline))]">
                    LINKED CLIENT ACCOUNT
                  </span>
                  <span className="block text-xs font-bold text-[hsl(var(--admin-on-surface))] truncate">
                    {client.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 pl-2">
                <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-[10px] font-bold">
                  SWITCH
                </span>
                <Icons.chevronDown
                  className={cn(
                    "size-[18px] text-[hsl(var(--admin-outline))] group-hover:text-[hsl(var(--admin-on-surface))] transition-transform",
                    pickerOpen && "rotate-180"
                  )}
                />
              </div>
            </button>

            {pickerOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-full bg-white/95 backdrop-blur-xl border border-white/80 shadow-2xl rounded-2xl p-2 z-40 space-y-1">
                <div className="text-[10px] font-bold text-[hsl(var(--admin-outline))] px-2 py-1">
                  SELECT MANAGED CLIENT:
                </div>
                {clients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setClientId(c.id)
                      setPickerOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer text-left",
                      c.id === clientId
                        ? "bg-[hsl(var(--brand-accent))]/15 border border-[hsl(var(--brand-accent))]/30"
                        : "hover:bg-[hsl(var(--admin-surface-low))] border border-transparent"
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg bg-[hsl(var(--admin-cobalt))] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      {c.initials}
                    </div>
                    <div className="truncate leading-tight">
                      <span className="block text-xs font-bold text-[hsl(var(--admin-on-surface))] truncate">
                        {c.name}
                      </span>
                      <span className="block text-[10px] text-[hsl(var(--admin-outline))]">
                        {c.accounts.length} channels
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {accounts.map((ch) => (
            <div
              key={ch.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#eeedf7]/40 border border-white/60 hover:border-[hsl(var(--admin-cobalt))]/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-[hsl(var(--admin-cobalt))]">
                  {platformIcon(ch.platform)}
                </div>
                <div>
                  <span className="block text-xs font-bold text-[hsl(var(--admin-on-surface))]">
                    {ch.platform}
                  </span>
                  <span className="block text-[10px] text-[hsl(var(--admin-outline))]">
                    {ch.handle}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-[#5e7400] px-2 py-0.5 rounded-full bg-[hsl(var(--brand-accent))]/25 border border-[hsl(var(--brand-accent))]/20">
                  {ch.status}
                </span>
                <button
                  onClick={() => setAccounts((prev) => prev.filter((a) => a.id !== ch.id))}
                  className="text-[hsl(var(--admin-outline))] hover:text-red-500 transition-colors cursor-pointer"
                  title="Disconnect channel"
                >
                  <Icons.close className="size-3.5" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => setConnectOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-2xl border border-dashed border-[hsl(var(--admin-outline))]/30 text-[10px] font-bold tracking-widest text-[hsl(var(--admin-outline))] uppercase hover:bg-white/50 transition-all cursor-pointer"
          >
            <Icons.hub className="size-3.5" />
            Connect Channel to Client
          </button>
        </div>
      </div>

      {/* Studio Identity Card */}
      <div className="p-6 rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/80 shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[hsl(var(--admin-outline))] tracking-wider">
            STUDIO IDENTITY
          </span>
          <span className="text-[hsl(var(--admin-cobalt))] text-xl font-bold">✦</span>
        </div>
        <div className="mt-4">
          <span className="block font-syne font-extrabold text-2xl text-[hsl(var(--admin-on-surface))] tracking-tight leading-none">
            {client.shortName.toUpperCase()}
          </span>
          <span className="block font-syne font-extrabold text-2xl text-[hsl(var(--admin-cobalt))] tracking-tight leading-none">
            SPACE.
          </span>
        </div>
        <div className="pt-6">
          <div className="p-3.5 rounded-2xl bg-[hsl(var(--admin-surface-low))]/60 border border-white/60 shadow-sm">
            <p className="font-syne font-bold text-sm text-[hsl(var(--admin-on-surface))]">
              Campaign Velocity: {profile.velocity}%
            </p>
            <p className="text-xs text-[hsl(var(--admin-outline))] mt-0.5">
              Multi-network algorithmic amplification active for {client.shortName}.
            </p>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-[hsl(var(--admin-cobalt))]">
                STATUS: {profile.velocity >= 90 ? "ACCELERATING" : "STEADY"}
              </span>
              <button className="px-2.5 py-0.5 rounded-full bg-[hsl(var(--admin-on-surface))] text-white text-[10px] font-semibold hover:bg-[hsl(var(--admin-cobalt))] cursor-pointer transition-colors">
                Details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Hooks Generator Launchpad */}
      <div className="p-5 rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/80 shadow-sm text-center">
        <div className="w-10 h-10 mx-auto rounded-full bg-[hsl(var(--brand-accent))] flex items-center justify-center text-[hsl(var(--brand-accent-foreground))] shadow-sm mb-2.5">
          <Icons.sparkles className="size-5" />
        </div>
        <h3 className="font-syne font-bold text-base text-[hsl(var(--admin-on-surface))]">
          Need AI Content Hooks?
        </h3>
        <p className="text-xs text-[hsl(var(--admin-outline))] mt-1 max-w-xs mx-auto">
          Generate 50 viral captions, hashtag clusters, and video concepts in seconds
          for {client.shortName}.
        </p>
        <button
          onClick={() => setAiOpen(true)}
          className="mt-3.5 w-full py-2 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold shadow-sm hover:bg-[hsl(var(--brand-accent))]/80 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Icons.bot className="size-4" />
          Launch Studio AI
        </button>
      </div>

      <StitchAiHookModal open={aiOpen} onOpenChange={setAiOpen} clientName={client.name} />
      <ConnectChannelModal
        open={connectOpen}
        client={client}
        existingPlatforms={accounts.map((a) => a.platform)}
        onClose={() => setConnectOpen(false)}
        onConnected={(acc) => setAccounts((prev) => [...prev, acc])}
      />
    </div>
  )
}
