import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

interface SeasonalPeriod {
  id: string
  name: string
  impact_multiplier: number
}

export function SeasonalCalendarBadge({ className }: { className?: string }) {
  const [activeSeason, setActiveSeason] = useState<SeasonalPeriod | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/seasonal-periods`)
      .then(r => r.json())
      .then(d => {
        const periods: SeasonalPeriod[] = d.periods || []
        if (periods.length > 0) {
          setActiveSeason(periods[0])
        }
        setLoading(false)
      })
  }, [])

  if (loading) return null
  if (!activeSeason) return null

  return (
    <Badge variant="secondary" className={`text-xs ${className || ''}`}>
      Musim: {activeSeason.name} (x{activeSeason.impact_multiplier})
    </Badge>
  )
}
