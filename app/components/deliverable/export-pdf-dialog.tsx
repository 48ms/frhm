"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/animate-ui/components/radix/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox"
import { Icons } from "@/components/icons"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ExportPdfDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deliverable: {
    id: string
    title: string
    type?: string
    status?: string
    content_md?: string | null
    created_at?: string | null
    approved_at?: string | null
  } | null
  clientName: string
}

type ThemeColor = "cobalt" | "emerald" | "indigo" | "monochrome"

const THEME_OPTIONS: { id: ThemeColor; label: string; bgClass: string; borderClass: string }[] = [
  { id: "cobalt", label: "Cobalt Blue", bgClass: "bg-blue-600", borderClass: "border-blue-500" },
  { id: "emerald", label: "Emerald Growth", bgClass: "bg-emerald-600", borderClass: "border-emerald-500" },
  { id: "indigo", label: "Royal Indigo", bgClass: "bg-indigo-600", borderClass: "border-indigo-500" },
  { id: "monochrome", label: "Monochrome", bgClass: "bg-muted-foreground", borderClass: "border-border" },
]

const WATERMARK_OPTIONS = [
  { id: "", label: "Tanpa Cap" },
  { id: "CONFIDENTIAL", label: "CONFIDENTIAL" },
  { id: "FINAL & APPROVED", label: "FINAL & APPROVED" },
  { id: "DRAFT STRATEGY", label: "DRAFT STRATEGY" },
]

export function ExportPdfDialog({
  open,
  onOpenChange,
  deliverable,
  clientName,
}: ExportPdfDialogProps) {
  const [themeColor, setThemeColor] = React.useState<ThemeColor>("cobalt")
  const [includeSignature, setIncludeSignature] = React.useState(true)
  const [watermark, setWatermark] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)

  const content = deliverable?.content_md || ""
  const charCount = content.length
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const estimatedPages = Math.max(1, Math.ceil(charCount / 1200))

  const handleGeneratePdf = async (action: "download" | "preview") => {
    if (!deliverable) return
    setIsGenerating(true)

    const generatePromise = (async () => {
      const { buildDeliverablePdfBlob } = await import("@/lib/pdf/deliverable-pdf")

      const blob = await buildDeliverablePdfBlob({
        title: deliverable.title,
        clientName: clientName || "Klien",
        deliverableType: deliverable.type || "strategy",
        status: deliverable.status || "draft",
        contentMarkdown: content || "# " + deliverable.title,
        createdAt: deliverable.created_at || undefined,
        approvedAt: deliverable.approved_at,
        themeColor,
        includeSignatureBlock: includeSignature,
        watermarkText: watermark || undefined,
      })

      const blobUrl = URL.createObjectURL(blob)
      const cleanClientName = (clientName || "klien").toLowerCase().replace(/[^a-z0-9]/g, "-")
      const cleanTitle = deliverable.title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30)
      const fileName = `${cleanClientName}-${cleanTitle}-strategy.pdf`

      if (action === "preview") {
        window.open(blobUrl, "_blank")
      } else {
        const link = document.createElement("a")
        link.href = blobUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        onOpenChange(false)
      }
      return fileName
    })()

    toast.promise(generatePromise, {
      loading: action === "preview" ? "Menyiapkan pratinjau dokumen PDF..." : "Menyusun dan mengunduh dokumen PDF...",
      success: (fileName) =>
        action === "preview" ? "Pratinjau PDF dibuka di tab baru." : `Dokumen PDF berhasil diunduh (${fileName}).`,
      error: (err: unknown) => (err instanceof Error ? err.message : "Gagal memproses dokumen PDF."),
    })

    try {
      await generatePromise
    } catch {
      // Handled by toast.promise
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full p-6 bg-card/95 backdrop-blur-2xl border-border/40 text-foreground rounded-3xl shadow-2xl space-y-4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
              <Icons.fileTypePdf className="size-4" />
            </span>
            Ekspor PDF Eksekutif
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Hasilkan dokumen strategi berformat PDF eksekutif siap presentasi dengan kop dan identitas brand klien.
          </DialogDescription>
        </DialogHeader>

        {deliverable && (
          <div className="space-y-4">
            {/* DOCUMENT OVERVIEW */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Klien: {clientName}
                  </span>
                  <h4 className="text-sm font-bold text-foreground truncate">
                    {deliverable.title}
                  </h4>
                </div>
                <Badge variant="outline" className="text-2xs uppercase shrink-0">
                  {deliverable.type || "STRATEGY"}
                </Badge>
              </div>

              {/* STATS STRIP */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/40 text-center">
                <div>
                  <span className="text-2xs text-muted-foreground block">Karakter</span>
                  <span className="text-xs font-bold text-foreground font-mono">
                    <MetricTicker value={charCount} />
                  </span>
                </div>
                <div>
                  <span className="text-2xs text-muted-foreground block">Kata</span>
                  <span className="text-xs font-bold text-foreground font-mono">
                    <MetricTicker value={wordCount} />
                  </span>
                </div>
                <div>
                  <span className="text-2xs text-muted-foreground block">Estimasi Hal.</span>
                  <span className="text-xs font-bold text-foreground font-mono">
                    <MetricTicker value={estimatedPages} /> Hal
                  </span>
                </div>
              </div>
            </div>

            {/* THEME SELECTOR */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Tema Warna Dokumen</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setThemeColor(opt.id)}
                    className={cn(
                      "p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5",
                      themeColor === opt.id
                        ? "bg-primary/10 border-primary ring-1 ring-primary text-foreground font-semibold"
                        : "bg-background hover:bg-muted/40 border-border/60 text-muted-foreground"
                    )}
                  >
                    <span className={cn("size-3 rounded-full", opt.bgClass)} />
                    <span className="text-1xs leading-tight">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* WATERMARK SELECTOR */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Cap Kerahasiaan (Watermark)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {WATERMARK_OPTIONS.map((wm) => (
                  <button
                    key={wm.id}
                    type="button"
                    onClick={() => setWatermark(wm.id)}
                    className={cn(
                      "p-1.5 rounded-lg border text-xs text-center transition-all",
                      watermark === wm.id
                        ? "bg-primary/10 border-primary font-semibold text-foreground"
                        : "bg-background hover:bg-muted/40 border-border/60 text-muted-foreground"
                    )}
                  >
                    {wm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SIGNATURE BLOCK TOGGLE */}
            <div
              onClick={() => setIncludeSignature(!includeSignature)}
              className="p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  Lembar Tanda Tangan & Persetujuan
                </span>
                <span className="text-2xs text-muted-foreground block">
                  Sertakan kotak tanda tangan resmi perwakilan klien dan tim strategi Frhm di akhir dokumen.
                </span>
              </div>
              <Checkbox
                checked={includeSignature}
                onCheckedChange={(checked) => setIncludeSignature(!!checked)}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
            className="text-xs"
          >
            Batal
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleGeneratePdf("preview")}
              isLoading={isGenerating}
              disabled={isGenerating}
              className="text-xs gap-1"
            >
              <Icons.externalLink className="size-3" />
              Pratinjau
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleGeneratePdf("download")}
              isLoading={isGenerating}
              disabled={isGenerating}
              className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isGenerating ? (
                <ShimmeringText text="Menyusun Dokumen..." />
              ) : (
                <>
                  <Icons.download className="size-3.5" />
                  Unduh PDF
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
