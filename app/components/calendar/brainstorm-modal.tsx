import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useGenerateContentIdeas, useEvaluateTrend } from "@/features/copilot/api/queries"
import type { GeneratedIdea, TrendEvaluation } from "@/features/copilot/api/types"
import { useCreateScheduledPost } from "@/features/scheduled-posts/api/queries"
import { addDays } from "date-fns"
import { cn } from "@/lib/utils"

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
      const result = await generateIdeas({ clientId, count, trendOrTopic })
      if (result.error) {
        toast.error(result.error)
        return
      }
      setIdeas(result.ideas || [])
      toast.success("Ide Konten Siap!", {
        description: `${result.ideas?.length || count} ide berhasil diracik menggunakan framework SPARK.`
      })
    } catch (err: any) {
      toast.error(err.message || "Gagal generate ide")
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
    } catch (err: any) {
      toast.error(err.message || "Gagal mengaudit tren")
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
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan ide")
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
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan tren ke kalender")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-2 cursor-pointer">
          <Icons.sparkles className="h-4 w-4 text-primary" />
          <span>AI Brainstorm</span>
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icons.sparkles className="h-5 w-5 text-primary" />
            AI Content Studio
          </DialogTitle>
          <DialogDescription>
            Rancang ide orisinal selaras Brand Profile atau audit kelayakan tren viral sebelum diadaptasi.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation Segmented */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/40 mt-1">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "ideation"}
            onClick={() => setActiveTab("ideation")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === "ideation"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icons.sparkles className="size-3.5" />
            <span>SPARK Ideation</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "trend"}
            onClick={() => setActiveTab("trend")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === "trend"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icons.flame className="size-3.5 text-amber-500" />
            <span>Audit Tren (3-Gate)</span>
          </button>
        </div>

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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="idea-count">Jumlah Ide ({count})</Label>
                  <input 
                    id="idea-count"
                    type="range" 
                    min="1" 
                    max="10" 
                    value={count} 
                    onChange={(e) => setCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <Button 
                  className="w-full gap-2" 
                  onClick={handleGenerate} 
                  isLoading={isGenerating}
                  disabled={isGenerating}
                >
                  <Icons.sparkles className="h-4 w-4" />
                  {isGenerating ? "Menganalisis Brand Profile..." : "Generate Ideas"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground">{ideas.length} Ide Ditemukan</h3>
                  <Button variant="ghost" size="sm" onClick={() => setIdeas([])} className="h-8">Reset</Button>
                </div>
                
                <div className="space-y-3">
                  {ideas.map((idea, i) => (
                    <div key={i} className="rounded-xl border border-border/40 p-4 space-y-3 bg-muted/20">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold text-sm">{idea.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{idea.content}</p>
                        </div>
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
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="trend-platform" className="text-xs font-semibold">
                  Platform Target
                </Label>
                <select
                  id="trend-platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Instagram">Instagram (Reels / Carousel)</option>
                  <option value="TikTok">TikTok</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Twitter">Twitter / X</option>
                </select>
              </div>

              <Button
                onClick={handleAuditTrend}
                isLoading={isAuditing}
                disabled={isAuditing}
                className="w-full gap-2"
              >
                <Icons.shield className="size-4" />
                {isAuditing ? "Mengaudit 3-Gate Framework..." : "Audit Kelayakan Tren (3-Gate)"}
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
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
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
                            ? "bg-emerald-500/10 text-emerald-600"
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
                            ? "bg-emerald-500/10 text-emerald-600"
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
