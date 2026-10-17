"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/animate-ui/components/radix/tooltip"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"
import {
  analyticsQueries,
  useAuditPerformanceAndIterate,
} from "@/features/analytics/api/queries"
import { scheduledPostQueries } from "@/features/scheduled-posts/api/queries"
import type { AuditPerformanceReport, ActionableIteration } from "@/features/analytics/api/types"
import { cn } from "@/lib/utils"

interface WeeklyRecommendationsProps {
  clientId: string
  clientName?: string
  initialReport?: AuditPerformanceReport | null
  onOpenHookModal?: (promptText?: string) => void
  isClientPortal?: boolean
  className?: string
}

function getPlatformBadgeStyle(platform: string) {
  const p = platform.toLowerCase()
  if (p.includes("instagram")) {
    return "bg-[hsl(var(--platform-instagram,340_80%_55%))]/15 text-[hsl(var(--platform-instagram,340_80%_55%))] border-[hsl(var(--platform-instagram,340_80%_55%))]/30"
  }
  if (p.includes("tiktok")) {
    return "bg-[hsl(var(--platform-tiktok,180_100%_40%))]/15 text-[hsl(var(--platform-tiktok,180_100%_40%))] border-[hsl(var(--platform-tiktok,180_100%_40%))]/30"
  }
  if (p.includes("linkedin")) {
    return "bg-[hsl(var(--platform-linkedin,210_80%_45%))]/15 text-[hsl(var(--platform-linkedin,210_80%_45%))] border-[hsl(var(--platform-linkedin,210_80%_45%))]/30"
  }
  if (p.includes("twitter") || p === "x") {
    return "bg-foreground/15 text-foreground border-foreground/30"
  }
  return "bg-primary/15 text-primary border-primary/30"
}

export function WeeklyRecommendations({
  clientId,
  clientName = "Client",
  initialReport = null,
  onOpenHookModal,
  isClientPortal = false,
  className,
}: WeeklyRecommendationsProps) {
  const router = useRouter()
  const [report, setReport] = React.useState<AuditPerformanceReport | null>(initialReport)
  const { mutateAsync: runAudit, isPending: isAuditing } = useAuditPerformanceAndIterate()

  // Ambil metrics faktual untuk analisis baseline jika belum ada report
  const { data: metrics = [] } = useQuery({
    ...analyticsQueries.listMetricsByClient(clientId),
    enabled: Boolean(clientId),
  })

  // Ambil post titles
  const { data: posts = [] } = useQuery({
    ...scheduledPostQueries.listByClient(clientId),
    enabled: Boolean(clientId),
  })

  // Sinkronkan initialReport bila berubah
  React.useEffect(() => {
    if (initialReport) {
      setReport(initialReport)
    }
  }, [initialReport])

  // Coba ambil dari localStorage jika tersedia
  React.useEffect(() => {
    if (!report && clientId && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`frhm_meter_audit_${clientId}`)
        if (saved) {
          const parsed = JSON.parse(saved) as AuditPerformanceReport
          if (parsed?.actionableIterations) {
            setReport(parsed)
          }
        }
      } catch {
        // ignore parse error
      }
    }
  }, [clientId, report])

  const handleRunAudit = async () => {
    if (!clientId) {
      toast.error("Pilih klien terlebih dahulu")
      return
    }

    try {
      const res = await runAudit({ clientId, period: "30d" })
      if (res.error) {
        toast.error(res.error)
        return
      }
      if (res.report) {
        setReport(res.report)
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(`frhm_meter_audit_${clientId}`, JSON.stringify(res.report))
          } catch {
            // ignore storage quota error
          }
        }
        toast.success("Audit Performa METER Selesai!", {
          description: `Kesehatan: ${res.report.overallHealth} (Signal Score: ${res.report.signalScore}/100)`,
        })
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengaudit performa.")
    }
  }

  const handleSendToComposer = (rec: ActionableIteration) => {
    const title = encodeURIComponent(rec.action)
    const content = encodeURIComponent(rec.recommendedPrompt)
    const targetUrl = isClientPortal
      ? `/client/support?clientId=${clientId}&topic=${title}`
      : `/admin/composer?clientId=${clientId}&title=${title}&content=${content}`
    router.push(targetUrl)
    toast.info("Mengirim rekomendasi ke Composer...", {
      description: `Target platform: ${rec.targetPlatform}`,
    })
  }

  // Fallback heuristik 3 rekomendasi jika ada metrik tetapi belum audit AI
  const fallbackRecommendations: ActionableIteration[] = React.useMemo(() => {
    if (report?.actionableIterations && report.actionableIterations.length > 0) {
      return report.actionableIterations.slice(0, 3)
    }
    if (metrics.length === 0) return []

    // Sort by Saves & Shares (Signal Metrics 2026)
    const sorted = [...metrics].sort((a, b) => {
      const signalA = (Number(a.saves) || 0) * 2 + (Number(a.shares) || 0) * 3
      const signalB = (Number(b.saves) || 0) * 2 + (Number(b.shares) || 0) * 3
      return signalB - signalA
    })

    const topMetric = sorted[0]
    const lowestMetric = sorted[sorted.length - 1]
    const topPost = posts.find((p) => p.id === topMetric?.post_id)
    const lowPost = posts.find((p) => p.id === lowestMetric?.post_id)

    return [
      {
        action: `Recycle pemenang '${topPost?.title || "Top Post"}' menjadi Carousel Edukasi`,
        targetPlatform: topPost?.platform || "instagram",
        priority: "HIGH",
        recommendedPrompt: `Ubah inti pesan '${topPost?.title || "konten pemenang"}' menjadi 5 slide carousel berbobot dengan retention hook kuat.`,
      },
      {
        action: `Optimasi Hook 3-Detik untuk '${lowPost?.title || "Konten Evaluasi"}'`,
        targetPlatform: lowPost?.platform || "tiktok",
        priority: "MEDIUM",
        recommendedPrompt: `Buat 3 alternatif hook contrarian/curiosity gap untuk topik '${lowPost?.title || "evaluasi"}' guna meningkatkan completion rate.`,
      },
      {
        action: "Tingkatkan Direct Leads via Conversational CTA (WA/DM)",
        targetPlatform: "instagram",
        priority: "MEDIUM",
        recommendedPrompt: "Sisipkan CTA langsung 'Kirim pesan DM untuk konsultasi gratis / katalog lengkap' di 2 post mendatang.",
      },
    ]
  }, [report, metrics, posts])

  const topWinner = report?.winners?.[0]
  const underperformer = report?.underperformers?.[0]

  return (
    <Card
      className={cn(
        "p-5 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/40 shadow-sm transition-all space-y-4",
        className
      )}
      data-testid="weekly-recommendations-widget"
    >
      <CardHeader className="p-0 flex flex-row items-center justify-between gap-3 space-y-0">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="size-7 rounded-lg bg-brand-accent/15 text-brand-accent flex items-center justify-center">
              <Icons.target className="size-4" />
            </span>
            <CardTitle className="text-sm sm:text-base font-bold text-foreground">
              3 Rekomendasi Mingguan
            </CardTitle>
            <Badge
              variant="outline"
              className="text-3xs uppercase font-mono px-1.5 py-0.5 border-brand-accent/30 text-brand-accent bg-brand-accent/5 hidden sm:inline-flex"
            >
              METER Closed-Loop
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Aksi taktis terkurasi dari evaluasi sinyal performa riil {clientName}.
          </CardDescription>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleRunAudit}
          isLoading={isAuditing}
          disabled={isAuditing || !clientId}
          className="h-8 px-2.5 rounded-xl border-border/60 hover:bg-muted/40 text-xs font-semibold gap-1.5 shrink-0 shadow-xs cursor-pointer"
        >
          <Icons.sparkles className="size-3.5 text-brand-accent" />
          {isAuditing ? (
            <ShimmeringText text="Menganalisis..." className="text-xs" />
          ) : (
            <span>Audit METER</span>
          )}
        </Button>
      </CardHeader>

      <CardContent className="p-0 space-y-3.5">
        {/* Signal Score & Health Status (if audit exists) */}
        {report && (
          <div
            className={cn(
              "p-2.5 rounded-xl border flex items-center justify-between text-2xs",
              report.overallHealth === "EXCELLENT"
                ? "bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/30 text-[hsl(var(--success))]"
                : report.overallHealth === "STABLE"
                ? "bg-brand-accent/10 border-brand-accent/30 text-brand-accent"
                : "bg-amber-500/10 border-amber-500/30 text-amber-500"
            )}
          >
            <div className="flex items-center gap-2">
              <Icons.target className="size-3.5 shrink-0" />
              <span className="font-bold uppercase tracking-wider">
                Status: {report.overallHealth} &bull; Signal Score: {report.signalScore}/100
              </span>
            </div>
            <span className="text-3xs opacity-80 font-mono">Berdasarkan METER Audit</span>
          </div>
        )}

        {/* Top Winner & Underperformer Diagnostics */}
        {(topWinner || underperformer) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
            {topWinner && (
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 space-y-1">
                <span className="font-bold text-[hsl(var(--success))] flex items-center gap-1">
                  <Icons.checkCircle className="size-3" /> Top Winner
                </span>
                <p className="font-semibold text-foreground truncate">{topWinner.title}</p>
                <p className="text-muted-foreground line-clamp-2 text-3xs">{topWinner.reason}</p>
              </div>
            )}
            {underperformer && (
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 space-y-1">
                <span className="font-bold text-amber-500 flex items-center gap-1">
                  <Icons.warning className="size-3" /> Underperformer
                </span>
                <p className="font-semibold text-foreground truncate">{underperformer.title}</p>
                <p className="text-muted-foreground line-clamp-2 text-3xs">
                  {underperformer.rootCause} &bull; <i className="text-foreground/80">{underperformer.fixAngle}</i>
                </p>
              </div>
            )}
          </div>
        )}

        {/* The 3 Recommendations List */}
        {fallbackRecommendations.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-muted/20 border border-dashed border-border/40 space-y-2">
            <Icons.activity className="size-6 text-muted-foreground/50 mx-auto" />
            <p className="text-xs font-semibold text-foreground">
              Belum ada data metrik postingan
            </p>
            <p className="text-2xs text-muted-foreground max-w-xs mx-auto">
              Hubungkan akun sosial media atau catat performa konten untuk menghasilkan 3 rekomendasi taktis mingguan.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {fallbackRecommendations.map((rec, index) => {
              const badgeClass = getPlatformBadgeStyle(rec.targetPlatform)
              return (
                <div
                  key={index}
                  className="p-3 rounded-xl bg-muted/30 border border-border/40 hover:border-border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-2xs"
                >
                  <div className="min-w-0 space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-brand-accent/20 text-brand-accent text-3xs font-bold font-mono flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <Badge variant="outline" className={cn("text-3xs font-mono uppercase px-1.5 py-0", badgeClass)}>
                        {rec.targetPlatform}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-3xs uppercase font-semibold px-1 py-0",
                          rec.priority === "HIGH"
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-muted text-muted-foreground border-border/40"
                        )}
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-xs font-bold text-foreground leading-snug">
                      {rec.action}
                    </p>
                    <p className="text-2xs text-muted-foreground line-clamp-1 italic font-mono">
                      "{rec.recommendedPrompt}"
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {onOpenHookModal && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => onOpenHookModal(rec.recommendedPrompt)}
                            className="h-7 px-2 text-2xs text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg cursor-pointer"
                            aria-label="Kirim ke Hook Writer"
                          >
                            <Icons.flame className="size-3 text-amber-500" />
                            <span className="hidden lg:inline ml-1">Hook</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Buka Hook Writer dengan ide ini</TooltipContent>
                      </Tooltip>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSendToComposer(rec)}
                      className="h-7 px-2.5 rounded-lg text-2xs font-semibold bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90 shadow-2xs gap-1 cursor-pointer"
                    >
                      <span>Composer</span>
                      <Icons.arrowRight className="size-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
