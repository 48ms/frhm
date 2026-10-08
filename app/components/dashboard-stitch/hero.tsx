"use client"

import React, { useState } from "react"
import { motion } from "motion/react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { useActiveDashboard } from "./dashboard-data"
import { ExportReportModal } from "./export-report-modal"
import { SchedulePostModal } from "./schedule-post-modal"
import { formatDistanceToNow } from "date-fns"

export function DashboardStitchHero() {
  const { clients, clientId, profile } = useActiveDashboard()
  // Safe client resolution: prefer explicit match, fall back to first available
  const client = clients.find((c) => c.id === clientId) ?? clients[0] ?? { id: clientId, name: "Client" }
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
          {/* WORKSPACE ACTIVE badge */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-bold border border-brand-accent/20 cursor-default select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
              <span>Workspace</span>
              <span className="opacity-40">•</span>
              <span className="text-brand-accent font-extrabold">
                {client.name}
              </span>
            </div>
            {/* Sync Status Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-[10px] font-bold text-muted-foreground cursor-help" title={`Data terakhir sinkron: ${profile.updated_at}`}>
              <Icons.refresh className="size-3" />
              <span>
                Synced {profile.updated_at ? formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true }) : 'never'}
              </span>
            </div>
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
