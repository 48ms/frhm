"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { useSuspenseQuery } from "@tanstack/react-query"
import { scheduledPostQueries } from "@/features/scheduled-posts/api/queries"
import { deliverableQueries } from "@/features/deliverables/api/queries"
import { useSendTelegramTest } from "@/features/erp/api/queries"
import { useUpdateDeliverableStatus } from "@/features/deliverables/api/queries"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { CreateDeliverableDialog } from "@/components/deliverable/create-deliverable-dialog"
import { ScheduleDeliverableDialog } from "@/components/deliverable/schedule-deliverable-dialog"
import { DispatchNotificationDialog } from "@/components/notifications/dispatch-notification-dialog"
import { ExportPdfDialog } from "@/components/deliverable/export-pdf-dialog"
import type { Deliverable } from "@/features/deliverables/api/types"
import { StatusBadge, TypeBadge } from "@/components/deliverable/status-badge"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { serializeComposerParams } from "@/lib/searchparams"

export function ErpDashboardClient() {
  const router = useRouter()
  const { clientId, client } = useActiveDashboard()
  // Data khusus client aktif dari DB (bukan listAll() lalu filter).
  const { data: posts } = useSuspenseQuery(scheduledPostQueries.listByClient(clientId))
  const { data: deliverables } = useSuspenseQuery(deliverableQueries.listByClient(clientId))

  const [createOpen, setCreateOpen] = React.useState(false)
  const [schedulingDeliverable, setSchedulingDeliverable] = React.useState<Deliverable | null>(null)
  const [notifyingDeliverable, setNotifyingDeliverable] = React.useState<Deliverable | null>(null)
  const [exportingPdfDeliverable, setExportingPdfDeliverable] = React.useState<Deliverable | null>(null)
  const { mutateAsync: sendTelegramTest, isPending: notifSending } = useSendTelegramTest()
  const updateStatusMutation = useUpdateDeliverableStatus()

  // Tombol "Notifikasi Telegram": kirim test ping ke Telegram admin via mutation hook.
  const handleNotifyTelegram = async () => {
    try {
      const data = await sendTelegramTest()
      toast.success("Notifikasi Telegram berhasil dikirim.", {
        description: `Pesan uji coba terkirim ke chat ${data.chatId}.`,
      })
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengirim notifikasi Telegram.")
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
              {todayPosts.length > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <MetricTicker value={todayPosts.length} /> konten terjadwal tayang hari ini
                </span>
              ) : (
                "Tidak ada jadwal tayang hari ini"
              )}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/calendar")}
          className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[hsl(var(--admin-surface-low))] hover:bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-on-surface))] text-xs font-semibold border border-[hsl(var(--admin-outline-variant))]/50 transition-colors cursor-pointer h-auto"
        >
          Kalender
          <Icons.chevronRight className="size-4 ml-1" />
        </Button>
      </section>

      {/* SECTION: DAFTAR DELIVERABLES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[hsl(var(--admin-on-surface))] admin-headline-md tracking-tight">
              Daftar Deliverables & Dokumen Strategi
            </h2>
            <p className="text-xs text-[hsl(var(--admin-outline))]">
              Materi dan dokumen hasil riset yang telah dikirim ke klien untuk ditinjau.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            variant="outline"
            className="text-xs h-8 gap-1.5 rounded-xl border-[hsl(var(--admin-outline-variant))]/50"
          >
            <Icons.add className="size-3.5" />
            Tambah Deliverable
          </Button>
        </div>

        {clientDeliverables.length === 0 ? (
          <div className="p-8 text-center admin-card rounded-2xl border border-[hsl(var(--admin-outline-variant))]/30 space-y-2">
            <Icons.inbox className="size-8 text-[hsl(var(--admin-outline))]/50 mx-auto" />
            <p className="text-sm font-semibold text-[hsl(var(--admin-on-surface))]">
              Belum Ada Deliverable
            </p>
            <p className="text-xs text-[hsl(var(--admin-outline))] max-w-sm mx-auto">
              Kirim dokumen hasil playbook dari halaman Client Workspaces atau buat deliverable baru di sini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {clientDeliverables.map((d) => (
              <div
                key={d.id}
                className="p-4 admin-card rounded-2xl border border-[hsl(var(--admin-outline-variant))]/40 hover:border-[hsl(var(--admin-cobalt))]/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <TypeBadge type={d.type || "content"} />
                    <StatusBadge status={d.status} />
                  </div>
                  <h3 className="text-sm font-bold text-[hsl(var(--admin-on-surface))] line-clamp-1">
                    {d.title}
                  </h3>
                  {d.content_md && (
                    <p className="text-xs text-[hsl(var(--admin-outline))] line-clamp-2 leading-relaxed">
                      {d.content_md}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[hsl(var(--admin-outline-variant))]/20 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-mono text-[hsl(var(--admin-outline))]">
                    {d.created_at ? new Date(d.created_at).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "-"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Aksi Review Klien & Internal */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const reviewUrl = `${window.location.origin}/review/${d.id}`
                        navigator.clipboard.writeText(reviewUrl)
                        toast.success("Link Review Klien Disalin!", {
                          description: "Tautan siap dibagikan ke WhatsApp Pak Adit / Bunda.",
                        })
                      }}
                      className="h-7 text-xs px-2.5 rounded-lg border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 gap-1"
                    >
                      <Icons.link className="size-3" /> Link Review
                    </Button>

                    <a
                      href={`/review/${d.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center size-7 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                      title="Buka Halaman Review Klien di Tab Baru"
                    >
                      <Icons.externalLink className="size-3.5" />
                    </a>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNotifyingDeliverable(d)}
                      className="h-7 text-xs px-2 rounded-lg border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40 gap-1"
                      title="Kirim Notifikasi Review ke Klien (WA / Telegram)"
                    >
                      <Icons.send className="size-3 text-primary" /> Notifikasi Review
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExportingPdfDeliverable(d)}
                      className="h-7 text-xs px-2 rounded-lg border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40 gap-1"
                      title="Ekspor Dokumen ke Format PDF Eksekutif"
                    >
                      <Icons.fileTypePdf className="size-3 text-red-500" /> PDF
                    </Button>

                    {d.status === "sent" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              deliverableId: d.id,
                              clientId,
                              status: "approved",
                            })
                          }
                          disabled={updateStatusMutation.isPending}
                          className="h-7 text-xs px-2.5 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30 gap-1"
                        >
                          <Icons.check className="size-3" /> Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              deliverableId: d.id,
                              clientId,
                              status: "revision_requested",
                            })
                          }
                          disabled={updateStatusMutation.isPending}
                          className="h-7 text-xs px-2.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 border-amber-500/30 gap-1"
                        >
                          <Icons.refresh className="size-3" /> Revisi
                        </Button>
                      </>
                    )}

                    {d.status === "approved" && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          onClick={() => setSchedulingDeliverable(d)}
                          className="h-7 text-xs px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs"
                        >
                          <Icons.calendar className="size-3" /> Jadwalkan
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(
                              serializeComposerParams("/admin/composer", {
                                clientId,
                                title: d.title,
                                content: d.content_md || "",
                              })
                            )
                          }
                          className="h-7 text-xs px-2.5 rounded-lg border-border/60 text-foreground hover:bg-muted gap-1"
                        >
                          <Icons.edit className="size-3" /> Composer
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                 <span className="font-mono text-1xs text-[hsl(var(--admin-outline))]">
                   {client.channels?.length || 0} / 10
                 </span>
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

      {/* MODAL JADWALKAN DELIVERABLE */}
      <ScheduleDeliverableDialog
        open={Boolean(schedulingDeliverable)}
        onOpenChange={(open) => !open && setSchedulingDeliverable(null)}
        deliverable={schedulingDeliverable}
        clientId={clientId}
      />

      {/* MODAL NOTIFIKASI REVIEW (WA / TELEGRAM) */}
      <DispatchNotificationDialog
        open={Boolean(notifyingDeliverable)}
        onOpenChange={(open) => !open && setNotifyingDeliverable(null)}
        deliverable={notifyingDeliverable}
      />

      {/* MODAL EKSPOR PDF EKSEKUTIF */}
      <ExportPdfDialog
        open={Boolean(exportingPdfDeliverable)}
        onOpenChange={(open) => !open && setExportingPdfDeliverable(null)}
        deliverable={exportingPdfDeliverable}
        clientName={client.name}
      />
    </PageContainer>
  )
}
