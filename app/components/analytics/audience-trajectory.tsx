"use client"

import React, { useMemo, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Titik data metrik faktual untuk satu titik waktu.
 * Nilai `reach` dan `engage` berasal dari post_metrics di DB, bukan angka rekaan.
 */
export type TrajectoryPoint = {
  label: string
  reach: number
  engage: number
}

const TIMEFRAMES = ["7D", "30D", "90D"] as const
type Timeframe = (typeof TIMEFRAMES)[number]

/**
 * AudienceTrajectory menampilkan tren reach & engagement dari data faktual.
 *
 * Tanpa data (atau data kurang dari dua titik), komponen menampilkan state
 * kosong yang jujur. Komponen tidak pernah membuat angka atau grafik rekaan.
 */
export function AudienceTrajectory({
  data,
}: {
  /** Deret metrik faktual dari DB, terurut lama ke baru. */
  data?: TrajectoryPoint[]
}) {
  const [tf, setTf] = useState<Timeframe>("7D")

  const points = useMemo(() => data ?? [], [data])
  const hasData = points.length >= 2

  const series = useMemo(() => {
    if (!hasData) return null

    // Ambil jendela titik sesuai timeframe (7D=7 titik, 30D=30, 90D=90),
    // dibatasi jumlah titik yang tersedia secara faktual.
    const windowSize = tf === "7D" ? 7 : tf === "30D" ? 30 : 90
    const sliced = points.slice(-windowSize)

    const maxReach = Math.max(...sliced.map((p) => p.reach), 1)
    const maxEngage = Math.max(...sliced.map((p) => p.engage), 1)

    // Skala 0..100 untuk tinggi bar, memakai nilai faktual.
    const bars = sliced.map((p) => ({
      label: p.label,
      reachPct: Math.round((p.reach / maxReach) * 100),
      engagePct: Math.round((p.engage / maxEngage) * 100),
      reach: p.reach,
      engage: p.engage,
    }))

    const totalReach = sliced.reduce((sum, p) => sum + p.reach, 0)
    const totalEngage = sliced.reduce((sum, p) => sum + p.engage, 0)
    const peak = sliced.reduce(
      (best, p) => (p.reach > best.reach ? p : best),
      sliced[0]
    )

    return { bars, totalReach, totalEngage, peak }
  }, [points, tf, hasData])

  return (
    <div className="admin-card border-none bg-card/90 backdrop-blur-xl shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <span className="admin-section-label">AUDIENCE TRAJECTORY</span>
          <h2 className="font-syne font-bold text-lg text-foreground mt-1">
            Performance &amp; Engagement Dynamics
          </h2>
        </div>
        <div className="inline-flex p-1 rounded-full bg-muted border border-border/30">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                tf === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {!series ? (
        <div className="h-60 w-full bg-muted/40 rounded-2xl border border-border/50 flex flex-col items-center justify-center gap-2 text-center px-4">
          <p className="text-sm font-semibold text-foreground">
            Belum ada data trajektori
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Grafik akan tampil setelah metrik harian tercatat untuk klien ini.
          </p>
        </div>
      ) : (
        <>
          {/* Bar chart faktual dari metrik DB */}
          <div className="relative h-60 w-full bg-muted/40 rounded-2xl p-4 border border-border/50 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 w-full flex items-end gap-1">
              {series.bars.map((b, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col justify-end gap-0.5 h-full"
                  title={`${b.label}: reach ${b.reach}, engage ${b.engage}`}
                >
                  <div
                    className="w-full rounded-t-sm bg-[#2333E7] transition-all"
                    style={{ height: `${b.reachPct}%` }}
                  />
                  <div
                    className="w-full rounded-t-sm bg-[#aed500] transition-all"
                    style={{ height: `${b.engagePct}%` }}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center relative z-10 text-xs text-muted-foreground font-medium pt-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2333E7]" /> Reach
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#aed500]" /> Engagement
              </span>
              <span className="bg-background px-2.5 py-0.5 rounded-full shadow-sm font-bold text-foreground">
                Peak: {series.peak.label} ({series.peak.reach})
              </span>
            </div>
          </div>

          {/* Ringkasan faktual dari deret yang sama */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
            <div className="p-3.5 rounded-xl bg-muted/60 border border-border/50">
              <p className="admin-section-label">TOTAL REACH</p>
              <p className="font-syne font-bold text-foreground text-base mt-1">
                {series.totalReach.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Periode {tf}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-muted/60 border border-border/50">
              <p className="admin-section-label">TOTAL ENGAGEMENT</p>
              <p className="font-syne font-bold text-foreground text-base mt-1">
                {series.totalEngage.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Likes, komentar, share, simpan
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-muted/60 border border-border/50">
              <p className="admin-section-label">TITIK TERBAIK</p>
              <p className="font-syne font-bold text-foreground text-base mt-1">
                {series.peak.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reach tertinggi di periode ini
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
