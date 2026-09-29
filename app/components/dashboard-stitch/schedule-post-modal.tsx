"use client"

import React, { useEffect, useState } from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import type { SocialClient } from "@/components/social-accounts/social-data"

const CHANNEL_ICON: Record<string, string> = {
  Instagram: "photo_camera",
  TikTok: "music_note",
  YouTube: "smart_display",
  LinkedIn: "work",
  "Twitter / X": "twitter",
}

export function SchedulePostModal({
  open,
  client,
  onClose,
  onScheduled,
}: {
  open: boolean
  client: SocialClient
  onClose: () => void
  onScheduled?: (title: string) => void
}) {
  const channels = client.accounts.map((a) => a.platform)
  const [title, setTitle] = useState("")
  const [caption, setCaption] = useState("")
  const [selected, setSelected] = useState<string[]>(channels.slice(0, 2))
  const [when, setWhen] = useState("18:00")
  const [phase, setPhase] = useState<"idle" | "working" | "done">("idle")

  useEffect(() => {
    if (open) {
      setPhase("idle")
      setTitle("")
      setCaption("")
      setSelected(channels.slice(0, 2))
      setWhen("18:00")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (phase !== "working") return
    const t = setTimeout(() => {
      setPhase("done")
      onScheduled?.(title.trim() || "Untitled post")
    }, 1500)
    return () => clearTimeout(t)
  }, [phase, title, onScheduled])

  if (!open) return null

  const toggle = (p: string) =>
    setSelected((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )

  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[hsl(var(--admin-on-surface))]/40 backdrop-blur-md"
        onClick={phase === "working" ? undefined : onClose}
      />
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/80 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[hsl(var(--admin-outline-variant))]/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--admin-cobalt))]/15 text-[hsl(var(--admin-cobalt))] flex items-center justify-center">
              <Icons.send className="size-[18px]" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-[hsl(var(--admin-on-surface))] text-sm">
                Schedule a Post
              </h3>
              <p className="text-[10px] text-[hsl(var(--admin-outline))]">
                Publishing for {client.name}
              </p>
            </div>
          </div>
          {phase !== "working" && (
            <button
              className="p-1 rounded-full hover:bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))] transition-all cursor-pointer"
              onClick={onClose}
            >
              <Icons.close className="size-[18px]" />
            </button>
          )}
        </div>

        {phase === "done" ? (
          <div className="py-6 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--brand-accent))]/20 flex items-center justify-center">
              <Icons.circleCheck className="size-7 text-[#526600]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[hsl(var(--admin-on-surface))]">
                Post scheduled
              </p>
              <p className="text-[11px] text-[hsl(var(--admin-outline))] mt-1">
                <b className="text-[hsl(var(--admin-on-surface))]">
                  {title.trim() || "Untitled post"}
                </b>{" "}
                will publish at {when} to {selected.length} channel
                {selected.length === 1 ? "" : "s"}.
              </p>
            </div>
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold transition-all cursor-pointer"
              onClick={onClose}
            >
              <Icons.check className="size-4" />
              Done
            </button>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
                Post Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] outline-none text-[hsl(var(--admin-on-surface))]"
                placeholder="e.g. Spatial Identity Teaser #05"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] outline-none text-[hsl(var(--admin-on-surface))] resize-none"
                placeholder="Write the caption that will accompany this post…"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1.5">
                Channels
              </label>
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
                          ? "border-[hsl(var(--admin-cobalt))] bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))]"
                          : "border-[hsl(var(--admin-outline-variant))]/40 text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))]"
                      )}
                    >
                      {IconCmp ? <IconCmp className="size-3.5" /> : <Icons.hub className="size-3.5" />}
                      {p}
                      {on && <Icons.check className="size-3" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1.5">
                Publish Time
              </label>
              <div className="flex flex-wrap gap-1.5">
                {["09:00", "12:30", "18:00", "21:00"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setWhen(t)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer",
                      when === t
                        ? "border-[hsl(var(--admin-cobalt))] bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))]"
                        : "border-[hsl(var(--admin-outline-variant))]/40 text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))]"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                className="px-4 py-2 rounded-full text-xs font-semibold text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-high))] transition-all cursor-pointer"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                disabled={phase === "working" || selected.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:hover:scale-100"
                onClick={() => setPhase("working")}
              >
                {phase === "working" ? (
                  <>
                    <Icons.refresh className="size-4 animate-spin" />
                    Scheduling…
                  </>
                ) : (
                  <>
                    <Icons.schedule className="size-4" />
                    Schedule Post
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
