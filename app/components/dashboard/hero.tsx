import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"

export function DashboardHero({
  clientName = "All Clients",
  greeting = "Good day, Creator.",
}: {
  clientName?: string
  greeting?: string
}) {
  return (
    <section className="group relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-white/90 bg-lum-surface-lowest/85 p-6 shadow-sm backdrop-blur-2xl md:flex-row md:items-center lg:p-7">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -right-8 -top-12 size-64 -rotate-12 rounded-full bg-lum-cobalt-light/15 blur-lg" />
      <div className="pointer-events-none absolute -bottom-8 right-40 size-48 rotate-6 rounded-full bg-lum-primary-container/30 blur-md" />
      <div className="pointer-events-none absolute right-10 top-5 select-none font-bold text-3xl text-lum-primary-container">
        ✦
      </div>

      <div className="relative z-10 space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full bg-lum-tertiary-container px-3 py-1 text-xs font-bold text-lum-tertiary shadow-sm">
          <span className="size-1.5 animate-pulse rounded-full bg-lum-tertiary" />
          <span>WORKSPACE ACTIVE</span>
          <span className="opacity-40">•</span>
          <span className="font-extrabold text-lum-cobalt">
            CLIENT: {clientName.toUpperCase()}
          </span>
        </div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-lum-on-surface md:text-3xl">
          {greeting}
        </h1>
        <p className="text-xs text-lum-outline md:text-sm">
          Managing real-time campaign acceleration &amp; audience velocity.
        </p>
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-lum-outline-variant/50 bg-lum-surface-lowest text-xs font-semibold text-lum-on-surface shadow-sm hover:bg-lum-surface-high"
        >
          <Icons.upload className="mr-1.5 size-4" />
          Export Report
        </Button>
        <Button
          size="sm"
          className="rounded-full bg-lum-cobalt text-xs font-semibold text-white shadow-md hover:bg-lum-cobalt-light"
        >
          <Icons.send className="mr-1.5 size-4" />
          Schedule Post
        </Button>
      </div>
    </section>
  )
}
