"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Icons } from "@/components/icons"
import { useGenerateContentIdeas } from "@/features/copilot/api/queries"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/animate-ui/components/radix/dialog"
import { Button } from "@/components/ui/button"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"
import { serializeComposerParams, serializeCalendarParams } from "@/lib/searchparams"

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
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<number | null>(null)

  const { mutateAsync: generateIdeas, isPending: loading } = useGenerateContentIdeas()
  const [hooks, setHooks] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setHooks([])
      setError(null)
      setCopied(null)
    }
  }, [open])

  async function generate() {
    setError(null)
    setHooks([])
    try {
      const res = await generateIdeas({
        clientId,
        count: 3,
        trendOrTopic: prompt.trim() || undefined,
      })
      if (res.error) {
        setError(res.error)
        return
      }
      setHooks(res.ideas?.map((idea) => idea.hook) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal terhubung ke AI.")
    }
  }

  function copy(i: number, text: string) {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(i)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto bg-card/95 backdrop-blur-2xl rounded-3xl border border-border/40 p-0 shadow-2xl gap-0">
        <DialogHeader className="p-6 border-b border-border/30 pb-4 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-accent text-brand-accent-foreground flex items-center justify-center shrink-0">
              <Icons.sparkles className="size-4" />
            </div>
            <div>
              <DialogTitle className="font-sans font-bold text-foreground text-sm">
                Studio AI Hook Generator
              </DialogTitle>
              <DialogDescription className="text-2xs text-muted-foreground">
                Hook untuk {clientName}
              </DialogDescription>
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

            <div className="space-y-2 max-h-64 overflow-y-auto">
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
              {hooks.map((hook, i) => (
                <div
                  key={i}
                  className="group p-3 rounded-xl bg-muted/60 border border-border/40 hover:border-brand-accent/40 transition-all flex flex-col gap-2"
                >
                  <p className="text-xs text-foreground leading-relaxed">
                    {hook}
                  </p>
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
              ))}
            </div>

            {hooks.length > 0 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xs text-muted-foreground">
                  {hooks.length} hook dihasilkan
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

