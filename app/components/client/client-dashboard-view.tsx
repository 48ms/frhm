"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { deliverableQueries } from "@/features/deliverables/api/queries"
import { scheduledPostQueries } from "@/features/scheduled-posts/api/queries"
import { socialQueries } from "@/features/social-accounts/api/queries"
import { PageContainer } from "@/components/layout/page-container"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { Icons } from "@/components/icons"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import type { ScheduledPost } from "@/features/scheduled-posts/api/types"

interface ClientDashboardViewProps {
  clientId: string
}

export function ClientDashboardView({ clientId }: ClientDashboardViewProps) {
  const router = useRouter()
  const { data: deliverables = [] } = useQuery(deliverableQueries.listByClient(clientId))
  const { data: scheduledPostsData } = useQuery(scheduledPostQueries.listByClient(clientId))
  const scheduledPosts: ScheduledPost[] = (scheduledPostsData as ScheduledPost[]) || []
  const { data: clientsData = [] } = useQuery(socialQueries.listClientsWithChannels())

  const currentClient = clientsData.find((c) => c.id === clientId)
  const clientName = currentClient?.name || "Client Partner"
  const channels = currentClient?.channels || []

  // Pending deliverables awaiting client action
  const pendingReview = deliverables.filter((d) => d.status === "sent")
  const approvedCount = deliverables.filter((d) => d.status === "approved").length

  // Next 3 scheduled posts
  const upcomingPosts = scheduledPosts
    .filter((p: ScheduledPost) => p.status === "scheduled" || p.status === "draft")
    .sort((a: ScheduledPost, b: ScheduledPost) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 3)

  return (
    <PageContainer
      pageTitle={`Halo, ${clientName}`}
      pageDescription="Selamat datang di Portal Kolaborasi Frhm. Pantau jadwal publikasi, ulas materi promosi, dan tinjau performa brand Anda."
      pageHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => router.push(`/client/review?clientId=${clientId}`)}
            className="rounded-full gap-2 text-xs font-semibold bg-primary text-primary-foreground shadow-xs cursor-pointer"
          >
            <Icons.layers className="size-4" />
            <span>Review Deliverable ({pendingReview.length})</span>
          </Button>
        </div>
      }
    >
      {/* 1. Action Banner (If deliverables are awaiting review) */}
      {pendingReview.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="size-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              <Icons.bell className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {pendingReview.length} Konten Menunggu Persetujuan Anda
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tim kreatif Frhm telah merampungkan draft konten terbaru. Silakan tinjau dan beri persetujuan atau catatan revisi agar dapat dijadwalkan tepat waktu.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => router.push(`/client/review?clientId=${clientId}`)}
            className="shrink-0 rounded-full font-bold text-xs bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer"
          >
            Tinjau Sekarang ({pendingReview.length})
          </Button>
        </div>
      )}

      {/* 2. Executive Metric Tickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Konten Siap Review</span>
            <Icons.layers className="size-4 text-primary" />
          </div>
          <div className="text-3xl font-extrabold text-foreground tracking-tight">
            <MetricTicker value={pendingReview.length} />
          </div>
          <p className="text-2xs text-muted-foreground font-medium">
            Membutuhkan ulasan atau rating Anda
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Konten Disetujui</span>
            <Icons.checkCircle className="size-4 text-[hsl(var(--success))]" />
          </div>
          <div className="text-3xl font-extrabold text-foreground tracking-tight">
            <MetricTicker value={approvedCount} />
          </div>
          <p className="text-2xs text-muted-foreground font-medium">
            Telah lolos quality gate &amp; siap tayang
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Jadwal Kalender Aktif</span>
            <Icons.calendar className="size-4 text-primary" />
          </div>
          <div className="text-3xl font-extrabold text-foreground tracking-tight">
            <MetricTicker value={scheduledPosts.length} />
          </div>
          <p className="text-2xs text-muted-foreground font-medium">
            Postingan tersusun pada kalender publikasi
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Kanal Terhubung</span>
            <Icons.hub className="size-4 text-primary" />
          </div>
          <div className="text-3xl font-extrabold text-foreground tracking-tight">
            <MetricTicker value={channels.length} />
          </div>
          <p className="text-2xs text-muted-foreground font-medium">
            Akun Instagram, TikTok, YouTube aktif
          </p>
        </div>
      </div>

      {/* 3. Upcoming Scheduled Posts & Quick Review Teaser */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Posts in Calendar */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border/40 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground">Postingan Tayang Terdekat</h3>
              <p className="text-xs text-muted-foreground">Jadwal publikasi multi-platform dalam waktu dekat</p>
            </div>
            <a
              href={`/client/calendar?clientId=${clientId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full text-xs font-semibold")}
            >
              Lihat Semua Kalender
            </a>
          </div>

          {upcomingPosts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs space-y-1">
              <Icons.calendar className="size-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="font-semibold text-foreground">Belum ada postingan terjadwal terdekat.</p>
              <p>Materi yang telah disetujui akan otomatis tampil pada kalender ini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingPosts.map((post: ScheduledPost) => (
                <div
                  key={post.id}
                  className="p-4 rounded-xl bg-muted/40 border border-border/30 flex items-center justify-between gap-4 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="size-10 rounded-xl bg-background border border-border/50 flex items-center justify-center font-bold text-xs uppercase text-primary shrink-0">
                      {post.platform.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {post.content ? post.content.slice(0, 75) + "..." : post.title || "Tanpa caption"}
                      </p>
                      <p className="text-2xs text-muted-foreground mt-0.5">
                        Jadwal: {format(new Date(post.scheduled_at), "eeee, dd MMMM yyyy HH:mm", { locale: idLocale })} WIB
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full text-2xs font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                    {post.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Contact & Hotline */}
        <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Icons.chat className="size-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Direct Agency Hotline</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Ada perubahan jadwal, event promosi mendadak, atau butuh materi tambahan? Ajukan tiket dukungan langsung ke tim Frhm.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-border/30">
            <a
              href={`/client/support?clientId=${clientId}`}
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full rounded-xl font-semibold text-xs shadow-xs"
              )}
            >
              <Icons.message className="size-4 mr-2" />
              <span>Buat Tiket Dukungan</span>
            </a>
            <p className="text-2xs text-center text-muted-foreground">
              Respon cepat terhubung ke notifikasi Telegram Admin Frhm
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
