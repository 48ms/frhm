"use client"

import React, { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { PLATFORMS } from "@/features/calendar/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/animate-ui/components/radix/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { Button } from "@/components/ui/button"
import type { ScheduledPost } from "@/features/scheduled-posts/api/types"

type Format = "csv" | "pdf" | "markdown"
type Range = "week" | "month" | "all"

const FORMATS: { id: Format; label: string; hint: string; icon: string }[] = [
  { id: "csv", label: "CSV Schedule", hint: "Impor ke spreadsheet", icon: "fileTypeXls" },
  { id: "pdf", label: "PDF Planner", hint: "Ringkasan bulanan siap cetak", icon: "fileTypePdf" },
  { id: "markdown", label: "Markdown", hint: "Tempel ke dokumen", icon: "fileTypeDoc" },
]

const RANGES: { id: Range; label: string }[] = [
  { id: "week", label: "Minggu ini" },
  { id: "month", label: "Bulan ini" },
  { id: "all", label: "Semua" },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Saring post ke rentang tanggal yang dipilih (berdasarkan scheduled_at). */
function filterByRange(posts: ScheduledPost[], range: Range): ScheduledPost[] {
  if (range === "all") return posts
  const now = new Date()
  const start = new Date(now)
  if (range === "week") {
    const day = (now.getDay() + 6) % 7 // Senin = 0
    start.setDate(now.getDate() - day)
  } else {
    start.setDate(1)
  }
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  if (range === "week") end.setDate(start.getDate() + 7)
  else end.setMonth(start.getMonth() + 1)
  return posts.filter((p) => {
    const t = new Date(p.scheduled_at).getTime()
    return t >= start.getTime() && t < end.getTime()
  })
}

function slug(name: string) {
  return name.replace(/\s+/g, "-").toLowerCase() || "client"
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
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
  const [range, setRange] = useState<Range>("month")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setFormat("csv")
      setRange("month")
      setBusy(false)
    }
  }, [open])

  const scoped = useMemo(() => filterByRange(posts, range), [posts, range])

  if (!open) return null

  function buildCsv(): string {
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
    const rows = [
      ["Tanggal", "Jam", "Judul", "Platform", "Status", "Catatan"],
      ...scoped.map((p) => [
        fmtDate(p.scheduled_at),
        fmtTime(p.scheduled_at),
        p.title,
        PLATFORMS[p.platform]?.name ?? p.platform,
        p.status,
        p.notes ?? "",
      ]),
    ]
    return rows.map((r) => r.map((c) => esc(String(c))).join(",")).join("\n")
  }

  function buildMarkdown(): string {
    const out: string[] = []
    out.push(`# Jadwal Konten: ${clientName}`)
    out.push("")
    out.push(`Rentang: **${RANGES.find((r) => r.id === range)?.label}** · ${scoped.length} post`)
    out.push("")
    out.push("| Tanggal | Jam | Judul | Platform | Status |")
    out.push("| --- | --- | --- | --- | --- |")
    for (const p of scoped) {
      out.push(
        `| ${fmtDate(p.scheduled_at)} | ${fmtTime(p.scheduled_at)} | ${p.title} | ${
          PLATFORMS[p.platform]?.name ?? p.platform
        } | ${p.status} |`
      )
    }
    return out.join("\n")
  }

  async function handleExport() {
    if (scoped.length === 0) return
    setBusy(true)
    try {
      if (format === "csv") {
        downloadBlob(new Blob([buildCsv()], { type: "text/csv;charset=utf-8;" }), `${slug(clientName)}-schedule.csv`)
      } else if (format === "markdown") {
        downloadBlob(new Blob([buildMarkdown()], { type: "text/markdown;charset=utf-8;" }), `${slug(clientName)}-schedule.md`)
      } else {
        const { buildSchedulePdfBlob } = await import("./calendar-export-pdf")
        downloadBlob(
          await buildSchedulePdfBlob(clientName, scoped, RANGES.find((r) => r.id === range)?.label ?? ""),
          `${slug(clientName)}-schedule.pdf`
        )
      }
      toast.success("Jadwal diekspor.", { description: `${scoped.length} post tersimpan di folder unduhan.` })
      onClose()
    } catch (err) {
      toast.error("Gagal mengekspor jadwal.", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl bg-card border border-border shadow-2xl">
        <DialogHeader className="p-5 border-b border-border/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center shrink-0">
              <Icons.download className="size-4" />
            </div>
            <div>
              <DialogTitle className="font-sans font-bold text-foreground text-sm">
                Export Content Schedule
              </DialogTitle>
              <DialogDescription className="text-2xs text-muted-foreground">
                {scoped.length} post · {clientName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {scoped.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Icons.activity className="size-6 mx-auto text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Tidak ada post pada rentang ini</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Pilih rentang lain atau jadwalkan post lebih dulu.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-foreground">Format</label>
                {FORMATS.map((f) => {
                  const IconCmp = (
                    Icons as Record<string, React.ComponentType<{ className?: string }>>
                  )[f.icon]
                  const isSelected = format === f.id
                  return (
                    <Button
                      key={f.id}
                      type="button"
                      variant="outline"
                      onClick={() => setFormat(f.id)}
                      className={cn(
                        "w-full h-auto flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-brand-accent bg-brand-accent/5 shadow-xs hover:bg-brand-accent/10"
                          : "border-border/40 hover:bg-muted/50"
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-brand-accent shrink-0">
                        {IconCmp ? <IconCmp className="size-4" /> : <Icons.fileText className="size-4" />}
                      </div>
                      <div className="flex-1">
                        <span className="block text-xs font-semibold text-foreground">{f.label}</span>
                        <span className="block text-2xs text-muted-foreground">{f.hint}</span>
                      </div>
                      {isSelected && <Icons.circleCheck className="size-4 text-brand-accent shrink-0" />}
                    </Button>
                  )
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Rentang tanggal
                </label>
                <Tabs value={range} onValueChange={(val) => setRange(val as Range)}>
                  <TabsList
                    highlightClassName="bg-card text-foreground shadow-xs rounded-full"
                    className="w-full grid grid-cols-3 h-9 p-0.5 bg-muted/60 rounded-full border border-border/40"
                  >
                    {RANGES.map((r) => (
                      <TabsTrigger
                        key={r.id}
                        value={r.id}
                        className="text-1xs font-semibold py-1 rounded-full"
                      >
                        {r.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/30">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full text-xs font-semibold"
                  onClick={onClose}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={busy}
                  isLoading={busy}
                  className="rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold gap-1.5 shadow-sm"
                >
                  <Icons.download className="size-3.5" />
                  Export Schedule
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
