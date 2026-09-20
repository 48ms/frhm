'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2Icon, CircleIcon, ClockIcon, LoaderIcon,
} from 'lucide-react'

type Stage = {
  key: string; label: string; description: string | null; sort_order: number
}
type Skill = {
  id: string; name: string; description: string | null; stage: string | null
}
type Status = 'belum' | 'jalan' | 'selesai'

const STATUS_META: Record<Status, { icon: React.ReactNode; label: string; color: string }> = {
  belum:   { icon: <CircleIcon   className="size-4" />, label: 'Belum',    color: 'text-muted-foreground' },
  jalan:   { icon: <ClockIcon    className="size-4" />, label: 'Dikerjakan', color: 'text-amber-600' },
  selesai: { icon: <CheckCircle2Icon className="size-4" />, label: 'Selesai', color: 'text-green-600' },
}

export function PipelineBoard({
  stages, skills, statusBySkill,
}: {
  stages: Stage[]; skills: Skill[]
  statusBySkill: Record<string, Status>; providerId?: string; haveFiles?: string[]
}) {
  const sorted = [...stages].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="flex flex-col gap-4">
      {sorted.map((stage, i) => {
        const stageSkills = skills.filter((s) => s.stage === stage.key)
        const done = stageSkills.filter((s) => statusBySkill[s.id] === 'selesai').length
        const active = stageSkills.filter((s) => statusBySkill[s.id] === 'jalan').length
        const total = stageSkills.length
        const pct = total > 0 ? Math.round((done / total) * 100) : 0

        return (
          <Card key={stage.key}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {i + 1}
                  </div>
                  <div>
                    <CardTitle className="text-base">{stage.label}</CardTitle>
                    {stage.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{stage.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {active > 0 && (
                    <Badge variant="outline" className="gap-1 text-amber-600">
                      <LoaderIcon className="size-3" /> {active} aktif
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1">
                    {done}/{total} selesai
                  </Badge>
                </div>
              </div>
              <div
                className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progres ${stage.label}: ${pct}%`}
              >
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </CardHeader>

            {stageSkills.length > 0 && (
              <CardContent className="pt-0">
                <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {stageSkills.map((skill) => {
                    const st = statusBySkill[skill.id] ?? 'belum'
                    const meta = STATUS_META[st]
                    return (
                      <div
                        key={skill.id}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                      >
                        <span className={meta.color}>{meta.icon}</span>
                        <span className="truncate">{skill.name}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}