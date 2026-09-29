"use client"

import React from "react"
import { Icons } from "@/components/icons"

const CHANNELS = [
  { id: 1, name: "Instagram", handle: "@b2b_reps", status: "SYNCED" },
  { id: 2, name: "TikTok", handle: "b2bshell_official", status: "SYNCED" },
  { id: 3, name: "YouTube", handle: "B2B Shell Global", status: "SYNCED" },
  { id: 4, name: "LinkedIn", handle: "B2B Shell B2B", status: "SYNCED" },
]

function getPlatformIcon(platform: string) {
  const key = platform.toLowerCase().includes("instagram")
    ? "photo_camera"
    : platform.toLowerCase().includes("tiktok")
    ? "music_note"
    : platform.toLowerCase().includes("youtube")
    ? "smart_display"
    : "work"
  const Cmp = Icons[key]
  return Cmp ? <Cmp className="size-5" /> : <Icons.hub className="size-5" />
}

export function DashboardStitchConnectedHub() {
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
              <p className="text-xs text-[hsl(var(--admin-outline))]">4 accounts connected</p>
            </div>
            <button
              className="w-8 h-8 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] flex items-center justify-center hover:scale-105 active:scale-90 transition-transform shadow-sm cursor-pointer"
              title="Connect New Account for Active Client"
            >
              <Icons.add className="size-5" />
            </button>
          </div>

          {/* Client Switcher Capsule */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[hsl(var(--admin-surface-low))] border border-[hsl(var(--admin-outline-variant))]/40 hover:border-[hsl(var(--admin-cobalt))]/50 transition-all cursor-pointer shadow-sm group">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-[hsl(var(--admin-cobalt))] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                BS
              </div>
              <div className="truncate leading-tight">
                <span className="block text-[10px] font-bold text-[hsl(var(--admin-outline))]">
                  LINKED CLIENT ACCOUNT
                </span>
                <span className="block text-xs font-bold text-[hsl(var(--admin-on-surface))] truncate">
                  B2B Shell Representatives
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 pl-2">
              <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-[10px] font-bold">
                SWITCH
              </span>
              <Icons.chevronDown className="size-[18px] text-[hsl(var(--admin-outline))] group-hover:text-[hsl(var(--admin-on-surface))] transition-colors" />
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {CHANNELS.map((ch) => (
            <div
              key={ch.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#eeedf7]/40 border border-white/60 hover:border-[hsl(var(--admin-cobalt))]/30 transition-all cursor-default"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-[hsl(var(--admin-cobalt))]">
                  {getPlatformIcon(ch.name)}
                </div>
                <div>
                  <span className="block text-xs font-bold text-[hsl(var(--admin-on-surface))]">
                    {ch.name}
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
                <button className="text-[hsl(var(--admin-outline))] hover:text-red-500 transition-colors">
                  <Icons.close className="size-3.5" />
                </button>
              </div>
            </div>
          ))}

          <button className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-2xl border border-dashed border-[hsl(var(--admin-outline))]/30 text-[10px] font-bold tracking-widest text-[hsl(var(--admin-outline))] uppercase hover:bg-white/50 transition-all">
            <Icons.hub className="size-3.5" />
            Connect Channel to Client
          </button>
        </div>
      </div>

      {/* Studio Identity Card */}
      <div className="relative p-6 rounded-2xl bg-[hsl(var(--admin-cobalt))] shadow-lg overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/70 tracking-wider">STUDIO IDENTITY</span>
            <span className="text-[hsl(var(--brand-accent))] text-xl font-bold">✦</span>
          </div>
          <div className="mt-4">
            <span className="block font-syne font-extrabold text-2xl text-white tracking-tight leading-none">
              DIGITAL
            </span>
            <span className="block font-syne font-extrabold text-2xl text-[hsl(var(--brand-accent))] tracking-tight leading-none">
              SPACE.
            </span>
          </div>
        </div>
        <div className="relative z-10 pt-6">
          <div className="p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-sm">
            <p className="font-syne font-bold text-sm text-[hsl(var(--admin-on-surface))]">
              Campaign Velocity: 98%
            </p>
            <p className="text-xs text-[hsl(var(--admin-outline))] mt-0.5">
              Multi-network algorithmic amplification active across EMEA &amp; NA regions.
            </p>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-[hsl(var(--brand-accent))]">
                STATUS: ACCELERATING
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
          Generate 50 viral captions, hashtag clusters, and video concepts in seconds for your client.
        </p>
        <button className="mt-3.5 w-full py-2 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold shadow-sm hover:bg-[hsl(var(--brand-accent))]/80 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5">
          <Icons.bot className="size-4" />
          Launch Studio AI
        </button>
      </div>
    </div>
  )
}
