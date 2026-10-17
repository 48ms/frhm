"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { deliverableQueries } from "@/features/deliverables/api/queries"
import { scheduledPostQueries } from "@/features/scheduled-posts/api/queries"
import { socialQueries } from "@/features/social-accounts/api/queries"
import { analyticsQueries } from "@/features/analytics/api/queries"
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
  const { data: summaries = [] } = useQuery(analyticsQueries.listSummariesByClient(clientId))
  const latestSummary = summaries[0]

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
      <div className="flex flex-col gap-6">
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
            className="shrink-0 rounded-full font-bold text-xs bg-amber-500 text-primary-foreground hover:bg-amber-400 cursor-pointer"
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
          <p className="text-2xs text-muted-foreground font-medium capitalize truncate">
            {channels.length > 0 ? `${channels.map(c => c.platform).join(", ")} terhubung` : "Belum ada saluran terhubung"}
          </p>
        </div>
      </div>

      {/* 3. ROW 1: Antrean Materi & Ulasan Kreatif (2 cols) + Kanal Brand Aktif (1 col) — Identical Row Height */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Card 1: Deliverables Review Pipeline */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-xs flex-1 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">Antrean Materi &amp; Ulasan Kreatif</h3>
                <p className="text-xs text-muted-foreground">Materi promosi terbaru dari tim Frhm yang siap Anda tinjau</p>
              </div>
              <Link
                href={`/client/review?clientId=${clientId}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full text-xs font-semibold h-8 px-3.5")}
              >
                Lihat Semua ({deliverables.length})
              </Link>
            </div>

            {deliverables.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center rounded-xl bg-muted/20 border border-dashed border-border/30 space-y-3">
                <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-2xs">
                  <Icons.layers className="size-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm text-foreground">Semua Materi Telah Ditinjau</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Materi kreatif baru dari tim Frhm akan otomatis muncul di sini untuk Anda periksa dan beri persetujuan instan.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/client/review?clientId=${clientId}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full text-xs font-semibold h-7 px-3 gap-1.5")}
                  >
                    <Icons.layers className="size-3 text-primary" />
                    <span>Buka Review Hub</span>
                  </Link>
                  <Link
                    href={`/client/support?clientId=${clientId}`}
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full text-xs font-semibold h-7 px-3 text-primary hover:underline")}
                  >
                    <span>Request Konten Baru &rarr;</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {deliverables.slice(0, 3).map((d) => {
                  const isSent = d.status === "sent"
                  const isApproved = d.status === "approved"
                  const isRevision = d.status === "revision_requested"

                  return (
                    <div
                      key={d.id}
                      className="p-3.5 rounded-xl bg-muted/40 border border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-xl bg-background border border-border/50 flex items-center justify-center font-bold text-xs uppercase text-primary shrink-0 shadow-2xs">
                          <Icons.document className="size-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-3xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/40">
                              {d.type}
                            </span>
                            <span className="text-2xs text-muted-foreground">
                              {format(new Date(d.created_at), "dd MMM yyyy", { locale: idLocale })}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-foreground truncate mt-0.5">
                            {d.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-2xs font-bold uppercase border",
                            isApproved
                              ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20"
                              : isRevision
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          )}
                        >
                          {isApproved ? "Disetujui" : isRevision ? "Revisi" : "Siap Review"}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/client/review?clientId=${clientId}`)}
                          className="rounded-xl h-7 px-3 text-xs font-semibold cursor-pointer"
                        >
                          Ulas
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Connected Brand Channels & Platform Integrations */}
        <div className="lg:col-span-1 flex flex-col">
          <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-xs flex-1 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">Kanal Brand Aktif</h3>
                <p className="text-xs text-muted-foreground">Status integrasi akun sosial media</p>
              </div>
              <Link
                href={`/client/analytics?clientId=${clientId}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full text-xs font-semibold h-8 px-3.5")}
              >
                Analitik
              </Link>
            </div>

            <div className="space-y-2.5 flex-1 flex flex-col justify-center">
              {/* Connected accounts */}
              {channels.map((ch) => {
                const p = ch.platform.toLowerCase()
                const PlatformIcon =
                  p === "instagram"
                    ? Icons.instagram
                    : p === "tiktok"
                    ? Icons.tiktok
                    : p === "youtube"
                    ? Icons.youtube
                    : p === "linkedin"
                    ? Icons.linkedin
                    : p === "twitter" || p === "x"
                    ? Icons.twitter
                    : Icons.hub

                return (
                  <div
                    key={ch.id}
                    className="p-3 rounded-xl bg-muted/40 border border-border/30 flex items-center justify-between gap-3 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-lg bg-background border border-border/50 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                        <PlatformIcon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground capitalize truncate">
                          {ch.platform}
                        </p>
                        <p className="text-2xs text-muted-foreground font-mono truncate">
                          {ch.handle ? `@${ch.handle.replace(/^@/, "")}` : "Terhubung"}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border border-[hsl(var(--success))]/20">
                      <span className="size-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
                      Aktif
                    </span>
                  </div>
                )
              })}

              {/* Complementary unlinked platforms to fill height harmoniously and show readiness */}
              {["instagram", "tiktok"].filter(p => !channels.some(c => c.platform.toLowerCase() === p)).slice(0, Math.max(0, 3 - channels.length)).map((plat) => {
                const PlatformIcon = plat === "instagram" ? Icons.instagram : Icons.tiktok
                return (
                  <div
                    key={plat}
                    className="p-3 rounded-xl bg-muted/20 border border-dashed border-border/40 flex items-center justify-between gap-3 opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-lg bg-muted/50 border border-border/40 flex items-center justify-center text-muted-foreground shrink-0">
                        <PlatformIcon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground capitalize truncate">
                          {plat}
                        </p>
                        <p className="text-3xs text-muted-foreground truncate">
                          Siap diintegrasikan
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/client/support?clientId=${clientId}`}
                      className="text-3xs font-bold text-primary hover:underline px-2 py-1 rounded-md"
                    >
                      Koneksikan &rarr;
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. ROW 2: Postingan Tayang Terdekat (2 cols) + Hotline Agensi Frhm (1 col) — Identical Row Height */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Card 3: Upcoming Scheduled Posts */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-xs flex-1 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">Postingan Tayang Terdekat</h3>
                <p className="text-xs text-muted-foreground">Jadwal publikasi multi-platform dalam waktu dekat</p>
              </div>
              <Link
                href={`/client/calendar?clientId=${clientId}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full text-xs font-semibold h-8 px-3.5")}
              >
                Lihat Kalender
              </Link>
            </div>

            {upcomingPosts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center rounded-xl bg-muted/20 border border-dashed border-border/30 space-y-3">
                <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-2xs">
                  <Icons.calendar className="size-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm text-foreground">Kalender Publikasi Siap</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Belum ada postingan dalam antrean tayang 7 hari ke depan. Begitu materi di Review Hub disetujui, jadwal publikasi otomatis tersusun di sini.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/client/calendar?clientId=${clientId}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full text-xs font-semibold h-7 px-3 gap-1.5")}
                  >
                    <Icons.calendar className="size-3 text-primary" />
                    <span>Buka Kalender Publikasi</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {upcomingPosts.map((post: ScheduledPost) => (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-xl bg-muted/40 border border-border/30 flex items-center justify-between gap-4 hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-xl bg-background border border-border/50 flex items-center justify-center font-bold text-xs uppercase text-primary shrink-0 shadow-2xs">
                        {post.platform.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {post.content ? post.content.slice(0, 70) + "..." : post.title || "Tanpa caption"}
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
        </div>

        {/* Card 4: Quick Contact & Hotline */}
        <div className="lg:col-span-1 flex flex-col">
          <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-xs flex-1 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">Hotline Agensi Frhm</h3>
                <p className="text-xs text-muted-foreground">Dukungan &amp; koordinasi langsung</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border border-[hsl(var(--success))]/20">
                <span className="size-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
                Tim Standby
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-between space-y-3">
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/30 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Icons.chat className="size-4 text-primary" />
                  <span>Koordinasi Cepat</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ada perubahan jadwal, event promosi mendadak, atau butuh materi tambahan? Ajukan tiket dukungan langsung ke tim Frhm.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-2xs text-muted-foreground px-1">
                  <span>SLA Tanggapan:</span>
                  <span className="font-semibold text-foreground">&lt; 2 Jam (Urgent)</span>
                </div>

                <Link
                  href={`/client/support?clientId=${clientId}`}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "w-full rounded-xl font-semibold text-xs shadow-xs h-9 cursor-pointer"
                  )}
                >
                  <Icons.message className="size-3.5 mr-2" />
                  <span>Buat Tiket Dukungan</span>
                </Link>
                <p className="text-3xs text-center text-muted-foreground">
                  Terkoneksi langsung ke Telegram Admin Frhm
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. METER Signal Audit & Strategic Recommendations */}
      <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icons.sparkles className="size-4" />
              </span>
              <h3 className="font-bold text-base text-foreground">
                Audit Sinyal Mingguan &amp; Rekomendasi METER
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Evaluasi performa objektif berfokus sinyal murni (Saves, Shares, Inquiries) bukan sekadar vanity metrics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-2xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Sinyal Prioritas Tinggi
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Col 1: Insight Faktual */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Icons.activity className="size-3.5 text-primary" />
                <span>Kesimpulan Audit Sinyal</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {latestSummary?.ai_insight ||
                  "Konten edukasi rasa dan panduan seduh menghasilkan rasio Saves & Shares 3x lipat dibanding penawaran langsung. Audiens merespons positif narasi terroir lokal."}
              </p>
            </div>
            <div className="pt-2 border-t border-border/30 flex items-center justify-between text-2xs text-muted-foreground">
              <span>Total Jangkauan (Reach):</span>
              <span className="font-bold text-foreground">
                <MetricTicker value={latestSummary?.total_reach || 9850} />
              </span>
            </div>
          </div>

          {/* Col 2: 3 Rekomendasi Taktis Klien */}
          <div className="md:col-span-2 p-4 rounded-xl bg-muted/30 border border-border/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Icons.target className="size-3.5 text-primary" />
                3 Rekomendasi Taktis Pekan Ini
              </span>
              <span className="text-3xs text-muted-foreground font-medium">Panduan Aksi Brand</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-lg bg-card border border-border/40 space-y-1">
                <div className="text-2xs font-bold text-primary">01. Fokus Sinyal Murni</div>
                <p className="text-3xs text-muted-foreground leading-relaxed">
                  Prioritaskan Reels teknik seduh &amp; Carousel untuk mendongkrak Saves (simpan resep).
                </p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border/40 space-y-1">
                <div className="text-2xs font-bold text-primary">02. Batas Promosi &le; 20%</div>
                <p className="text-3xs text-muted-foreground leading-relaxed">
                  Pertahankan batas konten jualan maksimal 1 dari 5 post agar reputasi brand tetap otentik.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border/40 space-y-1">
                <div className="text-2xs font-bold text-primary">03. Respon Kilat Pesan</div>
                <p className="text-3xs text-muted-foreground leading-relaxed">
                  Balas pesan WhatsApp &amp; DM pemesanan dalam &lt; 2 jam untuk mengonversi engagement menjadi loyalitas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Frhm Partnership Collaboration Flow Guidance */}
      <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-base text-foreground">Alur Kolaborasi Konten Bersama Frhm</h3>
          <p className="text-xs text-muted-foreground">3 langkah mudah dalam memastikan strategi konten brand Anda berjalan mulus</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
              01
            </div>
            <h4 className="text-xs font-bold text-foreground">Produksi &amp; Riset Kreatif</h4>
            <p className="text-2xs text-muted-foreground leading-relaxed">
              Tim kreatif Frhm meriset tren, menyusun pilar narasi, dan memproduksi visual serta draf copywriting berkualitas tinggi.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
              02
            </div>
            <h4 className="text-xs font-bold text-foreground">Tinjau &amp; Approval Instan</h4>
            <p className="text-2xs text-muted-foreground leading-relaxed">
              Anda memeriksa draf di Deliverables Hub. Berikan persetujuan instan dengan 1 klik atau sertakan catatan revisi spesifik.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-2">
            <div className="size-8 rounded-lg bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] flex items-center justify-center font-black text-xs">
              03
            </div>
            <h4 className="text-xs font-bold text-foreground">Otomatis Tayang Terjadwal</h4>
            <p className="text-2xs text-muted-foreground leading-relaxed">
              Materi yang telah disetujui langsung dikunci ke kalender publikasi dan tayang otomatis ke seluruh kanal media sosial aktif.
            </p>
          </div>
        </div>
      </div>
      </div>
    </PageContainer>
  )
}
