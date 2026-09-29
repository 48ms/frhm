'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Icons } from '@/components/icons'
import Link from 'next/link'

interface TrendJackBarProps {
  clientId: string
  clientName: string
  onContentGenerated?: () => void
}

interface EvaluationData {
  passed: boolean
  overallScore: number
  fitScore: number
  safetyScore: number
  timingScore: number
  reasoning: string
  recommendedAngle?: string
}

export function TrendJackBar({ clientId, clientName, onContentGenerated }: TrendJackBarProps) {
  const [topic, setTopic] = useState('')
  const [campaignTag, setCampaignTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [resultDialog, setResultDialog] = useState<{
    open: boolean
    passed: boolean
    evaluation?: EvaluationData
    deliverableId?: string
    deliverableTitle?: string
  }>({
    open: false,
    passed: false,
  })

  async function handleQuickJack(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = topic.trim()
    if (!trimmed) return

    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/trends/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          trendTopic: trimmed,
          campaignTag: campaignTag.trim() || undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        if (json.evaluation && !json.evaluation.passed) {
          setResultDialog({
            open: true,
            passed: false,
            evaluation: json.evaluation,
          })
          return
        }
        throw new Error(json.error || 'Gagal memproses tren')
      }

      setResultDialog({
        open: true,
        passed: true,
        evaluation: json.evaluation,
        deliverableId: json.deliverable?.id,
        deliverableTitle: json.deliverable?.title,
      })

      setTopic('')
      if (onContentGenerated) onContentGenerated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala jaringan'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="border-orange-500/20 bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-transparent">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <Icons.sparkles className="size-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold tracking-tight text-foreground">
                    Trend-Jack Cepat (FYP Radar)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Tempelkan topik atau sound viral dari TikTok/Reels untuk langsung divalidasi ke brand {clientName}.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="hidden sm:inline-flex border-orange-500/30 text-orange-600 dark:text-orange-400">
                The Three Gates
              </Badge>
            </div>

            <form onSubmit={handleQuickJack} className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="relative flex-1">
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Kopi butter viral TikTok, Sound 'Gwenchana', Tantangan makan pedas..."
                  disabled={loading}
                  className="h-11 sm:h-9 pl-3 text-sm focus-visible:ring-orange-500"
                  aria-label="Topik atau judul tren dari FYP"
                />
              </div>
              <div className="relative sm:w-48">
                <Input
                  value={campaignTag}
                  onChange={(e) => setCampaignTag(e.target.value)}
                  placeholder="Kampanye (opsional)"
                  disabled={loading}
                  className="h-11 sm:h-9 pl-3 text-sm focus-visible:ring-orange-500"
                  aria-label="Tag kampanye opsional"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !topic.trim()}
                className="h-11 sm:h-9 shrink-0 bg-orange-600 hover:bg-orange-700 text-white font-medium px-4"
              >
                {loading ? (
                  <>
                    <Icons.spinner className="mr-2 size-4 animate-spin" />
                    Validasi & Buat Konten
                  </>
                ) : (
                  <>
                    <Icons.sparkles className="mr-2 size-4" />
                    Validasi & Buat Konten
                  </>
                )}
              </Button>
            </form>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
                <Icons.alertCircle className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Hasil Evaluasi The Three Gates */}
      <Dialog
        open={resultDialog.open}
        onOpenChange={(open) => setResultDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              {resultDialog.passed ? (
                <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <Icons.circleCheck className="size-5" />
                </div>
              ) : (
                <div className="flex size-9 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
                  <Icons.shield className="size-5" />
                </div>
              )}
              <div>
                <DialogTitle className="text-base">
                  {resultDialog.passed ? 'Lolos The Three Gates' : 'Tren Ditolak (Guardrail Aktif)'}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {resultDialog.passed
                    ? 'Konten berhasil diproduksi dengan 3 opsi hook psikologis.'
                    : 'Tren tidak memenuhi ambang batas keamanan atau relevansi brand.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {resultDialog.evaluation && (
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border p-2 bg-muted/40">
                  <div className="text-[11px] text-muted-foreground">FIT (Relevansi)</div>
                  <div className="text-base font-bold text-foreground">
                    {resultDialog.evaluation.fitScore}/100
                  </div>
                </div>
                <div className="rounded-lg border p-2 bg-muted/40">
                  <div className="text-[11px] text-muted-foreground">SAFETY (Aman)</div>
                  <div className="text-base font-bold text-foreground">
                    {resultDialog.evaluation.safetyScore}/100
                  </div>
                </div>
                <div className="rounded-lg border p-2 bg-muted/40">
                  <div className="text-[11px] text-muted-foreground">TIMING (Tren)</div>
                  <div className="text-base font-bold text-foreground">
                    {resultDialog.evaluation.timingScore}/100
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="text-xs font-semibold text-foreground mb-1">Alasan Penilaian:</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {resultDialog.evaluation.reasoning}
                </p>
                {resultDialog.evaluation.recommendedAngle && (
                  <div className="mt-2 pt-2 border-t text-xs">
                    <span className="font-medium text-foreground">Rekomendasi Sudut Pandang: </span>
                    <span className="text-muted-foreground">{resultDialog.evaluation.recommendedAngle}</span>
                  </div>
                )}
              </div>

              {resultDialog.passed && resultDialog.deliverableId && (
                <div className="pt-2">
                  <Link
                    href={`/admin/deliverables/${resultDialog.deliverableId}`}
                    className="inline-flex h-11 sm:h-9 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Buka Deliverable & 3 Variasi Hook
                    <Icons.arrowRight className="size-4" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
