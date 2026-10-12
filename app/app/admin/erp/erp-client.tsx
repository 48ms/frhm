"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { useSuspenseQuery } from "@tanstack/react-query"
import { scheduledPostQueries } from "@/features/scheduled-posts/api/queries"
import { deliverableQueries } from "@/features/deliverables/api/queries"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { CreateDeliverableDialog } from "@/components/deliverable/create-deliverable-dialog"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"

export function ErpDashboardClient() {
  const router = useRouter()
  const { clientId, client } = useActiveDashboard()
  // Data khusus client aktif dari DB (bukan listAll() lalu filter).
  const { data: posts } = useSuspenseQuery(scheduledPostQueries.listByClient(clientId))
  const { data: deliverables } = useSuspenseQuery(deliverableQueries.listByClient(clientId))

  const [createOpen, setCreateOpen] = React.useState(false)
  const [notifSending, setNotifSending] = React.useState(false)

  // Tombol "Notifikasi Telegram": kirim test ping ke Telegram admin.
  // Backing nyata: POST /api/telegram/test (guard admin + rate limit).
  const handleNotifyTelegram = async () => {
    setNotifSending(true)
    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error || "Gagal mengirim notifikasi Telegram.")
        return
      }
      toast.success("Notifikasi Telegram berhasil dikirim.", {
        description: `Pesan uji coba terkirim ke chat ${data.chatId}.`,
      })
    } catch {
      toast.error("Gagal menghubungi endpoint Telegram.")
    } finally {
      setNotifSending(false)
    }
  }
  const clientPosts = posts || []
  const clientDeliverables = deliverables || []
  
  // === Metrik dihitung dari data NYATA ===
  // Status deliverables: draft | sent | approved | revision_requested (constraint DB)
  const totalDeliverable = clientDeliverables.length
  const waitingReview = clientDeliverables.filter(p => p.status === "sent").length
  const draft = clientDeliverables.filter(p => p.status === "revision_requested").length
  const approved = clientDeliverables.filter(p => p.status === "approved").length

  // Jadwal tayang hari ini — dihitung faktual dari scheduled_at, bukan teks statis.
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayPosts = clientPosts.filter(
    (p) => p.scheduled_at && String(p.scheduled_at).slice(0, 10) === todayStr
  )

  return (
    <PageContainer
      pageTitle="Dashboard"
      pageDescription="Ringkasan deliverable dan performa konten klien"
      pageHeaderAction={
        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleNotifyTelegram}
            isLoading={notifSending}
            variant="ghost"
            className="admin-pill admin-pill-ghost inline-flex items-center gap-2 px-4 py-2 cursor-pointer border"
          >
            <Icons.send className="size-4 text-[hsl(var(--admin-cobalt))]" />
            Notifikasi Telegram
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="admin-pill admin-pill-lime inline-flex items-center gap-2 px-4 py-2 cursor-pointer border-0"
          >
            <Icons.add className="size-4" />
            Deliverable Baru
          </Button>
        </div>
      }
      className="space-y-6 max-w-[1440px] w-full mx-auto"
    >

      <CreateDeliverableDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* TOP METRIC CARDS ROW */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: TOTAL DELIVERABLE */}
        <div className="lg:col-span-8 p-6 admin-card flex flex-col justify-between">
          <p className="admin-section-label">
            TOTAL DELIVERABLE
          </p>
          <div className="my-4">
            <span className="text-5xl font-black font-mono text-[hsl(var(--admin-cobalt))] tracking-tight">
              <MetricTicker value={totalDeliverable} />
            </span>
          </div>
          <p className="text-xs text-[hsl(var(--admin-outline))]">
            Total deliverable untuk {client.name}
          </p>
        </div>

        {/* Right Card: Status Badges — dihitung dari tabel deliverables (status nyata DB) */}
        <div className="lg:col-span-4 p-6 admin-card flex flex-col justify-center space-y-3">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[hsl(var(--admin-cobalt))]/10 border border-[hsl(var(--admin-cobalt))]/20 text-[hsl(var(--admin-cobalt))]">
            <Icons.clock className="size-[18px]" />
            <span className="text-xs font-semibold"><MetricTicker value={waitingReview} /></span>
            <span className="text-xs font-medium text-[hsl(var(--admin-on-surface))]">Menunggu review client</span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]">
            <Icons.warning className="size-[18px]" />
            <span className="text-xs font-semibold"><MetricTicker value={draft} /></span>
            <span className="text-xs font-medium text-[hsl(var(--admin-on-surface))]">Perlu revisi dari kamu</span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 text-[hsl(var(--success))]">
            <Icons.check className="size-[18px]" />
            <span className="text-xs font-semibold"><MetricTicker value={approved} /></span>
            <span className="text-xs font-medium text-[hsl(var(--admin-on-surface))]">Disetujui, siap publish</span>
          </div>
        </div>
      </section>

      {/* MIDDLE NOTICE BANNER: Jadwal Tayang Hari Ini */}
      <section className="p-4 sm:px-6 sm:py-4 admin-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))] flex items-center justify-center shrink-0">
            <Icons.calendar className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[hsl(var(--admin-on-surface))]">Jadwal Tayang Hari Ini</h2>
            <p className="text-xs text-[hsl(var(--admin-outline))]">
              {todayPosts.length > 0
                ? `${todayPosts.length} konten terjadwal tayang hari ini`
                : "Tidak ada jadwal tayang hari ini"}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/admin/calendar")}
          className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[hsl(var(--admin-surface-low))] hover:bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-on-surface))] text-xs font-semibold border border-[hsl(var(--admin-outline-variant))]/50 transition-colors cursor-pointer"
        >
          Kalender
          <Icons.chevronRight className="size-4 ml-1" />
        </button>
      </section>

      {/* CLIENT WORKSPACES GRID */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[hsl(var(--admin-on-surface))] admin-headline-md tracking-tight">
            Klien Aktif: {client.name}
          </h2>
        </div>
          
        <div className="p-5 admin-card flex flex-col justify-between min-h-[160px]">
           <div>
             <h3 className="text-sm font-bold text-[hsl(var(--admin-on-surface))] tracking-tight">{client.name}</h3>
             <div className="mt-4">
               <div className="flex items-center justify-between text-xs text-[hsl(var(--admin-on-surface-variant))] mb-1.5">
                 <span>Channel Terhubung</span>
                 <span className="font-mono text-1xs text-[hsl(var(--admin-outline))]">{client.channels?.length || 0} / 10</span>
               </div>
               <div className="w-full bg-[hsl(var(--admin-surface-high))] h-1.5 rounded-full overflow-hidden">
                 <div className="bg-[hsl(var(--admin-cobalt))] h-full rounded-full transition-all" style={{ width: `${((client.channels?.length || 0) / 10) * 100}%` }}></div>
               </div>
             </div>
           </div>
           <div className="pt-4 mt-5 border-t border-[hsl(var(--admin-outline-variant))]/30 flex items-center justify-between">
             <span className="text-xs text-[hsl(var(--admin-outline))]">
               {client.channels?.length || 0} connected channels
             </span>
           </div>
        </div>
      </section>
    </PageContainer>
  )
}
