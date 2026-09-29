import { Icons } from "@/components/icons"

export type KpiItem = {
  label: string
  value: string
  caption: string
  icon: keyof typeof Icons
  delta?: string
  tone?: "primary" | "cobalt" | "tertiary"
  progress?: number
}

const TONE = {
  primary: "bg-lum-primary-container text-lum-on-primary-container",
  cobalt: "bg-lum-cobalt/15 text-lum-cobalt",
  tertiary: "bg-lum-tertiary/15 text-lum-tertiary",
} as const

export function DashboardKpiGrid({ items }: { items: KpiItem[] }) {
  return (
    <section
      aria-label="Key Performance Indicators"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {items.map((kpi) => {
        const Icon = Icons[kpi.icon]
        return (
          <div
            key={kpi.label}
            className="rounded-2xl border border-white/80 bg-lum-surface-lowest/85 p-5 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-lum-outline">
                {kpi.label}
              </span>
              <div
                className={`flex size-8 items-center justify-center rounded-full shadow-sm ${TONE[kpi.tone ?? "primary"]}`}
              >
                <Icon className="size-[18px]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-lum-on-surface">
                {kpi.value}
              </span>
              {kpi.delta ? (
                <span className="rounded-full bg-lum-primary-container/25 px-2 py-0.5 text-xs font-bold text-lum-primary-deep">
                  {kpi.delta}
                </span>
              ) : null}
            </div>
            <p className="mt-1 truncate text-xs text-lum-outline">{kpi.caption}</p>
            {typeof kpi.progress === "number" ? (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-lum-surface-container">
                <div
                  className="h-full rounded-full bg-lum-cobalt-light transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, kpi.progress))}%` }}
                />
              </div>
            ) : null}
          </div>
        )
      })}
    </section>
  )
}
