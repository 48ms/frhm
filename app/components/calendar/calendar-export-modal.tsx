"use client"

import React, { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { PLATFORMS } from "@/features/calendar/types"
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
    out.push(`# Jadwal Konten — ${clientName}`)
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
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-2xl border border-border/80 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center">
              <Icons.download className="size-[18px]" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-foreground text-sm">
                Export Content Schedule
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {scoped.length} post · {clientName}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-all cursor-pointer"
            onClick={onClose}
          >
            <Icons.close className="size-[18px]" />
          </button>
        </div>

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
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer",
                      format === f.id
                        ? "border-brand-accent bg-brand-accent/5 shadow-sm"
                        : "border-border/40 hover:bg-muted/50"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-brand-accent shrink-0">
                      {IconCmp ? <IconCmp className="size-4" /> : <Icons.fileText className="size-4" />}
                    </div>
                    <div className="flex-1">
                      <span className="block text-xs font-semibold text-foreground">{f.label}</span>
                      <span className="block text-[10px] text-muted-foreground">{f.hint}</span>
                    </div>
                    {format === f.id && <Icons.circleCheck className="size-4 text-brand-accent" />}
                  </button>
                )
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Rentang tanggal
              </label>
              <div className="inline-flex p-1 rounded-full bg-muted/70 border border-border/40 w-full">
                {RANGES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRange(r.id)}
                    className={cn(
                      "flex-1 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer",
                      range === r.id
                        ? "bg-card text-foreground shadow-sm"
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
                type="button"
                className="px-4 py-2 rounded-full text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer"
                onClick={onClose}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
                onClick={handleExport}
              >
                {busy ? (
                  <>
                    <Icons.refresh className="size-4 animate-spin" />
                    Mengekspor…
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
