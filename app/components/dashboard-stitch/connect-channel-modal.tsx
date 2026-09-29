"use client"

import React, { useState } from "react"
import { Icons } from "@/components/icons"

const PLATFORMS = [
  "Instagram (Business/Creator)",
  "TikTok Commercial",
  "YouTube Channel",
  "LinkedIn Company Page",
  "Twitter / X Enterprise",
  "Threads by Meta",
]

export function StitchConnectChannelModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[hsl(var(--admin-on-surface))]/40 backdrop-blur-md"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/80 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[hsl(var(--admin-outline-variant))]/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--admin-cobalt))]/15 text-[hsl(var(--admin-cobalt))] flex items-center justify-center">
              <Icons.hub className="size-[18px]" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-[hsl(var(--admin-on-surface))] text-sm">
                Connect Channel to Client
              </h3>
              <p className="text-[10px] text-[hsl(var(--admin-outline))]">
                Target client: B2B Shell Representatives
              </p>
            </div>
          </div>
          <button
            className="p-1 rounded-full hover:bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))] transition-all cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            <Icons.close className="size-[18px]" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
              Target Client Account
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))]">
              <div className="w-6 h-6 rounded-lg bg-[hsl(var(--admin-cobalt))] text-white flex items-center justify-center text-[10px] font-bold">
                BS
              </div>
              <span className="text-xs text-[hsl(var(--admin-on-surface))]">B2B Shell Representatives</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1.5">
              Platform Channel
            </label>
            <div className="space-y-1.5">
              {PLATFORMS.map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[hsl(var(--admin-outline-variant))]/30 hover:border-[hsl(var(--admin-cobalt))]/50 hover:bg-[hsl(var(--admin-surface-low))]/50 cursor-pointer transition-all"
                >
                  <input type="radio" name="platform" className="accent-[hsl(var(--admin-cobalt))]" />
                  <span className="text-xs text-[hsl(var(--admin-on-surface))]">{p}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
                Handle / Channel Name
              </label>
              <input
                className="w-full rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] outline-none text-[hsl(var(--admin-on-surface))]"
                placeholder="@username"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
                Audience Size
              </label>
              <input
                className="w-full rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] outline-none text-[hsl(var(--admin-on-surface))]"
                placeholder="e.g. 12,400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-[hsl(var(--admin-surface-low))]/50 border border-[hsl(var(--admin-outline-variant))]/30">
            <Icons.shield className="size-4 text-[hsl(var(--admin-cobalt))]" />
            <div>
              <span className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))]">
                Direct OAuth 2.0 Auth
              </span>
              <span className="block text-[10px] text-[hsl(var(--admin-outline))]">
                Connecting authorizes FRHM to publish posts and fetch real-time engagement telemetry for this client.
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            className="px-4 py-2 rounded-full text-xs font-semibold text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-high))] transition-all cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer">
            <Icons.link className="size-4" />
            Authorize &amp; Link
          </button>
        </div>
      </div>
    </div>
  )
}
