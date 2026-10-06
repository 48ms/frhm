"use client"

import * as React from "react"
import { Icons } from "@/components/icons"
import { useAppStore } from "@/lib/store/app-store"

export function ErpDashboardClient() {
  const clients = useAppStore((s) => s.socialClients)
  const posts = useAppStore((s) => s.posts)
  
  const totalDeliverable = posts.length
  const waitingReview = posts.filter(p => p.status === "review").length
  const draft = posts.filter(p => p.status === "draft").length
  const approved = posts.filter(p => p.status === "approved" || p.status === "scheduled").length

  return (
    <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-[1440px] w-full mx-auto">
      {/* TITLE BAR & ACTIONS */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-headline-xl text-[hsl(var(--admin-on-surface))] tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[hsl(var(--admin-outline))] mt-1">
            Ringkasan deliverable dan performa konten klien
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="admin-pill admin-pill-ghost inline-flex items-center gap-2 px-4 py-2 cursor-pointer">
            <Icons.send className="size-4 text-[hsl(var(--admin-cobalt))]" />
            Notifikasi Telegram
          </button>
          <button className="admin-pill admin-pill-lime inline-flex items-center gap-2 px-4 py-2 cursor-pointer">
            <Icons.add className="size-4" />
            Deliverable Baru
          </button>
        </div>
      </section>

      {/* TOP METRIC CARDS ROW */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: TOTAL DELIVERABLE */}
        <div className="lg:col-span-8 p-6 admin-card flex flex-col justify-between">
          <p className="admin-section-label">
            TOTAL DELIVERABLE
          </p>
          <div className="my-4">
            <span className="text-5xl font-black font-headline-xl text-[hsl(var(--admin-cobalt))] tracking-tight">
              {totalDeliverable}
            </span>
          </div>
          <p className="text-xs text-[hsl(var(--admin-outline))]">
            Semua deliverable lintas klien
          </p>
        </div>

        {/* Right Card: Status Badges */}
        <div className="lg:col-span-4 p-6 admin-card flex flex-col justify-center space-y-3">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[hsl(var(--admin-cobalt))]/10 border border-[hsl(var(--admin-cobalt))]/20 text-[hsl(var(--admin-cobalt))]">
            <Icons.clock className="size-[18px]" />
            <span className="text-xs font-semibold">{waitingReview}</span>
            <span className="text-xs font-medium text-[hsl(var(--admin-on-surface))]">Menunggu review client</span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
            <Icons.warning className="size-[18px]" />
            <span className="text-xs font-semibold">{draft}</span>
            <span className="text-xs font-medium text-[hsl(var(--admin-on-surface))]">Perlu revisi dari kamu</span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
            <Icons.check className="size-[18px]" />
            <span className="text-xs font-semibold">{approved}</span>
            <span className="text-xs font-medium text-[hsl(var(--admin-on-surface))]">Disetujui, siap publish</span>
          </div>
        </div>
      </section>

      {/* MIDDLE NOTICE BANNER: Jadwal Tayang Hari Ini */}
      <section className="p-4 sm:px-6 sm:py-4 admin-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))] flex items-center justify-center shrink-0">
            <Icons.calendar className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[hsl(var(--admin-on-surface))]">Jadwal Tayang Hari Ini</h2>
            <p className="text-xs text-[hsl(var(--admin-outline))]">Tidak ada jadwal tayang hari ini</p>
          </div>
        </div>
        <button className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[hsl(var(--admin-surface-low))] hover:bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-on-surface))] text-xs font-semibold border border-[hsl(var(--admin-outline-variant))]/50 transition-colors cursor-pointer">
          Kalender
          <Icons.chevronRight className="size-4 ml-1" />
        </button>
      </section>

      {/* CLIENT WORKSPACES GRID */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[hsl(var(--admin-on-surface))] font-headline-md tracking-tight">Per Client</h2>
          <button className="admin-pill admin-pill-ghost inline-flex items-center gap-1 px-3 py-1.5 cursor-pointer">
            <Icons.add className="size-[15px]" />
            Tambah client
          </button>
        </div>
        
        {/* We will map over clients from the store */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
           {clients.map(c => {
             return (
               <div key={c.id} className="p-5 admin-card admin-card-hover flex flex-col justify-between min-h-[160px]">
                 <div>
                   <h3 className="text-sm font-bold text-[hsl(var(--admin-on-surface))] tracking-tight">{c.name}</h3>
                   <p className="text-xs text-[hsl(var(--admin-outline))] mt-0.5">{c.shortName}</p>
                   <div className="mt-4">
                     <div className="flex items-center justify-between text-xs text-[hsl(var(--admin-on-surface-variant))] mb-1.5">
                       <span>Channel Terhubung</span>
                       <span className="font-mono text-[11px] text-[hsl(var(--admin-outline))]">{c.accounts.length} / 10</span>
                     </div>
                     <div className="w-full bg-[hsl(var(--admin-surface-high))] h-1.5 rounded-full overflow-hidden">
                       <div className="bg-[hsl(var(--admin-cobalt))] h-full rounded-full transition-all" style={{ width: `${(c.accounts.length / 10) * 100}%` }}></div>
                     </div>
                   </div>
                 </div>
                 <div className="pt-4 mt-5 border-t border-[hsl(var(--admin-outline-variant))]/30 flex items-center justify-between">
                   <span className="text-xs text-[hsl(var(--admin-outline))]">
                     {c.accounts.length} connected channels
                   </span>
                   <button className="text-xs font-semibold text-[hsl(var(--admin-on-surface))] hover:text-[hsl(var(--admin-cobalt))] inline-flex items-center gap-1 transition-colors cursor-pointer group">
                     Kelola <span className="text-[hsl(var(--admin-outline))] group-hover:text-[hsl(var(--admin-cobalt))] transition-colors">→</span>
                   </button>
                 </div>
               </div>
             )
           })}
        </div>
      </section>
    </main>
  )
}
