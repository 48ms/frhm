"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'

interface ForecastData {
  target_month: string
  forecasted_reach: number
  forecasted_er: number
  forecasted_wa_inquiries: number
  forecasted_dm_inquiries: number
  estimated_roi_multiplier: number
  confidence_score: number
  model_notes?: string
}

export function ROIAnalyticalForecastCard({ clientId }: { clientId: string }) {
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/clients/${clientId}/analytics/predictions`)
      .then(r => r.json())
      .then(d => {
        const active = d.saved || d.algorithmic_forecast
        setForecast(active || null)
      })
      .catch(() => setForecast(null))
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) return <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Menghitung proyeksi ROI…</p></CardContent></Card>
  if (!forecast) return null

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Icons.trendingUp className="size-4 text-emerald-500" />
          Proyeksi Performa & Forecasting ROI (Bulan Depan)
        </CardTitle>
        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          <Icons.shield className="size-3 mr-1" /> Confidence {Math.round(forecast.confidence_score * 100)}%
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 bg-background rounded-lg border shadow-xs">
            <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <Icons.activity className="size-3 text-indigo-500" /> Target Reach
            </span>
            <span className="text-lg font-bold text-foreground">
              {forecast.forecasted_reach.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="p-3 bg-background rounded-lg border shadow-xs">
            <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <Icons.trendingUp className="size-3 text-emerald-500" /> Target ER
            </span>
            <span className="text-lg font-bold text-foreground">
              {forecast.forecasted_er}%
            </span>
          </div>

          <div className="p-3 bg-background rounded-lg border shadow-xs">
            <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <Icons.phone className="size-3 text-emerald-600" /> WA Inquiries
            </span>
            <span className="text-lg font-bold text-emerald-600">
              +{forecast.forecasted_wa_inquiries}
            </span>
          </div>

          <div className="p-3 bg-background rounded-lg border shadow-xs">
            <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <Icons.chat className="size-3 text-indigo-600" /> DM Inquiries
            </span>
            <span className="text-lg font-bold text-indigo-600">
              +{forecast.forecasted_dm_inquiries}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
          <div>
            <strong className="text-sm text-foreground">Estimasi ROI Multiplier</strong>
            <p className="text-xs text-muted-foreground">Proyeksi pengembalian agency fee berdasarkan proyeksi konversi sales</p>
          </div>
          <span className="text-xl font-extrabold text-emerald-600">
            {forecast.estimated_roi_multiplier}x
          </span>
        </div>

        {forecast.model_notes && (
          <p className="text-xs text-muted-foreground italic border-t pt-2">
            Catatan model: {forecast.model_notes}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
