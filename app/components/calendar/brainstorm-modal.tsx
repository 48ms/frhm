import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/animate-ui/components/radix/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useGenerateContentIdeas, useEvaluateTrend } from "@/features/copilot/api/queries"
import type { GeneratedIdea, TrendEvaluation } from "@/features/copilot/api/types"
import { useCreateScheduledPost } from "@/features/scheduled-posts/api/queries"
import { addDays } from "date-fns"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"

const IDEA_STRATEGY_PRESETS = [
  { label: "🔥 Bongkar Mitos", topic: "Bongkar mitos keliru seputar industri yang sering dipercaya audiens" },
  { label: "💡 Tips 3-Langkah", topic: "3 langkah praktis dan terbukti untuk menyelesaikan masalah utama audiens" },
  { label: "🎬 BTS & Standar", topic: "Di balik layar proses pembuatan produk dan standar kualitas kami" },
  { label: "💬 Social Proof", topic: "Kisah transformasi nyata dan bukti kepuasan pelanggan kami" },
]

const TREND_VIRAL_FORMATS = [
  { title: "POV: Coba Solusi", desc: "POV: Pertama kali coba solusi kami setelah frustrasi bertahun-tahun dengan metode konvensional." },
  { title: "Day in Life BTS", desc: "A Day in the Life: Aktivitas otentik di balik layar tim kami dalam memastikan standar kualitas terbaik." },
  { title: "Before vs After", desc: "Transformasi sebelum vs sesudah: Perubahan nyata yang dirasakan dalam 30 hari pemakaian konsisten." },
  { title: "Mitos vs Fakta", desc: "Mitos vs Fakta: Meluruskan miskonsepsi umum yang sering merugikan konsumen di industri ini." },
]

const TONE_OF_VOICE_PRESETS = [
  { id: "authority", label: "👑 Otoritatif", prompt: "Gaya otoritatif, mendalam, dan berbasis fakta/data industri" },
  { id: "story", label: "🤝 Storytelling", prompt: "Gaya cerita emosional, relatable, dan humanis" },
  { id: "hook", label: "⚡ Punchy Hook", prompt: "Gaya to-the-point, scroll-stopping, dan provokatif sehat" },
  { id: "direct", label: "🎯 Direct Sales", prompt: "Gaya penawaran bernilai tinggi dengan CTA lugas" },
]

interface BrainstormModalProps {
  clientId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

type TabMode = "ideation" | "trend"

export function BrainstormModal({ 
  clientId,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  hideTrigger
}: BrainstormModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange !== undefined ? externalOnOpenChange : setInternalOpen

  const [activeTab, setActiveTab] = useState<TabMode>("ideation")

  // State untuk Ideation
  const [trendOrTopic, setTrendOrTopic] = useState("")
  const [selectedTone, setSelectedTone] = useState<string | null>(null)
  const [count, setCount] = useState(5)
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([])

  // State untuk Trend Evaluator (3-Gate)
  const [trendDesc, setTrendDesc] = useState("")
  const [platform, setPlatform] = useState("Instagram")
  const [trendResult, setTrendResult] = useState<TrendEvaluation | null>(null)

  const { mutateAsync: generateIdeas, isPending: isGenerating } = useGenerateContentIdeas()
  const { mutateAsync: evaluateTrend, isPending: isAuditing } = useEvaluateTrend()
  const { mutateAsync: createPost, isPending: isSaving } = useCreateScheduledPost()

  const handleGenerate = async () => {
    try {
      const chosenTone = TONE_OF_VOICE_PRESETS.find((t) => t.id === selectedTone)
      const promptWithTone = chosenTone
        ? `${trendOrTopic ? trendOrTopic + " " : ""}[Tone: ${chosenTone.prompt}]`
        : trendOrTopic

      const result = await generateIdeas({ clientId, count, trendOrTopic: promptWithTone })
      if (result.error) {
        toast.error(result.error)
        return
      }
      setIdeas(result.ideas || [])
      toast.success("Ide Konten Siap!", {
        description: `${result.ideas?.length || count} ide berhasil diracik menggunakan framework SPARK.`
      })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal generate ide")
    }
  }

  const handleAuditTrend = async () => {
    if (!trendDesc.trim()) {
      toast.error("Harap isi deskripsi atau topik tren terlebih dahulu")
      return
    }

    try {
      const res = await evaluateTrend({
        clientId,
        trendDescription: trendDesc.trim(),
        trendSourceOrContext: `Platform target: ${platform}`,
      })
      if (res.error) {
        toast.error(res.error)
        return
      }
      if (res.evaluation) {
        setTrendResult(res.evaluation)
        toast.success("Audit Tren Selesai", {
          description: res.evaluation.overallApproved ? "Tren direkomendasikan (GO)" : "Tren tidak direkomendasikan (NO-GO)",
        })
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengaudit tren")
    }
  }

  const handleAddToCalendar = async (idea: GeneratedIdea, index: number) => {
    try {
      const scheduledAt = addDays(new Date(), index + 1).toISOString()
      const contentStr = `[HOOK]\n${idea.hook}\n\n[CONTENT]\n${idea.content}`

      await createPost({
        client_id: clientId,
        title: idea.title,
        content: contentStr,
        platform: idea.platform.toLowerCase(),
        scheduled_at: scheduledAt,
        status: "draft",
        campaign_tag: idea.pillar,
        notes: `Format: ${idea.format}`
      })

      toast.success("Ide berhasil ditambahkan ke kalender!")
      setIdeas(prev => prev.filter((_, i) => i !== index))
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan ide")
    }
  }

  const handleAddTrendToCalendar = async () => {
    if (!trendResult) return

    try {
      const scheduledAt = addDays(new Date(), 1).toISOString()
      const contentStr = `[SUDUT ADAPTASI / REMIX]\n${trendResult.remixAngle || trendDesc}\n\n[DRAFT PREMISE]\n${trendResult.draftPremise || "-"}\n\n[3-GATE EVALUATION]\nBrand Fit: ${trendResult.gateFit.pass ? "PASS" : "FAIL"} (${trendResult.gateFit.reason})\nSafety: ${trendResult.gateSafety.pass ? "PASS" : "FAIL"} (${trendResult.gateSafety.reason})\nTiming: ${trendResult.gateTiming.status} (${trendResult.gateTiming.verdict})`

      await createPost({
        client_id: clientId,
        title: `Trend: ${trendDesc.slice(0, 40)}`,
        content: contentStr,
        platform: platform.toLowerCase(),
        scheduled_at: scheduledAt,
        status: "draft",
        campaign_tag: "Trend-Jacking",
        notes: `Recommended Format: ${trendResult.recommendedFormat || "Post"}`
      })

      toast.success("Tren berhasil ditambahkan sebagai draft jadwal!")
      setTrendResult(null)
      setTrendDesc("")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan tren ke kalender")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="inline-flex items-center justify-center gap-2 h-11 px-4 py-2 cursor-pointer shadow-sm"
          >
            <Icons.sparkles className="h-4 w-4 text-primary" />
            <span>AI Brainstorm</span>
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto bg-card/95 backdrop-blur-2xl rounded-3xl border border-border/40 p-6 shadow-2xl space-y-6">
        <DialogHeader className="flex flex-row items-center gap-2 border-b border-border/40 pb-3 space-y-0 text-left">
          <div className="w-8 h-8 rounded-full bg-brand-accent text-brand-accent-foreground flex items-center justify-center shrink-0">
            <Icons.sparkles className="size-[18px]" />
          </div>
          <div>
            <DialogTitle className="font-sans font-bold text-foreground text-sm">
              AI Content Studio
            </DialogTitle>
            <DialogDescription className="text-2xs text-muted-foreground">
              Rancang ide orisinal selaras Brand Profile atau audit kelayakan tren viral sebelum diadaptasi.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Tab Navigation Segmented via Animate UI Tabs */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabMode)} className="mt-1">
          <TabsList
            highlightClassName="bg-card text-foreground shadow-xs rounded-lg"
            className="w-full grid grid-cols-2 h-auto p-1 bg-muted/60 rounded-xl border border-border/40"
          >
            <TabsTrigger
              value="ideation"
              onClick={() => setActiveTab("ideation")}
              className="text-xs font-semibold py-2 min-h-11 flex items-center justify-center gap-2"
            >
              <Icons.sparkles className="size-3.5 text-brand-accent" />
              <span>SPARK Ideation</span>
            </TabsTrigger>
            <TabsTrigger
              value="trend"
              onClick={() => setActiveTab("trend")}
              className="text-xs font-semibold py-2 min-h-11 flex items-center justify-center gap-2"
            >
              <Icons.flame className="size-3.5 text-warning" />
              <span>Audit Tren (3-Gate)</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* TAB 1: SPARK IDEATION */}
        {activeTab === "ideation" && (
          <div>
            {!ideas.length ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="trend-topic">Tren atau Topik Khusus (Opsional)</Label>
                  <Input 
                    id="trend-topic"
                    placeholder="Contoh: Kampanye Akhir Tahun, atau Tren AI..."
                    value={trendOrTopic}
                    onChange={(e) => setTrendOrTopic(e.target.value)}
                  />
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-2xs font-semibold text-muted-foreground mr-0.5">Preset:</span>
                    {IDEA_STRATEGY_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTrendOrTopic(preset.topic)}
                        className="text-2xs px-2 py-0.5 rounded-full bg-muted hover:bg-brand-accent/10 hover:text-brand-accent border border-border/40 transition-colors font-medium cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Tone of Voice Selector */}
                  <div className="space-y-1.5 pt-2">
                    <Label className="text-2xs uppercase tracking-wider text-muted-foreground font-semibold">
                      Tone of Voice / Gaya Penyampaian
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {TONE_OF_VOICE_PRESETS.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTone(selectedTone === t.id ? null : t.id)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer flex flex-col items-center gap-0.5",
                            selectedTone === t.id
                              ? "bg-primary/10 border-primary text-primary shadow-xs ring-1 ring-primary/20"
                              : "bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="idea-count">Jumlah Ide</Label>
                    <span className="text-xs font-bold text-primary">
                      <MetricTicker value={`${count} Ide`} />
                    </span>
                  </div>
                  <Slider 
                    id="idea-count"
                    min={1} 
                    max={10} 
                    step={1}
                    value={[count]} 
                    onValueChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val
                      if (typeof v === "number") setCount(v)
                    }}
                    className="w-full py-2"
                  />
                </div>

                <Button 
                  className="w-full gap-2" 
                  onClick={handleGenerate} 
                  isLoading={isGenerating}
                  disabled={isGenerating}
                >
                  <Icons.sparkles className="h-4 w-4" />
                  {isGenerating ? (
                    <ShimmeringText text="Menganalisis Brand Profile…" className="text-xs font-semibold" />
                  ) : (
                    "Generate Ideas"
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-1">
                    <MetricTicker value={ideas.length} /> Ide Ditemukan
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setIdeas([])} className="h-8 min-h-11">Reset</Button>
                </div>
                
                <div className="space-y-3">
                  {ideas.map((idea, i) => (
                    <div key={i} className="rounded-xl border border-border/40 p-4 space-y-3 bg-muted/20">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold text-sm">{idea.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{idea.content}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              void navigator.clipboard.writeText(`${idea.title}\n\nHook: ${idea.hook}\n\nKonsep: ${idea.content}`)
                              toast.success("Ide disalin ke clipboard!")
                            }}
                            className="h-8 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Salin Ide"
                          >
                            <Icons.copy className="size-3.5" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => handleAddToCalendar(idea, i)}
                            isLoading={isSaving}
                            disabled={isSaving}
                          >
                            <Icons.add className="h-4 w-4 mr-1" />
                            Add to Calendar
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-muted p-2 rounded-lg text-xs italic">
                        <span className="font-semibold mr-2 not-italic">Hook:</span>
                        "{idea.hook}"
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="outline">{idea.pillar}</Badge>
                        <Badge variant="outline" className="bg-primary/5">{idea.platform}</Badge>
                        <Badge variant="outline">{idea.format}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TREND-JACKING AUDIT (3 GATES) */}
        {activeTab === "trend" && (
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="trend-desc" className="text-xs font-semibold">
                  Deskripsi Tren / Sound / Format Viral
                </Label>
                <Input
                  id="trend-desc"
                  placeholder="Jelaskan tren, sound, format, atau isu yang sedang ramai..."
                  value={trendDesc}
                  onChange={(e) => setTrendDesc(e.target.value)}
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-2xs font-semibold text-muted-foreground mr-0.5">Format:</span>
                  {TREND_VIRAL_FORMATS.map((fmt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTrendDesc(fmt.desc)}
                      className="text-2xs px-2 py-0.5 rounded-full bg-muted hover:bg-warning/10 hover:text-warning border border-border/40 transition-colors font-medium cursor-pointer"
                    >
                      {fmt.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="trend-platform" className="text-xs font-semibold">
                  Platform Target
                </Label>
                <Tabs value={platform} onValueChange={setPlatform}>
                  <TabsList className="w-full grid grid-cols-4 h-11 p-0.5 bg-muted rounded-xl">
                    <TabsTrigger value="Instagram" className="text-xs font-bold rounded-lg py-1 min-h-11">Instagram</TabsTrigger>
                    <TabsTrigger value="TikTok" className="text-xs font-bold rounded-lg py-1 min-h-11">TikTok</TabsTrigger>
                    <TabsTrigger value="LinkedIn" className="text-xs font-bold rounded-lg py-1 min-h-11">LinkedIn</TabsTrigger>
                    <TabsTrigger value="Twitter" className="text-xs font-bold rounded-lg py-1 min-h-11">X / Twitter</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Button
                onClick={handleAuditTrend}
                isLoading={isAuditing}
                disabled={isAuditing}
                className="w-full gap-2"
              >
                <Icons.shield className="size-4" />
                {isAuditing ? (
                  <ShimmeringText text="Mengaudit 3-Gate Framework…" className="text-xs font-semibold" />
                ) : (
                  "Audit Kelayakan Tren (3-Gate)"
                )}
              </Button>
            </div>

            {/* HASIL AUDIT 3-GATE */}
            {trendResult && (
              <div className="space-y-4 pt-3 border-t border-border/40">
                {/* Banner Rekomendasi */}
                <div
                  className={cn(
                    "p-3.5 rounded-xl border flex items-center justify-between",
                    trendResult.overallApproved
                      ? "bg-success/10 border-success/20 text-success"
                      : "bg-destructive/10 border-destructive/20 text-destructive"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {trendResult.overallApproved ? (
                      <Icons.circleCheck className="size-5 shrink-0" />
                    ) : (
                      <Icons.circleX className="size-5 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-xs">
                        REKOMENDASI:{" "}
                        {trendResult.overallApproved
                          ? "AMAN & COCOK (GO)"
                          : "DITOLAK (NO-GO)"}
                      </p>
                      <p className="text-2xs opacity-90">
                        {trendResult.overallApproved
                          ? "Tren selaras dengan identitas brand dan risiko reputasi rendah."
                          : "Tren berisiko tinggi merusak citra atau melanggar guardrails brand."}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-2xs uppercase">
                    {trendResult.overallApproved ? "GO" : "NO_GO"}
                  </Badge>
                </div>

                {/* 3 Gates Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Gate 1: Brand Fit */}
                  <div className="p-3 rounded-xl border border-border/40 bg-muted/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Icons.target className="size-3" />
                        Brand Fit
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-2xs font-semibold",
                          trendResult.gateFit.pass
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {trendResult.gateFit.pass ? "PASS" : "FAIL"}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground/90 line-clamp-3">
                      {trendResult.gateFit.reason}
                    </p>
                  </div>

                  {/* Gate 2: Safety */}
                  <div className="p-3 rounded-xl border border-border/40 bg-muted/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Icons.shield className="size-3" />
                        Safety & Controversy
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-2xs font-semibold",
                          trendResult.gateSafety.pass
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {trendResult.gateSafety.pass ? "PASS" : "FAIL"}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground/90 line-clamp-3">
                      {trendResult.gateSafety.reason}
                    </p>
                  </div>

                  {/* Gate 3: Timing */}
                  <div className="p-3 rounded-xl border border-border/40 bg-muted/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Icons.clock className="size-3" />
                        Timing & Lifecycle
                      </span>
                      <Badge variant="outline" className="text-2xs font-mono uppercase">
                        {trendResult.gateTiming.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground/90">
                      {trendResult.gateTiming.verdict}
                    </p>
                  </div>
                </div>

                {/* Remix Angle & Draft Premise */}
                {trendResult.remixAngle && (
                  <div className="p-3.5 rounded-xl bg-card border border-border/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Sudut Adaptasi Brand:</span>
                      {trendResult.recommendedFormat && (
                        <Badge variant="outline" className="text-2xs">
                          {trendResult.recommendedFormat}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {trendResult.remixAngle}
                    </p>

                    {trendResult.draftPremise && (
                      <div className="pt-2 border-t border-border/30 space-y-1">
                        <span className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">
                          Draf Premis / Naskah:
                        </span>
                        <p className="text-xs text-foreground/90 italic bg-muted/40 p-2 rounded-md">
                          "{trendResult.draftPremise}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action CTA */}
                {trendResult.overallApproved && (
                  <Button
                    onClick={handleAddTrendToCalendar}
                    isLoading={isSaving}
                    disabled={isSaving}
                    className="w-full gap-2"
                  >
                    <Icons.calendar className="size-4" />
                    Jadikan Jadwal di Kalender
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
