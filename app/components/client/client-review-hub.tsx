"use client"

import * as React from "react"
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
    >
      {/* Status Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={filter} onValueChange={(val) => void setReviewState({ status: val as any })}>
          <TabsList aria-label="Deliverable filter tabs" className="h-auto p-1 bg-muted/60 rounded-full border border-border/30">
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

      {/* Deliverables Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-muted/40 border border-border/30" />
          ))}
        </div>
      ) : filteredDeliverables.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border/30 space-y-3">
          <Icons.layers className="size-10 mx-auto text-muted-foreground/40" />
          <h3 className="font-bold text-base text-foreground">Tidak Ada Deliverable pada Kategori Ini</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Materi yang dipromosikan oleh tim Frhm akan otomatis muncul di sini untuk ditinjau.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeliverables.map((item) => {
            const isPending = item.status === "sent"
            const isApproved = item.status === "approved"
            const isRevision = item.status === "revision_requested"

            return (
              <div
                key={item.id}
                className="p-6 rounded-2xl bg-card border border-border/40 shadow-xs flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/40">
                      {item.type || "Konten"}
                    </span>
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

                  <div>
                    <h3 className="font-bold text-base text-foreground leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                      {item.content_md || "Tidak ada deskripsi tambahan."}
                    </p>
                  </div>

                  <div className="pt-2 text-2xs text-muted-foreground">
                    Dibuat: {format(new Date(item.created_at), "dd MMMM yyyy", { locale: idLocale })}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/review/${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "flex-1 rounded-xl text-xs font-semibold"
                      )}
                    >
                      <Icons.externalLink className="size-3.5 mr-1.5 text-primary" />
                      <span>Buka Detail</span>
                    </a>

                    {isPending && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRevisionItem(item)
                          setRevisionNotes("")
                        }}
                        className="rounded-xl text-xs font-semibold text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 border-amber-500/30 cursor-pointer"
                      >
                        Revisi
                      </Button>
                    )}

                    {isPending && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(item)}
                        disabled={updateStatusMutation.isPending}
                        className="rounded-xl text-xs font-semibold bg-[hsl(var(--success))] text-primary-foreground hover:bg-[hsl(var(--success))]/90 cursor-pointer"
                      >
                        <Icons.check className="size-3.5 mr-1" />
                        Setujui
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
