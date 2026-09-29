"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'

interface Competitor {
  id: string
  brand_name: string
  platform: string
  avg_reach: number
  avg_er: number
  weekly_posts: number
}

export function CompetitorBenchmarkCard({ clientId }: { clientId: string }) {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/clients/${clientId}/competitors`)
      .then(r => r.json())
      .then(d => setCompetitors(d.competitors || []))
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) return <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Memuat benchmark kompetitor…</p></CardContent></Card>

  if (!competitors || competitors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Benchmark Kompetitor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Belum ada data benchmark. Tambahkan untuk analisis gap.</p>
          <Button variant="outline" size="sm" className="mt-3">
            <Icons.add className="size-4 mr-2" /> Tambah Benchmark
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benchmark Kompetitor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {competitors.map((c: Competitor) => (
          <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <strong className="text-sm">{c.brand_name}</strong>
              <span className="text-xs text-muted-foreground ml-2">({c.platform})</span>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="text-sm font-medium">{c.avg_reach.toLocaleString('id-ID')}</span>
                <span className="text-xs text-muted-foreground block">reach</span>
              </div>
              <div>
                <span className="text-sm font-medium">{c.avg_er}%</span>
                <span className="text-xs text-muted-foreground block">ER</span>
              </div>
              <div>
                <span className="text-sm font-medium">{c.weekly_posts}</span>
                <span className="text-xs text-muted-foreground block">/minggu</span>
              </div>
              <Button variant="ghost" size="sm">
                <Icons.trash className="size-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
