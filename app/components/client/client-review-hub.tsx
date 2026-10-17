"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { useQueryStates } from "nuqs"
import { clientReviewSearchParams } from "@/lib/searchparams"
import { deliverableQueries, useUpdateDeliverableStatus } from "@/features/deliverables/api/queries"
import { useScheduledPosts, useUpdateScheduledPost } from "@/features/scheduled-posts/api/queries"
import type { ScheduledPost } from "@/features/scheduled-posts/api/types"
import type { Deliverable } from "@/features/deliverables/api/types"
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
import { toast } from "sonner"

const PLATFORM_META: Record<
  string,
  { label: string; icon: keyof typeof Icons; badge: string }
> = {
  instagram: {
    label: "Instagram",
    icon: "instagram",
    badge: "bg-[hsl(var(--platform-instagram)/.1)] text-[hsl(var(--platform-instagram))] border-[hsl(var(--platform-instagram)/.2)]",
  },
  tiktok: {
    label: "TikTok",
    icon: "tiktok",
    badge: "bg-[hsl(var(--platform-tiktok)/.1)] text-[hsl(var(--platform-tiktok))] border-[hsl(var(--platform-tiktok)/.2)]",
  },
  youtube: {
    label: "YouTube",
    icon: "youtube",
    badge: "bg-[hsl(var(--platform-youtube)/.1)] text-[hsl(var(--platform-youtube))] border-[hsl(var(--platform-youtube)/.2)]",
  },
  shorts: {
    label: "Shorts",
    icon: "youtube",
    badge: "bg-[hsl(var(--platform-youtube)/.1)] text-[hsl(var(--platform-youtube))] border-[hsl(var(--platform-youtube)/.2)]",
  },
  linkedin: {
    label: "LinkedIn",
    icon: "linkedin",
    badge: "bg-[hsl(var(--platform-linkedin)/.1)] text-[hsl(var(--platform-linkedin))] border-[hsl(var(--platform-linkedin)/.2)]",
  },
  facebook: {
    label: "Facebook",
    icon: "facebook",
    badge: "bg-[hsl(var(--platform-facebook)/.1)] text-[hsl(var(--platform-facebook))] border-[hsl(var(--platform-facebook)/.2)]",
  },
  twitter: {
    label: "Twitter / X",
    icon: "twitter",
    badge: "bg-[hsl(var(--platform-twitter)/.1)] text-[hsl(var(--platform-twitter))] border-[hsl(var(--platform-twitter)/.2)]",
  },
  x: {
    label: "X",
    icon: "twitter",
    badge: "bg-[hsl(var(--platform-twitter)/.1)] text-[hsl(var(--platform-twitter))] border-[hsl(var(--platform-twitter)/.2)]",
  },
}

interface ClientReviewHubProps {
  clientId: string
}

export function ClientReviewHub({ clientId }: ClientReviewHubProps) {
  const { data: deliverables = [], isLoading: isLoadingDeliverables } = useQuery(
    deliverableQueries.listByClient(clientId)
  )
  const { data: scheduledPosts = [], isLoading: isLoadingPosts } = useScheduledPosts(clientId)

  const [{ status: filter, scope = "deliverables" }, setReviewState] = useQueryStates(
    clientReviewSearchParams,
    { shallow: true }
  )

  const [revisionItem, setRevisionItem] = React.useState<Deliverable | null>(null)
  const [revisionNotes, setRevisionNotes] = React.useState("")

  const [revisionPost, setRevisionPost] = React.useState<ScheduledPost | null>(null)
  const [postRevisionNotes, setPostRevisionNotes] = React.useState("")
  const [previewPost, setPreviewPost] = React.useState<ScheduledPost | null>(null)

  const [isBatchApproving, setIsBatchApproving] = React.useState(false)
  const [postStatusFilter, setPostStatusFilter] = React.useState<"all" | "draft" | "scheduled">("all")

  const updateDeliverableStatusMutation = useUpdateDeliverableStatus()
  const updateScheduledPostMutation = useUpdateScheduledPost()

  // Deliverables filter & metrics
  const filteredDeliverables = React.useMemo(() => {
    if (filter === "all") return deliverables
    return deliverables.filter((d) => d.status === filter)
  }, [deliverables, filter])

  const pendingCount = deliverables.filter((d) => d.status === "sent").length
  const revisionCount = deliverables.filter((d) => d.status === "revision_requested").length
  const approvedCount = deliverables.filter((d) => d.status === "approved").length

  // Scheduled posts filter & metrics
  const draftPosts = React.useMemo(() => scheduledPosts.filter((p) => p.status === "draft"), [scheduledPosts])
  const activeScheduledPosts = React.useMemo(
    () => scheduledPosts.filter((p) => p.status === "scheduled"),
    [scheduledPosts]
  )
  const publishedPosts = React.useMemo(
    () => scheduledPosts.filter((p) => p.status === "published"),
    [scheduledPosts]
  )

  const filteredPosts = React.useMemo(() => {
    if (postStatusFilter === "all") return scheduledPosts
    return scheduledPosts.filter((p) => p.status === postStatusFilter)
  }, [scheduledPosts, postStatusFilter])

  // Intent breakdown for Batch Plan compliance
  const intentCounts = React.useMemo(() => {
    let save = 0
    let share = 0
    let direct = 0
    for (const post of scheduledPosts) {
      const text = (post.title + " " + post.content + " " + (post.campaign_tag || "")).toLowerCase()
      if (
        text.includes("direct") ||
        text.includes("promo") ||
        text.includes("order") ||
        text.includes("diskon") ||
        text.includes("beli") ||
        text.includes("wa.me")
      ) {
        direct++
      } else if (
        text.includes("share") ||
        text.includes("relate") ||
        text.includes("story") ||
        text.includes("kebun")
      ) {
        share++
      } else {
        save++
      }
    }
    const total = scheduledPosts.length || 1
    return {
      save,
      share,
      direct,
      directPct: Math.round((direct / total) * 100),
      isSafePromo: direct / total <= 0.25,
    }
  }, [scheduledPosts])

  // Deliverable Actions
  const handleApproveDeliverable = (deliverable: Deliverable) => {
    updateDeliverableStatusMutation.mutate({
      deliverableId: deliverable.id,
      clientId,
      status: "approved",
    })
  }

  const handleConfirmDeliverableRevision = () => {
    if (!revisionItem) return
    updateDeliverableStatusMutation.mutate(
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

  // Scheduled Post Actions
  const handleBatchApproveAllPosts = async () => {
    if (draftPosts.length === 0) return
    setIsBatchApproving(true)
    try {
      await Promise.all(
        draftPosts.map((post) =>
          updateScheduledPostMutation.mutateAsync({
            id: post.id,
            clientId,
            status: "scheduled",
          })
        )
      )
      toast.success(`Berhasil menyetujui & menjadwalkan ${draftPosts.length} konten minggu ini!`)
    } catch {
      toast.error("Gagal menyetujui seluruh jadwal. Silakan coba kembali.")
    } finally {
      setIsBatchApproving(false)
    }
  }

  const handleApproveSinglePost = (post: ScheduledPost) => {
    updateScheduledPostMutation.mutate(
      {
        id: post.id,
        clientId,
        status: "scheduled",
      },
      {
        onSuccess: () => {
          toast.success(`Konten "${post.title}" disetujui & dijadwalkan!`)
          if (previewPost?.id === post.id) {
            setPreviewPost((prev) => (prev ? { ...prev, status: "scheduled" } : null))
          }
        },
      }
    )
  }

  const handleConfirmPostRevision = () => {
    if (!revisionPost || !postRevisionNotes.trim()) return
    const existingNotes = revisionPost.notes ? `${revisionPost.notes}\n` : ""
    const updatedNote = `${existingNotes}[Catatan Revisi Klien ${format(new Date(), "dd/MM HH:mm")}]: ${postRevisionNotes.trim()}`

    updateScheduledPostMutation.mutate(
      {
        id: revisionPost.id,
        clientId,
        notes: updatedNote,
      },
      {
        onSuccess: () => {
          toast.success("Catatan revisi tersimpan untuk tim kreatif Frhm")
          setRevisionPost(null)
          setPostRevisionNotes("")
        },
      }
    )
  }

  const isDeliverablesScope = scope === "deliverables"

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
        {/* Scope Switcher: Deliverables vs Batch Schedule Plan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void setReviewState({ scope: "deliverables" })}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                isDeliverablesScope
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <Icons.layers className="size-4" />
              <span>Dokumen &amp; Desain Deliverable</span>
              <span className="text-2xs px-2 py-0.5 rounded-full bg-background/20 font-mono">
                <MetricTicker value={deliverables.length} />
              </span>
            </button>

            <button
              type="button"
              onClick={() => void setReviewState({ scope: "batch_schedule" })}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                !isDeliverablesScope
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <Icons.calendar className="size-4" />
              <span>Draf Kalender Publikasi (Batch)</span>
              <span className="text-2xs px-2 py-0.5 rounded-full bg-background/20 font-mono">
                <MetricTicker value={scheduledPosts.length} />
              </span>
            </button>
          </div>

          {!isDeliverablesScope && (
            <div className="flex items-center gap-2">
              {draftPosts.length > 0 ? (
                <Button
                  size="sm"
                  onClick={handleBatchApproveAllPosts}
                  disabled={isBatchApproving}
                  className="rounded-xl text-xs font-bold bg-[hsl(var(--success))] text-primary-foreground hover:bg-[hsl(var(--success))]/90 shadow-xs cursor-pointer gap-1.5"
                >
                  <Icons.check className="size-3.5" />
                  <span>
                    {isBatchApproving
                      ? "Menyetujui..."
                      : `Setujui Seluruh Jadwal Minggu Ini (${draftPosts.length})`}
                  </span>
                </Button>
              ) : scheduledPosts.length > 0 ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 text-xs font-bold text-[hsl(var(--success))]">
                  <Icons.checkCircle className="size-3.5" />
                  <span>Seluruh Jadwal Terkunci</span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* 1. Dynamic Executive Metric Tickers */}
        {isDeliverablesScope ? (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Total Rencana Konten</span>
                <Icons.calendar className="size-4 text-primary" />
              </div>
              <div className="text-3xl font-extrabold text-foreground tracking-tight">
                <MetricTicker value={scheduledPosts.length} />
              </div>
              <p className="text-2xs text-muted-foreground font-medium">
                Postingan batch 1 minggu berjalan
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Menunggu Approval (Draf)</span>
                <Icons.bell className="size-4 text-amber-500" />
              </div>
              <div className="text-3xl font-extrabold text-foreground tracking-tight">
                <MetricTicker value={draftPosts.length} />
              </div>
              <p className="text-2xs text-muted-foreground font-medium">
                {draftPosts.length > 0 ? "Siap disetujui 1-klik sekaligus" : "Semua konten telah disetujui"}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Siap Tayang (Terjadwal)</span>
                <Icons.checkCircle className="size-4 text-primary" />
              </div>
              <div className="text-3xl font-extrabold text-foreground tracking-tight">
                <MetricTicker value={activeScheduledPosts.length} />
              </div>
              <p className="text-2xs text-muted-foreground font-medium">
                Terkunci masuk antrean publikasi
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Selesai Terbit</span>
                <Icons.check className="size-4 text-[hsl(var(--success))]" />
              </div>
              <div className="text-3xl font-extrabold text-foreground tracking-tight">
                <MetricTicker value={publishedPosts.length} />
              </div>
              <p className="text-2xs text-muted-foreground font-medium">
                Telah live di platform sosial
              </p>
            </div>
          </div>
        )}

        {/* 2. Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-4">
            {isDeliverablesScope ? (
              <>
                {/* Status Filter Tabs for Deliverables */}
                <div className="flex items-center justify-between gap-4 w-full overflow-x-auto no-scrollbar pb-1">
                  <Tabs
                    value={filter}
                    onValueChange={(val) => void setReviewState({ status: val as any })}
                    className="w-full sm:w-auto"
                  >
                    <TabsList
                      aria-label="Deliverable filter tabs"
                      className="h-auto p-1 bg-muted/60 rounded-full border border-border/30 flex items-center w-max"
                    >
                      <TabsTrigger
                        value="all"
                        onClick={() => void setReviewState({ status: "all" })}
                        className="rounded-full text-xs font-semibold px-4 py-2 flex items-center gap-1.5 cursor-pointer min-h-11"
                      >
                        <span>Semua</span>
                        <span className="opacity-80">
                          (<MetricTicker value={deliverables.length} />)
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="sent"
                        onClick={() => void setReviewState({ status: "sent" })}
                        className="rounded-full text-xs font-semibold px-4 py-2 flex items-center gap-1.5 cursor-pointer min-h-11"
                      >
                        <span>Menunggu Review</span>
                        <span className="opacity-80">
                          (<MetricTicker value={pendingCount} />)
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="revision_requested"
                        onClick={() => void setReviewState({ status: "revision_requested" })}
                        className="rounded-full text-xs font-semibold px-4 py-2 flex items-center gap-1.5 cursor-pointer min-h-11"
                      >
                        <span>Perlu Revisi</span>
                        <span className="opacity-80">
                          (<MetricTicker value={revisionCount} />)
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="approved"
                        onClick={() => void setReviewState({ status: "approved" })}
                        className="rounded-full text-xs font-semibold px-4 py-2 flex items-center gap-1.5 cursor-pointer min-h-11"
                      >
                        <span>Disetujui</span>
                        <span className="opacity-80">
                          (<MetricTicker value={approvedCount} />)
                        </span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Deliverables Cards */}
                {isLoadingDeliverables ? (
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
                    <h3 className="font-bold text-base text-foreground">
                      Tidak Ada Deliverable pada Kategori Ini
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      Materi promosi yang dirancang oleh tim Frhm akan otomatis muncul di sini untuk Anda
                      tinjau.
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
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/40">
                                {item.type || "Konten"}
                              </span>
                              <span className="text-2xs text-muted-foreground">
                                Dibuat:{" "}
                                {format(new Date(item.created_at), "dd MMMM yyyy", {
                                  locale: idLocale,
                                })}
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
                              {isApproved
                                ? "Disetujui"
                                : isRevision
                                ? "Revisi Diminta"
                                : "Menunggu Review"}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <h3 className="font-bold text-lg text-foreground leading-snug">
                              {item.title}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                              {item.content_md || "Tidak ada deskripsi tambahan."}
                            </p>
                          </div>

                          {isRevision ? (
                            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                              <Icons.clock className="size-4 text-amber-500 shrink-0 mt-0.5" />
                              <div className="text-xs text-muted-foreground leading-relaxed">
                                <span className="font-bold text-foreground">
                                  Sedang Dalam Proses Revisi:{" "}
                                </span>
                                Tim kreatif Frhm sedang memproses catatan perbaikan materi ini. Target SLA
                                penyelesaian adalah maksimal 1x24 jam kerja.
                              </div>
                            </div>
                          ) : isPending ? (
                            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3">
                              <Icons.bell className="size-4 text-primary shrink-0 mt-0.5" />
                              <div className="text-xs text-muted-foreground leading-relaxed">
                                <span className="font-bold text-foreground">Siap Ditinjau: </span>
                                Materi draf promosi telah rampung. Silakan tinjau visual &amp; narasi, lalu
                                berikan persetujuan instan atau sertakan catatan revisi spesifik.
                              </div>
                            </div>
                          ) : (
                            <div className="p-3.5 rounded-xl bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 flex items-start gap-3">
                              <Icons.checkCircle className="size-4 text-[hsl(var(--success))] shrink-0 mt-0.5" />
                              <div className="text-xs text-muted-foreground leading-relaxed">
                                <span className="font-bold text-foreground">Telah Disetujui: </span>
                                Materi ini telah lolos persetujuan dan otomatis dikunci ke kalender publikasi
                                multi-platform.
                              </div>
                            </div>
                          )}

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
                                  onClick={() => handleApproveDeliverable(item)}
                                  disabled={updateDeliverableStatusMutation.isPending}
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
              </>
            ) : (
              <>
                {/* Batch Plan Overview & Intent Mix Signal Assurance */}
                <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Icons.checkCircle className="size-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">
                          Audit Algoritma METER &amp; Intent Mix
                        </h4>
                        <p className="text-2xs text-muted-foreground">
                          Rasio materi promosi vs edukasi &amp; relasional
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-2xs font-bold px-2.5 py-1 rounded-full border",
                        intentCounts.isSafePromo
                          ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      )}
                    >
                      {intentCounts.isSafePromo
                        ? `Aman Algoritma (Promo ${intentCounts.directPct}% ≤ 20%)`
                        : `Perhatian (Promo ${intentCounts.directPct}% > 20%)`}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Setiap draf mingguan dijaga ketat agar tidak memicu shadowban atau fatigue audiens.
                    Mayoritas ({100 - intentCounts.directPct}%) materi difokuskan pada signal murni (Saves &amp;
                    Shares organik), dan promosi langsung dibatasi maksimal 20%.
                  </p>
                </div>

                {/* Filter Tabs for Batch Posts */}
                <div className="flex items-center justify-between gap-4 w-full overflow-x-auto no-scrollbar pb-1">
                  <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-full border border-border/30">
                    <button
                      type="button"
                      onClick={() => setPostStatusFilter("all")}
                      className={cn(
                        "rounded-full text-xs font-semibold px-4 py-2 flex items-center gap-1.5 cursor-pointer min-h-10 transition-all",
                        postStatusFilter === "all"
                          ? "bg-card text-foreground shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>Semua Konten</span>
                      <span className="opacity-80">({scheduledPosts.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPostStatusFilter("draft")}
                      className={cn(
                        "rounded-full text-xs font-semibold px-4 py-2 flex items-center gap-1.5 cursor-pointer min-h-10 transition-all",
                        postStatusFilter === "draft"
                          ? "bg-card text-foreground shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>Menunggu Approval</span>
                      <span className="opacity-80">({draftPosts.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPostStatusFilter("scheduled")}
                      className={cn(
                        "rounded-full text-xs font-semibold px-4 py-2 flex items-center gap-1.5 cursor-pointer min-h-10 transition-all",
                        postStatusFilter === "scheduled"
                          ? "bg-card text-foreground shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>Sudah Dijadwalkan</span>
                      <span className="opacity-80">({activeScheduledPosts.length})</span>
                    </button>
                  </div>
                </div>

                {/* Scheduled Posts Cards */}
                {isLoadingPosts ? (
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-40 rounded-2xl bg-muted/40 border border-border/30" />
                    ))}
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="py-14 px-6 text-center rounded-2xl bg-card border border-border/30 space-y-4 shadow-xs">
                    <div className="size-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto mb-1">
                      <Icons.calendar className="size-6 opacity-60" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">
                      Tidak Ada Konten pada Kategori Ini
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      Belum ada draf postingan yang dijadwalkan untuk kategori filter ini. Anda dapat meninjau
                      kalender publikasi lengkap atau berdiskusi dengan tim.
                    </p>
                    <div className="pt-2">
                      <Link
                        href={`/client/calendar?clientId=${clientId}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "rounded-xl text-xs font-semibold gap-1.5"
                        )}
                      >
                        <Icons.calendar className="size-3.5 text-primary" />
                        <span>Buka Kalender Publikasi</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPosts.map((post) => {
                      const isDraft = post.status === "draft"
                      const isScheduled = post.status === "scheduled"
                      const isPublished = post.status === "published"
                      const platformInfo = PLATFORM_META[post.platform.toLowerCase()] || {
                        label: post.platform,
                        icon: "post" as const,
                        badge: "bg-muted text-muted-foreground",
                      }
                      const PlatformIcon = Icons[platformInfo.icon] || Icons.post

                      return (
                        <div
                          key={post.id}
                          className="p-6 rounded-2xl bg-card border border-border/40 shadow-xs space-y-4 hover:border-primary/40 transition-all"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "text-2xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5",
                                  platformInfo.badge
                                )}
                              >
                                <PlatformIcon className="size-3" />
                                <span>{platformInfo.label}</span>
                              </span>
                              <span className="text-2xs text-muted-foreground">
                                Jadwal:{" "}
                                {format(new Date(post.scheduled_at), "eeee, dd MMMM yyyy • HH:mm", {
                                  locale: idLocale,
                                })}{" "}
                                WIB
                              </span>
                            </div>

                            <span
                              className={cn(
                                "text-2xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border",
                                isDraft
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  : isScheduled
                                  ? "bg-primary/10 text-primary border-primary/20"
                                  : "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20"
                              )}
                            >
                              {isDraft
                                ? "Menunggu Persetujuan"
                                : isScheduled
                                ? "Terjadwal Siap Tayang"
                                : "Telah Terbit"}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <h3 className="font-bold text-base text-foreground leading-snug">
                              {post.title}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                              {post.content}
                            </p>
                          </div>

                          {/* Client Revision Notes Callout if present */}
                          {post.notes && (
                            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 flex items-start gap-3">
                              <Icons.edit className="size-4 text-amber-500 shrink-0 mt-0.5" />
                              <div className="space-y-1 text-xs">
                                <span className="font-bold text-foreground">Catatan Tambahan:</span>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-2xs">
                                  {post.notes}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Card Actions */}
                          <div className="pt-3 border-t border-border/30 flex flex-wrap items-center justify-between gap-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewPost(post)}
                              className="rounded-xl text-xs font-semibold gap-1.5 h-8 px-3.5 cursor-pointer"
                            >
                              <Icons.externalLink className="size-3.5 text-primary" />
                              <span>Pratinjau Lengkap</span>
                            </Button>

                            <div className="flex items-center gap-2">
                              {isDraft && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setRevisionPost(post)
                                    setPostRevisionNotes("")
                                  }}
                                  className="rounded-xl text-xs font-semibold text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 border-amber-500/30 cursor-pointer h-8 px-3"
                                >
                                  <Icons.edit className="size-3.5 mr-1.5" />
                                  <span>Beri Catatan</span>
                                </Button>
                              )}

                              {isDraft && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveSinglePost(post)}
                                  disabled={updateScheduledPostMutation.isPending}
                                  className="rounded-xl text-xs font-semibold bg-[hsl(var(--success))] text-primary-foreground hover:bg-[hsl(var(--success))]/90 cursor-pointer h-8 px-3.5"
                                >
                                  <Icons.check className="size-3.5 mr-1" />
                                  <span>Setujui Post Ini</span>
                                </Button>
                              )}

                              {isScheduled && (
                                <span className="text-2xs font-semibold text-muted-foreground flex items-center gap-1">
                                  <Icons.checkCircle className="size-3.5 text-[hsl(var(--success))]" />
                                  <span>Terkunci ke kalender</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column: Guidance & Direct Assistance */}
          <div className="lg:col-span-1 space-y-4">
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
                    <p className="text-xs font-bold text-foreground">Periksa Hook &amp; Visual</p>
                    <p className="text-2xs text-muted-foreground leading-relaxed">
                      Klik &quot;Pratinjau Lengkap&quot; untuk memeriksa narasi, visual prompt, dan hashtag.
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
                      Gunakan tombol &quot;Beri Catatan&quot; jika ada koreksi jam tayang, penyesuaian caption,
                      atau revisi visual.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  <div className="size-6 rounded-full bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">1-Klik Batch Approval</p>
                    <p className="text-2xs text-muted-foreground leading-relaxed">
                      Gunakan tombol &quot;Setujui Seluruh Jadwal&quot; di atas untuk menyetujui seluruh draf
                      mingguan dalam 1 kali klik.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Need Custom Material Support */}
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
                Ada event kilat, pengumuman diskon mendadak, atau butuh aset promosi tambahan? Ajukan tiket
                dukungan langsung ke tim kreatif Frhm.
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
            <p className="text-xs text-muted-foreground">
              Standar operasional demi menjamin kualitas dan ketepatan waktu tayang kampanye brand Anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-2">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Icons.clock className="size-4" />
              </div>
              <h4 className="text-xs font-bold text-foreground">SLA Revisi 1x24 Jam Kerja</h4>
              <p className="text-2xs text-muted-foreground leading-relaxed">
                Catatan perbaikan copywriting, penyesuaian font, atau revisi visual minor diselesaikan tim
                dalam waktu maksimal 1 hari kerja.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-2">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Icons.edit className="size-4" />
              </div>
              <h4 className="text-xs font-bold text-foreground">Catatan Spesifik &amp; Terarah</h4>
              <p className="text-2xs text-muted-foreground leading-relaxed">
                Sertakan nomor slide atau visual spesifik saat mengajukan revisi agar eksekusi perbaikan tim
                kreatif tepat sasaran.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-2">
              <div className="size-8 rounded-lg bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] flex items-center justify-center font-bold">
                <Icons.checkCircle className="size-4" />
              </div>
              <h4 className="text-xs font-bold text-foreground">Otomatisasi Penjadwalan</h4>
              <p className="text-2xs text-muted-foreground leading-relaxed">
                Begitu tombol &quot;Setujui&quot; ditekan, materi otomatis dikunci masuk ke kalender dan siap
                dipublikasikan ke media sosial.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deliverable Revision Modal */}
      <Dialog open={Boolean(revisionItem)} onOpenChange={(open) => !open && setRevisionItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajukan Catatan Revisi Deliverable</DialogTitle>
            <DialogDescription>
              Tuliskan instruksi perbaikan untuk materi &quot;{revisionItem?.title}&quot;. Tim Frhm akan
              segera memperbarui dokumen ini.
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
              onClick={handleConfirmDeliverableRevision}
              disabled={!revisionNotes.trim() || updateDeliverableStatusMutation.isPending}
              className="bg-primary text-primary-foreground font-semibold rounded-xl"
            >
              Kirim Permintaan Revisi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scheduled Post Revision Modal */}
      <Dialog open={Boolean(revisionPost)} onOpenChange={(open) => !open && setRevisionPost(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Catatan Revisi Jadwal Konten</DialogTitle>
            <DialogDescription>
              Tuliskan instruksi perbaikan narasi atau jadwal untuk postingan &quot;{revisionPost?.title}&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              placeholder="Contoh: Mohon ganti jadwal tayang ke pukul 19:30 WIB dan sertakan CTA link order kopi..."
              value={postRevisionNotes}
              onChange={(e) => setPostRevisionNotes(e.target.value)}
              className="min-h-28 text-xs rounded-xl"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setRevisionPost(null)}>
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmPostRevision}
              disabled={!postRevisionNotes.trim() || updateScheduledPostMutation.isPending}
              className="bg-primary text-primary-foreground font-semibold rounded-xl"
            >
              Simpan Catatan Revisi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scheduled Post Full Preview Modal */}
      <Dialog open={Boolean(previewPost)} onOpenChange={(open) => !open && setPreviewPost(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              {previewPost && (
                <>
                  <span className="text-2xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {previewPost.platform.toUpperCase()}
                  </span>
                  <span
                    className={cn(
                      "text-2xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                      previewPost.status === "draft"
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20"
                    )}
                  >
                    {previewPost.status === "draft" ? "Draf Menunggu Persetujuan" : "Terjadwal Siap Tayang"}
                  </span>
                </>
              )}
            </div>
            <DialogTitle className="text-lg font-bold leading-snug">
              {previewPost?.title || "Pratinjau Publikasi"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Materi promosi yang dirancang untuk dipublikasikan secara otomatis sesuai jadwal.
            </DialogDescription>
          </DialogHeader>

          {previewPost && (
            <div className="space-y-4 py-2">
              {previewPost.media_url && (
                <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/30 max-h-56 flex items-center justify-center">
                  <img
                    src={previewPost.media_url}
                    alt={previewPost.title}
                    className="w-full h-full object-cover max-h-56"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-2xs font-bold uppercase text-muted-foreground tracking-wider">
                  Naskah / Caption:
                </span>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/30 text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {previewPost.content || "Tidak ada draf teks pada materi ini."}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icons.clock className="size-4 text-primary" />
                  <span className="font-semibold text-foreground">Waktu Penayangan:</span>
                </div>
                <span className="font-bold text-foreground">
                  {format(new Date(previewPost.scheduled_at), "eeee, dd MMMM yyyy • HH:mm", {
                    locale: idLocale,
                  })}{" "}
                  WIB
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (previewPost) {
                  setRevisionPost(previewPost)
                  setPostRevisionNotes("")
                  setPreviewPost(null)
                }
              }}
              className="rounded-xl text-xs font-semibold gap-1.5 text-amber-500 hover:text-amber-400 border-amber-500/30"
            >
              <Icons.edit className="size-3.5" />
              <span>Beri Catatan</span>
            </Button>

            <div className="flex items-center gap-2">
              {previewPost?.status === "draft" && (
                <Button
                  size="sm"
                  onClick={() => previewPost && handleApproveSinglePost(previewPost)}
                  disabled={updateScheduledPostMutation.isPending}
                  className="rounded-xl text-xs font-semibold bg-[hsl(var(--success))] text-primary-foreground hover:bg-[hsl(var(--success))]/90 cursor-pointer"
                >
                  <Icons.check className="size-3.5 mr-1" />
                  <span>Setujui Post Ini</span>
                </Button>
              )}

              <Button size="sm" onClick={() => setPreviewPost(null)} className="rounded-xl text-xs font-semibold">
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
