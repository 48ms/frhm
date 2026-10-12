"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import type { ClientWithChannels } from "@/features/social-accounts/api/types"
import { analyticsQueries } from "@/features/analytics/api/queries"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/animate-ui/components/radix/dialog"
import { Button } from "@/components/ui/button"
import {
  buildReportModel,
  buildCsv,
  buildMarkdown,
  reportFileName,
  type ReportFormat,
  type ReportRange,
} from "./report-generator"

const FORMATS: { id: ReportFormat; label: string; hint: string; icon: string }[] = [
  { id: "pdf", label: "PDF Report", hint: "Dokumen siap cetak", icon: "fileTypePdf" },
  { id: "markdown", label: "Markdown", hint: "Tempel ke Notion / docs", icon: "fileTypeDoc" },
  { id: "csv", label: "CSV Data", hint: "Data mentah untuk spreadsheet", icon: "fileTypeXls" },
]

const RANGES: { id: ReportRange; label: string }[] = [
  { id: "7d", label: "7 hari terakhir" },
  { id: "30d", label: "30 hari terakhir" },
  { id: "90d", label: "90 hari terakhir" },
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
  const [format, setFormat] = useState<ReportFormat>("pdf")
  const [range, setRange] = useState<ReportRange>("30d")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setFormat("pdf")
      setRange("30d")
      setBusy(false)
    }
  }, [open])

  // Data metrik NYATA dari DB (bukan angka rekaan).
  const { data: metrics = [], isPending: metricsPending } = useQuery({
    ...analyticsQueries.listMetricsByClient(client.id),
    enabled: open && Boolean(client.id),
  })
  const { data: summaries = [], isPending: summariesPending } = useQuery({
    ...analyticsQueries.listSummariesByClient(client.id),
    enabled: open && Boolean(client.id),
  })

  const model = useMemo(
    () => buildReportModel(client.name, range, metrics, summaries),
    [client.name, range, metrics, summaries]
  )

  const loading = metricsPending || summariesPending
  const hasData = model.totals.posts > 0

  if (!open) return null

  async function handleGenerate() {
    if (!hasData) return
    setBusy(true)
    try {
      if (format === "csv") {
        downloadBlob(new Blob([buildCsv(model)], { type: "text/csv;charset=utf-8;" }), reportFileName(client.name, range, "csv"))
      } else if (format === "markdown") {
        downloadBlob(new Blob([buildMarkdown(model)], { type: "text/markdown;charset=utf-8;" }), reportFileName(client.name, range, "md"))
      } else {
        const { buildPdfBlob } = await import("./report-pdf")
        downloadBlob(await buildPdfBlob(model), reportFileName(client.name, range, "pdf"))
      }
      toast.success("Laporan diunduh.", {
        description: `${reportFileName(client.name, range, format === "markdown" ? "md" : format)} tersimpan di folder unduhan.`,
      })
      onClose()
    } catch (err) {
      toast.error("Gagal membuat laporan.", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-5 rounded-2xl border-border/40 shadow-2xl bg-card space-y-4">
        <DialogHeader className="flex flex-row items-center gap-2 border-b border-border/30 pb-3 space-y-0 text-left">
          <div className="w-8 h-8 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center shrink-0">
            <Icons.ios_share className="size-[18px]" />
          </div>
          <div>
            <DialogTitle className="font-sans font-bold text-foreground text-sm">
              Export Performance Report
            </DialogTitle>
            <DialogDescription className="text-2xs text-muted-foreground">{client.name}</DialogDescription>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center space-y-2">
            <Icons.refresh className="size-5 mx-auto animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Memuat data metrik…</p>
          </div>
        ) : !hasData ? (
          <div className="py-8 text-center space-y-2">
            <Icons.activity className="size-6 mx-auto text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Belum ada data performa</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Laporan dibangun dari metrik postingan yang tercatat. Setelah ada metrik pada
              rentang ini, laporan bisa diunduh di sini.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                Format laporan
              </label>
              <div className="grid grid-cols-3 gap-2">
                {FORMATS.map((f) => {
                  const active = format === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormat(f.id)}
                      aria-pressed={active}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1",
                        active
                          ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                          : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="text-xs font-bold leading-tight">{f.label}</span>
                      <span className="text-2xs opacity-75 leading-tight">{f.hint}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                Rentang waktu
              </label>
              <div className="grid grid-cols-3 gap-2">
                {RANGES.map((r) => {
                  const active = range === r.id
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRange(r.id)}
                      aria-pressed={active}
                      className={cn(
                        "py-1.5 px-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer",
                        active
                          ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                          : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {r.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/30">
              <Icons.info className="size-4 text-brand-accent shrink-0" />
              <span className="text-2xs text-muted-foreground">
                Laporan memuat {model.totals.posts} postingan tercatat pada rentang ini:
                reach, engagement, rincian per platform, dan catatan AI yang tersimpan.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full text-xs font-semibold text-foreground hover:bg-muted/70"
                onClick={onClose}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy}
                isLoading={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all"
                onClick={handleGenerate}
              >
                <Icons.download className="size-4" />
                Buat laporan
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
