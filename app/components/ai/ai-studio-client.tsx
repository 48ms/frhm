"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQueryState, parseAsString } from "nuqs"
import { format } from "date-fns"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { PageContainer } from "@/components/layout/page-container"
import { serializeComposerParams } from "@/lib/searchparams"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/animate-ui/components/radix/tabs"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import {
  useGenerateContentIdeas,
  useGenerateBatchPlan,
  useEvaluateTrend,
} from "@/features/copilot/api/queries"
import { useCreateScheduledPostsBatch } from "@/features/scheduled-posts/api/queries"
import type { GeneratedIdea, TrendEvaluation } from "@/features/copilot/api/types"
import type { BrandProfile } from "@/features/social-accounts/api/types"
import { BrandBrainEditorDialog } from "@/components/ai/brand-brain-editor-dialog"
import type { BrandFileKey } from "@/features/brand-files/api/types"
import { SkillCatalogView } from "@/components/skills/skill-catalog-view"
import { SkillInterviewModal } from "@/components/skills/skill-interview-modal"
import { useSkillDetail } from "@/features/skills/api/queries"

const STUDIO_TABS = [
  { id: "ideas", label: "Idea Engine", icon: "sparkles", description: "SPARK Ideation Matrix" },
  { id: "batch", label: "Batch Planner", icon: "calendar", description: "Multi-Day Campaign Matrix" },
  { id: "trends", label: "Trend Radar", icon: "trendingUp", description: "Three Gates Vetting" },
  { id: "brand-brain", label: "Brand Brain", icon: "bot", description: "Live DNA & Context" },
  { id: "playbooks", label: "Playbooks (106)", icon: "bookOpen", description: "106 Strategic Skills & Packs" },
] as const

type StudioTab = typeof STUDIO_TABS[number]["id"]

const AVAILABLE_PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "instagram" },
  { id: "tiktok", label: "TikTok", icon: "tiktok" },
  { id: "twitter", label: "Twitter / X", icon: "twitter" },
  { id: "linkedin", label: "LinkedIn", icon: "linkedin" },
]

const IDEA_STRATEGY_PRESETS = [
  { label: "🔥 Bongkar Mitos", topic: "Bongkar mitos keliru seputar industri yang sering dipercaya audiens" },
  { label: "💡 Tips 3-Langkah", topic: "3 langkah praktis dan terbukti untuk menyelesaikan masalah utama audiens" },
  { label: "🎬 Behind The Scenes", topic: "Di balik layar proses pembuatan produk dan standar kualitas kami" },
  { label: "💬 Social Proof", topic: "Kisah transformasi nyata dan bukti kepuasan pelanggan kami" },
  { label: "⚡ Promo & Urgensi", topic: "Penawaran spesial terbatas waktu dengan nilai tambah eksklusif" },
]

const BATCH_CAMPAIGN_PRESETS = [
  {
    title: "🚀 Peluncuran Produk",
    desc: "Kampanye peluncuran produk baru: edukasi problem, teaser inovasi, countdown peluncuran, dan promo pre-order dengan penawaran terbatas.",
  },
  {
    title: "👑 Authority & Edukasi",
    desc: "Membangun kredibilitas dan otoritas industri melalui panduan mendalam, tips actionable, dan pemecahan masalah utama audiens.",
  },
  {
    title: "💰 Payday & Flash Sale",
    desc: "Penawaran promosi akhir bulan (Payday): penekanan urgensi voucher, bundle produk hemat, dan ulasan kepuasan pelanggan.",
  },
  {
    title: "🎯 Engagement Komunitas",
    desc: "Meningkatkan interaksi komunitas melalui Q&A interaktif, polling pilihan audiens, kuis berhadiah, dan cerita otentik tim.",
  },
]

const TREND_VIRAL_FORMATS = [
  {
    title: "POV: Pertama Kali Coba",
    desc: "POV: Pertama kali coba solusi kami setelah frustrasi bertahun-tahun dengan metode konvensional.",
  },
  {
    title: "A Day in My Life BTS",
    desc: "A Day in the Life: Aktivitas otentik di balik layar tim kami dalam memastikan standar kualitas terbaik.",
  },
  {
    title: "Sebelum vs Sesudah",
    desc: "Transformasi sebelum vs sesudah: Perubahan nyata yang dirasakan dalam 30 hari pemakaian konsisten.",
  },
  {
    title: "Mitos vs Fakta",
    desc: "Mitos vs Fakta: Meluruskan miskonsepsi umum yang sering merugikan konsumen di industri ini.",
  },
]

export function AiStudioClient() {
  const router = useRouter()
  const { clientId, client } = useActiveDashboard()

  const [currentTab, setCurrentTab] = useQueryState(
    "tab",
    parseAsString.withDefault("ideas")
  )

  const [localTab, setLocalTab] = React.useState<StudioTab>(() => {
    return STUDIO_TABS.some((t) => t.id === currentTab) ? (currentTab as StudioTab) : "ideas"
  })

  React.useEffect(() => {
    if (currentTab && STUDIO_TABS.some((t) => t.id === currentTab)) {
      setLocalTab(currentTab as StudioTab)
    }
  }, [currentTab])

  const handleTabChange = (val: string) => {
    setLocalTab(val as StudioTab)
    void setCurrentTab(val, { shallow: true })
  }

  const activeTab: StudioTab = localTab

  // Brand Brain Markdown Studio Dialog State
  const [brandEditorOpen, setBrandEditorOpen] = React.useState(false)
  const [brandEditorPath, setBrandEditorPath] = React.useState<BrandFileKey>("brand-profile.md")

  const handleOpenBrandEditor = (path: BrandFileKey = "brand-profile.md") => {
    setBrandEditorPath(path)
    setBrandEditorOpen(true)
  }

  // Skill Interview Dialog State & Auto-Launch Handler (?tab=brand-brain&interview=true / ?skill=...)
  const [activeInterviewSkillId, setActiveInterviewSkillId] = useQueryState("skill", parseAsString)
  const [interviewParam, setInterviewParam] = useQueryState("interview", parseAsString)
  const [isInterviewOpen, setIsInterviewOpen] = React.useState(false)
  const { data: interviewSkillDetail } = useSkillDetail(activeInterviewSkillId || "")

  React.useEffect(() => {
    if (interviewParam === "true") {
      void setActiveInterviewSkillId("brand-profile")
      setIsInterviewOpen(true)
    } else if (activeInterviewSkillId) {
      setIsInterviewOpen(true)
    }
  }, [interviewParam, activeInterviewSkillId, setActiveInterviewSkillId])

  const handleStartBrandInterview = (skillId: string = "brand-profile") => {
    void setActiveInterviewSkillId(skillId)
    setIsInterviewOpen(true)
  }

  // ==========================================
  // TAB 1: IDEA ENGINE (SPARK)
  // ==========================================
  const [ideaTopic, setIdeaTopic] = React.useState("")
  const [ideaCount, setIdeaCount] = React.useState(5)
  const [targetPlatform, setTargetPlatform] = React.useState("instagram")
  const [generatedIdeas, setGeneratedIdeas] = React.useState<GeneratedIdea[]>([])
  const { mutateAsync: generateIdeasMutate, isPending: isGeneratingIdeas } = useGenerateContentIdeas()

  const handleGenerateIdeas = async () => {
    if (!clientId) {
      toast.error("Pilih klien aktif terlebih dahulu.")
      return
    }
    try {
      const res = await generateIdeasMutate({
        clientId,
        count: ideaCount,
        trendOrTopic: ideaTopic.trim() || undefined,
      })
      if (res.error) {
        toast.error(res.error)
        return
      }
      if (res.ideas) {
        setGeneratedIdeas(res.ideas)
        toast.success("Ide Konten Terbentuk!", {
          description: `${res.ideas.length} konsep berhasil diracik menggunakan SPARK framework.`,
        })
      }
    } catch (err: unknown) {
      toast.error("Gagal meracik ide konten.")
      console.error(err)
    }
  }

  const handleSendToComposer = (idea: GeneratedIdea) => {
    router.push(
      serializeComposerParams("/admin/composer", {
        clientId: clientId || null,
        title: idea.title || null,
        content: idea.hook ? `${idea.hook}\n\n${idea.content || ""}` : (idea.content || null),
        platform: targetPlatform || null,
      })
    )
  }

  const handleCopyIdea = (idea: GeneratedIdea) => {
    const text = `${idea.title || idea.hook}\n\nHook: ${idea.hook}\n\nKonsep: ${idea.content || "-"}\n\nFormat: ${idea.format || "Post"} (${idea.pillar || "Umum"})`
    void navigator.clipboard.writeText(text)
    toast.success("Ide disalin ke clipboard!", {
      description: "Siap dibagikan ke WhatsApp klien atau tim produksi.",
    })
  }

  // ==========================================
  // TAB 2: BATCH CAMPAIGN PLANNER
  // ==========================================
  const [batchPeriod, setBatchPeriod] = React.useState("1 month")
  const [batchGoals, setBatchGoals] = React.useState("")
  const [batchPostsPerWeek, setBatchPostsPerWeek] = React.useState(3)
  const [batchPlatforms, setBatchPlatforms] = React.useState<string[]>(["instagram", "tiktok"])
  const [batchPosts, setBatchPosts] = React.useState<
    Array<{
      title: string
      platform: string
      scheduled_at: string
      content: string
      notes?: string
      selected: boolean
    }>
  >([])
  const [isSavingBatch, setIsSavingBatch] = React.useState(false)

  const { mutateAsync: generateBatchMutate, isPending: isGeneratingBatch } = useGenerateBatchPlan()
  const { mutateAsync: createScheduledPostsBatch, isPending: isCreatingBatch } = useCreateScheduledPostsBatch()

  const handleGenerateBatch = async () => {
    if (!clientId) {
      toast.error("Pilih klien aktif terlebih dahulu.")
      return
    }
    if (!batchGoals || batchGoals.trim().length < 10) {
      toast.error("Tolong isi goal lebih rinci (minimal 10 karakter).")
      return
    }
    try {
      const res = await generateBatchMutate({
        clientId,
        period: batchPeriod,
        goals: batchGoals.trim(),
        postsPerWeek: batchPostsPerWeek,
        platforms: batchPlatforms,
      })
      if (res.error) {
        toast.error(res.error)
        return
      }
      if (res.plan?.posts) {
        const mapped = res.plan.posts.map((p) => ({
          title: p.title,
          platform: p.platform,
          scheduled_at: p.scheduled_at,
          content: p.content,
          notes: p.notes,
          selected: true,
        }))
        setBatchPosts(mapped)
        toast.success("Batch Plan Berhasil Diracik!", {
          description: `${mapped.length} postingan siap dijadwalkan ke Content Calendar.`,
        })
      }
    } catch (err: unknown) {
      toast.error("Gagal membuat batch plan.")
      console.error(err)
    }
  }

  const handleScheduleAllBatch = async () => {
    if (!clientId) return
    const selected = batchPosts.filter((p) => p.selected)
    if (selected.length === 0) {
      toast.error("Pilih minimal satu postingan untuk dijadwalkan.")
      return
    }

    setIsSavingBatch(true)
    try {
      const posts = await createScheduledPostsBatch(
        selected.map((post) => ({
          client_id: clientId,
          title: post.title,
          content: post.content,
          platform: post.platform,
          scheduled_at: post.scheduled_at,
          status: "draft",
          notes: post.notes,
          is_reserved: false,
          is_placeholder: false,
        }))
      )

      const successCount = Array.isArray(posts) ? posts.length : 1

      toast.success("Batch Post Berhasil Dijadwalkan!", {
        description: `${successCount} postingan telah masuk ke Content Calendar.`,
      })
      setBatchPosts([])
    } catch (err: unknown) {
      toast.error("Gagal menjadwalkan sebagian postingan.")
      console.error(err)
    } finally {
      setIsSavingBatch(false)
    }
  }

  const handleCopyBatchSummary = () => {
    if (batchPosts.length === 0) return
    const summary = batchPosts
      .map(
        (p, i) =>
          `${i + 1}. [${p.platform.toUpperCase()}] ${p.scheduled_at ? format(new Date(p.scheduled_at), "dd/MM/yyyy HH:mm") : "-"} — ${p.title}\nCaption: ${p.content}`
      )
      .join("\n\n")
    void navigator.clipboard.writeText(summary)
    toast.success("Ringkasan Batch Disalin!", {
      description: `${batchPosts.length} postingan disalin dalam format teks terstruktur.`,
    })
  }

  // ==========================================
  // TAB 3: TREND RADAR & VETTING
  // ==========================================
  const [trendDesc, setTrendDesc] = React.useState("")
  const [trendPlatform, setTrendPlatform] = React.useState("Instagram")
  const [trendResult, setTrendResult] = React.useState<TrendEvaluation | null>(null)
  const { mutateAsync: evaluateTrendMutate, isPending: isAuditingTrend } = useEvaluateTrend()

  const handleAuditTrend = async () => {
    if (!trendDesc.trim()) {
      toast.error("Harap isi deskripsi tren terlebih dahulu.")
      return
    }
    try {
      const res = await evaluateTrendMutate({
        clientId: clientId || "client-default",
        trendDescription: trendDesc.trim(),
        trendSourceOrContext: `Platform target: ${trendPlatform}`,
      })
      if (res.error) {
        toast.error(res.error)
        return
      }
      if (res.evaluation) {
        setTrendResult(res.evaluation)
        toast.success("Audit Tren Selesai", {
          description: res.evaluation.overallApproved
            ? "Tren direkomendasikan untuk brand (GO)"
            : "Tren memiliki risiko atau tidak selaras (NO-GO)",
        })
      }
    } catch (err: unknown) {
      toast.error("Gagal melakukan evaluasi tren.")
      console.error(err)
    }
  }

  const handleAdoptTrendToIdeas = (topic: string) => {
    setIdeaTopic(topic)
    setCurrentTab("ideas")
    toast.info("Topik Tren Dimuat ke Idea Engine", {
      description: "Silakan tekan 'Racik Ide Konten' untuk mengeksplorasi variasi sudut pandang.",
    })
  }

  // ==========================================
  // TAB 4: BRAND BRAIN
  // ==========================================
  const bp = client?.brand_profile as Partial<BrandProfile> | undefined

  const dnaMetrics = React.useMemo(() => {
    const checks = [
      { key: "who", label: "Siapa Kami (Who)", filled: Boolean(bp?.who?.trim()), file: "brand-profile.md" as BrandFileKey },
      { key: "audience", label: "Target Audiens", filled: Boolean(bp?.audience?.trim()), file: "brand-profile.md" as BrandFileKey },
      { key: "voice", label: "Gaya Bahasa (Voice)", filled: Boolean(bp?.voice?.trim()), file: "voice.md" as BrandFileKey },
      { key: "pov", label: "Sudut Pandang (POV)", filled: Boolean(bp?.pov?.trim()), file: "brand-profile.md" as BrandFileKey },
      { key: "proof", label: "Bukti Kredibilitas", filled: Boolean(bp?.proof?.trim()), file: "brand-profile.md" as BrandFileKey },
      { key: "guardrails", label: "Pantangan (Guardrails)", filled: Boolean(bp?.guardrails?.trim()), file: "guardrails.md" as BrandFileKey },
      { key: "pillars", label: "Pilar Konten", filled: Boolean(bp?.pillars && bp.pillars.length > 0), file: "content-pillars.md" as BrandFileKey },
    ]
    const filledCount = checks.filter((c) => c.filled).length
    const score = Math.round((filledCount / checks.length) * 100)
    return { checks, filledCount, score }
  }, [bp])

  return (
    <PageContainer
      pageTitle="AI Creative Studio & Strategy Hub"
      pageDescription={`Pusat komando kecerdasan buatan terpadu untuk meracik ide, menyusun rencana kampanye, dan memvalidasi tren sesuai Brand DNA ${client?.name ? `(${client.name})` : ""}.`}
      pageHeaderAction={
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
            {client?.name || "Workspace"}
          </span>
          <Button
            size="sm"
            onClick={() => router.push(serializeComposerParams("/admin/composer", { clientId: clientId || null }))}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Icons.rocket className="size-3.5" />
            <span>Buka Composer</span>
          </Button>
        </div>
      }
      className="pb-20 space-y-6"
    >
      {/* Studio Nav Tabs */}
      <Tabs value={localTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList
          aria-label="AI Studio tabs"
          className="flex items-center gap-1.5 p-1 bg-secondary/40 rounded-full border border-border/20 w-max h-auto overflow-x-auto max-w-full"
        >
          {STUDIO_TABS.map((t) => {
            const IconCmp = Icons[t.icon as keyof typeof Icons] || Icons.sparkles
            return (
              <TabsTrigger
                key={t.id}
                value={t.id}
                onClick={() => handleTabChange(t.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <IconCmp className="size-4 text-primary" />
                <span>{t.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* ============================================================ */}
        {/* TAB 1: IDEA ENGINE                                           */}
        {/* ============================================================ */}
        <TabsContent value="ideas" className="space-y-6">
          <div className="admin-card border border-border/40 bg-card p-6 rounded-2xl shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Icons.sparkles className="size-5 text-primary" />
                  SPARK Ideation Engine
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generate ide konten viral yang terikat erat pada pilar dan persona merek klien aktif.
                </p>
              </div>
              {generatedIdeas.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <span>Hasil Teracik:</span>
                  <MetricTicker value={generatedIdeas.length} />
                  <span>Ide</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-foreground">
                  Topik / Fokus Bahasan (Opsional)
                </label>
                <Input
                  placeholder="Contoh: Manfaat teh putih organik untuk kesehatan, rahasia seduh kafe, dsb."
                  value={ideaTopic}
                  onChange={(e) => setIdeaTopic(e.target.value)}
                  className="bg-background border-border/40 text-sm"
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-2xs font-semibold text-muted-foreground mr-0.5">Preset Strategi:</span>
                  {IDEA_STRATEGY_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setIdeaTopic(preset.topic)}
                      className="text-2xs px-2.5 py-1 rounded-full bg-secondary/60 hover:bg-primary/10 hover:text-primary border border-border/40 transition-colors font-medium cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Platform Target</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {AVAILABLE_PLATFORMS.map((p) => (
                    <Button
                      key={p.id}
                      type="button"
                      variant={targetPlatform === p.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTargetPlatform(p.id)}
                      className="text-xs font-medium rounded-full cursor-pointer h-8 px-3"
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span>Jumlah Ide yang Dihasilkan:</span>
                <span className="text-primary font-extrabold inline-flex items-center gap-1">
                  <MetricTicker value={ideaCount} /> Ide
                </span>
              </div>
              <Slider
                min={3}
                max={10}
                step={1}
                value={[ideaCount]}
                onValueChange={(vals) => setIdeaCount(vals[0])}
                className="w-full cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={handleGenerateIdeas}
                isLoading={isGeneratingIdeas}
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Icons.sparkles className="size-4" />
                {isGeneratingIdeas ? (
                  <ShimmeringText text="Meracik Ide Konten SPARK..." />
                ) : (
                  "Racik Ide Konten Sekarang"
                )}
              </Button>
            </div>
          </div>

          {/* Ideas Results Grid */}
          {generatedIdeas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Koleksi Ide Siap Eksekusi</h3>
                <span className="text-xs text-muted-foreground">
                  Klik "Kirim ke Composer" untuk langsung menyusun naskah dan aset media.
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedIdeas.map((idea, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between p-5 rounded-2xl bg-card border border-border/40 shadow-xs hover:border-primary/40 transition-all gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-2xs font-bold bg-primary/5 text-primary border-primary/20">
                          {idea.pillar || "Konten"}
                        </Badge>
                        <span className="text-2xs font-semibold text-muted-foreground capitalize">
                          {idea.format || "Post"}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground line-clamp-2">
                        {idea.title || idea.hook}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {idea.content || idea.hook}
                      </p>
                      <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/20 text-2xs text-muted-foreground flex items-start gap-1.5">
                        <Icons.sparkles className="size-3.5 shrink-0 text-primary mt-0.5" />
                        <span className="line-clamp-2">Hook: {idea.hook}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/30 flex items-center justify-between gap-2">
                      <span className="text-2xs font-semibold text-muted-foreground capitalize">
                        Platform: {idea.platform || targetPlatform}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyIdea(idea)}
                          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-full cursor-pointer"
                          title="Salin Ide & Hook"
                        >
                          <Icons.copy className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSendToComposer(idea)}
                          className="text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          <Icons.rocket className="size-3.5" />
                          <span>Kirim ke Composer</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 2: BATCH CAMPAIGN PLANNER                                */}
        {/* ============================================================ */}
        <TabsContent value="batch" className="space-y-6">
          <div className="admin-card border border-border/40 bg-card p-6 rounded-2xl shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Icons.calendar className="size-5 text-primary" />
                  30-Day Batch Campaign Planner
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Rancang roadmap postingan multi-platform untuk 7 hingga 30 hari ke depan dalam 1 kali klik.
                </p>
              </div>
              {batchPosts.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <span>Draft Terbuat:</span>
                  <MetricTicker value={batchPosts.length} />
                  <span>Jadwal</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Rentang Waktu</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "this week", label: "7 Hari" },
                    { id: "14 days", label: "14 Hari" },
                    { id: "1 month", label: "30 Hari" },
                  ].map((p) => (
                    <Button
                      key={p.id}
                      type="button"
                      variant={batchPeriod === p.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBatchPeriod(p.id)}
                      className="text-xs font-semibold rounded-xl cursor-pointer h-9"
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">
                  Frekuensi Post per Minggu: <span className="text-primary font-extrabold inline-flex items-center"><MetricTicker value={batchPostsPerWeek} />x</span>
                </label>
                <Slider
                  min={1}
                  max={7}
                  step={1}
                  value={[batchPostsPerWeek]}
                  onValueChange={(vals) => setBatchPostsPerWeek(vals[0])}
                  className="w-full cursor-pointer pt-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Kanal Platform</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {AVAILABLE_PLATFORMS.map((p) => {
                    const isSelected = batchPlatforms.includes(p.id)
                    return (
                      <Button
                        key={p.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (isSelected) {
                            if (batchPlatforms.length > 1) {
                              setBatchPlatforms(batchPlatforms.filter((x) => x !== p.id))
                            }
                          } else {
                            setBatchPlatforms([...batchPlatforms, p.id])
                          }
                        }}
                        className="text-xs font-medium rounded-full cursor-pointer h-8 px-3"
                      >
                        {p.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">
                Tujuan / Fokus Utama Kampanye (Campaign Goals)
              </label>
              <Textarea
                placeholder="Contoh: Kampanye peluncuran menu teh musim panas. Fokus edukasi khasiat bahan organik lokal dan ajakan pre-order diskon 20%."
                value={batchGoals}
                onChange={(e) => setBatchGoals(e.target.value)}
                className="bg-background border-border/40 text-sm min-h-[90px]"
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-2xs font-semibold text-muted-foreground mr-0.5">Template Brief:</span>
                {BATCH_CAMPAIGN_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBatchGoals(preset.desc)}
                    className="text-2xs px-2.5 py-1 rounded-full bg-secondary/60 hover:bg-primary/10 hover:text-primary border border-border/40 transition-colors font-medium cursor-pointer"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={handleGenerateBatch}
                isLoading={isGeneratingBatch}
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Icons.calendar className="size-4" />
                {isGeneratingBatch ? (
                  <ShimmeringText text="Merancang Roadmap Batch Plan..." />
                ) : (
                  "Generate Batch Plan Sekarang"
                )}
              </Button>
            </div>
          </div>

          {/* Batch Matrix Table */}
          {batchPosts.length > 0 && (
            <div className="admin-card border border-border/40 bg-card p-6 rounded-2xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div>
                  <h3 className="text-base font-bold text-foreground">Matrix Jadwal Konten Terencana</h3>
                  <p className="text-xs text-muted-foreground">
                    Periksa draf jadwal di bawah. Centang postingan yang disetujui untuk langsung dijadwalkan ke Kalender.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyBatchSummary}
                    className="rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Icons.copy className="size-3.5" />
                    <span>Salin Ringkasan</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={handleScheduleAllBatch}
                    isLoading={isSavingBatch}
                    className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Icons.check className="size-4" />
                    <span>Jadwalkan (<MetricTicker value={batchPosts.filter((p) => p.selected).length} />) ke Kalender</span>
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border/40">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 bg-secondary/30">
                      <th className="p-3 w-10 text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={batchPosts.length > 0 && batchPosts.every((p) => p.selected)}
                            onCheckedChange={(checked) => {
                              const val = Boolean(checked)
                              setBatchPosts(batchPosts.map((p) => ({ ...p, selected: val })))
                            }}
                            aria-label="Pilih semua postingan batch"
                          />
                        </div>
                      </th>
                      <th className="p-3 font-bold text-foreground">Waktu Jadwal</th>
                      <th className="p-3 font-bold text-foreground">Platform</th>
                      <th className="p-3 font-bold text-foreground">Tema / Judul</th>
                      <th className="p-3 font-bold text-foreground">Draft Caption</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {batchPosts.map((post, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={post.selected}
                              onCheckedChange={(checked) => {
                                const isChecked = Boolean(checked)
                                setBatchPosts(
                                  batchPosts.map((p, i) => (i === idx ? { ...p, selected: isChecked } : p))
                                )
                              }}
                              aria-label={`Pilih postingan ${post.title}`}
                            />
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap font-medium text-foreground">
                          {post.scheduled_at ? format(new Date(post.scheduled_at), "dd MMM yyyy, HH:mm") : "-"}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <Badge variant="outline" className="capitalize text-2xs font-bold bg-primary/5 text-primary border-primary/20">
                            {post.platform}
                          </Badge>
                        </td>
                        <td className="p-3 font-semibold text-foreground max-w-[200px] truncate">
                          {post.title}
                        </td>
                        <td className="p-3 text-muted-foreground max-w-[320px] truncate">
                          {post.content}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 3: TREND RADAR & VETTING                                 */}
        {/* ============================================================ */}
        <TabsContent value="trends" className="space-y-6">
          <div className="admin-card border border-border/40 bg-card p-6 rounded-2xl shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Icons.trendingUp className="size-5 text-primary" />
                  Trend Radar & 3-Gate Vetting Engine
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Validasi tren viral secara ilmiah sebelum ikut-ikutan: uji Brand Fit, Safety, dan Timing.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-foreground">Deskripsi Tren / Topik Viral</label>
                <Textarea
                  placeholder="Contoh: Tren format video 'A Day in My Life as an Artisan Tea Brewer' dengan soundtrack audio lo-fi yang sedang viral di TikTok..."
                  value={trendDesc}
                  onChange={(e) => setTrendDesc(e.target.value)}
                  className="bg-background border-border/40 text-sm min-h-[90px]"
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-2xs font-semibold text-muted-foreground mr-0.5">Format Tren:</span>
                  {TREND_VIRAL_FORMATS.map((fmt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTrendDesc(fmt.desc)}
                      className="text-2xs px-2.5 py-1 rounded-full bg-secondary/60 hover:bg-primary/10 hover:text-primary border border-border/40 transition-colors font-medium cursor-pointer"
                    >
                      {fmt.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Platform Target</label>
                <div className="flex flex-col gap-2">
                  {AVAILABLE_PLATFORMS.map((p) => (
                    <Button
                      key={p.id}
                      type="button"
                      variant={trendPlatform.toLowerCase() === p.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTrendPlatform(p.label)}
                      className="text-xs font-medium rounded-xl cursor-pointer justify-start"
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={handleAuditTrend}
                isLoading={isAuditingTrend}
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Icons.trendingUp className="size-4" />
                {isAuditingTrend ? (
                  <ShimmeringText text="Menjalankan Audit 3-Gate..." />
                ) : (
                  "Audit Kelayakan Tren Sekarang"
                )}
              </Button>
            </div>
          </div>

          {/* Trend Result Display */}
          {trendResult && (
            <div className="admin-card border border-border/40 bg-card p-6 rounded-2xl shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "size-10 rounded-full flex items-center justify-center font-bold text-sm",
                      trendResult.overallApproved
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "bg-destructive/10 text-destructive border border-destructive/30"
                    )}
                  >
                    {trendResult.overallApproved ? "GO" : "NO"}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {trendResult.overallApproved
                        ? "Tren Direkomendasikan untuk Diadopsi"
                        : "Tren Berisiko / Tidak Direkomendasikan"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Status Kelayakan: {trendResult.overallApproved ? "Aman & Selaras" : "Potensi Risiko / Off-brand"}
                    </p>
                  </div>
                </div>

                {trendResult.remixAngle && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void navigator.clipboard.writeText(trendResult.remixAngle || "")
                        toast.success("Sudut Remix disalin ke clipboard!")
                      }}
                      className="rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Icons.copy className="size-3.5" />
                      <span>Salin Sudut</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAdoptTrendToIdeas(trendResult.remixAngle!)}
                      className="rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Icons.sparkles className="size-3.5" />
                      <span>Racik Ide dari Tren Ini</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Three Gates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Gate 1 */}
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-extrabold uppercase text-muted-foreground tracking-wider">
                      Gate 1: Brand Fit
                    </span>
                    <Badge variant="outline" className="text-2xs font-bold">
                      {trendResult.gateFit.pass ? "PASS" : "FAIL"}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-foreground">
                    {trendResult.gateFit.pass ? "Selaras dengan Nilai Merek" : "Menabrak Panduan Brand"}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {trendResult.gateFit.reason}
                  </p>
                </div>

                {/* Gate 2 */}
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-extrabold uppercase text-muted-foreground tracking-wider">
                      Gate 2: Brand Safety
                    </span>
                    <Badge variant="outline" className="text-2xs font-bold">
                      {trendResult.gateSafety.pass ? "SAFE" : "RISKY"}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-foreground">
                    {trendResult.gateSafety.pass ? "Aman dari Kontroversi" : "Potensi Risiko Sensitif"}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {trendResult.gateSafety.reason}
                  </p>
                </div>

                {/* Gate 3 */}
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-extrabold uppercase text-muted-foreground tracking-wider">
                      Gate 3: Timing Status
                    </span>
                    <Badge variant="outline" className="text-2xs font-bold capitalize">
                      {trendResult.gateTiming.status}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-foreground capitalize">
                    Fase: {trendResult.gateTiming.status}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {trendResult.gateTiming.verdict}
                  </p>
                </div>
              </div>

              {trendResult.remixAngle && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                  <span className="text-2xs font-bold text-primary uppercase tracking-wider">
                    Rekomendasi Sudut Pandang Unik Brand
                  </span>
                  <p className="text-xs font-semibold text-foreground">
                    "{trendResult.remixAngle}"
                  </p>
                  {trendResult.draftPremise && (
                    <p className="text-2xs text-muted-foreground italic mt-1">
                      Premis: {trendResult.draftPremise}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 4: BRAND BRAIN MATRIX                                    */}
        {/* ============================================================ */}
        <TabsContent value="brand-brain" className="space-y-6">
          <div className="admin-card border border-border/40 bg-card p-6 rounded-2xl shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Icons.bot className="size-5 text-primary" />
                  Brand Brain & Context Matrix
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Seluruh naskah, ide, dan hook yang dibuat Copilot mengacu pada matriks identitas ini.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                  <Icons.check className="size-3.5 text-primary" />
                  Synced via brand-profile.md
                </span>
                <Button
                  size="sm"
                  onClick={() => handleStartBrandInterview("brand-profile")}
                  className="rounded-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Icons.sparkles className="size-3.5" />
                  Wawancara AI Brand Profile
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenBrandEditor("brand-profile.md")}
                  className="rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Icons.bot className="size-3.5" />
                  Buka Markdown Studio (.md)
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push("/admin/settings?tab=brand-profile")}
                  className="rounded-full text-xs font-bold cursor-pointer"
                >
                  Edit Form di Settings
                </Button>
              </div>
            </div>

            {/* Brand DNA Completeness Card */}
            <div className="p-5 rounded-2xl bg-secondary/20 border border-border/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Icons.activity className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">Kelengkapan Brand DNA</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-2xs font-bold",
                          dnaMetrics.score === 100
                            ? "bg-primary/10 text-primary border-primary/30"
                            : dnaMetrics.score >= 60
                            ? "bg-primary/5 text-foreground border-border/40"
                            : "bg-muted text-muted-foreground border-border/40"
                        )}
                      >
                        {dnaMetrics.score === 100 ? "Optimal untuk AI" : dnaMetrics.score >= 60 ? "Cukup Lengkap" : "Perlu Dilengkapi"}
                      </Badge>
                    </div>
                    <p className="text-2xs text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                      <MetricTicker value={dnaMetrics.filledCount} /> dari {dnaMetrics.checks.length} pilar identitas telah terisi.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-2xs text-muted-foreground block">Skor DNA</span>
                    <div className="text-base font-extrabold text-primary flex items-center justify-end">
                      <MetricTicker value={dnaMetrics.score} />
                      <span>%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-2 w-full rounded-full bg-secondary/50 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${dnaMetrics.score}%` }}
                />
              </div>

              {dnaMetrics.score < 100 && (
                <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-border/20">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-2xs text-muted-foreground">Pilar belum lengkap:</span>
                    {dnaMetrics.checks
                      .filter((c) => !c.filled)
                      .map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => handleOpenBrandEditor(c.file)}
                          className="text-2xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <span>+ Lengkapi {c.label}</span>
                        </button>
                      ))}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleStartBrandInterview("brand-profile")}
                    className="h-7 text-xs font-bold text-primary hover:bg-primary/10 gap-1.5 cursor-pointer"
                  >
                    <Icons.sparkles className="size-3 text-primary" />
                    Interview AI Cepat
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-extrabold text-primary uppercase tracking-wider">
                    Siapa Kami? (Who)
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenBrandEditor("brand-profile.md")}
                    className="h-6 text-2xs text-muted-foreground hover:text-primary cursor-pointer px-1.5"
                  >
                    <Icons.edit className="size-3 mr-1" />
                    Edit .md
                  </Button>
                </div>
                <p className="text-xs text-foreground font-medium">
                  {bp?.who || "Belum dikonfigurasi. Atur identitas di Settings > Brand Profile."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-extrabold text-primary uppercase tracking-wider">
                    Target Audiens (Audience)
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenBrandEditor("brand-profile.md")}
                    className="h-6 text-2xs text-muted-foreground hover:text-primary cursor-pointer px-1.5"
                  >
                    <Icons.edit className="size-3 mr-1" />
                    Edit .md
                  </Button>
                </div>
                <p className="text-xs text-foreground font-medium">
                  {bp?.audience || "Belum dikonfigurasi. Tentukan target audiens di Settings."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-extrabold text-primary uppercase tracking-wider">
                    Gaya Bahasa (Tone of Voice)
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenBrandEditor("voice.md")}
                    className="h-6 text-2xs text-muted-foreground hover:text-primary cursor-pointer px-1.5"
                  >
                    <Icons.edit className="size-3 mr-1" />
                    Edit voice.md
                  </Button>
                </div>
                <p className="text-xs text-foreground font-medium">
                  {bp?.voice || "Belum dikonfigurasi. Tulis panduan lengkap di voice.md."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-extrabold text-primary uppercase tracking-wider">
                    Sudut Pandang (POV)
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenBrandEditor("brand-profile.md")}
                    className="h-6 text-2xs text-muted-foreground hover:text-primary cursor-pointer px-1.5"
                  >
                    <Icons.edit className="size-3 mr-1" />
                    Edit .md
                  </Button>
                </div>
                <p className="text-xs text-foreground font-medium">
                  {bp?.pov || "Belum dikonfigurasi."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-extrabold text-primary uppercase tracking-wider">
                    Bukti Kredibilitas (Proof)
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenBrandEditor("brand-profile.md")}
                    className="h-6 text-2xs text-muted-foreground hover:text-primary cursor-pointer px-1.5"
                  >
                    <Icons.edit className="size-3 mr-1" />
                    Edit .md
                  </Button>
                </div>
                <p className="text-xs text-foreground font-medium">
                  {bp?.proof || "Belum dikonfigurasi."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-extrabold text-destructive uppercase tracking-wider">
                    Pantangan / Never-List (Guardrails)
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenBrandEditor("guardrails.md")}
                    className="h-6 text-2xs text-destructive hover:bg-destructive/10 cursor-pointer px-1.5"
                  >
                    <Icons.edit className="size-3 mr-1" />
                    Edit guardrails.md
                  </Button>
                </div>
                <p className="text-xs text-foreground font-medium">
                  {bp?.guardrails || "Belum ada pantangan yang dispesifikasikan."}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-foreground">
                  Pilar Konten Utama (Content Pillars)
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenBrandEditor("content-pillars.md")}
                  className="h-6 text-2xs text-primary font-bold cursor-pointer px-1.5"
                >
                  <Icons.edit className="size-3 mr-1" />
                  Kelola Alokasi di content-pillars.md
                </Button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {bp?.pillars && bp.pillars.length > 0 ? (
                  bp.pillars.map((pillar, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border-primary/20"
                    >
                      {pillar}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    Belum ada pilar konten terdaftar.
                  </span>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 5: 106 PLAYBOOKS & 17 TOPIC PACKS                        */}
        {/* ============================================================ */}
        <TabsContent value="playbooks" className="space-y-6">
          <SkillCatalogView clientId={clientId} clientName={client?.name || "Klien"} />
        </TabsContent>
      </Tabs>

      <BrandBrainEditorDialog
        open={brandEditorOpen}
        onOpenChange={setBrandEditorOpen}
        clientId={clientId}
        clientName={client?.name || "Client"}
        initialPath={brandEditorPath}
      />

      <SkillInterviewModal
        open={isInterviewOpen}
        onOpenChange={(open) => {
          setIsInterviewOpen(open)
          if (!open) {
            void setInterviewParam(null, { shallow: true })
            void setActiveInterviewSkillId(null, { shallow: true })
          }
        }}
        skill={interviewSkillDetail?.skill || (activeInterviewSkillId === "brand-profile" ? {
          id: "brand-profile",
          name: "brand-profile",
          description: "Rancang profil brand komprehensif, target audiens, dan pilar komunikasi bersama AI.",
          category: "Foundation & strategy",
          job: "Rancang profil brand komprehensif bersama AI",
          allowed_tools: null,
        } : null)}
        clientId={clientId || ""}
        clientName={client?.name || "Klien"}
      />
    </PageContainer>
  )
}
