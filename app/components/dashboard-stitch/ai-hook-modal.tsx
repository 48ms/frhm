"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Icons } from "@/components/icons"
import { useGenerateContentIdeas } from "@/features/copilot/api/queries"
import { useGenerateHooks } from "@/features/hooks/api/queries"
import type { HookFormat, HookCandidate } from "@/features/hooks/api/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/animate-ui/components/radix/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"
import { serializeComposerParams, serializeCalendarParams } from "@/lib/searchparams"
import { cn } from "@/lib/utils"

export function StitchAiHookModal({
  open,
  onOpenChange,
  clientName = "the active client",
  clientId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName?: string
  clientId: string
}) {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [surprisingDetail, setSurprisingDetail] = useState("")
  const [format, setFormat] = useState<HookFormat>("caption")
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<number | null>(null)
  const [sendsQuestion, setSendsQuestion] = useState<string | null>(null)

  const { mutateAsync: generateIdeas, isPending: loadingIdeas } = useGenerateContentIdeas()
  const { mutateAsync: generateUpstreamHooks, isPending: loadingHooks } = useGenerateHooks()
  const loading = loadingIdeas || loadingHooks

  const [hooks, setHooks] = useState<string[]>([])
  const [enrichedCandidates, setEnrichedCandidates] = useState<HookCandidate[]>([])

  useEffect(() => {
    if (open) {
      setHooks([])
      setEnrichedCandidates([])
      setError(null)
      setCopied(null)
      setSendsQuestion(null)
    }
  }, [open])

  async function generate() {
    setError(null)
    setHooks([])
    setEnrichedCandidates([])
    setSendsQuestion(null)

    try {
      // Call both: generateIdeas for standard compatibility and upstream hook engine
      const res = await generateIdeas({
        clientId,
        count: 3,
        trendOrTopic: prompt.trim() || undefined,
      })
      if (res.error) {
        setError(res.error)
        return
      }

      const generated = res.ideas?.map((idea) => idea.hook) || []
      setHooks(generated)

      // Also generate 4-mechanism upstream breakdown
      const upstreamRes = await generateUpstreamHooks({
        clientId,
        topic: prompt.trim() || "Konten Brand",
        format,
        surprisingFactOrDetail: surprisingDetail.trim() || undefined,
      })

      if (upstreamRes.success && upstreamRes.candidates) {
        setEnrichedCandidates(upstreamRes.candidates)
        setSendsQuestion(upstreamRes.sendsQuestion || null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal terhubung ke AI Hook Generator.")
    }
  }

  function copy(i: number, text: string) {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(i)
    setTimeout(() => setCopied(null), 1500)
  }

  const cutoffLimit = format === "caption" ? 125 : format === "video" ? 90 : format === "carousel_cover" ? 80 : 250

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-2xl rounded-3xl border border-border/40 p-0 shadow-2xl gap-0">
        <DialogHeader className="p-6 border-b border-border/30 pb-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-accent text-brand-accent-foreground flex items-center justify-center shrink-0">
                <Icons.sparkles className="size-4" />
              </div>
              <div>
                <DialogTitle className="font-sans font-bold text-foreground text-sm flex items-center gap-2">
                  Studio AI Hook Generator
                  <Badge variant="secondary" className="text-2xs bg-primary/10 text-primary border-primary/20">
                    Upstream Hook Writer
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-2xs text-muted-foreground">
                  Hook untuk {clientName}
                </DialogDescription>
              </div>
            </div>

            {/* Format Selector Pills */}
            <div className="hidden sm:flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/30 text-2xs">
              {[
                { id: "caption", label: "Caption (~125c)" },
                { id: "video", label: "Video (3s Muted)" },
                { id: "carousel_cover", label: "Cover Slide" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id as HookFormat)}
                  className={cn(
                    "px-2 py-1 rounded-lg font-medium transition-all cursor-pointer",
                    format === f.id
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Konsep kampanye / topik
              </label>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-xl border border-border/40 bg-muted px-3.5 py-2 text-xs text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Contoh: peluncuran produk aplikasi fintech"
                  onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
                />
                <Button
                  onClick={generate}
                  disabled={loading}
                  isLoading={loading}
                  className="rounded-xl bg-brand-accent text-brand-accent-foreground text-xs font-bold gap-1.5 shrink-0 shadow-sm"
                >
                  <Icons.sparkles className="size-3.5" />
                  Generate
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-2xs font-medium text-muted-foreground mb-1">
                Fakta atau angka paling mengejutkan (opsional, untuk High-Stakes hook):
              </label>
              <input
                className="w-full rounded-xl border border-border/30 bg-muted/40 px-3 py-1.5 text-xs text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
                value={surprisingDetail}
                onChange={(e) => setSurprisingDetail(e.target.value)}
                placeholder="Contoh: hemat 40% biaya, diuji pada 1.200 pelanggan, suhu 85 derajat"
              />
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {hooks.length === 0 && !loading && !error && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Masukkan topik lalu klik Generate untuk membuat hook.
                </p>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30">
                  <p className="text-xs font-bold text-destructive mb-1">
                    Gagal membuat hook
                  </p>
                  <p className="text-xs text-destructive/80 leading-relaxed">{error}</p>
                </div>
              )}

              {loading && (
                <div className="py-6 flex flex-col items-center gap-2">
                  <Icons.refresh className="size-5 text-brand-accent animate-spin" />
                  <ShimmeringText
                    text={`Membuat hook untuk ${clientName}…`}
                    className="text-xs font-semibold"
                  />
                </div>
              )}

              {/* Standard Generated Hooks */}
              {hooks.map((hook, i) => {
                const charCount = hook.length
                const isInside = charCount <= cutoffLimit
                const matchedCandidate = enrichedCandidates[i]
                return (
                  <div
                    key={`std-${i}`}
                    className="group p-3.5 rounded-2xl bg-muted/60 border border-border/40 hover:border-brand-accent/40 transition-all flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-2xs font-medium">
                          {matchedCandidate?.mechanismLabel || (i === 0 ? "Curiosity Gap" : i === 1 ? "Contrarian" : "High Stakes")}
                        </Badge>
                        {i === 0 && (
                          <Badge className="text-2xs bg-primary text-primary-foreground font-bold">
                            Rekomendasi Utama
                          </Badge>
                        )}
                      </div>

                      <span
                        className={cn(
                          "text-2xs font-mono font-medium px-2 py-0.5 rounded-full border",
                          isInside
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        )}
                      >
                        {charCount} / {cutoffLimit} kar
                      </span>
                    </div>

                    <p className="text-xs text-foreground leading-relaxed">
                      {hook}
                    </p>

                    {format === "video" && matchedCandidate?.videoLayers && (
                      <div className="bg-card/70 p-2.5 rounded-xl border border-border/30 text-2xs space-y-1">
                        <div className="font-semibold text-primary">3 Lapisan Video Muted-First:</div>
                        <div><span className="font-bold">Visual:</span> {matchedCandidate.videoLayers.visualShot}</div>
                        <div><span className="font-bold">On-Screen:</span> &ldquo;{matchedCandidate.videoLayers.onScreenText}&rdquo;</div>
                        <div><span className="font-bold">Audio:</span> &ldquo;{matchedCandidate.videoLayers.spokenAudio}&rdquo;</div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-border/20">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          onOpenChange(false)
                          router.push(serializeComposerParams("/admin/composer", { clientId, content: hook }))
                        }}
                        className="h-6 px-2 text-2xs font-bold text-muted-foreground hover:text-foreground hover:bg-card transition-all cursor-pointer inline-flex items-center gap-1 rounded-md"
                        title="Buka di Composer"
                      >
                        <Icons.send className="size-3 text-primary" /> Composer
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          onOpenChange(false)
                          router.push(serializeCalendarParams("/admin/calendar", { clientId, caption: hook, new: "1" }))
                        }}
                        className="h-6 px-2 text-2xs font-bold text-muted-foreground hover:text-foreground hover:bg-card transition-all cursor-pointer inline-flex items-center gap-1 rounded-md"
                        title="Jadwalkan di Kalender"
                      >
                        <Icons.calendar className="size-3 text-secondary" /> Kalender
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => copy(i, hook)}
                        className="h-6 px-2 text-2xs font-bold text-muted-foreground hover:text-foreground hover:bg-card transition-all cursor-pointer inline-flex items-center gap-1 rounded-md"
                        title="Salin hook"
                      >
                        {copied === i ? (
                          <>
                            <Icons.check className="size-3 text-primary" /> Tersalin
                          </>
                        ) : (
                          <>
                            <Icons.copy className="size-3" /> Salin
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            {sendsQuestion && (
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-2xs text-sky-700 dark:text-sky-300 leading-relaxed">
                <span className="font-bold flex items-center gap-1 text-sky-600 dark:text-sky-400 mb-0.5">
                  <Icons.share className="size-3" /> The Sends Question:
                </span>
                {sendsQuestion}
              </div>
            )}

            {(hooks.length > 0 || enrichedCandidates.length > 0) && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xs text-muted-foreground">
                  {enrichedCandidates.length || hooks.length} hook terverifikasi dihasilkan
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generate}
                  disabled={loading}
                  isLoading={loading}
                  className="h-7 px-2 text-1xs font-bold text-brand-accent hover:text-brand-accent hover:bg-brand-accent/10 cursor-pointer inline-flex items-center gap-1"
                >
                  <Icons.refresh className="size-3.5" />
                  Buat ulang
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
