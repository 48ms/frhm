"use client"

import React, { useState } from "react"
import { motion } from "motion/react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { useActiveDashboard } from "./dashboard-data"
import { ExportReportModal } from "./export-report-modal"
import { SchedulePostModal } from "./schedule-post-modal"

export function DashboardStitchHero() {
  const { clients, clientId, setClientId, profile } = useActiveDashboard()
  // Safe client resolution: prefer explicit match, fall back to first available
  const client = clients.find((c) => c.id === clientId) ?? clients[0] ?? { id: clientId, name: "Client" }
  const [pickerOpen, setPickerOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  return (
    <>
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 lg:p-7 rounded-2xl bg-card/90 backdrop-blur-2xl border border-border/40 shadow-sm relative overflow-hidden"
        >

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
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-bold hover:brightness-95 transition-all cursor-pointer border border-brand-accent/20"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
              <span>Aktif</span>
              <span className="opacity-40">•</span>
              <span className="text-brand-accent font-extrabold">
                Klien: {client.name}
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
                className="absolute top-full left-0 mt-1.5 w-72 bg-card/95 backdrop-blur-xl border border-border/40 shadow-2xl rounded-2xl p-2 z-40 space-y-1"
              >
                <div className="text-[10px] font-bold text-muted-foreground px-2 py-1">
                  Ganti klien aktif:
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
                  </button>
                ))}
              </div>
            )}
          </div>

          <h1 className="font-syne font-extrabold text-2xl md:text-3xl text-foreground tracking-tight">
            {profile.greeting}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Ringkasan performa konten untuk {client.name}.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setExportOpen(true)}
            className="px-4 py-2 rounded-full bg-white border border-border/50 text-foreground text-xs font-semibold hover:bg-muted/70 transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Icons.ios_share className="size-4" />
            Export Report
          </button>
          <button
            onClick={() => setScheduleOpen(true)}
            className="px-4 py-2 rounded-full bg-brand-accent text-white text-xs font-semibold hover:bg-brand-accent/90 transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Icons.send className="size-4" />
            Schedule Post
          </button>
        </div>
      </motion.section>

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
