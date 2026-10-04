"use client"

import React, { useState } from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { parseAsString, useQueryState } from "nuqs"
import { useActiveDashboard } from "./dashboard-data"
import { ExportReportModal } from "./export-report-modal"
import { SchedulePostModal } from "./schedule-post-modal"

export function DashboardStitchHero() {
  const { clients } = useActiveDashboard()
  const [clientId, setClientId] = useQueryState("clientId", parseAsString.withDefault(clients[0]?.id ?? ""))
  const client = clients.find((c) => c.id === clientId) ?? clients[0]
  const [pickerOpen, setPickerOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  return (
    <>
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 lg:p-7 rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-2xl border border-white/90 shadow-sm relative overflow-hidden group">
        {/* Decorative blurred shapes */}
        <div className="absolute -right-8 -top-12 w-64 h-32 rounded-full bg-[hsl(var(--admin-cobalt))]/10 transform -rotate-12 pointer-events-none blur-lg" />
        <div className="absolute right-40 -bottom-8 w-48 h-24 rounded-full bg-[hsl(var(--brand-accent))]/20 transform rotate-6 pointer-events-none blur-md" />
        <div className="absolute right-10 top-5 text-[hsl(var(--brand-accent))] select-none pointer-events-none font-bold text-3xl">
          ✦
        </div>

        <div className="relative z-10 space-y-2">
          {/* WORKSPACE ACTIVE badge + inline client switcher */}
          <div 
            className="relative inline-flex"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setPickerOpen(false)
            }}
          >
            <button
              aria-haspopup="listbox"
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--admin-lavender-fixed))] text-[hsl(var(--admin-lavender))] text-xs font-bold shadow-sm hover:brightness-95 transition-all cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--admin-lavender))] animate-pulse" />
              <span>WORKSPACE ACTIVE</span>
              <span className="opacity-40">•</span>
              <span className="text-[hsl(var(--admin-cobalt))] font-extrabold">
                CLIENT: {client.shortName.toUpperCase()}
              </span>
              <Icons.chevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  pickerOpen && "rotate-180"
                )}
              />
            </button>

            {pickerOpen && (
              <div 
                role="listbox"
                className="absolute top-full left-0 mt-1.5 w-72 bg-white/95 backdrop-blur-xl border border-white/80 shadow-2xl rounded-2xl p-2 z-40 space-y-1"
              >
                <div className="text-[10px] font-bold text-[hsl(var(--admin-outline))] px-2 py-1">
                  SWITCH ACTIVE CLIENT:
                </div>
                {clients.map((c) => (
                  <button
                    key={c.id}
                    role="option"
                    aria-selected={c.id === clientId}
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

          <h1 className="font-syne font-extrabold text-2xl md:text-3xl text-[hsl(var(--admin-on-surface))] tracking-tight">
            Good day, Creator.
          </h1>
          <p className="text-xs md:text-sm text-[hsl(var(--admin-outline))]">
            Managing real-time campaign acceleration &amp; audience velocity for{" "}
            {client.name}.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setExportOpen(true)}
            className="px-4 py-2 rounded-full bg-white border border-[hsl(var(--admin-outline-variant))]/50 text-[hsl(var(--admin-on-surface))] text-xs font-semibold hover:bg-[hsl(var(--admin-surface-high))] transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Icons.ios_share className="size-4" />
            Export Report
          </button>
          <button
            onClick={() => setScheduleOpen(true)}
            className="px-4 py-2 rounded-full bg-[hsl(var(--admin-cobalt))] text-white text-xs font-semibold hover:bg-[hsl(var(--admin-cobalt))]/90 transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Icons.send className="size-4" />
            Schedule Post
          </button>
        </div>
      </section>

      <ExportReportModal
        open={exportOpen}
        client={client}
        onClose={() => setExportOpen(false)}
      />
      <SchedulePostModal
        open={scheduleOpen}
        client={client}
        onClose={() => setScheduleOpen(false)}
      />
    </>
  )
}
