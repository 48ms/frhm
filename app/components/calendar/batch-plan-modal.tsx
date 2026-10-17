"use client"

import * as React from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useGenerateBatchPlan } from "@/features/copilot/api/queries"
import { useQueryClient } from "@tanstack/react-query"
import { useCreateScheduledPost, postKeys } from "@/features/scheduled-posts/api/queries"
import { createDeliverable } from "@/features/deliverables/api/service"
import { deliverableQueries } from "@/features/deliverables/api/queries"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/animate-ui/components/radix/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"

const BATCH_CAMPAIGN_PRESETS = [
  {
    title: "🚀 Launching",
    desc: "Kampanye peluncuran produk baru: edukasi problem, teaser inovasi, countdown peluncuran, dan promo pre-order dengan penawaran terbatas.",
  },
  {
    title: "👑 Authority",
    desc: "Membangun kredibilitas dan otoritas industri melalui panduan mendalam, tips actionable, dan pemecahan masalah utama audiens.",
  },
  {
    title: "💰 Payday Sale",
    desc: "Penawaran promosi akhir bulan (Payday): penekanan urgensi voucher, bundle produk hemat, dan ulasan kepuasan pelanggan.",
  },
  {
    title: "🎯 Engagement",
    desc: "Meningkatkan interaksi komunitas melalui Q&A interaktif, polling pilihan audiens, kuis berhadiah, dan cerita otentik tim.",
  },
]

const INTENT_CONFIG = {
  educate: { label: "Edukasi", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  entertain: { label: "Hiburan", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  inspire: { label: "Inspirasi", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  connect: { label: "Relasi", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  promote: { label: "Promosi", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
} as const

export function BatchPlanModal({ 
  open,
  onOpenChange,
  hideTrigger
}: { 
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}) {
  const { client } = useActiveDashboard()
  const clientId = client?.id
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen
  
  const [period, setPeriod] = React.useState("this week")
  const [goals, setGoals] = React.useState("")
  const [postsPerWeek, setPostsPerWeek] = React.useState(3)
  const [platforms, setPlatforms] = React.useState<string[]>(["instagram", "tiktok"])
  
  const [step, setStep] = React.useState<"config" | "preview">("config")
  const [generatedPosts, setGeneratedPosts] = React.useState<Array<{
    title: string
    platform: string
    scheduled_at: string
    content: string
    pillar?: string
    intent?: "educate" | "entertain" | "inspire" | "connect" | "promote"
    format?: string
    hook?: string
    visualBrief?: string
    cta?: string
    notes?: string
    selected: boolean
  }>>([])
  const [isSaving, setIsSaving] = React.useState(false)
  const [isExportingDeliverable, setIsExportingDeliverable] = React.useState(false)

  const { mutateAsync: generateBatchPlanMutate, isPending } = useGenerateBatchPlan()
  const { mutateAsync: createScheduledPostMutate } = useCreateScheduledPost()
  const queryClient = useQueryClient()

  const intentSummary = React.useMemo(() => {
    const counts: Record<string, number> = { educate: 0, entertain: 0, inspire: 0, connect: 0, promote: 0 }
    generatedPosts.forEach((p) => {
      const k = p.intent || "educate"
      if (counts[k] !== undefined) counts[k]++
    })
    const total = generatedPosts.length || 1
    const promotePct = Math.round((counts.promote / total) * 100)
    return { counts, total: generatedPosts.length, promotePct }
  }, [generatedPosts])

  const handleGenerate = async () => {
    if (!clientId) {
      toast.error("Pilih klien aktif terlebih dahulu.")
      return
    }
    if (!goals || goals.trim().length < 10) {
      toast.error("Tolong isi goal lebih rinci (minimal 10 karakter).")
      return
    }

    try {
      const res = await generateBatchPlanMutate({
        clientId,
        period,
        goals,
        postsPerWeek,
        platforms,
      })

      if (res.error) {
        toast.error(res.error)
        return
      }

      if (res.plan && res.plan.posts.length > 0) {
        setGeneratedPosts(
          res.plan.posts.map((p) => ({ ...p, selected: true }))
        )
        setStep("preview")
      } else {
        toast.error("Gagal mendapatkan posts dari AI.")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal men-generate batch plan.")
    }
  }

  const handleSaveSelected = async () => {
    if (!clientId) return
    const selected = generatedPosts.filter((p) => p.selected)
    if (selected.length === 0) {
      toast.error("Pilih setidaknya satu post untuk disimpan.")
      return
    }

    setIsSaving(true)
    const toastId = toast.loading(`Menyimpan ${selected.length} post ke kalender...`)

    try {
      const results = await Promise.allSettled(
        selected.map((p) =>
          createScheduledPostMutate({
            client_id: clientId,
            title: p.title,
            content: p.content,
            platform: p.platform as any,
            scheduled_at: p.scheduled_at,
            status: "draft",
            notes: p.notes,
            is_reserved: false,
            is_placeholder: false,
          })
        )
      )

      toast.dismiss(toastId)
      const saved = results.filter((r) => r.status === "fulfilled").length
      const failed = results.length - saved

      queryClient.invalidateQueries({ queryKey: postKeys.list(clientId) })
      queryClient.invalidateQueries({ queryKey: postKeys.all })

      if (failed > 0) {
        toast.warning("Batch Plan Selesai Sebagian", {
          description: `${saved} post tersimpan, ${failed} gagal disave.`,
        })
      } else {
        toast.success("Batch Plan Berhasil Disimpan!", {
          description: `${saved} post ditambahkan ke kalender sebagai draft.`,
        })
      }
      
      setStep("config")
      setGeneratedPosts([])
      setIsOpen(false)
    } catch (err: unknown) {
      toast.dismiss(toastId)
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan post.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportToDeliverable = async () => {
    if (!clientId) return
    const selected = generatedPosts.filter((p) => p.selected)
    if (selected.length === 0) {
      toast.error("Pilih setidaknya satu post untuk dijadikan brief.")
      return
    }

    setIsExportingDeliverable(true)
    const exportPromise = (async () => {
      const briefContentMd = `# Brief Batch Plan: ${period.toUpperCase()}\n\n` +
        `**Goal Kampanye:**\n${goals}\n\n` +
        `**Daftar Konten Terencana (${selected.length} Post):**\n\n` +
        selected.map((p, i) => (
          `### ${i + 1}. [${p.platform.toUpperCase()} · ${p.format || 'Single'}] ${p.title}\n` +
          `- **Pilar:** ${p.pillar || '-'}\n` +
          `- **Intent:** ${p.intent || 'educate'}\n` +
          `- **Jadwal:** ${p.scheduled_at.split("T")[0]}\n` +
          (p.hook ? `- **Hook Angle:** "${p.hook}"\n` : "") +
          (p.visualBrief ? `- **Visual Brief:** ${p.visualBrief}\n` : "") +
          (p.cta ? `- **Single CTA:** ${p.cta}\n` : "") +
          `- **Draft Copy:**\n> ${p.content.replace(/\n/g, "\n> ")}\n` +
          (p.notes ? `- **Catatan Teknis:** ${p.notes}\n` : "")
        )).join("\n\n")

      await createDeliverable({
        clientId,
        type: "brief",
        title: `Batch Campaign Brief - ${period} (${selected.length} Konten)`,
        content_md: briefContentMd,
        external_link: "",
      })

      queryClient.invalidateQueries({ queryKey: deliverableQueries.listByClient(clientId).queryKey })
    })()

    toast.promise(exportPromise, {
      loading: "Membuat dokumen deliverable brief...",
      success: "Deliverable Brief Berhasil Dibuat! Tersimpan di modul ERP Deliverables.",
      error: (err: unknown) => (err instanceof Error ? err.message : "Gagal membuat deliverable brief."),
    })

    try {
      await exportPromise
    } catch {
      // Handled by toast.promise
    } finally {
      setIsExportingDeliverable(false)
    }
  }

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => 
      prev.includes(p) ? prev.filter((i) => i !== p) : [...prev, p]
    )
  }

  const toggleSelectPost = (index: number) => {
    setGeneratedPosts((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    )
  }

  return (
    <>
      {!hideTrigger && (
        <Button onClick={() => setIsOpen(true)} className="rounded-full text-xs font-bold gap-2">
          <Icons.sparkles className="size-3.5" />
          Batch Plan
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-2xl rounded-3xl border border-border/40 p-6 shadow-2xl space-y-6">
          <DialogHeader className="flex flex-row items-center gap-2 border-b border-border/40 pb-3 space-y-0 text-left">
            <div className="w-8 h-8 rounded-full bg-brand-accent text-brand-accent-foreground flex items-center justify-center shrink-0">
              <Icons.sparkles className="size-[18px]" />
            </div>
            <div>
              <DialogTitle className="font-sans font-bold text-foreground text-sm">
                AI Batch Planner
              </DialogTitle>
              <DialogDescription className="text-2xs text-muted-foreground">
                Otomasi perencanaan konten kalender secara serentak berdasarkan pilar dan tujuan brand.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto max-h-[60vh] px-1">
            {step === "config" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1.5">Periode</label>
                    <Tabs value={period} onValueChange={setPeriod}>
                      <TabsList
                        highlightClassName="bg-card shadow-sm rounded-lg"
                        className="w-full grid grid-cols-2 h-auto p-0.5 bg-muted/60 rounded-xl"
                      >
                        <TabsTrigger
                          value="this week"
                          className="text-xs font-bold py-2 min-h-11"
                        >
                          1 Minggu
                        </TabsTrigger>
                        <TabsTrigger
                          value="this month"
                          className="text-xs font-bold py-2 min-h-11"
                        >
                          1 Bulan
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1.5">Frekuensi</label>
                    <Tabs value={String(postsPerWeek)} onValueChange={(val) => setPostsPerWeek(Number(val))}>
                      <TabsList
                        highlightClassName="bg-card shadow-sm rounded-lg"
                        className="w-full grid grid-cols-2 h-auto p-0.5 bg-muted/60 rounded-xl"
                      >
                        <TabsTrigger
                          value="3"
                          className="text-xs font-bold py-2 min-h-11"
                        >
                          3 Post/Mg
                        </TabsTrigger>
                        <TabsTrigger
                          value="5"
                          className="text-xs font-bold py-2 min-h-11"
                        >
                          5 Post/Mg
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">Platform Target</label>
                  <div className="flex flex-wrap gap-2">
                    {["instagram", "tiktok", "linkedin", "shorts", "twitter"].map((p) => {
                      const active = platforms.includes(p)
                      return (
                        <Button
                          key={p}
                          type="button"
                          variant={active ? "default" : "outline"}
                          size="sm"
                          onClick={() => togglePlatform(p)}
                          className={cn(
                            "rounded-full text-xs font-bold capitalize border transition-all cursor-pointer h-auto py-2 px-3 min-h-9",
                            active
                              ? "bg-brand-accent text-brand-accent-foreground border-transparent shadow-xs hover:bg-brand-accent/90"
                              : "bg-muted/50 border-border/40 hover:bg-muted text-muted-foreground"
                          )}
                        >
                          {p}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">Goal & Tema Khusus</label>
                  <textarea
                    className="w-full min-h-[90px] px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    placeholder="Contoh: Fokus awareness peluncuran produk baru dan edukasi problem solving..."
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                  />
                  <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                    <span className="text-2xs font-semibold text-muted-foreground mr-0.5">Template Brief:</span>
                    {BATCH_CAMPAIGN_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setGoals(preset.desc)}
                        className="text-2xs px-2.5 py-1 rounded-full bg-muted hover:bg-brand-accent/10 hover:text-brand-accent border border-border/40 transition-colors font-medium cursor-pointer"
                      >
                        {preset.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1">
                    <span>Review Post Brief (</span>
                    <MetricTicker value={generatedPosts.length} />
                    <span> Konten)</span>
                  </h3>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setStep("config")}
                    className="text-xs font-semibold text-brand-accent p-0 h-auto cursor-pointer"
                  >
                    ← Kembali ke Config
                  </Button>
                </div>

                {/* Strategic Intent Mix Bar */}
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 space-y-1.5">
                  <div className="flex items-center justify-between text-2xs font-semibold text-muted-foreground">
                    <span>Komposisi Intent (Aturan: Promosi ≤20%)</span>
                    {intentSummary.promotePct > 20 && (
                      <span className="text-rose-500 font-bold flex items-center gap-1">
                        ⚠️ Promosi {intentSummary.promotePct}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Object.entries(intentSummary.counts).map(([intentKey, count]) => {
                      if (count === 0) return null
                      const cfg = INTENT_CONFIG[intentKey as keyof typeof INTENT_CONFIG]
                      return (
                        <span
                          key={intentKey}
                          className={cn("text-3xs font-semibold px-2 py-0.5 rounded-full border", cfg?.color)}
                        >
                          {cfg?.label || intentKey}: {count}
                        </span>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {generatedPosts.map((p, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all text-left",
                        p.selected
                          ? "bg-brand-accent/5 border-brand-accent/30 shadow-xs"
                          : "bg-muted/20 border-border/30 opacity-60 hover:opacity-100"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleSelectPost(idx)}
                          aria-label={`Pilih postingan ${p.title}`}
                          className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer",
                            p.selected
                              ? "bg-brand-accent border-brand-accent text-brand-accent-foreground"
                              : "border-muted-foreground/30 hover:border-brand-accent"
                          )}
                        >
                          {p.selected && <Icons.check className="size-3" />}
                        </button>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-3xs font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                              {p.platform}
                            </span>
                            <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/40">
                              {p.format || "Single"}
                            </span>
                            {p.intent && INTENT_CONFIG[p.intent as keyof typeof INTENT_CONFIG] && (
                              <span className={cn("text-3xs font-semibold px-2 py-0.5 rounded-full border", INTENT_CONFIG[p.intent as keyof typeof INTENT_CONFIG].color)}>
                                {INTENT_CONFIG[p.intent as keyof typeof INTENT_CONFIG].label}
                              </span>
                            )}
                            {p.pillar && (
                              <span className="text-3xs text-muted-foreground truncate max-w-[130px]" title={p.pillar}>
                                • {p.pillar}
                              </span>
                            )}
                            <span className="text-3xs text-muted-foreground ml-auto">
                              {p.scheduled_at ? p.scheduled_at.split("T")[0] : ""}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-foreground leading-snug">{p.title}</p>

                          {p.hook && (
                            <div className="text-2xs text-foreground/90 bg-muted/40 p-2 rounded-lg border border-border/30 flex items-start gap-1.5">
                              <Icons.sparkles className="size-3 text-primary shrink-0 mt-0.5" />
                              <span className="italic font-medium">Hook: "{p.hook}"</span>
                            </div>
                          )}

                          {p.visualBrief && (
                            <div className="text-3xs text-muted-foreground flex items-center gap-1">
                              <Icons.photo_camera className="size-3 shrink-0 text-muted-foreground" />
                              <span className="truncate">Visual: {p.visualBrief}</span>
                            </div>
                          )}

                          {p.cta && (
                            <div className="text-3xs text-primary/90 flex items-center gap-1 font-semibold">
                              <Icons.arrowRight className="size-3 shrink-0 text-primary" />
                              <span className="truncate">CTA: {p.cta}</span>
                            </div>
                          )}

                          <p className="text-2xs text-muted-foreground line-clamp-2 pt-0.5">{p.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="rounded-full font-bold text-xs"
            >
              Batalkan
            </Button>
            {step === "config" ? (
              <Button
                onClick={handleGenerate}
                disabled={isPending || goals.trim().length < 10}
                isLoading={isPending}
                size="sm"
                className="rounded-full font-bold text-xs bg-brand-accent text-brand-accent-foreground shadow-sm"
              >
                {isPending ? (
                  <ShimmeringText text="Merancang Batch Kalender…" className="text-xs font-semibold" />
                ) : (
                  "Generate Kalender"
                )}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep("config")}
                  className="rounded-full text-xs font-semibold cursor-pointer"
                >
                  ← Edit Konfig
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportToDeliverable}
                  disabled={isExportingDeliverable}
                  isLoading={isExportingDeliverable}
                  className="rounded-full font-semibold text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1.5 cursor-pointer"
                  title="Ekspor sebagai Brief Deliverable untuk direview klien"
                >
                  <Icons.fileText className="size-3.5" />
                  <span>+ Brief Deliverable</span>
                </Button>
                <Button
                  onClick={handleSaveSelected}
                  disabled={isSaving}
                  isLoading={isSaving}
                  size="sm"
                  className="rounded-full font-bold text-xs bg-brand-accent text-brand-accent-foreground shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <span>Simpan </span>
                  <MetricTicker value={generatedPosts.filter((p) => p.selected).length} />
                  <span> Post</span>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
