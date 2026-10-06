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
import { useAppStore } from "@/lib/store/app-store"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { useCurrentUser } from "@/lib/auth/use-current-user"
import { PlatformIcon } from "@/components/calendar/platform-icon"
import { toast } from "sonner"
import { AssetPicker } from "@/components/library/asset-picker"
import type { Asset, AssetFileType } from "@/features/library/api/types"
import { useGenerateCaption, useGenerateVideoScript, useRepurposeCrossPlatform } from "@/features/copilot/api/queries"
import { useCreateScheduledPost } from "@/features/scheduled-posts/api/queries"
import type { GeneratedVideoScript } from "@/features/copilot/api/types"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  tiktok: "#00f2fe",
  youtube: "#FF0000",
  linkedin: "#0077b5",
  facebook: "#1877F2",
  twitter: "#1DA1F2",
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

  const { mutate: generateAI, isPending: isGenerating } = useGenerateCaption()
  const { mutateAsync: generateVideo, isPending: isGeneratingVideo } = useGenerateVideoScript()
  const { mutateAsync: repurposeAI, isPending: isRepurposing } = useRepurposeCrossPlatform()

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
      }, 1500)
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
      }, 1800)
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
        toast.success("Script Video Siap! 🎬", {
          description: `Mood: ${result.script.overallMood} | ${result.script.scenes.length} Scene dirancang.`
        })
        // Format the script and put it in content field as backup
        const textScript = result.script.scenes.map(s => 
          `[${s.timecode}] ${s.toolRoute ? `(${s.toolRoute})` : ''}\nVis: ${s.visual}\nAud: ${s.audio}`
        ).join("\n\n")
        setContent(`VIDEO SCRIPT: ${result.script.title}\nMood: ${result.script.overallMood}\n\n${textScript}`)
      }
    } catch (err: any) {
      toast.error("Gagal generate video script")
    }
  }

  const handleGenerateCopilot = () => {
    if (!title) {
      toast.error("Mohon isi judul / topik terlebih dahulu")
      return
    }
    generateAI({
      clientId,
      topic: title,
      platform: platforms[0] || connectedChannels[0]?.platform?.toLowerCase() || "instagram",
      goal: "awareness",
    }, {
      onSuccess: (data) => {
        if (data.error) {
          toast.error(data.error)
        } else {
          setContent(data.caption)
          toast.success("Copywriting Selesai! ✍️", {
            description: "Copilot telah meracik caption beserta hashtag untuk Anda."
          })
        }
      },
      onError: (err) => {
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
        res.repurposed.results.forEach(r => {
          newMap[r.platform.toLowerCase()] = r.content
        })
        setRepurposedContents(newMap)
        toast.success("Adaptasi Platform Selesai! 🚀", {
          description: `Konten berhasil di-repurpose untuk ${platforms.join(', ')}.`
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

      toast.success("Konten Dijadwalkan! 🗓️", {
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
        <Link href={`/admin/social-accounts?clientId=${clientId}`}>
          <Button className="bg-[hsl(var(--admin-cobalt))] hover:bg-[#2333e7] text-white shadow-md font-bold px-8 py-6 rounded-xl">
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
            const current = step === s.id
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
                  <Icon className={cn("size-6", current && "animate-pulse")} />
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
                  <span className="text-[10px] text-[hsl(var(--admin-outline))] hidden sm:block">
                    {s.desc}
                  </span>
                </div>
              </div>
            )
          })}
          {/* Connecting dashed line behind steps */}
          <div className="absolute top-6 left-0 w-full h-[2px] bg-gradient-to-r from-[hsl(var(--admin-cobalt))]/10 to-[hsl(var(--admin-cobalt))]/10 -z-10 px-[10%]" />
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
                  <Label>Judul Postingan / Referensi Internal</Label>
                  <Input
                    placeholder="e.g. Campaign Natal 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-12 bg-white/50 border-white"
                  />
                </div>
                <div className="flex gap-2 p-1 bg-muted/50 rounded-lg mb-4">
                  <button 
                    onClick={() => setContentMode("standard")} 
                    className={cn("flex-1 py-1.5 text-sm font-medium rounded-md transition-all", contentMode === "standard" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:bg-white/50")}
                  >
                    Standard Content
                  </button>
                  <button 
                    onClick={() => setContentMode("video_script")} 
                    className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-medium rounded-md transition-all", contentMode === "video_script" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:bg-white/50")}
                  >
                    <Icons.sparkles className="size-4" /> AI Video Script
                  </button>
                </div>
                  
                {contentMode === "standard" ? (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Label>Caption & Copywriting</Label>
                          <div className="w-[140px]">
                            <Select 
                              value={platforms[0] || (connectedChannels[0]?.platform ? connectedChannels[0].platform.toLowerCase() : "instagram")}
                              onValueChange={(val) => {
                                if (val && !platforms.includes(val)) {
                                  setPlatforms([val])
                                }
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
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleGenerateCopilot}
                          disabled={isGenerating}
                          className="text-xs h-7 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200 text-purple-700 hover:bg-purple-50 min-w-[180px] flex justify-start"
                        >
                          <Icons.sparkles className={cn("size-3 mr-1.5 shrink-0", isGenerating && "animate-spin")} />
                          <span className={cn(isGenerating && "animate-pulse")}>
                            {isGenerating ? copilotLoadingMessages[copilotMsgIdx] : "Generate AI Copilot"}
                          </span>
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Tulis pesan brilian Anda di sini, atau gunakan AI Copilot..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[160px] bg-white/50 border-white resize-none"
                        disabled={isGenerating}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Media Lampiran</Label>
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
                        <button
                          onClick={() => setPickerOpen(true)}
                          className="w-full h-32 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[hsl(var(--admin-outline-variant))] bg-white/30 hover:bg-white/60 transition-colors text-[hsl(var(--admin-outline))]"
                        >
                          <Icons.media className="size-6" />
                          <span className="text-sm font-semibold">Pilih dari Media Library</span>
                        </button>
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
                          <Label>Target Durasi</Label>
                          <select 
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={videoDuration}
                            onChange={(e) => setVideoDuration(e.target.value)}
                          >
                            <option value="15 seconds">15 Detik (Shorts/Reels)</option>
                            <option value="30 seconds">30 Detik (Standard)</option>
                            <option value="60 seconds">60 Detik (Deep Dive)</option>
                          </select>
                        </div>
                        <Button 
                          onClick={handleGenerateVideoScript}
                          disabled={isGeneratingVideo || !title}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[200px]"
                        >
                          {isGeneratingVideo ? (
                            <>
                              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                              <span className="animate-pulse">{videoLoadingMessages[loadingMsgIdx]}</span>
                            </>
                          ) : (
                            <>
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
                          {videoScriptData.scenes.map((scene: any, idx: number) => (
                            <div key={idx} className="grid grid-cols-12 p-3 text-sm gap-3">
                              <div className="col-span-2 font-medium">{scene.timecode}</div>
                              <div className="col-span-4 text-muted-foreground">{scene.visual}</div>
                              <div className="col-span-4 italic">"{scene.audio}"</div>
                              <div className="col-span-2">
                                <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
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
                      <div className="w-full h-12 bg-slate-100 rounded-lg mb-2 flex items-center justify-center text-slate-300">
                        <Icons.media className="size-5" />
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-[hsl(var(--admin-cobalt))]">KONTEN ANDA</span>
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
                            isSelected ? "bg-emerald-500 scale-100 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-transparent scale-0"
                          )} />
                          
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm border border-black/5 bg-slate-100 flex items-center justify-center text-slate-400">
                            {channel.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={channel.avatar_url} alt={channel.handle || "Avatar"} className="w-full h-full object-cover" />
                            ) : (
                              <IconComp className="size-6" />
                            )}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-white flex items-center justify-center shadow-sm border border-slate-100 p-0.5 text-black">
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
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                              {channel.platform}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {platforms.length > 1 && (
                  <div className="mt-8 p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                          <Icons.sparkles className="size-4 text-indigo-600" />
                          Dapur Transformasi (Repurposing AI)
                        </h4>
                        <p className="text-xs text-indigo-700 mt-1">Otomatis atomisasi dan adaptasi konten secara native ke tiap platform.</p>
                      </div>
                      <Button 
                        onClick={handleRepurpose}
                        disabled={isRepurposing || !content}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm min-w-[220px]"
                      >
                        {isRepurposing ? (
                          <>
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            <span className="animate-pulse">{repurposeLoadingMessages[repurposeMsgIdx]}</span>
                          </>
                        ) : (
                          <>
                            <Icons.sparkles className="mr-2 h-4 w-4" />
                            Adaptasi per Platform
                          </>
                        )}
                      </Button>
                    </div>

                    {Object.keys(repurposedContents).length > 0 && (
                      <div className="space-y-4 mt-6">
                        {platforms.map(p => {
                          const val = repurposedContents[p.toLowerCase()]
                          if (!val) return null
                          const channel = connectedChannels.find(c => c.platform.toLowerCase() === p.toLowerCase())
                          const color = PLATFORM_COLORS[p.toLowerCase()] || "#6366f1"
                          const IconComp = Icons[p.toLowerCase() as keyof typeof Icons] || Icons.hub

                          return (
                            <div key={p} className="bg-white p-4 rounded-xl shadow-sm border border-indigo-50 space-y-2">
                              <div className="flex items-center gap-2 font-bold text-sm" style={{ color }}>
                                <IconComp className="size-4" /> {channel?.handle || p}
                              </div>
                              <Textarea 
                                value={val}
                                onChange={(e) => setRepurposedContents(prev => ({...prev, [p.toLowerCase()]: e.target.value}))}
                                className="min-h-[100px] text-sm bg-slate-50"
                              />
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
                  <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm max-w-lg mx-auto text-left flex items-start gap-3">
                    <Icons.alertCircle className="size-5 shrink-0 text-amber-600" />
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
              <Button onClick={() => setStep((s) => s + 1)} className="bg-[hsl(var(--admin-cobalt))] hover:bg-[#2333e7] text-white">
                Selanjutnya
              </Button>
            ) : (
              <Button onClick={handlePublish} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
                {loading ? "Menjadwalkan..." : "Jadwalkan & Publish Otomatis"}
              </Button>
            )}
          </div>
        </div>

        {/* Benefits Sidebar (from User image reference) */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[hsl(var(--admin-surface-low))] border border-white/80 shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
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
          <div className="p-4 rounded-xl bg-emerald-600 text-white shadow-lg flex items-start gap-3 border border-emerald-500">
            <div className="p-2 rounded-lg bg-white/20">
              <Icons.rocket className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Auto Posting</h4>
              <p className="text-xs text-emerald-50 mt-1">Satu konten, banyak tujuan. Sistem akan menangani distribusi otomatis sesuai batas API platform.</p>
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
