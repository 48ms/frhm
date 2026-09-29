"use client"

import React, { useEffect, useState } from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { PLATFORMS, type ScheduledPost } from "@/features/calendar/types"

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
        className="absolute inset-0 bg-[hsl(var(--admin-on-surface))]/40 backdrop-blur-md"
        onClick={phase === "working" ? undefined : onClose}
      />
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/80 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[hsl(var(--admin-outline-variant))]/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--admin-cobalt))]/15 text-[hsl(var(--admin-cobalt))] flex items-center justify-center">
              <Icons.download className="size-[18px]" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-[hsl(var(--admin-on-surface))] text-sm">
                Export Content Schedule
              </h3>
              <p className="text-[10px] text-[hsl(var(--admin-outline))]">
                {posts.length} posts · {clientName}
              </p>
            </div>
          </div>
          <button
            className="p-1 rounded-full hover:bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))] transition-all cursor-pointer"
            onClick={onClose}
          >
            <Icons.close className="size-[18px]" />
          </button>
        </div>

        {phase === "done" ? (
          <div className="py-6 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--brand-accent))]/20 flex items-center justify-center">
              <Icons.circleCheck className="size-7 text-[#526600]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[hsl(var(--admin-on-surface))]">
                Schedule exported
              </p>
              <p className="text-[11px] text-[hsl(var(--admin-outline))] mt-1">
                {posts.length} posts packed for {clientName}.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold transition-all cursor-pointer"
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
              <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))]">
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
                        ? "border-[hsl(var(--admin-cobalt))] bg-[hsl(var(--admin-cobalt))]/5 shadow-sm"
                        : "border-[hsl(var(--admin-outline-variant))]/30 hover:bg-[hsl(var(--admin-surface-low))]/50"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--admin-surface-low))] flex items-center justify-center text-[hsl(var(--admin-cobalt))] shrink-0">
                      {IconCmp ? <IconCmp className="size-4" /> : <Icons.fileText className="size-4" />}
                    </div>
                    <div className="flex-1">
                      <span className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))]">
                        {f.label}
                      </span>
                      <span className="block text-[10px] text-[hsl(var(--admin-outline))]">
                        {f.hint}
                      </span>
                    </div>
                    {format === f.id && (
                      <Icons.circleCheck className="size-4 text-[hsl(var(--admin-cobalt))]" />
                    )}
                  </button>
                )
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1.5">
                Date Range
              </label>
              <div className="inline-flex p-1 rounded-full bg-[hsl(var(--admin-surface-high))]/70 border border-[hsl(var(--admin-outline-variant))]/30 w-full">
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
                        ? "bg-white text-[hsl(var(--admin-on-surface))] shadow-sm"
                        : "text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))]"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                className="px-4 py-2 rounded-full text-xs font-semibold text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-high))] transition-all cursor-pointer"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                disabled={phase === "working"}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--admin-cobalt))] text-white text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:hover:scale-100"
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
