"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import type { ClientWithChannels } from "@/features/social-accounts/api/types"
import { analyticsQueries } from "@/features/analytics/api/queries"
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
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-2xl border border-border/40 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center">
              <Icons.ios_share className="size-[18px]" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-foreground text-sm">
                Export Performance Report
              </h3>
              <p className="text-[10px] text-muted-foreground">{client.name}</p>
            </div>
          </div>
          <button
            type="button"
            className="p-1 rounded-full hover:bg-muted/70 text-muted-foreground transition-all cursor-pointer"
            onClick={onClose}
          >
            <Icons.close className="size-[18px]" />
          </button>
        </div>

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
                Rentang tanggal
              </label>
              <div className="inline-flex p-1 rounded-full bg-muted/70 border border-border/30 w-full">
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

            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/30">
              <Icons.info className="size-4 text-brand-accent shrink-0" />
              <span className="text-[10px] text-muted-foreground">
                Laporan memuat {model.totals.posts} postingan tercatat pada rentang ini:
                reach, engagement, rincian per platform, dan catatan AI yang tersimpan.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                className="px-4 py-2 rounded-full text-xs font-semibold text-foreground hover:bg-muted/70 transition-all cursor-pointer"
                onClick={onClose}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-accent text-white text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:hover:scale-100"
                onClick={handleGenerate}
              >
                {busy ? (
                  <>
                    <Icons.refresh className="size-4 animate-spin" />
                    Membuat…
                  </>
                ) : (
                  <>
                    <Icons.download className="size-4" />
                    Buat laporan
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
