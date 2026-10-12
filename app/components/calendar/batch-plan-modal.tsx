"use client"

import * as React from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { generateBatchPlan } from "@/features/copilot/api/service"
import { useQueryClient } from "@tanstack/react-query"
import { createScheduledPost } from "@/features/scheduled-posts/api/service"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/animate-ui/components/radix/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"

export function BatchPlanModal({ 
  open,
  onOpenChange,
  hideTrigger
}: { 
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}) {
  const { client } = useActiveDashboard()
  const clientId = client?.id
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen
  
  const [period, setPeriod] = React.useState("this week")
  const [goals, setGoals] = React.useState("")
  const [postsPerWeek, setPostsPerWeek] = React.useState(3)
  const [platforms, setPlatforms] = React.useState<string[]>(["instagram", "tiktok"])
  
  const [step, setStep] = React.useState<"config" | "preview">("config")
  const [generatedPosts, setGeneratedPosts] = React.useState<Array<{
    title: string
    platform: string
    scheduled_at: string
    content: string
    notes?: string
    selected: boolean
  }>>([])
  const [isSaving, setIsSaving] = React.useState(false)
  const [isPending, setIsPending] = React.useState(false)

  const queryClient = useQueryClient()

  const handleGenerate = async () => {
    if (!clientId) {
      toast.error("Pilih klien aktif terlebih dahulu.")
      return
    }
    if (!goals || goals.trim().length < 10) {
      toast.error("Tolong isi goal lebih rinci (minimal 10 karakter).")
      return
    }

    setIsPending(true)
    try {
      const res = await generateBatchPlan({
        clientId,
        period,
        goals,
        postsPerWeek,
        platforms,
      })

      if (res.error) {
        toast.error(res.error)
        return
      }

      if (res.plan && res.plan.posts.length > 0) {
        setGeneratedPosts(
          res.plan.posts.map((p) => ({ ...p, selected: true }))
        )
        setStep("preview")
      } else {
        toast.error("Gagal mendapatkan posts dari AI.")
      }
    } catch {
      toast.error("Gagal men-generate batch plan.")
    } finally {
      setIsPending(false)
    }
  }

  const handleSaveSelected = async () => {
    if (!clientId) return
    const selected = generatedPosts.filter((p) => p.selected)
    if (selected.length === 0) {
      toast.error("Pilih setidaknya satu post untuk disimpan.")
      return
    }

    setIsSaving(true)
    const toastId = toast.loading(`Menyimpan ${selected.length} post ke kalender...`)

    try {
      const results = await Promise.allSettled(
        selected.map((p) =>
          createScheduledPost({
            client_id: clientId,
            title: p.title,
            content: p.content,
            platform: p.platform as any,
            scheduled_at: p.scheduled_at,
            status: "draft",
            notes: p.notes,
            is_reserved: false,
            is_placeholder: false,
          })
        )
      )

      toast.dismiss(toastId)
      const saved = results.filter((r) => r.status === "fulfilled").length
      const failed = results.length - saved

      queryClient.invalidateQueries({ queryKey: ["scheduled-posts", clientId] })

      if (failed > 0) {
        toast.warning("Batch Plan Selesai Sebagian", {
          description: `${saved} post tersimpan, ${failed} gagal disave.`,
        })
      } else {
        toast.success("Batch Plan Berhasil Disimpan!", {
          description: `${saved} post ditambahkan ke kalender sebagai draft.`,
        })
      }
      
      setStep("config")
      setGeneratedPosts([])
      setIsOpen(false)
    } catch {
      toast.dismiss(toastId)
      toast.error("Terjadi kesalahan saat menyimpan post.")
    } finally {
      setIsSaving(false)
    }
  }

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => 
      prev.includes(p) ? prev.filter((i) => i !== p) : [...prev, p]
    )
  }

  const toggleSelectPost = (index: number) => {
    setGeneratedPosts((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    )
  }

  return (
    <>
      {!hideTrigger && (
        <Button onClick={() => setIsOpen(true)} className="rounded-full text-xs font-bold gap-2">
          <Icons.sparkles className="size-3.5" />
          Batch Plan
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl bg-card border border-border">
          <DialogHeader className="p-6 border-b border-border/40 pb-4">
            <DialogTitle className="font-bold text-lg flex items-center gap-2">
              <Icons.sparkles className="size-5 text-[hsl(var(--admin-cobalt))]" />
              AI Batch Planner
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Otomasi perencanaan konten kalender secara serentak berdasarkan pilar dan tujuan brand.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
            {step === "config" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1.5">Periode</label>
                    <Tabs value={period} onValueChange={setPeriod}>
                      <TabsList
                        highlightClassName="bg-card shadow-sm rounded-lg"
                        className="w-full grid grid-cols-2 h-9 p-0.5 bg-muted/60 rounded-xl"
                      >
                        <TabsTrigger
                          value="this week"
                          className="text-xs font-bold py-1"
                        >
                          1 Minggu
                        </TabsTrigger>
                        <TabsTrigger
                          value="this month"
                          className="text-xs font-bold py-1"
                        >
                          1 Bulan
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1.5">Frekuensi</label>
                    <Tabs value={String(postsPerWeek)} onValueChange={(val) => setPostsPerWeek(Number(val))}>
                      <TabsList
                        highlightClassName="bg-card shadow-sm rounded-lg"
                        className="w-full grid grid-cols-2 h-9 p-0.5 bg-muted/60 rounded-xl"
                      >
                        <TabsTrigger
                          value="3"
                          className="text-xs font-bold py-1"
                        >
                          3 Post/Mg
                        </TabsTrigger>
                        <TabsTrigger
                          value="5"
                          className="text-xs font-bold py-1"
                        >
                          5 Post/Mg
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">Platform Target</label>
                  <div className="flex flex-wrap gap-2">
                    {["instagram", "tiktok", "linkedin", "shorts", "twitter"].map((p) => {
                      const active = platforms.includes(p)
                      return (
                        <Button
                          key={p}
                          type="button"
                          variant={active ? "default" : "outline"}
                          size="sm"
                          onClick={() => togglePlatform(p)}
                          className={cn(
                            "rounded-full text-xs font-bold capitalize border transition-all cursor-pointer h-auto py-1 px-3",
                            active
                              ? "bg-[hsl(var(--admin-cobalt))] text-[hsl(var(--admin-cobalt-foreground))] border-[hsl(var(--admin-cobalt))] shadow-xs hover:bg-[hsl(var(--admin-cobalt))]/90"
                              : "bg-muted/50 border-border/40 hover:bg-muted text-muted-foreground"
                          )}
                        >
                          {p}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">Goal & Tema Khusus</label>
                  <textarea
                    className="w-full min-h-[90px] px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--admin-cobalt))]"
                    placeholder="Contoh: Fokus awareness peluncuran produk baru dan edukasi problem solving..."
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1">
                    <span>Review (</span>
                    <MetricTicker value={generatedPosts.length} />
                    <span> Post)</span>
                  </h3>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setStep("config")}
                    className="text-xs font-semibold text-[hsl(var(--admin-cobalt))] p-0 h-auto"
                  >
                    ← Kembali ke Config
                  </Button>
                </div>
                <div className="space-y-2">
                  {generatedPosts.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleSelectPost(idx)}
                      className={cn(
                        "p-3 rounded-2xl border cursor-pointer flex gap-3 transition-all",
                        p.selected
                          ? "bg-[hsl(var(--admin-cobalt))/10] border-[hsl(var(--admin-cobalt))/30] shadow-xs"
                          : "bg-muted/20 border-border/30 opacity-60 hover:opacity-100"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                          p.selected
                            ? "bg-[hsl(var(--admin-cobalt))] border-[hsl(var(--admin-cobalt))] text-white"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {p.selected && <Icons.check className="size-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{p.title}</p>
                        <p className="text-2xs text-muted-foreground line-clamp-1">{p.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border/40 flex justify-end gap-2.5 bg-muted/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="rounded-full font-bold text-xs"
            >
              Batalkan
            </Button>
            {step === "config" ? (
              <Button
                onClick={handleGenerate}
                disabled={isPending || goals.trim().length < 10}
                isLoading={isPending}
                className="rounded-full font-bold text-xs bg-[hsl(var(--admin-cobalt))] text-white shadow-sm"
              >
                {isPending ? (
                  <ShimmeringText text="Merancang Batch Kalender…" className="text-xs font-semibold" />
                ) : (
                  "Generate Kalender"
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSaveSelected}
                disabled={isSaving}
                isLoading={isSaving}
                className="rounded-full font-bold text-xs bg-[hsl(var(--admin-cobalt))] text-white shadow-sm flex items-center gap-1"
              >
                <span>Simpan </span>
                <MetricTicker value={generatedPosts.filter((p) => p.selected).length} />
                <span> Post</span>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
