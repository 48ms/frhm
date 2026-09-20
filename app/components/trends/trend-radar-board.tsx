'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Flame,
  RefreshCw,
  Loader2,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import type { TrendRadarItem } from '@/lib/trends/radar'

interface TrendRadarBoardProps {
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

export function TrendRadarBoard({ clientId, clientName, onContentGenerated }: TrendRadarBoardProps) {
  const [trends, setTrends] = useState<TrendRadarItem[]>([])
  const [filter, setFilter] = useState<'all' | 'fnb'>('all')
  const [loading, setLoading] = useState(true)
  const [generatingTopic, setGeneratingTopic] = useState<string | null>(null)
  const [resultDialog, setResultDialog] = useState<{
    open: boolean
    passed: boolean
    evaluation?: EvaluationData
    deliverableId?: string
    deliverableTitle?: string
    topicTitle?: string
  }>({
    open: false,
    passed: false,
  })

  const fetchTrends = useCallback(async (category: 'all' | 'fnb') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/trends/radar?filter=${category}`)
      const data = await res.json()
      if (Array.isArray(data.trends)) {
        setTrends(data.trends)
      }
    } catch (err) {
      console.error('[TrendRadar] Gagal memuat tren:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrends(filter)
  }, [fetchTrends, filter])

  async function handleGenerate(item: TrendRadarItem) {
    setGeneratingTopic(item.title)
    try {
      const res = await fetch('/api/trends/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          trendTopic: item.title,
          trendSnippet: item.snippet,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        if (json.evaluation && !json.evaluation.passed) {
          setResultDialog({
            open: true,
            passed: false,
            evaluation: json.evaluation,
            topicTitle: item.title,
          })
          return
        }
        alert(json.error || 'Gagal memproses tren')
        return
      }

      setResultDialog({
        open: true,
        passed: true,
        evaluation: json.evaluation,
        deliverableId: json.deliverable?.id,
        deliverableTitle: json.deliverable?.title,
        topicTitle: item.title,
      })

      if (onContentGenerated) onContentGenerated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala jaringan'
      alert(msg)
    } finally {
      setGeneratingTopic(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header & Filter Controller */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-orange-500" />
            <h3 className="text-base font-semibold text-foreground">Radar Tren Harian Indonesia</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sumber live Google Trends Indonesia untuk brand {clientName}. Evaluasi instan via The Three Gates.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-md px-2.5 py-1.5 font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Semua Tren
            </button>
            <button
              type="button"
              onClick={() => setFilter('fnb')}
              className={`rounded-md px-2.5 py-1.5 font-medium transition-colors ${
                filter === 'fnb'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              F&B / Kuliner
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTrends(filter)}
            disabled={loading}
            className="h-11 sm:h-8 px-2.5 shrink-0"
            title="Muat Ulang Radar Tren"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-1.5 text-xs">Segarkan</span>
          </Button>
        </div>
      </div>

      {/* Grid Kartu Tren */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-orange-500 mb-2" />
          <p className="text-xs">Memindai tren pencarian Indonesia...</p>
        </div>
      ) : trends.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p className="text-sm">Tidak ada tren yang ditemukan untuk kategori ini.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter('all')}
            className="mt-2 text-xs"
          >
            Tampilkan Semua Tren
          </Button>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-3.5 space-y-3.5">
          {trends.map((item, idx) => {
            const isProcessing = generatingTopic === item.title

            return (
              <motion.div 
                key={`${item.title}-${idx}`}
                className="break-inside-avoid mb-3.5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Card
                  className="flex flex-col justify-between border-border/70 hover:border-orange-500/40 transition-all hover:shadow-xs"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-medium shrink-0 bg-muted/60"
                      >
                        {item.category === 'fnb' ? 'Kuliner / F&B' : 'Tren Nasional'}
                      </Badge>

                      {item.traffic && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                          <TrendingUp className="size-3" />
                          {item.traffic}
                        </span>
                      )}
                    </div>

                    <CardTitle className="text-sm font-semibold leading-snug line-clamp-2 mt-2">
                      {item.title}
                    </CardTitle>
                    {item.snippet && (
                      <CardDescription className="text-xs line-clamp-2 mt-1">
                        {item.snippet}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 pt-2">
                    <div className="pt-2 border-t flex items-center justify-between gap-2">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Sumber <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Google Trends ID</span>
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleGenerate(item)}
                        disabled={Boolean(generatingTopic)}
                        className="h-11 sm:h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white shrink-0"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-1.5 size-3.5" />
                            Jadikan Konten
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Dialog Hasil Evaluasi & Akses Cepat */}
      <Dialog
        open={resultDialog.open}
        onOpenChange={(open) => setResultDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              {resultDialog.passed ? (
                <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="size-5" />
                </div>
              ) : (
                <div className="flex size-9 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
                  <ShieldAlert className="size-5" />
                </div>
              )}
              <div>
                <DialogTitle className="text-base">
                  {resultDialog.passed ? 'Lolos The Three Gates' : 'Tren Ditolak'}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {resultDialog.topicTitle}
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
                <div className="text-xs font-semibold text-foreground mb-1">Analisis Sistem:</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {resultDialog.evaluation.reasoning}
                </p>
                {resultDialog.evaluation.recommendedAngle && (
                  <div className="mt-2 pt-2 border-t text-xs">
                    <span className="font-medium text-foreground">Sudut Pandang Brand: </span>
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
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
