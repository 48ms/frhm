"use client"

import React, { useEffect, useState } from "react"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import type { ClientWithChannels } from "@/features/social-accounts/api/types"
import { useCreateScheduledPost } from "@/features/scheduled-posts/api/queries"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/animate-ui/components/radix/dialog"
import { Button } from "@/components/ui/button"

const CHANNEL_ICON: Record<string, string> = {
  Instagram: "photo_camera",
  TikTok: "music_note",
  YouTube: "smart_display",
  LinkedIn: "work",
  "Twitter / X": "twitter",
}

/** Jam rilis yang ditawarkan. Tanggal default = hari ini (waktu lokal). */
const TIME_SLOTS = ["09:00", "12:30", "18:00", "21:00"]

/** Gabungkan tanggal (YYYY-MM-DD) + jam (HH:mm) jadi ISO lokal. */
function toIso(dateStr: string, timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number)
  const d = new Date(`${dateStr}T00:00:00`)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

function todayStr(): string {
  const d = new Date()
  const pad = (x: number) => String(x).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
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
  const safeChannels = client?.channels ?? []
  const channels = safeChannels.map((a) => a.platform)
  const [title, setTitle] = useState("")
  const [caption, setCaption] = useState("")
  const [selected, setSelected] = useState<string[]>(channels.slice(0, 2))
  const [date, setDate] = useState(todayStr())
  const [when, setWhen] = useState("18:00")

  // Mutasi NYATA ke tabel scheduled_posts (bukan localStorage).
  const { mutateAsync: createPost, isPending } = useCreateScheduledPost()

  useEffect(() => {
    if (open) {
      setTitle("")
      setCaption("")
      setSelected(channels.slice(0, 2))
      setDate(todayStr())
      setWhen("18:00")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const toggle = (p: string) =>
    setSelected((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))

  const canSubmit = Boolean(client?.id) && title.trim().length > 0 && selected.length > 0 && !isPending

  async function handleSubmit() {
    if (!canSubmit || !client) return
    try {
      const basePost = {
        client_id: client.id,
        title: title.trim(),
        content: caption.trim(),
        scheduled_at: toIso(date, when),
        status: "draft" as const,
        campaign_tag: null,
        notes: null,
      }

      // Buat satu post per channel yang dipilih (multi-channel = multiple records DB).
      const results = await Promise.all(selected.map((p) => createPost({ ...basePost, platform: p })))

      toast.success("Post dijadwalkan.", {
        description: `${results.length} post tersimpan untuk ${date} ${when}.`,
      })
      onScheduled?.(title.trim())
      onClose()
    } catch (err) {
      toast.error("Gagal menjadwalkan post.", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.",
      })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-5 rounded-2xl border-border/40 shadow-2xl bg-card space-y-4">
        <DialogHeader className="flex flex-row items-center gap-2 border-b border-border/30 pb-3 space-y-0 text-left">
          <div className="w-8 h-8 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center shrink-0">
            <Icons.send className="size-[18px]" />
          </div>
          <div>
            <DialogTitle className="font-sans font-bold text-foreground text-sm">Schedule a Post</DialogTitle>
            <DialogDescription className="text-2xs text-muted-foreground">
              Publishing for {client?.name ?? "Client"}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Post title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs focus:border-brand-accent outline-none text-foreground"
              placeholder="Judul post"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs focus:border-brand-accent outline-none text-foreground resize-none"
              placeholder="Tulis caption lengkap..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Target channels</label>
            {safeChannels.length === 0 ? (
              <p className="text-2xs text-muted-foreground">
                Klien belum menghubungkan channel sosial. Sambungkan dulu di Channel Status.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {safeChannels.map((c) => {
                  const active = selected.includes(c.platform)
                  return (
                    <Button
                      key={c.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggle(c.platform)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer h-auto",
                        active
                          ? "border-brand-accent bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/15"
                          : "border-border/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icons.share className="size-3.5" />
                      <span>{c.platform}</span>
                      {c.handle && (
                        <span className="text-2xs opacity-70">({c.handle})</span>
                      )}
                    </Button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs text-foreground focus:border-brand-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Time slot</label>
              <div className="flex flex-wrap gap-1.5">
                {TIME_SLOTS.map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setWhen(t)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-full text-1xs font-semibold border transition-all cursor-pointer h-auto",
                      when === t
                        ? "border-brand-accent bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/15"
                        : "border-border/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full text-xs font-semibold text-foreground hover:bg-muted/70"
              onClick={onClose}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!canSubmit}
              isLoading={isPending}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all"
              onClick={handleSubmit}
            >
              <Icons.schedule className="size-4" />
              Schedule Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
