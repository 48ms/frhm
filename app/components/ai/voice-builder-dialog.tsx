"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { useExtractVoice, useSaveVoiceGuide } from "@/features/voice-builder/api/queries"
import type { VoiceExtractionResult, VoiceTargetType } from "@/features/voice-builder/api/types"

interface VoiceBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
  onSaved?: (markdown: string) => void
}

const SAMPLE_PRESETS = [
  `Kopi enak itu sederhana. Biji segar dari petani lokal, air bersuhu 92 derajat, dan rasio seduh yang pas. Kami tidak pernah menambahkan perisa buatan atau pemanis kimia. Jika Anda mencari racikan instan murahan, kami bukan tempatnya. Tapi jika Anda menghargai kerja keras petani di lereng gunung, mari duduk bersama kami.`,
  `Banyak brand sibuk mengejar viralitas sampai lupa menjaga mutu seduhan. Di dapur kami, setiap batch biji kopi diuji tiga kali sebelum sampai ke meja Anda. Kami percaya hubungan baik dibangun lewat kejujuran rasa, bukan trik marketing bombastis. Ada harga untuk sebuah konsistensi.`,
  `Catatan kecil untuk akhir pekan: Luangkan waktu 15 menit tanpa layar ponsel. Nikmati aroma seduhan kopi pagi Anda perlahan. Kadang inspirasi terbesar lahir saat kita berhenti terburu-buru dan mulai benar-benar merasakan.`,
]

export function VoiceBuilderDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  onSaved,
}: VoiceBuilderDialogProps) {
  const [targetType, setTargetType] = React.useState<VoiceTargetType>("brand")
  const [samples, setSamples] = React.useState<string[]>(["", ""])
  const [result, setResult] = React.useState<VoiceExtractionResult | null>(null)
  const [activeTab, setActiveTab] = React.useState<"input" | "blueprint" | "markdown">("input")

  const { mutateAsync: extractVoice, isPending: isExtracting } = useExtractVoice()
  const { mutateAsync: saveVoice, isPending: isSaving } = useSaveVoiceGuide()

  // Reset state when opened
  React.useEffect(() => {
    if (open && !result) {
      setActiveTab("input")
    }
  }, [open, result])

  const handleAddSample = () => {
    if (samples.length >= 8) {
      toast.info("Maksimal 8 sampel teks untuk menjaga efisiensi konteks.")
      return
    }
    setSamples((prev) => [...prev, ""])
  }

  const handleRemoveSample = (index: number) => {
    if (samples.length <= 1) return
    setSamples((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSampleChange = (index: number, val: string) => {
    setSamples((prev) => {
      const next = [...prev]
      next[index] = val
      return next
    })
  }

  const handleLoadPresets = () => {
    setSamples(SAMPLE_PRESETS)
    toast.info("3 sampel tulisan acuan berhasil dimuat.")
  }

  const handleRunExtraction = async () => {
    const validSamples = samples.map((s) => s.trim()).filter(Boolean)
    if (validSamples.length === 0) {
      toast.error("Masukkan minimal 1-2 sampel tulisan asli atau transkrip pembicaraan.")
      return
    }

    try {
      const res = await extractVoice({
        clientId,
        brandName: clientName,
        targetType,
        samples: validSamples,
      })

      if (!res.success || !res.data) {
        toast.error(res.error || "Gagal mengekstrak suara.")
        return
      }

      setResult(res.data)
      setActiveTab("blueprint")
      toast.success("Karakteristik suara berhasil diekstraksi dari bukti nyata!")
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') console.error(err)
      toast.error("Terjadi kendala saat menghubungkan ke AI Voice Engine.")
    }
  }

  const handleSaveToBrandBrain = async () => {
    if (!result?.markdown) return

    try {
      const res = await saveVoice({
        clientId,
        content: result.markdown,
      })

      if (!res.success) {
        toast.error(res.error || "Gagal menyimpan voice guide.")
        return
      }

      toast.success("Dokumen voice.md berhasil disimpan ke Brand Brain & disinkronkan ke AI!")
      if (onSaved) onSaved(result.markdown)
      onOpenChange(false)
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') console.error(err)
      toast.error("Gagal menyimpan dokumen ke server.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-card/95 backdrop-blur-2xl rounded-3xl border border-border/40 p-0 shadow-2xl gap-0">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-border/30 pb-4 text-left shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <Icons.sparkles className="size-5" />
              </div>
              <div>
                <DialogTitle className="font-sans font-bold text-foreground text-base flex items-center gap-2">
                  Voice Builder Architecture
                  <Badge variant="secondary" className="text-2xs bg-primary/10 text-primary border-primary/20">
                    Upstream Ground Truth
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Ekstraksi gaya bahasa otentik untuk {clientName} dari bukti sampel tulisan nyata (6-Layer Deconstruction).
                </DialogDescription>
              </div>
            </div>

            {result && (
              <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/30">
                <Button
                  size="sm"
                  variant={activeTab === "blueprint" ? "secondary" : "ghost"}
                  className="h-7 text-xs px-2.5 rounded-lg font-medium"
                  onClick={() => setActiveTab("blueprint")}
                >
                  <Icons.bot className="size-3.5 mr-1" />
                  Blueprint
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === "markdown" ? "secondary" : "ghost"}
                  className="h-7 text-xs px-2.5 rounded-lg font-medium"
                  onClick={() => setActiveTab("markdown")}
                >
                  <Icons.fileText className="size-3.5 mr-1" />
                  Markdown
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === "input" ? "secondary" : "ghost"}
                  className="h-7 text-xs px-2.5 rounded-lg font-medium"
                  onClick={() => setActiveTab("input")}
                >
                  <Icons.edit className="size-3.5 mr-1" />
                  Sampel
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "input" && (
            <div className="space-y-5">
              {/* Persona Selector */}
              <div className="bg-muted/40 p-4 rounded-2xl border border-border/30 space-y-3">
                <label className="text-xs font-semibold text-foreground block">
                  Target Karakter Suara:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "founder", label: "Founder / Executive", desc: "Suara orang pertama, berwawasan, autentik" },
                    { id: "brand", label: "Brand / Company", desc: "Suara entitas bisnis yang konsisten & ramah" },
                    { id: "creator", label: "Creator / Ghostwriter", desc: "Suara personal kreator dengan gaya kasual" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTargetType(p.id as VoiceTargetType)}
                      className={cn(
                        "text-left p-3 rounded-xl border text-xs transition-all",
                        targetType === p.id
                          ? "border-primary bg-primary/10 text-foreground font-semibold shadow-sm"
                          : "border-border/40 bg-card hover:bg-muted/50 text-muted-foreground"
                      )}
                    >
                      <div className="font-medium text-foreground">{p.label}</div>
                      <div className="text-2xs text-muted-foreground mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample Blocks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">
                      Kumpulan Sampel Tulisan Nyata
                    </h4>
                    <p className="text-2xs text-muted-foreground">
                      Masukkan 2–5 postingan terbaik, newsletter, atau transkrip pembicaraan asli.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-dashed text-primary hover:text-primary"
                    onClick={handleLoadPresets}
                  >
                    <Icons.sparkles className="size-3.5 mr-1" />
                    Muat Contoh Sampel
                  </Button>
                </div>

                <div className="space-y-3">
                  {samples.map((sample, idx) => (
                    <div key={idx} className="relative group">
                      <div className="flex items-center justify-between text-2xs text-muted-foreground mb-1 px-1">
                        <span className="font-medium">Sampel Tulisan #{idx + 1}</span>
                        {samples.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSample(idx)}
                            className="text-destructive hover:underline"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                      <Textarea
                        value={sample}
                        onChange={(e) => handleSampleChange(idx, e.target.value)}
                        placeholder={`Tempel teks postingan asli, caption instagram, atau materi newsletter #${idx + 1}...`}
                        className="min-h-[90px] text-xs resize-y bg-muted/30 border-border/40 focus-visible:ring-primary/40 rounded-xl"
                      />
                    </div>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full h-8 text-xs text-muted-foreground border border-dashed border-border/40 hover:bg-muted/40 rounded-xl"
                  onClick={handleAddSample}
                >
                  <Icons.plus className="size-3.5 mr-1" />
                  Tambah Blok Sampel Tulisan
                </Button>
              </div>
            </div>
          )}

          {activeTab === "blueprint" && result && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 space-y-1.5">
                <div className="text-2xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Icons.checkCircle className="size-3.5" />
                  Intisari Suara Otentik
                </div>
                <p className="text-xs text-foreground leading-relaxed">{result.summary}</p>
              </div>

              {/* Dimensions Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground">Dimensi Suara (1–5)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {Object.entries(result.dimensions).map(([dim, score]) => (
                    <div
                      key={dim}
                      className="bg-muted/40 p-2.5 rounded-xl border border-border/30 text-center space-y-1"
                    >
                      <span className="capitalize text-2xs text-muted-foreground font-medium block">
                        {dim}
                      </span>
                      <span className="text-sm font-bold text-foreground">{score} / 5</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fingerprint vs Negative Space */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card p-4 rounded-2xl border border-border/40 space-y-2.5">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <Icons.sparkles className="size-4" />
                    The Voice Fingerprint (Karakter Unik)
                  </h4>
                  <ul className="space-y-2">
                    {result.fingerprint.map((fp, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        <span>{fp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-card p-4 rounded-2xl border border-border/40 space-y-2.5">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <Icons.alertCircle className="size-4" />
                    The Negative Space (Pantangan Keras)
                  </h4>
                  <ul className="space-y-2">
                    {result.negativeSpace.map((ns, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                        <span>{ns}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Do / Don't Rewrites */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-foreground">
                  Do / Don't Rewrites (Kalibrasi Kalimat)
                </h4>
                <div className="space-y-2.5">
                  {result.rewrites.map((rw, i) => (
                    <div key={i} className="bg-muted/30 p-3.5 rounded-2xl border border-border/30 space-y-2 text-xs">
                      <div className="text-rose-500 dark:text-rose-400 font-medium flex items-start gap-1.5">
                        <span className="shrink-0 font-bold">[Generic / Don&apos;t]:</span>
                        <span className="line-through opacity-80">{rw.generic}</span>
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-start gap-1.5">
                        <span className="shrink-0 font-bold">[On-Voice / Do]:</span>
                        <span>{rw.onVoice}</span>
                      </div>
                      <div className="text-2xs text-muted-foreground italic border-t border-border/20 pt-1.5 mt-1">
                        Alasan: {rw.why}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "markdown" && result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-2xs text-muted-foreground">
                <span>Pratinjau Berkas Markdown (voice.md)</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-2xs"
                  onClick={() => {
                    navigator.clipboard?.writeText(result.markdown).catch(() => {})
                    toast.success("Markdown disalin ke clipboard.")
                  }}
                >
                  <Icons.copy className="size-3 mr-1" />
                  Salin Teks
                </Button>
              </div>
              <Textarea
                value={result.markdown}
                onChange={(e) => setResult((prev) => (prev ? { ...prev, markdown: e.target.value } : prev))}
                className="font-mono text-xs min-h-[360px] bg-muted/40 border-border/40 rounded-xl resize-y"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border/30 bg-muted/20 flex flex-row items-center justify-between gap-3 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>

          <div className="flex items-center gap-2">
            {activeTab === "input" ? (
              <Button
                size="sm"
                className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleRunExtraction}
                isLoading={isExtracting}
                disabled={isExtracting}
              >
                {isExtracting ? (
                  <ShimmeringText text="Menganalisis 6 Lapisan Suara..." />
                ) : (
                  <>
                    <Icons.sparkles className="size-3.5 mr-1.5" />
                    Analisis 6 Lapisan & Bangun Voice Guide
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleSaveToBrandBrain}
                isLoading={isSaving}
                disabled={isSaving}
              >
                <Icons.check className="size-3.5 mr-1.5" />
                Simpan ke Brand Brain (voice.md)
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
