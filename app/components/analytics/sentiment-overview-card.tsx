import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'

interface SentimentOverviewProps {
  positiveCount: number
  neutralCount: number
  negativeCount: number
  totalProcessed: number
  avgConfidence: number
}

export function SentimentOverviewCard({
  positiveCount,
  neutralCount,
  negativeCount,
  totalProcessed,
  avgConfidence,
}: SentimentOverviewProps) {
  if (totalProcessed === 0) return null

  const posPct = Math.round((positiveCount / totalProcessed) * 100)
  const neuPct = Math.round((neutralCount / totalProcessed) * 100)
  const negPct = Math.round((negativeCount / totalProcessed) * 100)

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icons.messageSquare className="size-4 text-primary" />
          Analisis Sentimen Komentar (NLP)
        </CardTitle>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          {totalProcessed} komentar • Conf. {Math.round(avgConfidence * 100)}%
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-emerald-500/10 rounded-md border border-emerald-500/20">
            <span className="text-xs text-emerald-600 font-medium flex items-center justify-center gap-1">
              <Icons.trendingUp className="size-3" /> Positif
            </span>
            <span className="text-base font-bold text-emerald-600 block mt-0.5">{posPct}%</span>
            <span className="text-[10px] text-muted-foreground">{positiveCount} komentar</span>
          </div>

          <div className="p-2 bg-muted/50 rounded-md border">
            <span className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
              <Icons.minus className="size-3" /> Netral
            </span>
            <span className="text-base font-bold text-foreground block mt-0.5">{neuPct}%</span>
            <span className="text-[10px] text-muted-foreground">{neutralCount} komentar</span>
          </div>

          <div className="p-2 bg-rose-500/10 rounded-md border border-rose-500/20">
            <span className="text-xs text-rose-600 font-medium flex items-center justify-center gap-1">
              <Icons.trendingDown className="size-3" /> Negatif
            </span>
            <span className="text-base font-bold text-rose-600 block mt-0.5">{negPct}%</span>
            <span className="text-[10px] text-muted-foreground">{negativeCount} komentar</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
