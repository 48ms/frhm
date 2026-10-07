"use client"

import * as React from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useGenerateBatchPlan } from "@/features/copilot/api/queries"
import { useQueryClient } from "@tanstack/react-query"
import { createScheduledPost } from "@/features/scheduled-posts/api/service"

export function BatchPlanModal({ 
  clientId,
  open,
  onOpenChange,
  hideTrigger
}: { 
  clientId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen
  const [period, setPeriod] = React.useState("this week")
  const [goals, setGoals] = React.useState("")
  const [postsPerWeek, setPostsPerWeek] = React.useState(3)
  const [platforms, setPlatforms] = React.useState<string[]>(["instagram", "tiktok"])
  
  const { mutateAsync: generatePlan, isPending } = useGenerateBatchPlan()
  const queryClient = useQueryClient()

  const handleGenerate = async () => {
    if (!goals) {
      toast.error("Tolong isi goal untuk batch plan ini.")
      return
    }
    if (platforms.length === 0) {
      toast.error("Pilih setidaknya satu platform.")
      return
    }

    try {
      const res = await generatePlan({
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
        // Save each post to scheduled_posts as draft
        for (const p of res.plan.posts) {
          await createScheduledPost({
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
        }
        
        // Refresh calendar
        queryClient.invalidateQueries({ queryKey: ["scheduled-posts", clientId] })
        toast.success("Batch Plan Selesai! 🗓️", {
          description: `${res.plan.posts.length} post berhasil ditambahkan ke kalender sebagai draft.`,
          action: {
            label: "Tutup",
            onClick: () => setIsOpen(false)
          }
        })
        setIsOpen(false)
      } else {
        toast.error("Gagal mendapatkan posts dari AI.")
      }
    } catch (err: any) {
      toast.error("Gagal men-generate batch plan.")
    }
  }

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => 
      prev.includes(p) ? prev.filter((i) => i !== p) : [...prev, p]
    )
  }

  return (
    <>
      {!hideTrigger && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
        >
          {/* Icons.sparkles = AI batch planning feature (R-04 exception: AI feature with written justification) */}
          <Icons.sparkles className="size-[18px]" />
          AI Batch Plan
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-border/40 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Icons.calendar className="size-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Auto-Fill Batch Plan</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Generate sebulan/seminggu konten otomatis sesuai Brand DNA.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              >
                <Icons.close className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Periode Perencanaan</label>
                    <select
                      className="w-full px-3 py-2 rounded-xl bg-muted border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                    >
                      <option value="this week">1 Minggu Kedepan</option>
                      <option value="this month">1 Bulan Kedepan</option>
                      <option value="next month">Bulan Depan</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Frekuensi / Kapasitas</label>
                    <select
                      className="w-full px-3 py-2 rounded-xl bg-muted border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      value={postsPerWeek}
                      onChange={(e) => setPostsPerWeek(Number(e.target.value))}
                    >
                      <option value={2}>2 Post / Minggu (Low)</option>
                      <option value={3}>3 Post / Minggu (Balanced)</option>
                      <option value={5}>5 Post / Minggu (Aggressive)</option>
                      <option value={7}>7 Post / Minggu (Daily)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Pilih Platform Target</label>
                  <div className="flex flex-wrap gap-2">
                    {["instagram", "tiktok", "linkedin", "shorts", "twitter"].map((p) => (
                      <button
                        key={p}
                        onClick={() => togglePlatform(p)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all border",
                          platforms.includes(p)
                            ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                            : "bg-background text-muted-foreground border-border/60 hover:border-blue-300"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Goal (Tujuan Batch)</label>
                  <textarea
                    className="w-full min-h-[80px] px-3 py-2 rounded-xl bg-muted border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="Contoh: Fokus awareness produk baru, perbanyak konten edukasi fundamental, drive traffic ke website..."
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex gap-3 text-amber-500">
                <Icons.alertCircle className="size-5 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold block mb-0.5">Strategi Otomatis</span>
                  AI akan membaca <strong>Brand Profile</strong> (Identity, Voice, Guardrails) klien ini sebelum membangun kalender. Pastikan Brand Profile sudah terisi untuk hasil terbaik.
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border/20 flex justify-end gap-3 bg-card">
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 rounded-full font-bold text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleGenerate}
                disabled={isPending || !goals || platforms.length === 0}
                className="px-5 py-2.5 rounded-full font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <Icons.spinner className="size-4 animate-spin" /> Sedang Merencanakan...
                  </>
                ) : (
                  <>
                    {/* Icons.sparkles = AI generation action (R-04 exception: AI feature with written justification) */}
                    <Icons.sparkles className="size-4" /> Generate Kalender
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
