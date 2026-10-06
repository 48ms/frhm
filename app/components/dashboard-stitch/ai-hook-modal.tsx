"use client"

import React, { useEffect, useState } from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

const SAMPLE_HOOKS: Record<string, string[]> = {
  default: [
    "Stop designing flat interfaces. Here is how frosted glass aura transforms user session times by 41%.",
    "Why top creative directors are replacing corporate blue with electric lime & chromatic blur in 2026.",
    "The 3-layer rule for digital branding that algorithmic feeds cannot resist scrolling past.",
  ],
}

type Tone = "bold" | "playful" | "professional"

const TONES: { id: Tone; label: string }[] = [
  { id: "bold", label: "Bold" },
  { id: "playful", label: "Playful" },
  { id: "professional", label: "Professional" },
]

export function StitchAiHookModal({
  open,
  onOpenChange,
  clientName = "the active client",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName?: string
}) {
  const [prompt, setPrompt] = useState("Spatial UI design & frosted glass interfaces")
  const [tone, setTone] = useState<Tone>("bold")
  const [hooks, setHooks] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      setHooks([])
      setLoading(false)
      setCopied(null)
    }
  }, [open])

  function generate() {
    setLoading(true)
    setHooks([])
    setTimeout(() => {
      setHooks(SAMPLE_HOOKS.default.map((h) => `${h} #${clientName.split(" ")[0]}`))
      setLoading(false)
    }, 900)
  }

  function copy(i: number, text: string) {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(i)
    setTimeout(() => setCopied(null), 1500)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[foreground]/40 backdrop-blur-md"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full max-w-lg bg-card/95 backdrop-blur-2xl rounded-2xl border border-border/40 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-accent text-brand-accent-foreground flex items-center justify-center">
              <Icons.sparkles className="size-[18px]" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-foreground text-sm">
                Studio AI Hook Generator
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Engineered for {clientName}
              </p>
            </div>
          </div>
          <button
            className="p-1 rounded-full hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            <Icons.close className="size-[18px]" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Campaign Concept / Niche Topic
            </label>
            <div className="flex gap-2">
              <input
                className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs focus:border-brand-accent focus:ring-[brand-accent] text-foreground outline-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Product launch teaser for a fintech app"
              />
              <button
                className="px-3.5 py-1.5 rounded-xl bg-brand-accent text-brand-accent-foreground text-xs font-bold hover:bg-brand-accent/80 transition-all cursor-pointer shrink-0 disabled:opacity-50 inline-flex items-center gap-1.5"
                onClick={generate}
                disabled={loading}
              >
                {loading ? (
                  <Icons.refresh className="size-3.5 animate-spin" />
                ) : (
                  <Icons.sparkles className="size-3.5" />
                )}
                Generate
              </button>
            </div>
          </div>

          {/* Tone selector */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Voice Tone
            </label>
            <div className="inline-flex p-1 rounded-full bg-muted/70/70 border border-border/30 w-full">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer",
                    tone === t.id
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {hooks.length === 0 && !loading && (
              <p className="text-xs text-muted-foreground text-center py-6">
                Enter a topic and click Generate to create viral hooks.
              </p>
            )}
            {loading && (
              <div className="py-6 flex flex-col items-center gap-2">
                <Icons.refresh className="size-5 text-brand-accent animate-spin" />
                <p className="text-xs text-muted-foreground">
                  Generating viral hooks for {clientName}…
                </p>
              </div>
            )}
            {hooks.map((hook, i) => (
              <div
                key={i}
                className="group p-3 rounded-xl bg-muted/60 border border-border/40 hover:border-brand-accent/40 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-foreground leading-relaxed">
                    {hook}
                  </p>
                  <button
                    onClick={() => copy(i, hook)}
                    className="shrink-0 p-1 rounded-full text-muted-foreground hover:text-brand-accent hover:bg-white transition-all cursor-pointer"
                    title="Copy hook"
                  >
                    {copied === i ? (
                      <Icons.check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Icons.copy className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {hooks.length > 0 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-muted-foreground">
                {hooks.length} hooks generated · {tone} tone
              </span>
              <button
                onClick={generate}
                className="text-[11px] font-bold text-brand-accent hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <Icons.refresh className="size-3.5" />
                Regenerate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
