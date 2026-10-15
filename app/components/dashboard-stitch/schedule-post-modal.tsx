"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import type { ClientWithChannels } from "@/features/social-accounts/api/types"
import { useCreateScheduledPost } from "@/features/scheduled-posts/api/queries"
import { useGenerateCaption, useGenerateHooks } from "@/features/copilot/api/queries"
import type { HookOption } from "@/features/copilot/api/types"
import { AssetPicker } from "@/components/library/asset-picker"
import type { Asset, AssetFileType } from "@/features/library/api/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/animate-ui/components/radix/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"
import { Button } from "@/components/ui/button"
import { serializeCalendarParams } from "@/lib/searchparams"

const QUICK_CTA_CHIPS = [
  { label: "📲 Link Bio", text: "\n\n👉 Klik link di bio untuk informasi selengkapnya!" },
  { label: "💬 Komen INFO", text: "\n\n💬 Komen 'INFO' untuk kami kirimkan panduan lengkapnya via DM." },
  { label: "📌 Save & Share", text: "\n\n📌 Simpan postingan ini agar tidak lupa & bagikan ke temanmu!" },
  { label: "⚡ Promo Terbatas", text: "\n\n⚡ Promo terbatas khusus minggu ini. Jangan sampai kehabisan!" },
]

const TIME_SLOT_OPTIONS = [
  { time: "09:00", label: "09:00", icon: "☀️" },
  { time: "12:30", label: "12:30", icon: "🌤️" },
  { time: "18:00", label: "18:00", icon: "🌅" },
  { time: "21:00", label: "21:00", icon: "🌙" },
]

/** Gabungkan tanggal (YYYY-MM-DD) + jam (HH:mm) jadi ISO lokal yang aman tanpa RangeError & timezone drift. */
function toIso(dateStr: string, timeStr: string): string {
  if (!dateStr || !timeStr) return new Date().toISOString()
  const [year, month, day] = dateStr.split("-").map(Number)
  const [h, m] = timeStr.split(":").map(Number)
  if (!year || !month || !day) return new Date().toISOString()
  const localDate = new Date(year, month - 1, day, isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0)
  return localDate.toISOString()
}

function getPlatformIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case "instagram":
      return Icons.instagram
    case "tiktok":
      return Icons.tiktok
    case "twitter":
    case "x":
      return Icons.twitter
    case "youtube":
    case "shorts":
      return Icons.youtube
    case "linkedin":
      return Icons.linkedin
    case "facebook":
      return Icons.facebook
    case "whatsapp":
      return Icons.whatsapp
    case "telegram":
      return Icons.telegram
    default:
      return Icons.share
  }
}

function getFormattedDate(d: Date): string {
  const pad = (x: number) => String(x).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function todayStr(): string {
  return getFormattedDate(new Date())
}

function getRelativeDateStr(daysAhead: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return getFormattedDate(d)
}

function getNextWeekendStr(): string {
  const d = new Date()
  const day = d.getDay()
  const daysUntilSaturday = day === 6 ? 7 : 6 - day
  return getRelativeDateStr(daysUntilSaturday)
}

export function SchedulePostModal({
  open,
  client,
  onClose,
  onScheduled,
}: {
  open: boolean
  client: ClientWithChannels | undefined
  onClose: () => void
  onScheduled?: (title: string) => void
}) {
  const router = useRouter()
  const safeChannels = client?.channels ?? []
  const channels = safeChannels.map((a) => a.platform)
  const [title, setTitle] = useState("")
  const [caption, setCaption] = useState("")
  const [selected, setSelected] = useState<string[]>(channels.slice(0, 2))
  const [date, setDate] = useState(todayStr())
  const [when, setWhen] = useState("18:00")
  const [viewTab, setViewTab] = useState<"editor" | "preview">("editor")
  const [hookSuggestions, setHookSuggestions] = useState<HookOption[]>([])
  const [showHookSuggestions, setShowHookSuggestions] = useState(false)
  const [mediaUrl, setMediaUrl] = useState("")
  const [mediaType, setMediaType] = useState<AssetFileType>("image")
  const [pickerOpen, setPickerOpen] = useState(false)

  // Mutasi NYATA ke tabel scheduled_posts (bukan localStorage).
  const { mutateAsync: createPost, isPending } = useCreateScheduledPost()
  const { mutateAsync: generateCaptionMutate, isPending: isGeneratingCaption } = useGenerateCaption()
  const { mutateAsync: generateHooksMutate, isPending: isGeneratingHooks } = useGenerateHooks()

  const handleAiCaption = async () => {
    if (!client?.id) return
    if (!title.trim()) {
      toast.error("Isi Judul Postingan / Konsep terlebih dahulu sebagai topik caption.")
      return
    }
    const toastId = toast.loading("Membuat draf caption AI...")
    try {
      const res = await generateCaptionMutate({
        clientId: client.id,
        platform: selected[0] || "instagram",
        topic: title.trim(),
        goal: "engagement",
      })
      toast.dismiss(toastId)
      if (res.caption) {
        setCaption(res.caption)
        toast.success("Caption berhasil diracik AI sesuai Brand Voice!")
      }
    } catch {
      toast.dismiss(toastId)
      toast.error("Gagal membuat caption AI.")
    }
  }

  const handleGenerateHooks = async () => {
    if (!client?.id) return
    if (!title.trim()) {
      toast.error("Isi Judul Postingan / Konsep terlebih dahulu sebagai topik hook.")
      return
    }
    const toastId = toast.loading("Meracik variasi hook pembuka...")
    try {
      const res = await generateHooksMutate({
        clientId: client.id,
        platform: selected[0] || "instagram",
        topic: title.trim(),
        goal: "engagement",
      })
      toast.dismiss(toastId)
      if (res.error) {
        toast.error(res.error)
        return
      }
      if (res.hooks && res.hooks.length > 0) {
        setHookSuggestions(res.hooks)
        setShowHookSuggestions(true)
        toast.success(`${res.hooks.length} variasi hook siap dipilih!`)
      }
    } catch {
      toast.dismiss(toastId)
      toast.error("Gagal membuat variasi hook.")
    }
  }

  const handleSelectHook = (hookText: string) => {
    if (caption.trim()) {
      setCaption(`${hookText}\n\n${caption.trim()}`)
    } else {
      setCaption(hookText)
    }
    setShowHookSuggestions(false)
    toast.success("Hook disisipkan di baris pertama caption!")
  }

  const handleInsertCta = (ctaText: string) => {
    setCaption((prev) => (prev ? `${prev.trimEnd()}${ctaText}` : ctaText.trimStart()))
    toast.success("Call-to-Action disisipkan ke caption!")
  }

  useEffect(() => {
    if (open) {
      setTitle("")
      setCaption("")
      setSelected(channels.slice(0, 2))
      setDate(todayStr())
      setWhen("18:00")
      setViewTab("editor")
      setHookSuggestions([])
      setShowHookSuggestions(false)
      setMediaUrl("")
      setMediaType("image")
      setPickerOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const toggle = (p: string) =>
    setSelected((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))

  const activeChannelLabel = selected.length > 0 ? selected.join(", ") : "Belum ada channel"
  const captionLength = caption.length
  const hasTwitter = selected.includes("twitter") || selected.includes("x")
  const primaryPlatform = selected[0] || "instagram"
  const maxChars = hasTwitter || primaryPlatform === "twitter" ? 280 : 2200
  const charPercent = Math.min(100, Math.round((captionLength / maxChars) * 100))
  const isOverLimit = captionLength > maxChars
  const isDirty = Boolean(title.trim() || caption.trim() || mediaUrl.trim())

  const canSubmit =
    Boolean(client?.id) &&
    title.trim().length > 0 &&
    selected.length > 0 &&
    Boolean(date) &&
    Boolean(when) &&
    !isOverLimit &&
    !isPending

  async function handleSubmit() {
    if (!canSubmit || !client) return
    try {
      const basePost = {
        client_id: client.id,
        title: title.trim(),
        content: caption.trim(),
        media_url: mediaUrl || null,
        scheduled_at: toIso(date, when),
        status: "draft" as const,
        campaign_tag: null,
        notes: null,
      }

      // Buat satu post per channel yang dipilih (multi-channel = multiple records DB).
      const results = await Promise.all(selected.map((p) => createPost({ ...basePost, platform: p })))

      toast.success("Post berhasil dijadwalkan!", {
        description: `${results.length} post tersimpan untuk ${date} pukul ${when}.`,
      })
      onScheduled?.(title.trim())
      onClose()
    } catch (err) {
      toast.error("Gagal menjadwalkan post.", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.",
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
      e.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent 
        onKeyDown={handleKeyDown}
        onPointerDownOutside={(e) => {
          if (isDirty) {
            e.preventDefault()
            toast.warning("Ada draf postingan yang belum disimpan. Klik 'Batal' untuk keluar.")
          }
        }}
        className="max-w-xl max-h-[88vh] overflow-y-auto bg-card/95 backdrop-blur-2xl rounded-3xl border border-border/40 p-6 shadow-2xl space-y-5"
      >
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border/30 pb-3 space-y-0 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-brand-accent/15 text-brand-accent flex items-center justify-center shrink-0 shadow-inner">
              <Icons.send className="size-4" />
            </div>
            <div>
              <DialogTitle className="font-sans font-bold text-foreground text-sm flex items-center gap-2">
                Jadwalkan Postingan
                <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                  Quick Composer
                </span>
              </DialogTitle>
              <DialogDescription className="text-2xs text-muted-foreground">
                Klien: <span className="font-semibold text-foreground">{client?.name ?? "Client"}</span>
              </DialogDescription>
            </div>
          </div>

          {/* Segmented View Switcher */}
          <div className="mr-6">
            <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as "editor" | "preview")}>
              <TabsList className="bg-muted/70 p-1 rounded-full border border-border/40 h-8" highlightClassName="bg-card text-foreground shadow-xs rounded-full">
                <TabsTrigger value="editor" className="rounded-full px-3 py-0.5 text-2xs font-semibold">
                  <Icons.pencil className="size-3 mr-1" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="preview" className="rounded-full px-3 py-0.5 text-2xs font-semibold">
                  <Icons.eye className="size-3 mr-1" />
                  Live Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

        {viewTab === "preview" ? (
          /* ======================================================== */
          /* LIVE SOCIAL FEED CARD PREVIEW                            */
          /* ======================================================== */
          <div className="space-y-4 py-1 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between text-2xs text-muted-foreground px-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Icons.share className="size-3.5 text-brand-accent" />
                Simulasi Feed Publikasi
              </span>
              <span className="bg-muted/60 px-2 py-0.5 rounded-full text-3xs font-mono font-medium">
                {activeChannelLabel} • {date} {when}
              </span>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm space-y-3">
              {/* Card Header */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {client?.name ? client.name.charAt(0).toUpperCase() : "B"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground truncate">{client?.name || "Nama Brand"}</span>
                    <Icons.check className="size-3 text-brand-accent shrink-0" />
                  </div>
                  <span className="text-3xs text-muted-foreground block truncate">
                    {client?.name ? `@${client.name.toLowerCase().replace(/\s+/g, "")}` : "@brand"} • Dijadwalkan {date} {when}
                  </span>
                </div>
              </div>

              {/* Title / Concept */}
              {title && (
                <div className="text-xs font-bold text-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/30">
                  {title}
                </div>
              )}

              {/* Caption content */}
              <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto px-1">
                {caption ? caption : <span className="italic text-muted-foreground">Belum ada caption. Tulis atau racik dengan AI di tab Editor...</span>}
              </div>

              {/* Attached Media preview in feed card */}
              {mediaUrl && (
                <div className="relative w-full rounded-xl overflow-hidden border border-border/40 bg-muted aspect-video flex items-center justify-center">
                  {mediaType === "video" ? (
                    <video src={mediaUrl} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={mediaUrl} alt="Preview media feed" className="w-full h-full object-cover" />
                  )}
                </div>
              )}

              {/* Card Footer */}
              <div className="pt-2 border-t border-border/20 flex items-center justify-between text-3xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Icons.clock className="size-3 text-secondary" />
                  <span>Status: Draf Siap Terjadwal</span>
                </div>
                <div className="flex items-center gap-1">
                  {selected.map((p) => (
                    <span key={p} className="capitalize px-1.5 py-0.5 rounded bg-muted/60 font-medium">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* FORM EDITOR WORKSPACE                                    */
          /* ======================================================== */
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Post Title */}
            <div>
              <label htmlFor="schedule-post-title" className="block text-xs font-semibold text-foreground mb-1">
                Judul Postingan / Konsep
              </label>
              <input
                id="schedule-post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-border/40 bg-muted/50 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:bg-background transition-colors"
                placeholder="e.g. Tips Strategi Konten Organik 2026"
                autoFocus
              />
            </div>

            {/* Caption & AI Co-pilot */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <label htmlFor="schedule-post-caption" className="block text-xs font-semibold text-foreground">
                    Caption
                  </label>
                  {/* Gauge indicator */}
                  <div className="flex items-center gap-1 text-3xs font-mono">
                    <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-300 rounded-full",
                          isOverLimit ? "bg-destructive" : charPercent > 75 ? "bg-warning" : "bg-brand-accent"
                        )}
                        style={{ width: `${charPercent}%` }}
                      />
                    </div>
                    <span className={cn(isOverLimit ? "text-destructive font-bold" : "text-muted-foreground")}>
                      {captionLength}/{maxChars}
                    </span>
                    {isOverLimit && (
                      <span className="text-3xs text-destructive font-bold ml-1 animate-pulse">
                        (Melebihi batas {maxChars})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={handleGenerateHooks}
                    disabled={isGeneratingHooks || !client?.id}
                    isLoading={isGeneratingHooks}
                    className="h-6 px-2 text-2xs font-bold text-secondary hover:bg-secondary/10 rounded-full cursor-pointer gap-1 transition-all"
                  >
                    <Icons.sparkles className="size-3" />
                    {isGeneratingHooks ? (
                      <ShimmeringText text="Meracik Hook..." className="text-2xs" />
                    ) : (
                      "🎯 AI Hook"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={handleAiCaption}
                    disabled={isGeneratingCaption || !client?.id}
                    isLoading={isGeneratingCaption}
                    className="h-6 px-2 text-2xs font-bold text-primary hover:bg-primary/10 rounded-full cursor-pointer gap-1 transition-all"
                  >
                    <Icons.sparkles className="size-3" />
                    {isGeneratingCaption ? (
                      <ShimmeringText text="Meracik Caption..." className="text-2xs" />
                    ) : (
                      "✨ AI Caption"
                    )}
                  </Button>
                </div>
              </div>

              {showHookSuggestions && hookSuggestions.length > 0 && (
                <div className="mb-2.5 p-3 rounded-xl bg-secondary/5 border border-secondary/20 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-bold text-foreground flex items-center gap-1">
                      <Icons.sparkles className="size-3 text-secondary" />
                      Pilih Hook Scroll-Stopping (Disisipkan di Baris Pertama):
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setShowHookSuggestions(false)}
                      className="h-5 px-1.5 text-3xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Tutup
                    </Button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {hookSuggestions.map((h, idx) => (
                      <Button
                        key={idx}
                        type="button"
                        variant="ghost"
                        onClick={() => handleSelectHook(h.text)}
                        className="w-full text-left justify-start p-2.5 rounded-lg bg-card/80 hover:bg-card border border-border/40 hover:border-secondary transition-all cursor-pointer flex flex-col items-start gap-1 h-auto whitespace-normal font-normal"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-3xs font-bold px-1.5 py-0.5 rounded bg-secondary/15 text-secondary">
                            {h.angle}
                          </span>
                          <span className="text-3xs text-muted-foreground line-clamp-1 italic">
                            {h.explanation}
                          </span>
                        </div>
                        <span className="text-2xs font-semibold text-foreground mt-0.5 leading-snug">{h.text}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                id="schedule-post-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border/40 bg-muted/50 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:bg-background transition-colors leading-relaxed"
                placeholder="Tulis draf caption lengkap beserta hashtag..."
              />

              {/* Quick CTA Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-3xs font-semibold text-muted-foreground mr-0.5">Sisip CTA:</span>
                {QUICK_CTA_CHIPS.map((chip) => (
                  <Button
                    key={chip.label}
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => handleInsertCta(chip.text)}
                    className="h-6 px-2.5 py-0.5 rounded-full text-2xs font-medium border-border/40 bg-card hover:bg-muted text-muted-foreground hover:text-foreground hover:border-brand-accent/40 transition-all cursor-pointer shadow-none active:scale-95"
                  >
                    {chip.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Media Attachment Strip */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-foreground">Media Visual (Foto / Video)</label>
                <span className="text-3xs text-muted-foreground font-medium">Opsional</span>
              </div>
              {mediaUrl ? (
                <div className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-muted/30 group">
                  <div className="flex items-center gap-3 p-2.5">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/40 flex items-center justify-center">
                      {mediaType === "video" ? (
                        <video src={mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={mediaUrl} alt="Thumbnail media" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xs font-bold text-foreground truncate">
                          {mediaUrl.split("/").pop()?.split("?")[0] || "Media terlampir"}
                        </span>
                        <span className="text-3xs uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-accent/15 text-brand-accent">
                          {mediaType}
                        </span>
                      </div>
                      <span className="text-3xs text-muted-foreground block truncate mt-0.5">
                        Siap dipublikasikan bersama postingan
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => setPickerOpen(true)}
                        className="h-7 text-2xs font-semibold text-secondary hover:bg-secondary/10 rounded-lg cursor-pointer"
                      >
                        Ganti
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setMediaUrl("")
                          setMediaType("image")
                        }}
                        className="h-7 text-2xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                        title="Hapus media"
                      >
                        <Icons.trash className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPickerOpen(true)}
                  className="w-full h-auto flex items-center justify-between px-3.5 py-2.5 rounded-xl border-dashed border-border/60 bg-muted/30 hover:bg-muted/60 hover:border-brand-accent/50 transition-all cursor-pointer group font-normal text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-accent/10 text-brand-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icons.photo_camera className="size-3.5" />
                    </div>
                    <div className="text-left">
                      <span className="text-2xs font-bold text-foreground block group-hover:text-brand-accent transition-colors">
                        Lampirkan Media dari Library / Upload Baru
                      </span>
                      <span className="text-3xs text-muted-foreground block">
                        Pilih aset tersimpan atau drag & drop file foto/video
                      </span>
                    </div>
                  </div>
                  <Icons.arrowRight className="size-3.5 text-muted-foreground group-hover:text-brand-accent group-hover:translate-x-0.5 transition-all" />
                </Button>
              )}
            </div>

            {/* Target Channels */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-foreground">Target Channel Publikasi</label>
                <span className="text-3xs text-muted-foreground font-medium">Bisa pilih multi-platform</span>
              </div>
              {safeChannels.length === 0 ? (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/30 text-2xs text-muted-foreground flex items-center gap-2">
                  <Icons.info className="size-3.5 text-muted-foreground shrink-0" />
                  <span>Klien belum menghubungkan channel sosial. Hubungkan di menu Social Accounts.</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {safeChannels.map((c) => {
                    const active = selected.includes(c.platform)
                    const ChannelIcon = getPlatformIcon(c.platform)
                    return (
                      <Button
                        key={c.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggle(c.platform)}
                        className={cn(
                          "h-8 rounded-full text-xs font-medium border transition-all cursor-pointer px-3 gap-1.5",
                          active
                            ? "border-brand-accent bg-brand-accent/10 text-brand-accent font-semibold shadow-xs hover:bg-brand-accent/15"
                            : "border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        )}
                      >
                        <ChannelIcon className="size-3.5" />
                        <span className="capitalize">{c.platform}</span>
                        {c.handle && <span className="text-2xs opacity-70">({c.handle})</span>}
                        {active && <Icons.check className="size-3 text-brand-accent ml-0.5" />}
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Date & Time Picker with Quick Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Date Column */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="schedule-post-date" className="block text-xs font-semibold text-foreground">
                    Tanggal Rilis
                  </label>
                  <span className="text-3xs text-muted-foreground">Pintasan:</span>
                </div>
                {/* Quick Date Presets */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setDate(todayStr())}
                    className={cn(
                      "h-6 text-3xs px-2 rounded-md font-medium transition-all cursor-pointer shadow-none",
                      date === todayStr() ? "bg-brand-accent text-brand-accent-foreground border-transparent hover:bg-brand-accent/90" : "border-border/40 hover:bg-muted"
                    )}
                  >
                    Hari ini
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setDate(getRelativeDateStr(1))}
                    className={cn(
                      "h-6 text-3xs px-2 rounded-md font-medium transition-all cursor-pointer shadow-none",
                      date === getRelativeDateStr(1) ? "bg-brand-accent text-brand-accent-foreground border-transparent hover:bg-brand-accent/90" : "border-border/40 hover:bg-muted"
                    )}
                  >
                    Besok
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setDate(getNextWeekendStr())}
                    className={cn(
                      "h-6 text-3xs px-2 rounded-md font-medium transition-all cursor-pointer shadow-none",
                      date === getNextWeekendStr() ? "bg-brand-accent text-brand-accent-foreground border-transparent hover:bg-brand-accent/90" : "border-border/40 hover:bg-muted"
                    )}
                  >
                    Weekend
                  </Button>
                </div>
                <input
                  id="schedule-post-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-border/40 bg-muted/50 px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:bg-background transition-colors"
                />
              </div>

              {/* Time Column */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="schedule-post-time" className="block text-xs font-semibold text-foreground">
                    Jam Tayang
                  </label>
                  <span className="text-3xs text-muted-foreground">Slot emas:</span>
                </div>
                {/* Quick Time Pills */}
                <div className="grid grid-cols-4 gap-1">
                  {TIME_SLOT_OPTIONS.map((slot) => (
                    <Button
                      key={slot.time}
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => setWhen(slot.time)}
                      className={cn(
                        "h-auto py-1 px-1 rounded-lg text-3xs font-semibold border transition-all cursor-pointer text-center flex flex-col items-center justify-center shadow-none",
                        when === slot.time
                          ? "border-brand-accent bg-brand-accent/15 text-brand-accent shadow-xs hover:bg-brand-accent/20"
                          : "border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <span className="block text-2xs leading-none mb-0.5">{slot.icon}</span>
                      <span>{slot.label}</span>
                    </Button>
                  ))}
                </div>
                <input
                  id="schedule-post-time"
                  type="time"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  className="w-full rounded-xl border border-border/40 bg-muted/50 px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:bg-background transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/20">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="text-2xs text-secondary hover:underline p-0 h-auto font-bold cursor-pointer flex items-center gap-1"
            onClick={() => {
              onClose()
              router.push(
                serializeCalendarParams("/admin/calendar", {
                  clientId: client?.id || null,
                  title: title.trim() || null,
                  caption: caption.trim() || null,
                  mediaUrl: mediaUrl.trim() || null,
                  new: "1",
                })
              )
            }}
          >
            <Icons.calendar className="size-3.5" /> Buka Kalender Penuh
          </Button>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-3xs text-muted-foreground mr-1">
              Tekan <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border/40">⌘+Enter</kbd>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full text-xs font-semibold text-foreground hover:bg-muted/70 cursor-pointer"
              onClick={onClose}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!canSubmit}
              isLoading={isPending}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              onClick={handleSubmit}
            >
              <Icons.schedule className="size-4" />
              Jadwalkan Post
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Media Library Asset Picker */}
      {client?.id && (
        <AssetPicker
          clientId={client.id}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={(asset: Asset) => {
            setMediaUrl(asset.url)
            setMediaType(asset.fileType)
            toast.success("Media visual berhasil dilampirkan!")
          }}
        />
      )}
    </Dialog>
  )
}
