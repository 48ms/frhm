"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
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
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"
import { Icons } from "@/components/icons"
import { useGenerateCarousel } from "@/features/carousel/api/queries"
import type { CarouselPlatform, CarouselResult, CarouselStructure } from "@/features/carousel/api/types"
import { serializeComposerParams, serializeCalendarParams } from "@/lib/searchparams"
import { cn } from "@/lib/utils"

interface CarouselDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
}

export function CarouselDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
}: CarouselDialogProps) {
  const router = useRouter()
  const [topic, setTopic] = React.useState("")
  const [painPoint, setPainPoint] = React.useState("")
  const [structure, setStructure] = React.useState<CarouselStructure>("how_to")
  const [platform, setPlatform] = React.useState<CarouselPlatform>("instagram")
  const [result, setResult] = React.useState<CarouselResult | null>(null)
  const [activeSlideIndex, setActiveSlideIndex] = React.useState(0)

  const { mutateAsync: generateCarouselMutate, isPending: isGenerating } = useGenerateCarousel()

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Masukkan topik atau konsep panduan carousel.")
      return
    }

    try {
      const res = await generateCarouselMutate({
        clientId,
        clientName,
        topic: topic.trim(),
        painPointOrTakeaway: painPoint.trim() || undefined,
        structure,
        platform,
      })

      if (!res.success || !res.data) {
        toast.error(res.error || "Gagal menyusun storyboard carousel.")
        return
      }

      setResult(res.data)
      setActiveSlideIndex(0)
      toast.success("Storyboard Carousel Slide-by-Slide berhasil disusun!")
    } catch (err: unknown) {
      console.error(err)
      toast.error("Terjadi kendala saat menghubungkan ke AI Carousel Engine.")
    }
  }

  const formatMarkdown = (data: CarouselResult): string => {
    let md = `# ${data.title}\n\n`
    md += `> **Struktur**: ${data.structure.toUpperCase()} | **Platform**: ${data.platform.toUpperCase()} | **Jumlah Slide**: ${data.slideCount}\n\n`
    md += `### Intisari 1 Ide (Spine)\n${data.oneIdeaSpine}\n\n`
    md += `### Single-Action CTA (Save-Leaning)\n${data.singleActionCta}\n\n`
    md += `### Storyboard Slide-by-Slide\n\n`
    data.slides.forEach((s) => {
      md += `#### Slide ${s.slideNumber}: [${s.slideRole.toUpperCase()}] ${s.headline}\n`
      if (s.subhead) md += `- **Sub-Headline**: ${s.subhead}\n`
      if (s.takeawayBullet) md += `- **Takeaway**: ${s.takeawayBullet}\n`
      md += `- **Visual / Layout Direction**: ${s.visualLayoutDirection}\n`
      if (s.ideogramPrompt) md += `- **Ideogram Prompt**: \`${s.ideogramPrompt}\`\n`
      md += `\n---\n\n`
    })
    md += `### Saran Caption Pendamping:\n${data.suggestedCaption}\n`
    return md
  }

  const handleCopy = () => {
    if (!result) return
    const text = formatMarkdown(result)
    navigator.clipboard?.writeText(text).catch(() => {})
    toast.success("Naskah storyboard disalin ke clipboard!", {
      description: "Format Markdown rapi siap dibagikan ke Canva atau desainer grafis.",
    })
  }

  const handleSendToComposer = () => {
    if (!result) return
    onOpenChange(false)
    router.push(
      serializeComposerParams("/admin/composer", {
        clientId,
        title: result.title,
        content: result.suggestedCaption,
        platform,
      })
    )
  }

  const handleSendToCalendar = () => {
    if (!result) return
    onOpenChange(false)
    router.push(
      serializeCalendarParams("/admin/calendar", {
        clientId,
        caption: `${result.title}\n\n${result.oneIdeaSpine}`,
        new: "1",
      })
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-card/95 backdrop-blur-2xl rounded-3xl border border-border/40 p-0 shadow-2xl gap-0">
        <DialogHeader className="p-6 border-b border-border/30 pb-4 text-left shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <Icons.layers className="size-5" />
              </div>
              <div>
                <DialogTitle className="font-sans font-bold text-foreground text-base flex items-center gap-2">
                  Carousel Slide-by-Slide Generator
                  <Badge variant="secondary" className="text-2xs bg-primary/10 text-primary border-primary/20">
                    Upstream carousel-writer
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Rancang postingan carousel multi-slide (Instagram & LinkedIn PDF) dengan disiplin 1 ide per slide untuk {clientName}.
                </DialogDescription>
              </div>
            </div>

            {result && (
              <Badge variant="outline" className="text-2xs font-mono bg-muted/60 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                {result.slideCount} Slides Ready
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Controls Bar */}
          <div className="bg-muted/30 p-4 rounded-2xl border border-border/30 space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Topik / Masalah Pokok yang Ingin Dibahas:
              </label>
              <div className="flex gap-2">
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isGenerating && handleGenerate()}
                  placeholder="Contoh: 4 langkah memilih biji kopi segar yang ramah lambung..."
                  className="w-full rounded-xl border border-border/40 bg-background px-3.5 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                />
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  isLoading={isGenerating}
                  className="rounded-xl bg-primary text-primary-foreground font-semibold text-xs gap-1.5 shrink-0 px-4"
                >
                  <Icons.sparkles className="size-3.5" />
                  Rancang Carousel
                </Button>
              </div>
            </div>

            {/* Micro Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-border/20 text-xs">
              <div>
                <span className="text-2xs font-medium text-muted-foreground block mb-1">Struktur Carousel:</span>
                <select
                  value={structure}
                  onChange={(e) => setStructure(e.target.value as CarouselStructure)}
                  aria-label="Struktur Carousel"
                  className="w-full bg-background border border-border/40 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none"
                >
                  <option value="how_to">How-To (Panduan Langkah Demi Langkah)</option>
                  <option value="listicle">Listicle (Daftar Pilihan Terbaik)</option>
                  <option value="myth_bust">Myth-Bust (Patahkan Mitos Populer)</option>
                  <option value="before_after">Before & After (Transformasi Nyata)</option>
                  <option value="framework">Framework (Kerangka Kerja Strategis)</option>
                </select>
              </div>

              <div>
                <span className="text-2xs font-medium text-muted-foreground block mb-1">Format Platform:</span>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as CarouselPlatform)}
                  aria-label="Format Platform"
                  className="w-full bg-background border border-border/40 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none"
                >
                  <option value="instagram">Instagram Carousel (1080x1350 4:5)</option>
                  <option value="linkedin">LinkedIn PDF Document (Dwell Time)</option>
                  <option value="tiktok">TikTok Photo Carousel</option>
                </select>
              </div>

              <div>
                <span className="text-2xs font-medium text-muted-foreground block mb-1">Titik Sakit / Solusi Kontras (Opsional):</span>
                <input
                  value={painPoint}
                  onChange={(e) => setPainPoint(e.target.value)}
                  placeholder="Contoh: sering pusing memilih biji kopi"
                  className="w-full bg-background border border-border/40 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Generated Result Display */}
          {isGenerating && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Icons.refresh className="size-6 text-primary animate-spin" />
              <ShimmeringText
                text={`Menyusun arsitektur slide & Ideogram prompts untuk ${clientName}…`}
                className="text-xs font-semibold"
              />
            </div>
          )}

          {result && !isGenerating && (
            <div className="space-y-6">
              {/* Single Action CTA Callout */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-2xs uppercase tracking-wider">
                    <Icons.checkCircle className="size-3.5" /> Single-Action CTA (Save-Leaning)
                  </div>
                  <p className="text-2xs text-foreground/90 mt-0.5">{result.singleActionCta}</p>
                </div>
                <Badge variant="outline" className="text-2xs bg-background text-emerald-600 border-emerald-500/30 shrink-0">
                  Save Priority
                </Badge>
              </div>

              {/* Slide Navigator Thumbnails */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">
                    Pratinjau Slide #{result.slides[activeSlideIndex]?.slideNumber} dari {result.slideCount}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      disabled={activeSlideIndex === 0}
                      onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                      className="h-6 px-2 text-2xs cursor-pointer"
                    >
                      <Icons.arrowLeft className="size-3 mr-1" /> Geser Kiri
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      disabled={activeSlideIndex === result.slides.length - 1}
                      onClick={() => setActiveSlideIndex((prev) => Math.min(result.slides.length - 1, prev + 1))}
                      className="h-6 px-2 text-2xs cursor-pointer"
                    >
                      Geser Kanan <Icons.arrowRight className="size-3 ml-1" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {result.slides.map((s, idx) => (
                    <button
                      key={s.slideNumber}
                      type="button"
                      onClick={() => setActiveSlideIndex(idx)}
                      className={cn(
                        "shrink-0 w-28 p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24",
                        activeSlideIndex === idx
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/40 bg-card hover:bg-muted/40 text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between text-3xs font-mono">
                        <span className="font-bold text-foreground">S#{s.slideNumber}</span>
                        <span className="capitalize">{s.slideRole}</span>
                      </div>
                      <p className="text-3xs line-clamp-2 font-medium text-foreground leading-snug">
                        {s.headline}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Slide Detailed Canvas Card */}
              {result.slides[activeSlideIndex] && (
                <div className="p-5 rounded-2xl bg-card border border-border/40 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-2xs">
                        Slide {result.slides[activeSlideIndex].slideNumber}
                      </Badge>
                      <Badge variant="outline" className="text-2xs capitalize">
                        {result.slides[activeSlideIndex].slideRole}
                      </Badge>
                    </div>
                    <span className="text-2xs text-muted-foreground">
                      Disiplin: Maksimal 1 Ide Utama
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground">
                      {result.slides[activeSlideIndex].headline}
                    </h3>
                    {result.slides[activeSlideIndex].subhead && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {result.slides[activeSlideIndex].subhead}
                      </p>
                    )}
                    {result.slides[activeSlideIndex].takeawayBullet && (
                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/20 text-xs text-foreground font-semibold flex items-center gap-2">
                        <Icons.sparkles className="size-3.5 text-primary shrink-0" />
                        <span>{result.slides[activeSlideIndex].takeawayBullet}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border/20 space-y-2 text-2xs">
                    <div>
                      <span className="font-semibold text-foreground">Arahan Layout Visual: </span>
                      <span className="text-muted-foreground">{result.slides[activeSlideIndex].visualLayoutDirection}</span>
                    </div>

                    {result.slides[activeSlideIndex].ideogramPrompt && (
                      <div className="p-2.5 rounded-xl bg-muted/30 border border-border/20 space-y-1 font-mono text-3xs">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="font-semibold text-primary">Ideogram / Nano Banana AI Image Prompt:</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(result.slides[activeSlideIndex].ideogramPrompt || "").catch(() => {})
                              toast.success("Prompt disalin.")
                            }}
                            className="text-primary hover:underline cursor-pointer"
                          >
                            Salin Prompt
                          </button>
                        </div>
                        <p className="text-foreground">{result.slides[activeSlideIndex].ideogramPrompt}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
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

          {result && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleCopy}
              >
                <Icons.copy className="size-3.5 mr-1" />
                Salin Storyboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleSendToCalendar}
              >
                <Icons.calendar className="size-3.5 mr-1" />
                Kalender
              </Button>
              <Button
                size="sm"
                className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSendToComposer}
              >
                <Icons.send className="size-3.5 mr-1" />
                Buka di Composer
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
