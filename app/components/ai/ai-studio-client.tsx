"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQueryState, parseAsString } from "nuqs"
import { format } from "date-fns"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { PageContainer } from "@/components/layout/page-container"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/animate-ui/components/radix/tabs"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"
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
import { useCreateScheduledPost, postKeys } from "@/features/scheduled-posts/api/queries"
import type { GeneratedIdea, TrendEvaluation } from "@/features/copilot/api/types"
import type { BrandProfile } from "@/features/social-accounts/api/types"
import { BrandBrainEditorDialog } from "@/components/ai/brand-brain-editor-dialog"
import type { BrandFileKey } from "@/features/brand-files/api/types"

const STUDIO_TABS = [
  { id: "ideas", label: "Idea Engine", icon: "sparkles", description: "SPARK Ideation Matrix" },
  { id: "batch", label: "Batch Planner", icon: "calendar", description: "Multi-Day Campaign Matrix" },
  { id: "trends", label: "Trend Radar", icon: "trendingUp", description: "Three Gates Vetting" },
  { id: "brand-brain", label: "Brand Brain", icon: "bot", description: "Live DNA & Context" },
] as const

type StudioTab = typeof STUDIO_TABS[number]["id"]

const AVAILABLE_PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "instagram" },
  { id: "tiktok", label: "TikTok", icon: "tiktok" },
  { id: "twitter", label: "Twitter / X", icon: "twitter" },
  { id: "linkedin", label: "LinkedIn", icon: "post" },
]

export function AiStudioClient() {
  const router = useRouter()
  const queryClient = useQueryClient()
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
    void setCurrentTab(val)
  }

  const activeTab: StudioTab = localTab

  // Brand Brain Markdown Studio Dialog State
  const [brandEditorOpen, setBrandEditorOpen] = React.useState(false)
  const [brandEditorPath, setBrandEditorPath] = React.useState<BrandFileKey>("brand-profile.md")

  const handleOpenBrandEditor = (path: BrandFileKey = "brand-profile.md") => {
    setBrandEditorPath(path)
    setBrandEditorOpen(true)
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
    const params = new URLSearchParams()
    if (clientId) params.set("clientId", clientId)
    params.set("topic", idea.title || idea.hook)
    params.set("platform", targetPlatform)
    router.push(`/admin/composer?${params.toString()}`)
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
  const { mutateAsync: createScheduledPostMutate } = useCreateScheduledPost()

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
      let successCount = 0
      for (const post of selected) {
        await createScheduledPostMutate({
          client_id: clientId,
          title: post.title,
          content: post.content,
          platform: post.platform,
          scheduled_at: post.scheduled_at,
          status: "draft",
          notes: post.notes,
          is_reserved: false,
          is_placeholder: false,
        })
        successCount++
      }

      await queryClient.invalidateQueries({ queryKey: postKeys.list(clientId) })
      await queryClient.invalidateQueries({ queryKey: postKeys.all })

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
            onClick={() => router.push(`/admin/composer${clientId ? `?clientId=${clientId}` : ""}`)}
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
                <span className="text-primary font-extrabold">{ideaCount} Ide</span>
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
                  Frekuensi Post per Minggu: <span className="text-primary font-extrabold">{batchPostsPerWeek}x</span>
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
                <Button
                  type="button"
                  onClick={handleScheduleAllBatch}
                  isLoading={isSavingBatch}
                  className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Icons.check className="size-4" />
                  Jadwalkan ({batchPosts.filter((p) => p.selected).length}) ke Kalender
                </Button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border/40">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 bg-secondary/30">
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={batchPosts.length > 0 && batchPosts.every((p) => p.selected)}
                          onChange={(e) => {
                            const val = e.target.checked
                            setBatchPosts(batchPosts.map((p) => ({ ...p, selected: val })))
                          }}
                          className="rounded cursor-pointer"
                        />
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
                          <input
                            type="checkbox"
                            checked={post.selected}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setBatchPosts(
                                batchPosts.map((p, i) => (i === idx ? { ...p, selected: checked } : p))
                              )
                            }}
                            className="rounded cursor-pointer"
                          />
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
                  <Button
                    size="sm"
                    onClick={() => handleAdoptTrendToIdeas(trendResult.remixAngle!)}
                    className="rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Icons.sparkles className="size-3.5" />
                    Racik Ide dari Tren Ini
                  </Button>
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
                  onClick={() => handleOpenBrandEditor("brand-profile.md")}
                  className="rounded-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Icons.bot className="size-3.5" />
                  Buka Markdown Studio (.md)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/admin/settings?tab=brand-profile")}
                  className="rounded-full text-xs font-bold cursor-pointer"
                >
                  Edit Form di Settings
                </Button>
              </div>
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
      </Tabs>

      <BrandBrainEditorDialog
        open={brandEditorOpen}
        onOpenChange={setBrandEditorOpen}
        clientId={clientId}
        clientName={client?.name || "Client"}
        initialPath={brandEditorPath}
      />
    </PageContainer>
  )
}
