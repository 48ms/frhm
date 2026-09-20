'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, Award } from 'lucide-react'
import type { ClientBenchmark } from '@/lib/analytics/benchmark-types'

export function BenchmarkBoard() {
  const [benchmarks, setBenchmarks] = useState<ClientBenchmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/analytics/benchmark')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setBenchmarks(data.benchmarks || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Memuat data benchmarking...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-destructive">
          Gagal memuat data: {error}
        </CardContent>
      </Card>
    )
  }

  if (benchmarks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Belum ada data analytics untuk dibandingkan. Pastikan ringkasan analytics sudah digenerate.
        </CardContent>
      </Card>
    )
  }

  // Urutkan berdasarkan reach tertinggi untuk highlight
  const sorted = [...benchmarks].sort((a, b) => b.totalReach - a.totalReach)
  const topPerformer = sorted[0]
  const bestConversion = [...benchmarks].sort((a, b) => b.conversionRate - a.conversionRate)[0]

  return (
    <div className="flex flex-col gap-6">
      {/* Highlight Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/15">
              <Award className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Reach Tertinggi</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{topPerformer.clientName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {topPerformer.totalReach.toLocaleString('id-ID')} total reach
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-500/30 bg-indigo-500/5">
          <CardContent className="p-5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/15">
              <TrendingUp className="size-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Konversi Terbaik</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{bestConversion.clientName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {bestConversion.conversionRate}% conversion rate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benchmarking Table */}
      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            Perbandingan Performa Antar Klien
          </CardTitle>
          <CardDescription className="text-xs">
            Data agregat dari seluruh ringkasan analytics yang tersimpan.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/10">
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Brand</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Total Reach</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Rata-rata Reach</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">ER (%)</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">WA</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">DM</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Konversi (%)</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((b, idx) => (
                  <tr key={b.clientId} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      {idx === 0 && <Badge variant="outline" className="text-[10px] border-emerald-500/40 bg-emerald-500/10 text-emerald-600 font-bold">TOP</Badge>}
                      {b.clientName}
                    </td>
                    <td className="text-right px-4 py-3 tabular-nums font-semibold">{b.totalReach.toLocaleString('id-ID')}</td>
                    <td className="text-right px-4 py-3 tabular-nums text-muted-foreground">{b.avgReach.toLocaleString('id-ID')}</td>
                    <td className="text-right px-4 py-3 tabular-nums">{b.engagementRate}%</td>
                    <td className="text-right px-4 py-3 tabular-nums text-emerald-600 font-medium">{b.totalWaInquiries}</td>
                    <td className="text-right px-4 py-3 tabular-nums text-indigo-600 font-medium">{b.totalDmInquiries}</td>
                    <td className="text-right px-4 py-3 tabular-nums font-semibold text-primary">{b.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
