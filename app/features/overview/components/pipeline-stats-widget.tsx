import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { NumberTicker } from "@/components/motion/number-ticker"
import { ActionStrip } from "./client-overview"
import type { PipelineStats } from "../api/types"

interface PipelineStatsWidgetProps {
  stats: PipelineStats
}

export function PipelineStatsWidget({ stats }: PipelineStatsWidgetProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
      <Card className="@container/card rounded-2xl border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs uppercase tracking-wider font-semibold">
            Total deliverable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NumberTicker
            value={stats.total}
            className="text-4xl @sm:text-5xl font-extrabold tracking-tighter tabular-nums text-brand-accent"
          />
          <p className="text-muted-foreground mt-2 text-xs font-medium">
            Semua deliverable lintas klien
          </p>
        </CardContent>
      </Card>
      <div className="rounded-2xl overflow-hidden border border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
        <ActionStrip
          awaitingReview={stats.sent}
          needsRevision={stats.revision}
          approved={stats.approved}
        />
      </div>
    </div>
  )
}
