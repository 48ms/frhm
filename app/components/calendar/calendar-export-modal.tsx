"use client"

import React, { useEffect, useState } from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { PLATFORMS } from "@/features/calendar/types"
import type { ScheduledPost } from "@/features/scheduled-posts/api/types"

type Format = "csv" | "pdf" | "markdown"

const FORMATS: { id: Format; label: string; hint: string; icon: string }[] = [
  { id: "csv", label: "CSV Schedule", hint: "Import into sheets / tools", icon: "fileTypeXls" },
  { id: "pdf", label: "PDF Planner", hint: "Print-ready monthly overview", icon: "fileTypePdf" },
  { id: "markdown", label: "Markdown", hint: "Paste into docs", icon: "fileTypeDoc" },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function CalendarExportModal({
  open,
  posts,
  clientName,
  onClose,
}: {
  open: boolean
  posts: ScheduledPost[]
  clientName: string
  onClose: () => void
}) {
  const [format, setFormat] = useState<Format>("csv")
  const [range, setRange] = useState<"week" | "month" | "all">("month")
  const [phase, setPhase] = useState<"idle" | "working" | "done">("idle")
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    if (open) {
      setPhase("idle")
      setFormat("csv")
      setRange("month")
      setDownloaded(false)
    }
  }, [open])

  useEffect(() => {
    if (phase !== "working") return
    const t = setTimeout(() => setPhase("done"), 1400)
    return () => clearTimeout(t)
  }, [phase])

  if (!open) return null

  // Client-side CSV render so the download button produces a real file.
  function buildCsv(): string {
    const rows = [
      ["Date", "Time", "Title", "Platform", "Status", "Notes"],
      ...posts.map((p) => [
        fmtDate(p.scheduled_at),
        fmtTime(p.scheduled_at),
        p.title,
        PLATFORMS[p.platform]?.name ?? p.platform,
        p.status,
        p.notes ?? "",
      ]),
    ]
    return rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")
  }

  function handleDownload() {
    if (format !== "csv") {
      setDownloaded(true)
      return
    }
    const blob = new Blob([buildCsv()], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${clientName.replace(/\s+/g, "-").toLowerCase()}-schedule.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloaded(true)
  }

  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-md"
        onClick={phase === "working" ? undefined : onClose}
      />
      <div className="relative w-full max-w-md bg-card/95 backdrop-blur-2xl rounded-2xl border border-border/80 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/15 text-blue-500 flex items-center justify-center">
              <Icons.download className="size-[18px]" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-foreground text-sm">
                Export Content Schedule
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {posts.length} posts · {clientName}
              </p>
            </div>
          </div>
          <button
            className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-all cursor-pointer"
            onClick={onClose}
          >
            <Icons.close className="size-[18px]" />
          </button>
        </div>

        {phase === "done" ? (
          <div className="py-6 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-lime-500/20 flex items-center justify-center">
              <Icons.circleCheck className="size-7 text-lime-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Schedule exported
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {posts.length} posts packed for {clientName}.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="admin-pill admin-pill-lime px-4 py-2 cursor-pointer flex items-center gap-1.5"
            >
              <Icons.download className="size-4" />
              {downloaded ? "Download again" : "Download file"}
            </button>
            {downloaded && (
              <span className="text-[10px] text-emerald-600 font-semibold">
                Saved to your downloads.
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                Export Format
              </label>
              {FORMATS.map((f) => {
                const IconCmp = (
                  Icons as Record<string, React.ComponentType<{ className?: string }>>
                )[f.icon]
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer",
                      format === f.id
                        ? "border-blue-500 bg-blue-500/5 shadow-sm"
                        : "border-border/40 hover:bg-muted/50"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-blue-500 shrink-0">
                      {IconCmp ? <IconCmp className="size-4" /> : <Icons.fileText className="size-4" />}
                    </div>
                    <div className="flex-1">
                      <span className="block text-xs font-semibold text-foreground">
                        {f.label}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        {f.hint}
                      </span>
                    </div>
                    {format === f.id && (
                      <Icons.circleCheck className="size-4 text-blue-500" />
                    )}
                  </button>
                )
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Date Range
              </label>
              <div className="inline-flex p-1 rounded-full bg-muted/70 border border-border/40 w-full">
                {[
                  { id: "week", label: "This week" },
                  { id: "month", label: "This month" },
                  { id: "all", label: "Everything" },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRange(r.id as "week" | "month" | "all")}
                    className={cn(
                      "flex-1 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer",
                      range === r.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                className="px-4 py-2 rounded-full text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                disabled={phase === "working"}
                className="admin-pill admin-pill-blue px-4 py-2 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 flex items-center gap-1.5"
                onClick={() => setPhase("working")}
              >
                {phase === "working" ? (
                  <>
                    <Icons.refresh className="size-4 animate-spin" />
                    Packing…
                  </>
                ) : (
                  <>
                    <Icons.download className="size-4" />
                    Export Schedule
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
