"use client"

import React, { useState } from "react"
import { Icons } from "@/components/icons"

const SAMPLE_HOOKS = [
  "Stop designing flat interfaces. Here is how frosted glass aura transforms user session times by 41% #B2BShell",
  "Why top luxury creative directors are replacing corporate blue with electric lime & chromatic blur in 2026.",
  "The 3-layer rule for B2B Shell digital branding that algorithmic feeds cannot resist scrolling past.",
]

export function StitchAiHookModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [prompt, setPrompt] = useState("Spatial UI design & frosted glass interfaces")
  const [hooks, setHooks] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  function generate() {
    setLoading(true)
    setTimeout(() => {
      setHooks(SAMPLE_HOOKS)
      setLoading(false)
    }, 800)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[hsl(var(--admin-on-surface))]/40 backdrop-blur-md"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/80 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[hsl(var(--admin-outline-variant))]/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] flex items-center justify-center">
              <Icons.sparkles className="size-[18px]" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-[hsl(var(--admin-on-surface))] text-sm">
                Studio AI Hook Generator
              </h3>
              <p className="text-[10px] text-[hsl(var(--admin-outline))]">
                Engineered for viral client engagement
              </p>
            </div>
          </div>
          <button
            className="p-1 rounded-full hover:bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))] transition-all cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            <Icons.close className="size-[18px]" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
              Campaign Concept / Niche Topic
            </label>
            <div className="flex gap-2">
              <input
                className="w-full rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] focus:ring-[hsl(var(--admin-cobalt))] text-[hsl(var(--admin-on-surface))] outline-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button
                className="px-3.5 py-1.5 rounded-xl bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold hover:bg-[hsl(var(--brand-accent))]/80 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                onClick={generate}
                disabled={loading}
              >
                {loading ? "..." : "Generate"}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {hooks.length === 0 && !loading && (
              <p className="text-xs text-[hsl(var(--admin-outline))] text-center py-6">
                Enter a topic and click Generate to create viral hooks.
              </p>
            )}
            {loading && (
              <p className="text-xs text-[hsl(var(--admin-outline))] text-center py-6">
                Generating viral hooks...
              </p>
            )}
            {hooks.map((hook, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[hsl(var(--admin-surface-low))]/60 border border-white/60"
              >
                <p className="text-xs text-[hsl(var(--admin-on-surface))]">{hook}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
