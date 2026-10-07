"use client"

import React, { useEffect, useState } from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import type { ClientWithChannels } from "@/features/social-accounts/api/types"

type Format = "pdf" | "markdown" | "csv"

const FORMATS: { id: Format; label: string; hint: string; icon: string }[] = [
  { id: "pdf", label: "PDF Report", hint: "Branded, print-ready deck", icon: "fileTypePdf" },
  { id: "markdown", label: "Markdown", hint: "Paste into Notion / docs", icon: "fileTypeDoc" },
  { id: "csv", label: "CSV Data", hint: "Raw metrics for spreadsheets", icon: "fileTypeXls" },
]

export function ExportReportModal({
  open,
  client,
  onClose,
}: {
  open: boolean
  client: ClientWithChannels
  onClose: () => void
}) {
  const [format, setFormat] = useState<Format>("pdf")
  const [range, setRange] = useState("30d")
  const [phase, setPhase] = useState<"idle" | "working" | "done">("idle")

  useEffect(() => {
    if (open) {
      setPhase("idle")
      setFormat("pdf")
      setRange("30d")
    }
  }, [open])

  useEffect(() => {
    if (phase !== "working") return
    const t = setTimeout(() => setPhase("done"), 1500)
    return () => clearTimeout(t)
  }, [phase])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-md"
        onClick={phase === "working" ? undefined : onClose}
      />
      <div className="relative w-full max-w-md bg-card/95 backdrop-blur-2xl rounded-2xl border border-border/40 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center">
              <Icons.ios_share className="size-[18px]" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-foreground text-sm">
                Export Performance Report
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {client.name}
              </p>
            </div>
          </div>
          {phase !== "working" && (
            <button
              className="p-1 rounded-full hover:bg-muted/70 text-muted-foreground transition-all cursor-pointer"
              onClick={onClose}
            >
              <Icons.close className="size-[18px]" />
            </button>
          )}
        </div>

        {phase === "done" ? (
          <div className="py-6 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-brand-accent/20 flex items-center justify-center">
              <Icons.circleCheck className="size-7 text-[#526600]" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Report ready
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {client.name}-performance-{range}.{format === "markdown" ? "md" : format} has
                been generated.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border/40 text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer">
                <Icons.download className="size-3.5" />
                Download
              </button>
              <button
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold transition-all cursor-pointer"
                onClick={onClose}
              >
                <Icons.check className="size-3.5" />
                Done
              </button>
            </div>
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
                        ? "border-brand-accent bg-brand-accent/5 shadow-sm"
                        : "border-border/30 hover:bg-muted/50"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-brand-accent shrink-0">
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
                      <Icons.circleCheck className="size-4 text-brand-accent" />
                    )}
                  </button>
                )
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Date Range
              </label>
              <div className="inline-flex p-1 rounded-full bg-muted/70/70 border border-border/30 w-full">
                {[
                  { id: "7d", label: "Last 7 days" },
                  { id: "30d", label: "Last 30 days" },
                  { id: "90d", label: "Last 90 days" },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRange(r.id)}
                    className={cn(
                      "flex-1 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer",
                      range === r.id
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/30">
              <Icons.info className="size-4 text-brand-accent shrink-0" />
              <span className="text-[10px] text-muted-foreground">
                The report includes reach, engagement, top formats and AI insights,
                white-labelled with the client logo.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                className="px-4 py-2 rounded-full text-xs font-semibold text-foreground hover:bg-muted/70 transition-all cursor-pointer"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                disabled={phase === "working"}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-accent text-white text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:hover:scale-100"
                onClick={() => setPhase("working")}
              >
                {phase === "working" ? (
                  <>
                    <Icons.refresh className="size-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Icons.download className="size-4" />
                    Generate Report
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
