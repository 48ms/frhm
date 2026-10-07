"use client"

import React, { useEffect, useState } from "react"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import type { ClientWithChannels } from "@/features/social-accounts/api/types"
import { useCreateScheduledPost } from "@/features/scheduled-posts/api/queries"

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
      await createPost({
        client_id: client.id,
        title: title.trim(),
        content: caption.trim(),
        platform: selected[0],
        scheduled_at: toIso(date, when),
        status: "draft",
        campaign_tag: null,
        notes: selected.length > 1 ? `Channel: ${selected.join(", ")}` : null,
      })
      toast.success("Post dijadwalkan.", {
        description: `Tersimpan untuk ${selected.length} channel pada ${date} ${when}.`,
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
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card rounded-2xl border border-border/40 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center">
              <Icons.send className="size-[18px]" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-foreground text-sm">Schedule a Post</h3>
              <p className="text-[10px] text-muted-foreground">
                Publishing for {client?.name ?? "Client"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1 rounded-full hover:bg-muted/70 text-muted-foreground transition-all cursor-pointer"
            onClick={onClose}
          >
            <Icons.close className="size-[18px]" />
          </button>
        </div>

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
              placeholder="Tulis caption yang akan menyertai post ini"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Channels</label>
            {channels.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Belum ada channel terhubung untuk klien ini. Hubungkan akun sosial lebih dulu di
                halaman Social Accounts.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {channels.map((p) => {
                  const on = selected.includes(p)
                  const key = CHANNEL_ICON[p] ?? "hub"
                  const IconCmp = (
                    Icons as Record<string, React.ComponentType<{ className?: string }>>
                  )[key]
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggle(p)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-semibold transition-all cursor-pointer",
                        on
                          ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                          : "border-border/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {IconCmp ? <IconCmp className="size-3.5" /> : <Icons.hub className="size-3.5" />}
                      {p}
                      {on && <Icons.check className="size-3" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs focus:border-brand-accent outline-none text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Jam rilis</label>
              <div className="flex flex-wrap gap-1.5">
                {TIME_SLOTS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setWhen(t)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer",
                      when === t
                        ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                        : "border-border/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              className="px-4 py-2 rounded-full text-xs font-semibold text-foreground hover:bg-muted/70 transition-all cursor-pointer"
              onClick={onClose}
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:hover:scale-100"
              onClick={handleSubmit}
            >
              {isPending ? (
                <>
                  <Icons.refresh className="size-4 animate-spin" />
                  Menyimpan…
                </>
              ) : (
                <>
                  <Icons.schedule className="size-4" />
                  Schedule Post
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
