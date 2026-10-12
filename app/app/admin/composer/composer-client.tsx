"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useRouter } from "next/navigation"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { useCurrentUser } from "@/lib/auth/use-current-user"
import { toast } from "sonner"
import { AssetPicker } from "@/components/library/asset-picker"
import type { Asset, AssetFileType } from "@/features/library/api/types"
import { useGenerateCaption, useGenerateVideoScript, useRepurposeCrossPlatform, useGenerateHooks, useGenerateCarousel, useValidatePlatformPost, useGenerateVisualPrompt } from "@/features/copilot/api/queries"
import { useCreateScheduledPost } from "@/features/scheduled-posts/api/queries"
import type { GeneratedVideoScript, HookOption, PostValidationResult, VisualPromptResult } from "@/features/copilot/api/types"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"
import Link from "next/link"

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "var(--platform-instagram)",
  tiktok: "var(--platform-tiktok)",
  youtube: "var(--platform-youtube)",
  linkedin: "var(--platform-linkedin)",
  facebook: "var(--platform-facebook)",
  twitter: "var(--platform-twitter)",
}

const STEPS = [
  { id: 1, label: "Tulis / Upload", icon: "edit", desc: "Buat konten sekali" },
  { id: 2, label: "Pilih Platform", icon: "hub", desc: "Satu ke banyak" },
  { id: 3, label: "Atur Jadwal", icon: "calendar_month", desc: "Tentukan waktu" },
  { id: 4, label: "Publish", icon: "rocket", desc: "Otomatisasi rilis" },
]

export function ComposerClient() {
  const router = useRouter()
  const { clientId, client: activeClient } = useActiveDashboard()
  const { authorName } = useCurrentUser()
  
  const { mutateAsync: createPost } = useCreateScheduledPost()

  const [step, setStep] = useState(1)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [copilotPlatform, setCopilotPlatform] = useState<string | null>(null)
  const [mediaUrl, setMediaUrl] = useState("")
  const [mediaType, setMediaType] = useState<AssetFileType>("image")
  const [pickerOpen, setPickerOpen] = useState(false)
  const connectedChannels = activeClient?.channels?.filter(c => c.status === "terhubung") || []
  const [platforms, setPlatforms] = useState<string[]>([])
  const [dateStr, setDateStr] = useState("")
  const [timeStr, setTimeStr] = useState("09:00")
  const [loading, setLoading] = useState(false)

  const todayStr = new Date().toISOString().split("T")[0]
  const [contentMode, setContentMode] = useState<"standard" | "video_script">("standard")
  const [videoDuration, setVideoDuration] = useState("30 seconds")
  const [videoScriptData, setVideoScriptData] = useState<GeneratedVideoScript | null>(null)
  
  const [repurposedContents, setRepurposedContents] = useState<Record<string, string>>({})
  const [repurposedMeta, setRepurposedMeta] = useState<Record<string, { format?: string; hook?: string; callToAction?: string; registerNote?: string }>>({})
  const [coreAtom, setCoreAtom] = useState<string | null>(null)

  // Social Media Skills format selection
  const [aiFormat, setAiFormat] = useState<"caption" | "carousel" | "hooks" | "video_script">("caption")
  const [hookOptions, setHookOptions] = useState<HookOption[] | null>(null)
  const [validationResult, setValidationResult] = useState<PostValidationResult | null>(null)

  const [visualPromptResult, setVisualPromptResult] = useState<VisualPromptResult | null>(null)

  const { mutate: generateAI, isPending: isGenerating } = useGenerateCaption()
  const { mutateAsync: generateVideo, isPending: isGeneratingVideo } = useGenerateVideoScript()
  const { mutateAsync: repurposeAI, isPending: isRepurposing } = useRepurposeCrossPlatform()
  const { mutateAsync: generateCarouselMutate, isPending: isGeneratingCarousel } = useGenerateCarousel()
  const { mutateAsync: generateHooksMutate, isPending: isGeneratingHooks } = useGenerateHooks()
  const { mutateAsync: validatePostMutate, isPending: isValidatingPost } = useValidatePlatformPost()
  const { mutateAsync: generateVisualPromptMutate, isPending: isGeneratingVisualPrompt } = useGenerateVisualPrompt()

  const isAnyAiLoading = isGenerating || isGeneratingCarousel || isGeneratingHooks || isGeneratingVideo || isGeneratingVisualPrompt

  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const videoLoadingMessages = [
    "Membedah Brand DNA...",
    "Menyusun alur cerita...",
    "Merancang visual & audio...",
    "Menentukan tool terbaik...",
    "Finalisasi script..."
  ]

  const [copilotMsgIdx, setCopilotMsgIdx] = useState(0)
  const copilotLoadingMessages = [
    "Membaca konteks brand...",
    "Menyesuaikan tone of voice...",
    "Menulis copywriting...",
    "Menambahkan hashtag & call-to-action...",
    "Merapikan format..."
  ]

  const [repurposeMsgIdx, setRepurposeMsgIdx] = useState(0)
  const repurposeLoadingMessages = [
    "Menganalisis konten dasar...",
    "Memetakan behavior platform...",
    "Ekstraksi poin kunci...",
    "Membangun hook spesifik...",
    "Finalisasi adaptasi..."
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isGeneratingVideo) {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % videoLoadingMessages.length)
      }, 2000)
    } else {
      setLoadingMsgIdx(0)
    }
    return () => clearInterval(interval)
  }, [isGeneratingVideo])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isGenerating) {
      interval = setInterval(() => {
        setCopilotMsgIdx(prev => (prev + 1) % copilotLoadingMessages.length)
      }, 2000)
    } else {
      setCopilotMsgIdx(0)
    }
    return () => clearInterval(interval)
  }, [isGenerating])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRepurposing) {
      interval = setInterval(() => {
        setRepurposeMsgIdx(prev => (prev + 1) % repurposeLoadingMessages.length)
      }, 2000)
    } else {
      setRepurposeMsgIdx(0)
    }
    return () => clearInterval(interval)
  }, [isRepurposing])

  const handleGenerateVideoScript = async () => {
    if (!title) {
      toast.error("Mohon isi judul / topik untuk acuan video script")
      return
    }
    try {
      const result = await generateVideo({
        clientId,
        topic: title,
        duration: videoDuration
      })
      if (result.error) {
        toast.error(result.error)
      } else if (result.script) {
        setVideoScriptData(result.script)
        toast.success("Script Video Siap!", {
          description: `Mood: ${result.script.overallMood} | ${result.script.scenes.length} Scene dirancang.`
        })
        const textScript = result.script.scenes.map(s => 
          `[${s.timecode}] ${s.toolRoute ? `(${s.toolRoute})` : ''}\nVis: ${s.visual}\nAud: ${s.audio}`
        ).join("\n\n")
        setContent(`VIDEO SCRIPT: ${result.script.title}\nMood: ${result.script.overallMood}\n\n${textScript}`)
      }
    } catch {
      toast.error("Gagal generate video script")
    }
  }

  const handleGenerateCarousel = async (targetPlatform: string) => {
    try {
      const res = await generateCarouselMutate({
        clientId,
        topic: title,
        slideCount: 5,
        platform: targetPlatform,
      })
      if (res.error) {
        toast.error(res.error)
      } else if (res.carousel) {
        const slidesText = res.carousel.slides.map(s =>
          `[SLIDE ${s.slideNumber}: ${s.role.toUpperCase()}]\nHeadline: ${s.headline}\nText: ${s.bodyText}\nVisual Direction: ${s.visualDirection}`
        ).join("\n\n---\n\n")
        setContent(`CAROUSEL: ${res.carousel.title}\n\n${slidesText}\n\n---\nCAPTION:\n${res.carousel.accompanyingCaption}`)
        toast.success("Carousel Studio Selesai!", {
          description: `${res.carousel.slides.length} slide dan visual brief berhasil diracik.`
        })
      }
    } catch {
      toast.error("Gagal generate carousel")
    }
  }

  const handleGenerateHooks = async (targetPlatform: string) => {
    try {
      const res = await generateHooksMutate({
        clientId,
        topic: title,
        platform: targetPlatform,
      })
      if (res.error) {
        toast.error(res.error)
      } else if (res.hooks) {
        setHookOptions(res.hooks)
        toast.success("Hook Matrix Siap!", {
          description: `${res.hooks.length} variasi hook scroll-stopper berhasil diracik.`
        })
      }
    } catch {
      toast.error("Gagal generate hooks")
    }
  }

  const handleApplyHook = (hookText: string) => {
    if (!content) {
      setContent(hookText + "\n\n")
    } else {
      const lines = content.split("\n")
      lines[0] = hookText
      setContent(lines.join("\n"))
    }
    toast.success("Hook Terpasang!", {
      description: "Hook berhasil diterapkan di baris pertama caption."
    })
  }

  const handleValidatePost = async () => {
    if (!content.trim()) {
      toast.error("Mohon isi caption/konten terlebih dahulu untuk diaudit.")
      return
    }
    const targetPlatform =
      copilotPlatform ||
      platforms[0] ||
      connectedChannels[0]?.platform?.toLowerCase() ||
      "instagram"

    try {
      const res = await validatePostMutate({
        platform: targetPlatform,
        content,
        mediaType: mediaUrl ? (mediaType === "video" ? "video" : "image") : "text",
      })
      if (res.error) {
        toast.error(res.error)
      } else if (res.result) {
        setValidationResult(res.result)
        toast.success("Audit Platform Selesai!", {
          description: `Skor kepatuhan ${targetPlatform}: ${res.result.score}/100`
        })
      }
    } catch {
      toast.error("Gagal memvalidasi konten")
    }
  }

  const handleGenerateVisualPrompt = async () => {
    if (!title && !content) {
      toast.error("Mohon isi judul atau caption terlebih dahulu untuk acuan visual.")
      return
    }
    try {
      const res = await generateVisualPromptMutate({
        clientId,
        topic: title || content.slice(0, 50),
        postCaption: content,
        mediaType: mediaType === "video" ? "video" : "image",
      })
      if (res.error) {
        toast.error(res.error)
      } else if (res.result) {
        setVisualPromptResult(res.result)
        toast.success("Visual Prompt Siap!", {
          description: `Rekomendasi tool: ${res.result.recommendedTool.toUpperCase()} (${res.result.aspectRatio})`
        })
      }
    } catch {
      toast.error("Gagal generate visual prompt")
    }
  }

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Prompt Disalin!", {
      description: "Prompt visual siap di-paste ke Ideogram / Flux / Midjourney."
    })
  }

  const handleGenerateCopilot = () => {
    if (!title) {
      toast.error("Mohon isi judul / topik terlebih dahulu")
      return
    }
    const targetPlatform =
      copilotPlatform ||
      platforms[0] ||
      connectedChannels[0]?.platform?.toLowerCase() ||
      "instagram"

    if (aiFormat === "carousel") {
      handleGenerateCarousel(targetPlatform)
      return
    }
    if (aiFormat === "hooks") {
      handleGenerateHooks(targetPlatform)
      return
    }
    if (aiFormat === "video_script") {
      handleGenerateVideoScript()
      return
    }

    generateAI({
      clientId,
      topic: title,
      platform: targetPlatform,
      goal: "awareness",
    }, {
      onSuccess: (data) => {
        if (data.error) {
          toast.error(data.error)
        } else {
          setContent(data.caption)
          toast.success("Copywriting Selesai!", {
            description: "Copilot telah meracik caption beserta hashtag untuk Anda."
          })
        }
      },
      onError: () => {
        toast.error("Gagal generate caption")
      }
    })
  }

  const handleRepurpose = async () => {
    if (!content) {
      toast.error("Mohon isi Standard Content terlebih dahulu sebelum melakukan adaptasi platform.")
      return
    }
    if (platforms.length <= 1) {
      toast.error("Pilih lebih dari satu platform untuk melihat efek adaptasi konten.")
      return
    }
    try {
      const res = await repurposeAI({
        clientId,
        baseContent: content,
        platforms,
      })
      if (res.error) {
        toast.error(res.error)
      } else if (res.repurposed) {
        const newMap: Record<string, string> = {}
        const newMeta: Record<string, { format?: string; hook?: string; callToAction?: string; registerNote?: string }> = {}
        res.repurposed.results.forEach(r => {
          newMap[r.platform.toLowerCase()] = r.content
          newMeta[r.platform.toLowerCase()] = {
            format: r.format,
            hook: r.hook,
            callToAction: r.callToAction,
            registerNote: r.registerNote,
          }
        })
        setRepurposedContents(newMap)
        setRepurposedMeta(newMeta)
        setCoreAtom(res.repurposed.coreAtom || null)
        toast.success("Adaptasi Platform Selesai!", {
          description: `Konten berhasil di-atomize & adaptasi untuk ${platforms.join(', ')}.`
        })
      }
    } catch (err) {
      toast.error("Gagal mengadaptasi konten.")
    }
  }

  const togglePlatform = (id: string) => {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handlePublish = async () => {
    if (!title || !dateStr || !timeStr || platforms.length === 0) {
      toast.error("Mohon lengkapi semua data wajib.")
      return
    }

    if (!content.trim() && !mediaUrl) {
      toast.error("Validasi Gagal: Anda harus mengisi Caption (Teks) atau mengunggah Media.")
      return
    }

    const scheduledDateObj = new Date(`${dateStr}T${timeStr}:00`)
    const now = new Date()
    const diffMins = (scheduledDateObj.getTime() - now.getTime()) / 1000 / 60

    if (diffMins < 2) {
      toast.error("Validasi Gagal: Waktu tayang harus setidaknya 2 menit dari sekarang.")
      return
    }

    setLoading(true)
    try {
      const scheduledAt = new Date(`${dateStr}T${timeStr}:00`).toISOString()

      // Insert one scheduled post per selected platform
      for (const p of platforms) {
        const platformContent = repurposedContents[p.toLowerCase()] || content
        await createPost({
          client_id: clientId,
          title,
          content: platformContent,
          platform: p,
          scheduled_at: scheduledAt,
          status: "scheduled",
          author: authorName,
          media_url: mediaUrl || undefined,
        })
      }

      toast.success("Konten Dijadwalkan!", {
        description: `Berhasil dijadwalkan ke ${platforms.length} platform secara bersamaan.`
      })
      router.push(`/admin/calendar?clientId=${clientId}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menjadwalkan.")
    } finally {
      setLoading(false)
    }
  }

  if (!activeClient || !activeClient.channels || activeClient.channels.length === 0 || connectedChannels.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-[hsl(var(--admin-surface-low))] border border-[hsl(var(--admin-outline-variant))]/50 flex items-center justify-center text-[hsl(var(--admin-outline))] mb-2 shadow-sm">
          <Icons.hub className="size-12 opacity-50" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="font-syne font-bold text-2xl text-[hsl(var(--admin-on-surface))]">Akun Belum Terhubung</h2>
          <p className="text-[hsl(var(--admin-outline))] text-sm">
            Anda belum menghubungkan akun media sosial manapun untuk klien ini. Hubungkan setidaknya satu akun untuk mulai membuat dan menjadwalkan konten.
          </p>
        </div>
        <Link href={`/admin/social-accounts${clientId ? `?clientId=${clientId}` : ""}`}>
          <Button className="bg-[hsl(var(--admin-cobalt))] hover:bg-[hsl(var(--admin-cobalt)/0.85)] text-white shadow-md font-bold px-8 py-6 rounded-xl">
            <Icons.add className="mr-2 size-5" />
            Hubungkan Akun Sekarang
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Visual Stepper based on Frahma Premium Core */}
      <div className="p-6 rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/80 shadow-sm">
        <div className="flex items-center justify-between relative z-10">
          {STEPS.map((s) => {
            const Icon = Icons[s.icon as keyof typeof Icons]
            const active = step >= s.id
            return (
              <div key={s.id} className="flex flex-col items-center gap-2 relative z-10 w-full">
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                    active
                      ? "bg-[hsl(var(--admin-cobalt))] text-white scale-100"
                      : "bg-[hsl(var(--admin-surface-low))] border border-[hsl(var(--admin-outline-variant))]/50 text-[hsl(var(--admin-outline))] scale-95"
                  )}
                >
                  <Icon className="size-6" />
                </div>
                <div className="text-center">
                  <span
                    className={cn(
                      "block text-sm font-bold",
                      active ? "text-[hsl(var(--admin-on-surface))]" : "text-[hsl(var(--admin-outline))]"
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="text-2xs text-[hsl(var(--admin-outline))] hidden sm:block">
                    {s.desc}
                  </span>
                </div>
              </div>
            )
          })}
          {/* Connecting dashed line behind steps */}
          <div className="absolute top-6 left-0 w-full h-[2px] bg-[hsl(var(--admin-cobalt))]/10 -z-10 px-[10%]" />
        </div>
      </div>

      {/* Dynamic Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/80 shadow-sm min-h-[500px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="composer-title">Judul Postingan / Referensi Internal</Label>
                  <Input
                    id="composer-title"
                    placeholder="e.g. Campaign Natal 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-12 bg-white/50 border-white"
                  />
                </div>
                <Tabs value={contentMode} onValueChange={(val) => setContentMode(val as "standard" | "video_script")} className="w-full mb-4">
                  <TabsList className="w-full grid grid-cols-2 h-10 p-1 bg-muted/50 rounded-lg">
                    <TabsTrigger value="standard" className="text-sm font-medium">
                      Standard Content
                    </TabsTrigger>
                    <TabsTrigger value="video_script" className="flex items-center justify-center gap-2 text-sm font-medium">
                      <Icons.sparkles className="size-4" /> AI Video Script
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                  
                {contentMode === "standard" ? (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Label htmlFor="composer-caption">Caption & Copywriting</Label>
                          <div className="w-[130px]">
                            <Select
                              value={
                                copilotPlatform ||
                                platforms[0] ||
                                (connectedChannels[0]?.platform
                                  ? connectedChannels[0].platform.toLowerCase()
                                  : "instagram")
                              }
                              onValueChange={(val) => {
                                if (val) setCopilotPlatform(val)
                              }}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="Platform" />
                              </SelectTrigger>
                              <SelectContent>
                                {connectedChannels.map(c => {
                                  const plat = c.platform || "unknown"
                                  return (
                                    <SelectItem key={c.id} value={plat.toLowerCase()}>{plat}</SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <Tabs value={aiFormat} onValueChange={(val) => setAiFormat(val as any)}>
                            <TabsList className="h-7 p-0.5 bg-muted/40 rounded-lg border border-border/40">
                              <TabsTrigger value="caption" className="px-2 py-0.5 text-2xs font-semibold">
                                Caption
                              </TabsTrigger>
                              <TabsTrigger value="carousel" className="px-2 py-0.5 text-2xs font-semibold">
                                Carousel
                              </TabsTrigger>
                              <TabsTrigger value="video_script" className="px-2 py-0.5 text-2xs font-semibold">
                                Script
                              </TabsTrigger>
                              <TabsTrigger value="hooks" className="px-2 py-0.5 text-2xs font-semibold">
                                Hooks
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleGenerateCopilot}
                          disabled={isAnyAiLoading}
                          className="text-xs h-7 bg-[hsl(var(--admin-surface-low))] border-[hsl(var(--admin-outline-variant))] text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-high))] min-w-[180px] flex justify-start"
                        >
                          {/* Icons.sparkles = AI Copilot caption generator (R-04 exception: AI feature with written justification) */}
                          <Icons.sparkles className={cn("size-3 mr-1.5 shrink-0 text-brand-accent", isAnyAiLoading && "animate-spin")} />
                          {isAnyAiLoading ? (
                            <ShimmeringText
                              text={
                                isGenerating ? copilotLoadingMessages[copilotMsgIdx] : 
                                isGeneratingCarousel ? "Menyusun slide carousel..." :
                                isGeneratingHooks ? "Meracik 5 variasi hook..." :
                                "Generating AI content..."
                              }
                              className="text-xs"
                            />
                          ) : (
                            <span>Generate AI Copilot</span>
                          )}
                        </Button>
                      </div>
                      <Textarea
                        id="composer-caption"
                        placeholder="Tulis pesan brilian Anda di sini, atau gunakan AI Copilot..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[160px] bg-white/50 border-white resize-none"
                        disabled={isAnyAiLoading}
                      />

                      {/* Hook Matrix Display if generated */}
                      {hookOptions && hookOptions.length > 0 && (
                        <div className="p-3 rounded-xl border border-[hsl(var(--admin-outline-variant))] bg-muted/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <Icons.sparkles className="size-3 text-primary" /> Hook Matrix (Pilih Baris Pembuka)
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => setHookOptions(null)} className="h-6 text-2xs">
                              Tutup
                            </Button>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {hookOptions.map((h, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 rounded-lg border border-border/50 bg-background/80 hover:border-primary/50 transition-all flex flex-col justify-between gap-1.5 text-left"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="text-2xs font-bold uppercase tracking-wider text-primary">
                                      {h.angle}
                                    </span>
                                  </div>
                                  <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">
                                    &ldquo;{h.text}&rdquo;
                                  </p>
                                  <p className="text-2xs text-muted-foreground mt-0.5">
                                    {h.explanation}
                                  </p>
                                </div>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleApplyHook(h.text)}
                                  className="h-6 text-2xs self-start mt-1"
                                >
                                  Gunakan Hook Ini
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pre-Flight Platform Validator Action & Report */}
                      <div className="pt-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleValidatePost}
                            disabled={isValidatingPost || !content.trim()}
                            className="h-7 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2"
                          >
                            <Icons.shield className={cn("size-3.5", isValidatingPost && "animate-spin")} />
                            {isValidatingPost ? "Mengaudit Aturan Platform..." : "Audit Kepatuhan Platform (Pre-Flight)"}
                          </Button>
                          {validationResult && (
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-semibold",
                              validationResult.score >= 80 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                            )}>
                              Skor Platform: {validationResult.score}/100
                            </span>
                          )}
                        </div>

                        {validationResult && (
                          <div className="p-3 rounded-xl border border-border/60 bg-background/90 space-y-2 text-xs">
                            <div className="flex items-start gap-2 bg-muted/40 p-2 rounded-lg">
                              <span className="font-semibold shrink-0 text-muted-foreground">Tampilan Feed (Fold Cutoff):</span>
                              <span className="font-medium text-foreground truncate">&ldquo;{validationResult.firstLinePreview}&rdquo; <span className="text-primary font-normal">...more</span></span>
                            </div>
                            {validationResult.issues.length > 0 && (
                              <div className="space-y-1">
                                {validationResult.issues.map((iss, i) => (
                                  <div key={i} className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                                    {iss.severity === "error" ? (
                                      <Icons.warning className="size-3 text-destructive shrink-0" />
                                    ) : (
                                      <Icons.info className="size-3 text-primary shrink-0" />
                                    )}
                                    <span><strong className="text-foreground">{iss.rule}:</strong> {iss.message}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="composer-media">Media Lampiran</Label>
                      {mediaUrl ? (
                        <div className="relative rounded-xl overflow-hidden border border-white/80 shadow-sm max-w-sm">
                          {mediaType === "video" ? (
                            <video src={mediaUrl} controls className="w-full h-48 object-cover bg-black" />
                          ) : (
                            <img src={mediaUrl} alt="Preview" className="w-full h-48 object-cover" />
                          )}
                          <div className="absolute top-2 right-2 flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => setPickerOpen(true)}>
                              Ganti
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => setMediaUrl("")}>
                              Hapus
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setPickerOpen(true)}
                              className="h-28 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[hsl(var(--admin-outline-variant))] bg-white/30 hover:bg-white/60 transition-colors text-[hsl(var(--admin-outline))] cursor-pointer"
                            >
                              <Icons.media className="size-5" />
                              <span className="text-xs font-semibold">Pilih dari Media Library</span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleGenerateVisualPrompt}
                              disabled={isGeneratingVisualPrompt}
                              className="h-28 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors text-primary cursor-pointer"
                            >
                              <Icons.sparkles className={cn("size-5", isGeneratingVisualPrompt && "animate-spin")} />
                              {isGeneratingVisualPrompt ? (
                                <ShimmeringText text="Meracik Prompt Visual..." className="text-xs font-semibold" />
                              ) : (
                                <span className="text-xs font-semibold">Buat AI Visual Prompt (Flux/Ideogram)</span>
                              )}
                            </Button>
                          </div>

                          {/* Visual Prompt Result Card */}
                          {visualPromptResult && (
                            <div className="p-3.5 rounded-xl border border-primary/30 bg-background/95 space-y-2.5 text-xs shadow-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xs font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                    Tool: {visualPromptResult.recommendedTool.toUpperCase()}
                                  </span>
                                  <span className="text-2xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    Rasio: {visualPromptResult.aspectRatio}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setVisualPromptResult(null)}
                                  className="h-6 text-2xs text-muted-foreground"
                                >
                                  Tutup
                                </Button>
                              </div>
                              <p className="text-2xs text-muted-foreground">
                                <strong>Brief:</strong> {visualPromptResult.brief}
                              </p>
                              <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-2xs font-bold text-muted-foreground">PROMPT MODEL</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopyPrompt(visualPromptResult.prompt)}
                                    className="h-6 text-2xs flex items-center gap-1"
                                  >
                                    <Icons.copy className="size-3" /> Salin Prompt
                                  </Button>
                                </div>
                                <p className="text-xs font-mono text-foreground select-all bg-background/60 p-2 rounded">
                                  {visualPromptResult.prompt}
                                </p>
                              </div>
                              {visualPromptResult.textOverlay && (
                                <div className="text-2xs text-muted-foreground">
                                  <strong>Teks Gambar (Typography):</strong> &ldquo;{visualPromptResult.textOverlay}&rdquo;
                                </div>
                              )}
                              <div className="text-2xs text-muted-foreground">
                                <strong>Harmoni Warna Brand:</strong> {visualPromptResult.brandColorNotes}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl border bg-white/50 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-sm">AI Video Director (BRIEF Framework)</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Sistem akan menyusun naskah dan merekomendasikan AI Video Tool (Veo, Kling, HeyGen, ElevenLabs, dll).</p>
                        </div>
                      </div>
                      <div className="flex items-end gap-3">
                        <div className="space-y-1.5 flex-1">
                          <Label htmlFor="composer-duration" className="text-xs font-semibold">Target Durasi</Label>
                          <Tabs value={videoDuration} onValueChange={setVideoDuration}>
                            <TabsList className="w-full grid grid-cols-3 h-10 p-1 bg-muted rounded-xl">
                              <TabsTrigger value="15 seconds" className="text-xs font-bold rounded-lg py-1">15s (Shorts)</TabsTrigger>
                              <TabsTrigger value="30 seconds" className="text-xs font-bold rounded-lg py-1">30s (Standard)</TabsTrigger>
                              <TabsTrigger value="60 seconds" className="text-xs font-bold rounded-lg py-1">60s (Deep Dive)</TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
                        <Button 
                          onClick={handleGenerateVideoScript}
                          disabled={isGeneratingVideo || !title}
                          className="bg-[hsl(var(--admin-cobalt))] hover:bg-[hsl(var(--admin-cobalt)/0.85)] text-[hsl(var(--admin-cobalt-foreground))] min-w-[200px]"
                        >
                          {isGeneratingVideo ? (
                            <>
                              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                              <span className="animate-pulse">{videoLoadingMessages[loadingMsgIdx]}</span>
                            </>
                          ) : (
                            <>
                              {/* Icons.sparkles = AI script generation action (R-04 exception: AI feature with written justification) */}
                              <Icons.sparkles className="mr-2 h-4 w-4" />
                              Generate Script
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {videoScriptData && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">Mood:</span>
                            <span className="text-sm text-muted-foreground">{videoScriptData.overallMood}</span>
                          </div>
                        </div>
                        <div className="overflow-hidden rounded-xl border bg-white/80 shadow-sm divide-y">
                          <div className="grid grid-cols-12 bg-muted/50 p-3 font-semibold text-xs text-muted-foreground">
                            <div className="col-span-2">Time</div>
                            <div className="col-span-4">Visual / Scene</div>
                            <div className="col-span-4">Audio / Voiceover</div>
                            <div className="col-span-2">Tool Route</div>
                          </div>
                        {videoScriptData.scenes.map((scene: GeneratedVideoScript['scenes'][number], idx: number) => (
                            <div key={idx} className="grid grid-cols-12 p-3 text-sm gap-3">
                              <div className="col-span-2 font-medium">{scene.timecode}</div>
                              <div className="col-span-4 text-muted-foreground">{scene.visual}</div>
                              <div className="col-span-4 italic">"{scene.audio}"</div>
                              <div className="col-span-2">
                                <span className="inline-flex items-center rounded-md bg-[hsl(var(--admin-cobalt-fixed))] px-2 py-1 text-2xs font-semibold text-[hsl(var(--admin-cobalt-fixed-foreground))] ring-1 ring-inset ring-[hsl(var(--admin-cobalt-fixed-foreground))/10]">
                                  {scene.toolRoute || "Auto"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="font-syne font-bold text-lg text-[hsl(var(--admin-on-surface))]">
                    1 Konten, Banyak Platform
                  </h3>
                  <p className="text-sm text-[hsl(var(--admin-outline))]">
                    Pilih akun dan jaringan distribusi untuk konten ini.
                  </p>
                </div>
                
                {/* Visual Branching Diagram Implementation */}
                <div className="relative py-12 flex justify-between items-center bg-white/30 rounded-2xl p-6 border border-white/60">
                  {/* Left: Content Origin */}
                  <div className="z-10 w-24 h-24 rounded-2xl bg-white shadow-lg border border-[hsl(var(--admin-cobalt))]/30 flex flex-col items-center justify-center p-2 relative">
                    {mediaUrl ? (
                      <img src={mediaUrl} className="w-full h-12 object-cover rounded-lg mb-2" alt="thumb" />
                    ) : (
                      <div className="w-full h-12 bg-muted rounded-lg mb-2 flex items-center justify-center text-muted-foreground/40">
                        <Icons.media className="size-5" />
                      </div>
                    )}
                    <span className="text-2xs font-bold text-[hsl(var(--admin-cobalt))]">Konten Anda</span>
                    {/* Source dot for lines */}
                    <div id="source-dot" className="absolute right-0 translate-x-1/2 w-3 h-3 rounded-full bg-[hsl(var(--admin-cobalt))]" />
                  </div>

                  {/* SVG Lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full" preserveAspectRatio="none">
                      {connectedChannels.map((channel, i) => {
                        const optPlatform = channel.platform.toLowerCase()
                        if (!platforms.includes(optPlatform)) return null
                        const color = PLATFORM_COLORS[optPlatform] || "#6366f1"
                        const startY = 96 // approx center of left box relative to container
                        const endY = 48 + (i * 60) // approximate vertical spacing of right targets
                        return (
                          <motion.path
                            key={channel.id}
                            d={`M 120,${startY} C 200,${startY} 200,${endY} 380,${endY}`}
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            strokeDasharray="4 4"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                          />
                        )
                      })}
                    </svg>
                  </div>

                  {/* Right: Platform Destinations (Factual) */}
                  <div className="z-10 flex flex-col gap-4">
                    {connectedChannels.map((channel) => {
                      const optPlatform = channel.platform.toLowerCase()
                      const isSelected = platforms.includes(optPlatform)
                      const IconComp = Icons[optPlatform as keyof typeof Icons] || Icons.hub

                      return (
                        <div
                          key={channel.id}
                          className={cn(
                            "flex items-center gap-4 relative cursor-pointer p-3 rounded-2xl border transition-all duration-300",
                            isSelected ? "bg-white border-[hsl(var(--admin-cobalt))]/40 shadow-md" : "bg-white/30 border-white/50 grayscale opacity-70 hover:grayscale-0 hover:opacity-100"
                          )}
                          onClick={() => togglePlatform(optPlatform)}
                        >
                          <div className={cn(
                            "absolute -left-4 w-3 h-3 rounded-full -translate-x-full transition-all",
                            isSelected ? "bg-[hsl(var(--success))] scale-100 shadow-[0_0_8px_hsl(var(--success)/0.5)]" : "bg-transparent scale-0"
                          )} />
                          
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm border border-border/40 bg-muted flex items-center justify-center text-muted-foreground">
                            {channel.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={channel.avatar_url} alt={channel.handle || "Avatar"} className="w-full h-full object-cover" />
                            ) : (
                              <IconComp className="size-6" />
                            )}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-card flex items-center justify-center shadow-sm border border-border p-0.5 text-foreground">
                               <IconComp className="w-full h-full" />
                            </div>
                          </div>

                          <div className="min-w-0 pr-4">
                            <span className={cn(
                              "block text-sm font-bold truncate",
                              isSelected ? "text-[hsl(var(--admin-on-surface))]" : "text-[hsl(var(--admin-outline))]"
                            )}>
                              {channel.handle || "Akun Terhubung"}
                            </span>
                            <span className="text-2xs text-muted-foreground font-semibold">
                              {channel.platform}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {platforms.length > 1 && (
                  <div className="mt-8 p-6 rounded-2xl bg-[hsl(var(--admin-cobalt))/5] border border-[hsl(var(--admin-cobalt)/10)]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-[hsl(var(--admin-cobalt-foreground))] flex items-center gap-2">
                          {/* Icons.sparkles = AI repurposing feature (R-04 exception: AI feature with written justification) */}
                          <Icons.sparkles className="size-4 text-[hsl(var(--admin-cobalt))]" />
                          Repurpose Lintas Platform (AI)
                        </h4>
                        <p className="text-xs text-[hsl(var(--admin-cobalt)/80)] mt-1">Otomatisasi format dan gaya konten untuk setiap platform.</p>
                      </div>
                      <Button 
                        onClick={handleRepurpose}
                        disabled={isRepurposing || !content}
                        className="bg-[hsl(var(--admin-cobalt))] hover:bg-[hsl(var(--admin-cobalt)/0.85)] text-white shadow-sm min-w-[220px]"
                      >
                        {isRepurposing ? (
                          <>
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            <span className="animate-pulse">{repurposeLoadingMessages[repurposeMsgIdx]}</span>
                          </>
                        ) : (
                          <>
                            {/* Icons.sparkles = AI cross-platform adaptation action (R-04 exception: AI feature with written justification) */}
                            <Icons.sparkles className="mr-2 h-4 w-4" />
                            Adaptasi per Platform
                          </>
                        )}
                      </Button>
                    </div>

                    {coreAtom && (
                      <div className="mt-5 p-3.5 rounded-xl bg-card border border-border/40 shadow-sm space-y-1">
                        <span className="text-2xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Icons.target className="size-3 text-primary" />
                          Core Reusable Atom (Ide Inti yang Diekstrak)
                        </span>
                        <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                          {coreAtom}
                        </p>
                      </div>
                    )}

                    {Object.keys(repurposedContents).length > 0 && (
                      <div className="space-y-4 mt-4">
                        {platforms.map(p => {
                          const val = repurposedContents[p.toLowerCase()]
                          if (!val) return null
                          const meta = repurposedMeta[p.toLowerCase()]
                          const channel = connectedChannels.find(c => c.platform.toLowerCase() === p.toLowerCase())
                          const color = PLATFORM_COLORS[p.toLowerCase()] || "#6366f1"
                          const IconComp = Icons[p.toLowerCase() as keyof typeof Icons] || Icons.hub

                          return (
                            <div key={p} className="bg-card p-4 rounded-xl shadow-sm border border-border/40 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 font-bold text-sm" style={{ color }}>
                                  <IconComp className="size-4" /> {channel?.handle || p}
                                </div>
                                <div className="flex items-center gap-2">
                                  {meta?.format && (
                                    <Badge variant="outline" className="text-2xs font-semibold">
                                      {meta.format}
                                    </Badge>
                                  )}
                                  {meta?.registerNote && (
                                    <span className="text-2xs text-muted-foreground hidden sm:inline" title={meta.registerNote}>
                                      • {meta.registerNote}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {meta?.hook && (
                                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/30 text-xs">
                                  <span className="font-bold text-2xs text-muted-foreground uppercase tracking-wider block mb-0.5">
                                    Native Hook:
                                  </span>
                                  <span className="italic text-foreground/90">"{meta.hook}"</span>
                                </div>
                              )}

                              <Textarea 
                                value={val}
                                onChange={(e) => setRepurposedContents(prev => ({...prev, [p.toLowerCase()]: e.target.value}))}
                                className="min-h-[120px] text-sm bg-muted/20 border-border/40"
                              />

                              {meta?.callToAction && (
                                <div className="text-2xs text-muted-foreground flex items-center justify-between pt-1">
                                  <span><b className="text-foreground">CTA:</b> {meta.callToAction}</span>
                                  <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    onClick={() => {
                                      setContent(val)
                                      toast.success(`Draf utama diisi dengan versi ${p}`)
                                    }}
                                    className="text-primary hover:underline font-semibold cursor-pointer p-0 h-auto text-2xs"
                                  >
                                    Salin ke Draf Utama
                                  </Button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                 <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="date-tayang">Tanggal Tayang</Label>
                    <Input
                      id="date-tayang"
                      type="date"
                      value={dateStr}
                      min={todayStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      className="h-12 bg-white/50 border-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="time-tayang">Waktu Tayang</Label>
                    <Input
                      id="time-tayang"
                      type="time"
                      value={timeStr}
                      onChange={(e) => setTimeStr(e.target.value)}
                      className="h-12 bg-white/50 border-white"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6 text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-[hsl(var(--admin-cobalt))]/10 flex items-center justify-center text-[hsl(var(--admin-cobalt))] mb-4">
                  <Icons.rocket className="size-10" />
                </div>
                <h3 className="font-syne font-bold text-2xl text-[hsl(var(--admin-on-surface))]">
                  Siap Meluncur!
                </h3>
                <p className="text-[hsl(var(--admin-outline))]">
                  Anda akan menjadwalkan <strong>{title || "Konten"}</strong> ke <strong>{platforms.length} platform</strong> pada {dateStr} pukul {timeStr}.
                </p>
                
                {platforms.length > 1 && Object.keys(repurposedContents).length === 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-[hsl(var(--warning))/10] border border-[hsl(var(--warning))/20] text-[hsl(var(--warning))] text-sm max-w-lg mx-auto text-left flex items-start gap-3">
                    <Icons.alertCircle className="size-5 shrink-0 text-[hsl(var(--warning))]" />
                    <div>
                      <span className="font-bold block mb-1">Perhatian: Konten Belum Diadaptasi</span>
                      Anda memilih {platforms.length} platform tapi belum melakukan proses <strong>Repurposing AI</strong> di Langkah 2. Konten standar (caption yang sama persis) akan dipublikasikan secara duplikat ke semua platform.
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stepper Controls */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/60">
            <Button
              variant="outline"
              disabled={step === 1}
              onClick={() => setStep((s) => s - 1)}
            >
              Kembali
            </Button>
            {step < 4 ? (
              <Button onClick={() => setStep((s) => s + 1)} className="bg-[hsl(var(--admin-cobalt))] hover:bg-[hsl(var(--admin-cobalt)/0.85)] text-white">
                Selanjutnya
              </Button>
            ) : (
              <Button onClick={handlePublish} isLoading={loading} className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.9)] text-[hsl(var(--success-foreground))] shadow-lg">
                Jadwalkan & Publish Otomatis
              </Button>
            )}
          </div>
        </div>

        {/* Benefits Sidebar (from User image reference) */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[hsl(var(--admin-surface-low))] border border-white/80 shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]">
              <Icons.clock className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[hsl(var(--admin-on-surface))]">Hemat Waktu Posting</h4>
              <p className="text-xs text-[hsl(var(--admin-outline))] mt-1">Buat sekali, publikasi ke banyak platform sekaligus dalam hitungan detik.</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[hsl(var(--admin-surface-low))] border border-white/80 shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))]">
              <Icons.dashboard className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[hsl(var(--admin-on-surface))]">Satu Dashboard</h4>
              <p className="text-xs text-[hsl(var(--admin-outline))] mt-1">Kelola semua akun dan jadwal media sosial Frahma dalam satu aplikasi.</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] shadow-lg flex items-start gap-3 border border-[hsl(var(--success))]/80">
            <div className="p-2 rounded-lg bg-white/20">
              <Icons.rocket className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Auto Posting</h4>
              <p className="text-xs text-white/80 mt-1">Satu konten, banyak tujuan. Sistem akan menangani distribusi otomatis sesuai batas API platform.</p>
            </div>
          </div>
        </div>
      </div>

      <AssetPicker
        clientId={clientId}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(asset: Asset) => {
          setMediaUrl(asset.url)
          setMediaType(asset.fileType)
        }}
      />
    </div>
  )
}
