"use client"

import * as React from "react"
import { LucideX, LucideCheck, LucideSparkles, LucideSend, LucideAlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { generateBatchPlan } from "@/features/copilot/api/service"
import { useQueryClient } from "@tanstack/react-query"
import { createScheduledPost } from "@/features/scheduled-posts/api/service"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"

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
          res.plan.posts.map((p: any) => ({ ...p, selected: true }))
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
    <div className="relative">
      {!hideTrigger && (
        <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold">
          Batch Plan
        </button>
      )}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-xl border border-border">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">AI Batch Planner</h2>
              <button onClick={() => setIsOpen(false)}><LucideX className="size-5" /></button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
              {step === "config" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1">Periode</label>
                      <select className="w-full px-3 py-2 rounded-xl bg-muted border-none text-sm text-foreground" value={period} onChange={(e) => setPeriod(e.target.value)}>
                        <option value="this week">1 Minggu</option>
                        <option value="this month">1 Bulan</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1">Frekuensi</label>
                      <select className="w-full px-3 py-2 rounded-xl bg-muted border-none text-sm text-foreground" value={postsPerWeek} onChange={(e) => setPostsPerWeek(Number(e.target.value))}>
                        <option value={3}>3 Post/Mg</option>
                        <option value={5}>5 Post/Mg</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Platform</label>
                    <div className="flex flex-wrap gap-2">
                      {["instagram", "tiktok", "linkedin", "shorts", "twitter"].map((p) => (
                        <button key={p} type="button" onClick={() => togglePlatform(p)} className={cn("px-3 py-1.5 rounded-full text-xs font-bold capitalize border", platforms.includes(p) ? "bg-blue-500 text-white" : "bg-muted")}>{p}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Goal</label>
                    <textarea className="w-full min-h-[80px] px-3 py-2 rounded-xl bg-muted border-none text-sm text-foreground" placeholder="Contoh: Fokus awareness..." value={goals} onChange={(e) => setGoals(e.target.value)} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-foreground">Review ({generatedPosts.length} Post)</h3>
                    <button onClick={() => setStep("config")} className="text-[10px] text-blue-500 hover:underline">Kembali</button>
                  </div>
                  <div className="space-y-2">
                    {generatedPosts.map((p, idx) => (
                      <div key={idx} onClick={() => toggleSelectPost(idx)} className={cn("p-3 rounded-2xl border cursor-pointer flex gap-3", p.selected ? "bg-blue-50 border-blue-200" : "bg-muted/30 border-transparent opacity-60")}>
                        <div className={cn("w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5", p.selected ? "bg-blue-500 border-blue-500 text-white" : "border-muted-foreground/30")}>{p.selected && <LucideCheck className="size-3" />}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{p.title}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{p.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end gap-3 bg-card">
              <button onClick={() => setIsOpen(false)} className="px-5 py-2.5 rounded-full font-bold text-sm text-muted-foreground hover:bg-muted">Batal</button>
              {step === "config" ? (
                <button onClick={handleGenerate} disabled={isPending || goals.trim().length < 10} className="px-5 py-2.5 rounded-full font-bold text-sm bg-blue-600 text-white shadow-md">Generate Kalender</button>
              ) : (
                <button onClick={handleSaveSelected} disabled={isSaving} className="px-5 py-2.5 rounded-full font-bold text-sm bg-blue-600 text-white shadow-md">Simpan</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
