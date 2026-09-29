"use client"

import React from "react"
import { Icons } from "@/components/icons"

export function DashboardStitchHero() {
  return (
    <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 lg:p-7 rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-2xl border border-white/90 shadow-sm relative overflow-hidden group">
      {/* Decorative blurred shapes */}
      <div className="absolute -right-8 -top-12 w-64 h-32 rounded-full bg-[hsl(var(--admin-cobalt))]/15 transform -rotate-12 pointer-events-none blur-lg" />
      <div className="absolute right-40 -bottom-8 w-48 h-24 rounded-full bg-[hsl(var(--brand-accent))]/30 transform rotate-6 pointer-events-none blur-md" />
      <div className="absolute right-10 top-5 text-[hsl(var(--brand-accent))] select-none pointer-events-none font-bold text-3xl">
        ✦
      </div>

      <div className="relative z-10 space-y-1">
        {/* WORKSPACE ACTIVE badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--admin-lavender-fixed))] text-[hsl(var(--admin-lavender))] text-xs font-bold shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--admin-lavender))] animate-pulse" />
          <span>WORKSPACE ACTIVE</span>
          <span className="opacity-40">•</span>
          <span className="text-[hsl(var(--admin-cobalt))] font-extrabold">
            CLIENT: B2B SHELL REPS
          </span>
        </div>
        <h1 className="font-syne font-extrabold text-2xl md:text-3xl text-[hsl(var(--admin-on-surface))] tracking-tight">
          Good day, Creator.
        </h1>
        <p className="text-xs md:text-sm text-[hsl(var(--admin-outline))]">
          Managing real-time campaign acceleration &amp; audience velocity for B2B Shell
          Representatives.
        </p>
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-2.5">
        <button className="px-4 py-2 rounded-full bg-white border border-[hsl(var(--admin-outline-variant))]/50 text-[hsl(var(--admin-on-surface))] text-xs font-semibold hover:bg-[hsl(var(--admin-surface-high))] transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer">
          <Icons.ios_share className="size-4" />
          Export Report
        </button>
        <button className="px-4 py-2 rounded-full bg-[hsl(var(--admin-cobalt))] text-white text-xs font-semibold hover:bg-[hsl(var(--admin-cobalt))]/90 transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer">
          <Icons.send className="size-4" />
          Schedule Post
        </button>
      </div>
    </section>
  )
}
