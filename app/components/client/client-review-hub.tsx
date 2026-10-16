"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { useQueryStates } from "nuqs"
import { clientReviewSearchParams } from "@/lib/searchparams"
import { deliverableQueries, useUpdateDeliverableStatus } from "@/features/deliverables/api/queries"
import { PageContainer } from "@/components/layout/page-container"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { Icons } from "@/components/icons"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { Deliverable } from "@/features/deliverables/api/types"

interface ClientReviewHubProps {
  clientId: string
}

export function ClientReviewHub({ clientId }: ClientReviewHubProps) {
  const { data: deliverables = [], isLoading } = useQuery(deliverableQueries.listByClient(clientId))
  const [{ status: filter }, setReviewState] = useQueryStates(clientReviewSearchParams, { shallow: true })
  const [revisionItem, setRevisionItem] = React.useState<Deliverable | null>(null)
  const [revisionNotes, setRevisionNotes] = React.useState("")

  const updateStatusMutation = useUpdateDeliverableStatus()

  const filteredDeliverables = React.useMemo(() => {
    if (filter === "all") return deliverables
    return deliverables.filter((d) => d.status === filter)
  }, [deliverables, filter])

  const pendingCount = deliverables.filter((d) => d.status === "sent").length
  const revisionCount = deliverables.filter((d) => d.status === "revision_requested").length
  const approvedCount = deliverables.filter((d) => d.status === "approved").length

  const handleApprove = (deliverable: Deliverable) => {
    updateStatusMutation.mutate({
      deliverableId: deliverable.id,
      clientId,
      status: "approved",
    })
  }

  const handleConfirmRevision = () => {
    if (!revisionItem) return
    updateStatusMutation.mutate(
      {
        deliverableId: revisionItem.id,
        clientId,
        status: "revision_requested",
        notes: revisionNotes,
      },
      {
        onSuccess: () => {
          setRevisionItem(null)
          setRevisionNotes("")
        },
      }
    )
  }

  return (
    <PageContainer
      pageTitle="Deliverables & Review Hub"
      pageDescription="Tinjau materi konten, draf desain, dan publikasi promosi. Berikan persetujuan instan atau ajukan catatan revisi ke tim Frhm."
      pageHeaderAction={
        <div className="flex items-center gap-2">
          <Link
            href={`/client/support?clientId=${clientId}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-full gap-1.5 text-xs font-semibold"
            )}
          >
            <Icons.message className="size-3.5 text-primary" />
            <span>Request Materi Baru</span>
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* 1. Executive Metric Tickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Total Deliverable</span>
              <Icons.layers className="size-4 text-primary" />
            </div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              <MetricTicker value={deliverables.length} />
            </div>
            <p className="text-2xs text-muted-foreground font-medium">
              Semua materi kampanye &amp; promosi
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Menunggu Review</span>
              <Icons.bell className="size-4 text-primary" />
            </div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              <MetricTicker value={pendingCount} />
            </div>
            <p className="text-2xs text-muted-foreground font-medium">
              {pendingCount > 0 ? "Membutuhkan persetujuan Anda" : "Semua draf selesai ditinjau"}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Perlu Revisi</span>
              <Icons.edit className="size-4 text-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              <MetricTicker value={revisionCount} />
            </div>
            <p className="text-2xs text-muted-foreground font-medium">
              {revisionCount > 0 ? "Dalam perbaikan tim kreatif Frhm" : "Tidak ada antrean revisi"}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Telah Disetujui</span>
              <Icons.checkCircle className="size-4 text-[hsl(var(--success))]" />
            </div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              <MetricTicker value={approvedCount} />
            </div>
            <p className="text-2xs text-muted-foreground font-medium">
              Terkunci ke kalender publikasi
            </p>
          </div>
        </div>

        {/* 2. Master Two-Column Workspace (Deliverables List + Context & Quick Action Side Panel) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Column: Filter Tabs + Deliverable Review Cards */}
          <div className="lg:col-span-2 space-y-4">
            {/* Status Filter Tabs */}
            <div className="flex items-center justify-between gap-4 w-full overflow-x-auto no-scrollbar pb-1">
              <Tabs value={filter} onValueChange={(val) => void setReviewState({ status: val as any })} className="w-full sm:w-auto">
                <TabsList aria-label="Deliverable filter tabs" className="h-auto p-1 bg-muted/60 rounded-full border border-border/30 flex items-center w-max">
                  <TabsTrigger value="all" onClick={() => void setReviewState({ status: "all" })} className="rounded-full text-xs font-semibold px-4 py-2 flex items-center gap-1.5 cursor-pointer min-h-11">
                    <span>Semua</span>
                    <span className="opacity-80">(<MetricTicker value={deliverables.length} />)</span>
                  </TabsTrigger>
                  <TabsTrigger value="sent" onClick={() => void setReviewState({ status: "sent" })} className="rounded-full text-xs font-semibold px-4 py-2 flex items-center gap-1.5 cursor-pointer min-h-11">
                    <span>Menunggu Review</span>
                    <span className="opacity-80">(<MetricTicker value={pendingCount} />)</span>
                  </TabsTrigger>
                  <TabsTrigger value="revision_requested" onClick={() => void setReviewState({ status: "revision_requested" })} className="rounded-full text-xs font-semibold px-4 py-2 flex items-center gap-1.5 cursor-pointer min-h-11">
                    <span>Perlu Revisi</span>
                    <span className="opacity-80">(<MetricTicker value={revisionCount} />)</span>
                  </TabsTrigger>
                  <TabsTrigger value="approved" onClick={() => void setReviewState({ status: "approved" })} className="rounded-full text-xs font-semibold px-4 py-2 flex items-center gap-1.5 cursor-pointer min-h-11">
                    <span>Disetujui</span>
                    <span className="opacity-80">(<MetricTicker value={approvedCount} />)</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Deliverables List */}
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-44 rounded-2xl bg-muted/40 border border-border/30" />
                ))}
              </div>
            ) : filteredDeliverables.length === 0 ? (
              <div className="py-14 px-6 text-center rounded-2xl bg-card border border-border/30 space-y-4 shadow-xs">
                <div className="size-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto mb-1">
                  <Icons.layers className="size-6 opacity-60" />
                </div>
                <h3 className="font-bold text-base text-foreground">Tidak Ada Deliverable pada Kategori Ini</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Materi promosi yang dirancang oleh tim Frhm akan otomatis muncul di sini untuk Anda tinjau. Butuh materi kampanye khusus?
                </p>
                <div className="pt-2">
                  <Link
                    href={`/client/support?clientId=${clientId}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "rounded-xl text-xs font-semibold gap-1.5"
                    )}
                  >
                    <Icons.message className="size-3.5 text-primary" />
                    <span>Ajukan Request Materi Baru</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDeliverables.map((item) => {
                  const isPending = item.status === "sent"
                  const isApproved = item.status === "approved"
                  const isRevision = item.status === "revision_requested"

                  return (
                    <div
                      key={item.id}
                      className="p-6 rounded-2xl bg-card border border-border/40 shadow-xs space-y-4 hover:border-primary/40 transition-all"
                    >
                      {/* Card Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/40">
                            {item.type || "Konten"}
                          </span>
                          <span className="text-2xs text-muted-foreground">
                            Dibuat: {format(new Date(item.created_at), "dd MMMM yyyy", { locale: idLocale })}
                          </span>
                        </div>
                        <span
                          className={`text-2xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            isApproved
                              ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20"
                              : isRevision
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          }`}
                        >
                          {isApproved ? "Disetujui" : isRevision ? "Revisi Diminta" : "Menunggu Review"}
                        </span>
                      </div>

                      {/* Title & Excerpt */}
                      <div className="space-y-1.5">
                        <h3 className="font-bold text-lg text-foreground leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                          {item.content_md || "Tidak ada deskripsi tambahan."}
                        </p>
                      </div>

                      {/* Status Info Banner */}
                      {isRevision ? (
                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                          <Icons.clock className="size-4 text-amber-500 shrink-0 mt-0.5" />
                          <div className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-bold text-foreground">Sedang Dalam Proses Revisi: </span>
                            Tim kreatif Frhm sedang memproses catatan perbaikan materi ini. Target SLA penyelesaian adalah maksimal 1x24 jam kerja.
                          </div>
                        </div>
                      ) : isPending ? (
                        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3">
                          <Icons.bell className="size-4 text-primary shrink-0 mt-0.5" />
                          <div className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-bold text-foreground">Siap Ditinjau: </span>
                            Materi draf promosi telah rampung. Silakan tinjau visual &amp; narasi, lalu berikan persetujuan instan atau sertakan catatan revisi spesifik.
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 flex items-start gap-3">
                          <Icons.checkCircle className="size-4 text-[hsl(var(--success))] shrink-0 mt-0.5" />
                          <div className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-bold text-foreground">Telah Disetujui: </span>
                            Materi ini telah lolos persetujuan dan otomatis dikunci ke kalender publikasi multi-platform.
                          </div>
                        </div>
                      )}

                      {/* Card Actions */}
                      <div className="pt-3 border-t border-border/30 flex flex-wrap items-center justify-between gap-3">
                        <a
                          href={`/review/${item.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "rounded-xl text-xs font-semibold gap-1.5 h-8 px-3.5"
                          )}
                        >
                          <Icons.externalLink className="size-3.5 text-primary" />
                          <span>Buka Detail &amp; Ulasan</span>
                        </a>

                        <div className="flex items-center gap-2">
                          {isPending && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRevisionItem(item)
                                setRevisionNotes("")
                              }}
                              className="rounded-xl text-xs font-semibold text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 border-amber-500/30 cursor-pointer h-8 px-3"
                            >
                              <Icons.edit className="size-3.5 mr-1.5" />
                              <span>Ajukan Revisi</span>
                            </Button>
                          )}

                          {isPending && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(item)}
                              disabled={updateStatusMutation.isPending}
                              className="rounded-xl text-xs font-semibold bg-[hsl(var(--success))] text-primary-foreground hover:bg-[hsl(var(--success))]/90 cursor-pointer h-8 px-3.5"
                            >
                              <Icons.check className="size-3.5 mr-1" />
                              <span>Setujui Konten</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Column: Guidance & Direct Assistance */}
          <div className="lg:col-span-1 space-y-4">
            {/* Card 1: Review Steps Guide */}
            <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">Alur Review Mandiri</h3>
                  <p className="text-xs text-muted-foreground">3 langkah mudah persetujuan materi</p>
                </div>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icons.checkCircle className="size-4" />
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                  <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">Buka &amp; Periksa Visual</p>
                    <p className="text-2xs text-muted-foreground leading-relaxed">
                      Klik &quot;Buka Detail&quot; untuk memeriksa slide carousel, naskah copywriting, dan hashtag.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                  <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">Beri Catatan Spesifik</p>
                    <p className="text-2xs text-muted-foreground leading-relaxed">
                      Jika ada perbaikan kata atau visual, gunakan tombol &quot;Ajukan Revisi&quot; dengan poin jelas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                  <div className="size-6 rounded-full bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">1-Klik Approval Instan</p>
                    <p className="text-2xs text-muted-foreground leading-relaxed">
                      Tekan &quot;Setujui&quot; untuk langsung menjadwalkan konten ke kalender tayang multi-platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Need Custom / Additional Material */}
            <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">Request Materi Khusus</h3>
                  <p className="text-xs text-muted-foreground">Kebutuhan event promosi mendadak</p>
                </div>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icons.chat className="size-4" />
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Ada event kilat, pengumuman diskon mendadak, atau butuh aset promosi tambahan? Ajukan tiket dukungan langsung ke tim kreatif Frhm.
              </p>

              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between text-2xs text-muted-foreground px-1">
                  <span>SLA Tanggapan:</span>
                  <span className="font-semibold text-foreground">&lt; 2 Jam Kerja</span>
                </div>
                <Link
                  href={`/client/support?clientId=${clientId}`}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "w-full rounded-xl font-semibold text-xs shadow-xs h-9 cursor-pointer"
                  )}
                >
                  <Icons.message className="size-3.5 mr-2" />
                  <span>Ajukan Request Materi</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SLA & Review Policy Guidance Section */}
        <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-foreground">Kebijakan Ulasan &amp; SLA Revisi Tim Frhm</h3>
            <p className="text-xs text-muted-foreground">Standar operasional demi menjamin kualitas dan ketepatan waktu tayang kampanye brand Anda</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-2">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Icons.clock className="size-4" />
              </div>
              <h4 className="text-xs font-bold text-foreground">SLA Revisi 1x24 Jam Kerja</h4>
              <p className="text-2xs text-muted-foreground leading-relaxed">
                Catatan perbaikan copywriting, penyesuaian font, atau revisi visual minor diselesaikan tim dalam waktu maksimal 1 hari kerja.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-2">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Icons.edit className="size-4" />
              </div>
              <h4 className="text-xs font-bold text-foreground">Catatan Spesifik &amp; Terarah</h4>
              <p className="text-2xs text-muted-foreground leading-relaxed">
                Sertakan nomor slide atau visual spesifik saat mengajukan revisi agar eksekusi perbaikan tim kreatif tepat sasaran.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-2">
              <div className="size-8 rounded-lg bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] flex items-center justify-center font-bold">
                <Icons.checkCircle className="size-4" />
              </div>
              <h4 className="text-xs font-bold text-foreground">Otomatisasi Penjadwalan</h4>
              <p className="text-2xs text-muted-foreground leading-relaxed">
                Begitu tombol &quot;Setujui&quot; ditekan, materi otomatis dikunci masuk ke kalender dan siap dipublikasikan ke media sosial.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revision Request Modal */}
      <Dialog open={Boolean(revisionItem)} onOpenChange={(open) => !open && setRevisionItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajukan Catatan Revisi</DialogTitle>
            <DialogDescription>
              Tuliskan instruksi perbaikan untuk deliverable &quot;{revisionItem?.title}&quot;. Tim Frhm akan segera memperbarui materi.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              placeholder="Contoh: Tolong sesuaikan warna palet logo dan ganti copy pada slide ke-2..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              className="min-h-28 text-xs rounded-xl"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setRevisionItem(null)}>
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmRevision}
              disabled={!revisionNotes.trim() || updateStatusMutation.isPending}
              className="bg-primary text-primary-foreground font-semibold rounded-xl"
            >
              Kirim Permintaan Revisi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
