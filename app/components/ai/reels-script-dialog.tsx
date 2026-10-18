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
import { Textarea } from "@/components/ui/textarea"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"
import { Icons } from "@/components/icons"
import { useGenerateReelsScript } from "@/features/reels-script/api/queries"
import type { ReelGoal, ReelLengthTier, ReelAudioType, ReelsScriptResult } from "@/features/reels-script/api/types"
import { serializeComposerParams, serializeCalendarParams } from "@/lib/searchparams"
import { cn } from "@/lib/utils"

interface ReelsScriptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
  initialTopic?: string
}

export function ReelsScriptDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  initialTopic,
}: ReelsScriptDialogProps) {
  const router = useRouter()
  const [topic, setTopic] = React.useState("")
  const [goal, setGoal] = React.useState<ReelGoal>("reach")
  const [lengthTier, setLengthTier] = React.useState<ReelLengthTier>("15-30s")
  const [audioType, setAudioType] = React.useState<ReelAudioType>("original_voice")
  const [result, setResult] = React.useState<ReelsScriptResult | null>(null)

  React.useEffect(() => {
    if (open && initialTopic) {
      setTopic(initialTopic)
    }
  }, [open, initialTopic])

  const { mutateAsync: generateScript, isPending: isGenerating } = useGenerateReelsScript()

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Masukkan ide atau tema Reel yang ingin dibuat.")
      return
    }

    try {
      const res = await generateScript({
        clientId,
        clientName,
        topic: topic.trim(),
        goal,
        lengthTier,
        audioType,
      })

      if (!res.success || !res.data) {
        toast.error(res.error || "Gagal merancang naskah Reel.")
        return
      }

      setResult(res.data)
      toast.success("Naskah produksi Reel 3-kolom berhasil dirancang!")
    } catch (err: unknown) {
      console.error(err)
      toast.error("Terjadi kendala saat menghubungkan ke AI Scripting Engine.")
    }
  }

  const formatProductionMarkdown = (data: ReelsScriptResult): string => {
    let md = `# ${data.title}\n\n`
    md += `> **Konsep 1 Ide**: ${data.conceptOneIdea}\n`
    md += `> **Target Metrik**: ${data.goal.toUpperCase()} | **Durasi**: ${data.lengthTier} | **Audio**: ${data.audioType}\n\n`
    md += `### The Sends Question\n${data.sendsQuestion}\n\n`
    md += `### Cover Frame Brief (Grid Safe)\n- **Visual**: ${data.coverFrameBrief.gridSafeVisual}\n- **Teks Tengah**: "${data.coverFrameBrief.centerBoldText}"\n\n`
    md += `### Tabel Produksi 3-Kolom (Sound-Off First)\n\n`
    md += `| Timecode / Beat | Visual / B-Roll / Veo Prompt | On-Screen Text (Muted) | Spoken Audio / Voice |\n`
    md += `| --- | --- | --- | --- |\n`
    data.beats.forEach((b) => {
      md += `| **${b.timecode}**<br>${b.beatName} | ${b.visualShot}${b.veoPrompt ? `<br>*Veo Prompt: ${b.veoPrompt}*` : ''} | "${b.onScreenText}" | "${b.spokenAudio}" |\n`
    })
    md += `\n### Catatan Audio & Instagram SEO\n`
    md += `- **Keyword Utama**: ${data.instagramSeo.primaryKeyword}\n`
    md += `- **Caption Opener**: ${data.instagramSeo.captionOpener}\n`
    md += `- **Arahan Audio**: ${data.audioNotes}\n`
    return md
  }

  const handleCopy = () => {
    if (!result) return
    const text = formatProductionMarkdown(result)
    navigator.clipboard?.writeText(text).catch(() => {})
    toast.success("Naskah produksi disalin ke clipboard!", {
      description: "Format tabel Markdown rapi siap dibagikan ke tim video & desainer.",
    })
  }

  const handleSendToComposer = () => {
    if (!result) return
    onOpenChange(false)
    const caption = `${result.instagramSeo.captionOpener}\n\n1. Simak detail visual di video.\n2. Praktikkan langkahnya secara konsisten.\n\n#${result.instagramSeo.primaryKeyword.replace(/\s+/g, '')} #tips #reels`
    router.push(
      serializeComposerParams("/admin/composer", {
        clientId,
        title: result.title,
        content: caption,
        platform: "instagram",
      })
    )
  }

  const handleSendToCalendar = () => {
    if (!result) return
    onOpenChange(false)
    router.push(
      serializeCalendarParams("/admin/calendar", {
        clientId,
        caption: `${result.title}\n\n${result.conceptOneIdea}`,
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
                <Icons.clapperboard className="size-5" />
              </div>
              <div>
                <DialogTitle className="font-sans font-bold text-foreground text-base flex items-center gap-2">
                  Reels & Short-Form Video Scripting Studio
                  <Badge variant="secondary" className="text-2xs bg-primary/10 text-primary border-primary/20">
                    Upstream reels-script
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Rancang naskah video 3-kolom sound-off first, hook 3 detik, dan send-worthy beats untuk {clientName}.
                </DialogDescription>
              </div>
            </div>

            {result && (
              <Badge variant="outline" className="text-2xs font-mono bg-muted/60 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                Shootable Doc Ready
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Controls Bar */}
          <div className="bg-muted/30 p-4 rounded-2xl border border-border/30 space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Topik atau Ide Pokok Video Reel:
              </label>
              <div className="flex gap-2">
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isGenerating && handleGenerate()}
                  placeholder="Contoh: 3 kesalahan menyeduh teh yang bikin rasanya kelat..."
                  className="w-full rounded-xl border border-border/40 bg-background px-3.5 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                />
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  isLoading={isGenerating}
                  className="rounded-xl bg-primary text-primary-foreground font-semibold text-xs gap-1.5 shrink-0 px-4"
                >
                  <Icons.sparkles className="size-3.5" />
                  Rancang Naskah
                </Button>
              </div>
            </div>

            {/* Micro Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-border/20 text-xs">
              <div>
                <span className="text-2xs font-medium text-muted-foreground block mb-1">Goal / Metrik Target:</span>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as ReelGoal)}
                  aria-label="Goal / Metrik Target"
                  className="w-full bg-background border border-border/40 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none"
                >
                  <option value="reach">Reach (Eksplorasi Baru)</option>
                  <option value="sends">Sends (Forward via DM)</option>
                  <option value="saves">Saves (Simpan Referensi)</option>
                  <option value="comments">Comments (Diskusi)</option>
                </select>
              </div>

              <div>
                <span className="text-2xs font-medium text-muted-foreground block mb-1">Durasi / Length Tier:</span>
                <select
                  value={lengthTier}
                  onChange={(e) => setLengthTier(e.target.value as ReelLengthTier)}
                  aria-label="Durasi / Length Tier"
                  className="w-full bg-background border border-border/40 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none"
                >
                  <option value="15-30s">15–30 Detik (Reach Sweet Spot)</option>
                  <option value="30-60s">30–60 Detik (Deep Dive)</option>
                  <option value="60-90s">60–90 Detik (Lengkap / Tutorial)</option>
                </select>
              </div>

              <div>
                <span className="text-2xs font-medium text-muted-foreground block mb-1">Pilihan Audio:</span>
                <select
                  value={audioType}
                  onChange={(e) => setAudioType(e.target.value as ReelAudioType)}
                  aria-label="Pilihan Audio"
                  className="w-full bg-background border border-border/40 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none"
                >
                  <option value="original_voice">Original Voice (Suara Asli)</option>
                  <option value="trending_audio_in_app">Trending Audio (Manual In-App)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Generated Result Display */}
          {isGenerating && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Icons.refresh className="size-6 text-primary animate-spin" />
              <ShimmeringText
                text={`Merancang naskah 3-kolom & cover frame untuk ${clientName}…`}
                className="text-xs font-semibold"
              />
            </div>
          )}

          {result && !isGenerating && (
            <div className="space-y-6">
              {/* Strategic Context Bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-1">
                  <div className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 text-2xs uppercase tracking-wider">
                    <Icons.share className="size-3.5" /> The Sends Question
                  </div>
                  <p className="text-2xs text-foreground/90 leading-relaxed">{result.sendsQuestion}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-2xs uppercase tracking-wider">
                    <Icons.media className="size-3.5" /> Cover Frame Brief (Grid-Safe Center)
                  </div>
                  <p className="text-2xs text-foreground/90 leading-relaxed">
                    <span className="font-semibold">Teks:</span> &ldquo;{result.coverFrameBrief.centerBoldText}&rdquo; &bull; {result.coverFrameBrief.gridSafeVisual}
                  </p>
                </div>
              </div>

              {/* 3-Column Production Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Icons.table className="size-3.5 text-primary" />
                    Tabel Naskah Produksi (3-Kolom Sound-Off First)
                  </h4>
                  <span className="text-2xs text-muted-foreground">
                    Total {result.beats.length} Beat Produksi
                  </span>
                </div>

                <div className="border border-border/40 rounded-2xl overflow-hidden bg-card shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border/30 text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-28">Beat / Timing</th>
                          <th className="py-2.5 px-3">Visual / B-Roll / Veo Prompt</th>
                          <th className="py-2.5 px-3 bg-primary/5 text-primary">On-Screen Text (Muted-First)</th>
                          <th className="py-2.5 px-3">Spoken Audio / Voice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {result.beats.map((beat, idx) => (
                          <tr key={idx} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-3 align-top font-mono text-2xs">
                              <span className="font-bold text-foreground block">{beat.timecode}</span>
                              <span className="text-muted-foreground text-3xs">{beat.beatName}</span>
                            </td>
                            <td className="py-3 px-3 align-top text-2xs text-foreground leading-relaxed">
                              <div>{beat.visualShot}</div>
                              {beat.veoPrompt && (
                                <div className="mt-1 p-1.5 rounded-lg bg-muted/40 font-mono text-3xs text-muted-foreground border border-border/20">
                                  <span className="font-semibold text-primary">Veo Prompt:</span> {beat.veoPrompt}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 align-top text-2xs font-semibold text-foreground bg-primary/5 leading-relaxed">
                              &ldquo;{beat.onScreenText}&rdquo;
                            </td>
                            <td className="py-3 px-3 align-top text-2xs text-muted-foreground leading-relaxed">
                              <div className="text-foreground/90">&ldquo;{beat.spokenAudio}&rdquo;</div>
                              {beat.audioCue && (
                                <span className="text-3xs italic text-muted-foreground block mt-0.5">
                                  SFX: {beat.audioCue}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Instagram SEO & Audio Notice Bar */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/30 space-y-2 text-2xs">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Icons.search className="size-3.5 text-primary" />
                  Instagram Search & SEO Keywords:
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-2xs bg-background font-mono">
                    {result.instagramSeo.primaryKeyword}
                  </Badge>
                  {result.instagramSeo.secondaryKeywords.map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-2xs font-mono">
                      {kw}
                    </Badge>
                  ))}
                </div>
                <p className="text-muted-foreground pt-1 border-t border-border/20">
                  <span className="font-semibold text-foreground">Catatan Audio:</span> {result.audioNotes}
                </p>
              </div>
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
                Salin Naskah
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
