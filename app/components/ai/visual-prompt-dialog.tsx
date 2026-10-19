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
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"
import { Icons } from "@/components/icons"
import { useGenerateVisualPrompt } from "@/features/visual-prompt/api/queries"
import type {
  VisualTool,
  AspectRatio,
  VisualPromptResult,
} from "@/features/visual-prompt/api/types"
import { cn } from "@/lib/utils"

interface VisualPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
  initialTopic?: string
  initialVisualBrief?: string
  initialFormat?: "Single" | "Carousel" | "Reel" | "Thread" | "Story"
}

const TOOLS_CONFIG: { id: VisualTool; label: string; desc: string; icon: keyof typeof Icons }[] = [
  { id: "flux", label: "Flux / Realistic", desc: "Fotografi realistis & produk hero", icon: "media" },
  { id: "ideogram", label: "Ideogram", desc: "Tipografi teks & infografis", icon: "text" },
  { id: "veo", label: "Veo-3 Video", desc: "Naskah video 9:16 8-detik sinematik", icon: "video" },
  { id: "midjourney", label: "Midjourney", desc: "Artistik & atmosfer editorial", icon: "palette" },
  { id: "canva", label: "Canva Template", desc: "Layout grafis & poster modular", icon: "table" },
]

const ASPECT_RATIOS: { id: AspectRatio; label: string; desc: string }[] = [
  { id: "4:5", label: "4:5 Portrait", desc: "Feed Instagram optimal" },
  { id: "1:1", label: "1:1 Persegi", desc: "Universal Feed post" },
  { id: "9:16", label: "9:16 Vertikal", desc: "Reels / TikTok / Story" },
  { id: "16:9", label: "16:9 Lanskap", desc: "Banner / YouTube" },
]

export function VisualPromptDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  initialTopic = "",
  initialVisualBrief = "",
  initialFormat = "Single",
}: VisualPromptDialogProps) {
  const [topic, setTopic] = React.useState(initialTopic)
  const [visualBrief, setVisualBrief] = React.useState(initialVisualBrief)
  const [format, setFormat] = React.useState<"Single" | "Carousel" | "Reel" | "Thread" | "Story">(initialFormat)
  const [selectedTool, setSelectedTool] = React.useState<VisualTool | "auto">("auto")
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatio>("4:5")
  const [result, setResult] = React.useState<VisualPromptResult | null>(null)
  const [viewTab, setViewTab] = React.useState<"prompt" | "anatomy" | "guidelines">("prompt")

  // Sync state when props change
  React.useEffect(() => {
    if (open) {
      setTopic(initialTopic)
      setVisualBrief(initialVisualBrief)
      setFormat(initialFormat)
      setResult(null)
      if (initialFormat === "Reel" || initialFormat === "Story") {
        setAspectRatio("9:16")
      } else if (initialFormat === "Single") {
        setAspectRatio("4:5")
      } else {
        setAspectRatio("1:1")
      }
    }
  }, [open, initialTopic, initialVisualBrief, initialFormat])

  const { mutateAsync: generatePrompt, isPending } = useGenerateVisualPrompt()

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Masukkan topik atau judul konten visual.")
      return
    }

    try {
      const res = await generatePrompt({
        clientId,
        clientName,
        topic: topic.trim(),
        visualBrief: visualBrief.trim() || undefined,
        tool: selectedTool === "auto" ? undefined : selectedTool,
        aspectRatio,
        format,
      })

      if (!res.success || !res.data) {
        toast.error(res.error || "Gagal merumuskan prompt visual.")
        return
      }

      setResult(res.data)
      toast.success("Prompt visual siap pakai berhasil dirumuskan!", {
        description: `Dioptimalkan untuk mesin ${res.data.recommendedTool.toUpperCase()} (${res.data.aspectRatio}).`,
      })
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') console.error(err)
      toast.error("Terjadi kendala saat merumuskan prompt.")
    }
  }

  const handleCopyPrompt = () => {
    if (!result) return
    navigator.clipboard?.writeText(result.toolSpecificPrompt).catch(() => {})
    toast.success("Prompt berhasil disalin ke clipboard!", {
      description: `Format siap paste ke ${result.recommendedTool.toUpperCase()}.`,
    })
  }

  const handleCopyFullMarkdown = () => {
    if (!result) return
    navigator.clipboard?.writeText(result.copyableMarkdown).catch(() => {})
    toast.success("Brief visual lengkap disalin!", {
      description: "Format Markdown terstruktur lengkap dengan 8 elemen anatomi & negative constraints.",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 bg-card border-border/40 text-foreground">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icons.palette className="h-4 w-4" />
            </span>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Studio Visual Prompter & Generator Media
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Standar resmi upstream <code className="font-mono text-xs text-primary">image-prompt</code>. Gate etis foto asli vs AI, router mesin cerdas, dan anatomi prompt 8-elemen tanpa token spam.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 my-4">
          {/* Baris 1: Topik & Format */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Topik / Judul Konten *
              </label>
              <Input
                placeholder="cth: Kenapa Kopi Lereng Taraju Punya Notes Floral Melati?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-background border-border/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Format Konten
              </label>
              <select
                aria-label="Format Konten"
                value={format}
                onChange={(e) => {
                  const f = e.target.value as any
                  setFormat(f)
                  if (f === "Reel" || f === "Story") setAspectRatio("9:16")
                  else if (f === "Single") setAspectRatio("4:5")
                }}
                className="w-full h-10 px-3 rounded-md bg-background border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Single">Single Post</option>
                <option value="Carousel">Carousel Slides</option>
                <option value="Reel">Reels Video</option>
                <option value="Story">Story Video/Grafis</option>
                <option value="Thread">Thread</option>
              </select>
            </div>
          </div>

          {/* Baris 2: Catatan Visual Brief Awal */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Catatan Visual Brief (Opsional / dari Post Brief)
            </label>
            <Textarea
              rows={2}
              placeholder="cth: Video vertikal 9:16 shot makro ceri kopi merah di pohon, transisi ke uap V60..."
              value={visualBrief}
              onChange={(e) => setVisualBrief(e.target.value)}
              className="bg-background border-border/50 resize-none text-sm"
            />
          </div>

          {/* Baris 3: Pemilihan Mesin Target & Aspek Rasio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Mesin AI Visual</span>
                <span className="text-[11px] text-primary lowercase">Auto-route direkomendasikan</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTool("auto")}
                  className={cn(
                    "flex flex-col items-start p-2.5 rounded-lg border text-left transition-colors",
                    selectedTool === "auto"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border/40 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Icons.sparkles className="h-3.5 w-3.5 text-primary" /> Auto Router
                  </span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1">Pilih otomatis per format</span>
                </button>
                {TOOLS_CONFIG.map((t) => {
                  const IconComponent = Icons[t.icon] || Icons.media
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTool(t.id)}
                      className={cn(
                        "flex flex-col items-start p-2.5 rounded-lg border text-left transition-colors",
                        selectedTool === t.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border/40 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      <span className="text-xs font-semibold flex items-center gap-1.5">
                        <IconComponent className="h-3.5 w-3.5" /> {t.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">{t.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Aspek Rasio (Aspect Ratio)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setAspectRatio(ar.id)}
                    className={cn(
                      "flex flex-col items-start p-2.5 rounded-lg border text-left transition-colors",
                      aspectRatio === ar.id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border/40 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <span className="text-xs font-semibold">{ar.label}</span>
                    <span className="text-[10px] text-muted-foreground">{ar.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tombol Eksekusi Generator */}
          <div className="pt-2">
            <Button
              onClick={handleGenerate}
              disabled={isPending || !topic.trim()}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Icons.spinner className="h-4 w-4 animate-spin" />
                  <ShimmeringText text="Meracik Anatomi Visual 8-Elemen..." />
                </>
              ) : (
                <>
                  <Icons.sparkles className="h-4 w-4" />
                  Rancang Prompt Visual Sesuai Upstream Spec
                </>
              )}
            </Button>
          </div>

          {/* HASIL PROMPT */}
          {result && (
            <div className="space-y-4 pt-4 border-t border-border/40">
              {/* Banner Gate: Step 0 Gate */}
              <div
                className={cn(
                  "p-3.5 rounded-xl border flex items-start gap-3",
                  result.shouldGenerateAI
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                )}
              >
                <div className="mt-0.5">
                  {result.shouldGenerateAI ? (
                    <Icons.circleCheck className="h-5 w-5" />
                  ) : (
                    <Icons.alertTriangle className="h-5 w-5" />
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-bold uppercase tracking-wider">
                    {result.shouldGenerateAI ? "Gate Step 0: Lolos Validasi AI" : "Gate Step 0: Rekomendasi Foto Riil"}
                  </div>
                  <div className="leading-relaxed opacity-90">{result.gateReasoning}</div>
                </div>
              </div>

              {/* Sub-header Hasil dengan Badge Target */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs border-primary/40 bg-primary/5 text-primary">
                    Mesin: {result.recommendedTool.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-xs">
                    Rasio: {result.aspectRatio}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Fungsi: {result.job.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewTab("prompt")}
                    className={cn(
                      "px-3 py-1 text-xs font-semibold rounded-md transition-colors",
                      viewTab === "prompt"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Prompt Mesin
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewTab("anatomy")}
                    className={cn(
                      "px-3 py-1 text-xs font-semibold rounded-md transition-colors",
                      viewTab === "anatomy"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    8 Elemen Anatomi
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewTab("guidelines")}
                    className={cn(
                      "px-3 py-1 text-xs font-semibold rounded-md transition-colors",
                      viewTab === "guidelines"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Panduan & Aksesibilitas
                  </button>
                </div>
              </div>

              {/* Konten Tab 1: Prompt Mesin */}
              {viewTab === "prompt" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Prompt Siap Tempel ({result.recommendedTool.toUpperCase()})
                      </label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyPrompt}
                        className="h-7 text-xs flex items-center gap-1.5 text-primary hover:text-primary"
                      >
                        <Icons.copy className="h-3.5 w-3.5" /> Salin Prompt
                      </Button>
                    </div>
                    <div className="p-3.5 rounded-lg bg-muted/40 border border-border/50 font-mono text-xs leading-relaxed break-words text-foreground selection:bg-primary/20">
                      {result.toolSpecificPrompt}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Negative Prompt (Anti-Artifacts)
                    </label>
                    <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 font-mono text-xs leading-relaxed text-muted-foreground">
                      {result.negativePrompt}
                    </div>
                  </div>
                </div>
              )}

              {/* Konten Tab 2: 8 Elemen Anatomi Universal */}
              {viewTab === "anatomy" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                    <div className="font-bold text-primary">1. Subject</div>
                    <div className="text-muted-foreground">{result.universalAnatomy.subject}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                    <div className="font-bold text-primary">2. Composition</div>
                    <div className="text-muted-foreground">{result.universalAnatomy.composition}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                    <div className="font-bold text-primary">3. Lighting</div>
                    <div className="text-muted-foreground">{result.universalAnatomy.lighting}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                    <div className="font-bold text-primary">4. Color Palette</div>
                    <div className="text-muted-foreground">{result.universalAnatomy.colorPalette}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                    <div className="font-bold text-primary">5. Style</div>
                    <div className="text-muted-foreground">{result.universalAnatomy.style}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                    <div className="font-bold text-primary">6. Mood</div>
                    <div className="text-muted-foreground">{result.universalAnatomy.mood}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                    <div className="font-bold text-primary">7. Detail</div>
                    <div className="text-muted-foreground">{result.universalAnatomy.detail}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                    <div className="font-bold text-primary">8. Negative Constraints</div>
                    <div className="text-muted-foreground">{result.universalAnatomy.negativeConstraints}</div>
                  </div>
                </div>
              )}

              {/* Konten Tab 3: Panduan & Aksesibilitas */}
              {viewTab === "guidelines" && (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-lg bg-muted/30 border border-border/40 space-y-1.5">
                    <div className="font-bold text-foreground flex items-center gap-2">
                      <Icons.shieldCheck className="h-4 w-4 text-primary" /> Pengungkapan AI & Kepatuhan Regulasi
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Wajib menyertakan tag pengungkapan pada konten terpublikasi (Meta &ldquo;Made with AI&rdquo; / EU AI Act).
                    </p>
                    <code className="block p-2 rounded bg-background font-mono text-[11px] text-primary">
                      {result.aiDisclosureTag}
                    </code>
                  </div>

                  <div className="p-3.5 rounded-lg bg-muted/30 border border-border/40 space-y-1.5">
                    <div className="font-bold text-foreground flex items-center gap-2">
                      <Icons.text className="h-4 w-4 text-primary" /> Keterbacaan Teks & Aksesibilitas Layar Ponsel
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {result.overlayTextGuidance}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-xs"
          >
            Tutup
          </Button>

          {result && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyFullMarkdown}
                className="w-full sm:w-auto text-xs flex items-center gap-1.5"
              >
                <Icons.document className="h-3.5 w-3.5" /> Salin Markdown Lengkap
              </Button>
              <Button
                type="button"
                onClick={handleCopyPrompt}
                className="w-full sm:w-auto text-xs bg-primary text-primary-foreground flex items-center gap-1.5"
              >
                <Icons.copy className="h-3.5 w-3.5" /> Salin Prompt
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
