"use client"

import React, { useState } from "react"
import { motion } from "motion/react"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { useActiveDashboard } from "./dashboard-data"
import { ExportReportModal } from "./export-report-modal"
import { SchedulePostModal } from "./schedule-post-modal"
import { formatDistanceToNow } from "date-fns"

export function DashboardStitchHero() {
  const { client, profile } = useActiveDashboard()
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-2xs font-bold text-muted-foreground cursor-help" title={`Data terakhir sinkron: ${profile.updated_at}`}>
              <Icons.refresh className="size-3" />
              <span>
                Synced {profile.updated_at ? formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true }) : 'never'}
              </span>
            </div>
          </div>

          <h1 className="font-sans font-extrabold text-2xl md:text-3xl text-foreground tracking-tight">
            {profile.greeting}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Ringkasan performa konten untuk {client.name}.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setExportOpen(true)}
            className="rounded-full text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Icons.ios_share className="size-4" />
            Export Report
          </Button>
          <Button
            type="button"
            onClick={() => setScheduleOpen(true)}
            className="rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-semibold gap-1.5 shadow-md"
          >
            <Icons.send className="size-4" />
            Schedule Post
          </Button>
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
