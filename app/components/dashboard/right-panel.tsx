import Link from "next/link"

import { Icons } from "@/components/icons"

export type HubClient = {
  id: string
  name: string
  deliverableCount: number
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

export function DashboardConnectedHub({
  clients,
  activeClient,
}: {
  clients: HubClient[]
  activeClient?: HubClient | null
}) {
  const current = activeClient ?? clients[0] ?? null

  return (
    <div className="rounded-2xl border border-white/90 bg-lum-surface-lowest/90 p-6 shadow-sm backdrop-blur-xl">
      <div className="space-y-3 border-b border-lum-outline-variant/30 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-lum-on-surface">Connected Hub</h2>
            <p className="text-xs text-lum-outline">{clients.length} klien terhubung</p>
          </div>
          <Link
            href="/admin/clients"
            aria-label="Tambah klien"
            className="flex size-8 items-center justify-center rounded-full bg-lum-primary-container text-lum-on-primary-container shadow-sm transition-transform hover:scale-105 active:scale-90"
          >
            <Icons.add className="size-[18px]" />
          </Link>
        </div>

        {current ? (
          <>
            <div className="flex items-center justify-between rounded-2xl border border-lum-outline-variant/40 bg-lum-surface-low p-2.5 shadow-sm">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-lum-cobalt text-xs font-bold text-white shadow-sm">
                  {initials(current.name)}
                </div>
                <div className="truncate leading-tight">
                  <span className="block text-[10px] font-bold text-lum-outline">
                    LINKED CLIENT ACCOUNT
                  </span>
                  <span className="block truncate text-xs font-bold text-lum-on-surface">
                    {current.name}
                  </span>
                </div>
              </div>
              <Link
                href={`/admin/clients/${current.id}`}
                className="shrink-0 rounded-full bg-lum-primary-container px-2 py-0.5 text-[10px] font-bold text-lum-on-primary-container"
              >
                OPEN
              </Link>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-lum-outline-variant/30 bg-lum-surface-low/70 px-3 py-2 text-xs text-lum-outline">
              <Icons.badgeCheck className="size-4 shrink-0 text-lum-cobalt" />
              <span className="truncate">
                {current.deliverableCount} deliverable aktif untuk{" "}
                <b className="text-lum-on-surface">{current.name}</b>
              </span>
            </div>
          </>
        ) : (
          <p className="text-xs text-lum-outline">Belum ada klien.</p>
        )}
      </div>

      <div className="mt-4 space-y-2.5">
        {clients.slice(0, 4).map((c) => (
          <Link
            key={c.id}
            href={`/admin/clients/${c.id}`}
            className="flex items-center justify-between rounded-xl border border-white/60 bg-lum-surface-low/40 px-3 py-2.5 transition-all hover:bg-lum-surface-lowest"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-lum-surface-container text-[10px] font-bold text-lum-on-surface">
                {initials(c.name)}
              </span>
              <span className="truncate text-xs font-semibold text-lum-on-surface">{c.name}</span>
            </div>
            <span className="shrink-0 rounded-full bg-lum-primary-container/40 px-2 py-0.5 text-[10px] font-bold text-lum-on-primary-container">
              SYNCED
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-4 border-t border-lum-outline-variant/20 pt-3">
        <Link
          href="/admin/clients"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-lum-cobalt/50 px-4 py-2.5 text-xs font-semibold text-lum-cobalt transition-all hover:border-lum-cobalt hover:bg-lum-cobalt/5 active:scale-95"
        >
          <Icons.link className="size-4" />
          + Connect Channel to Client
        </Link>
      </div>
    </div>
  )
}

export function DashboardStudioIdentity() {
  return (
    <div className="relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br from-white/90 via-lum-surface-lowest/80 to-lum-tertiary-container/30 p-6 shadow-sm backdrop-blur-2xl">
      <div className="absolute -right-6 top-8 size-44 rotate-12 rounded-full bg-lum-cobalt-light opacity-80 shadow-md" />
      <div className="absolute -left-6 bottom-12 size-48 -rotate-12 rounded-full bg-lum-tertiary opacity-80 shadow-md" />
      <div className="absolute bottom-8 right-6 flex size-32 rotate-3 items-center justify-center rounded-full bg-lum-primary-container shadow-md">
        <span className="font-display text-xs font-extrabold tracking-wider text-lum-on-surface">
          NEXT-GEN
        </span>
      </div>
      <div className="fluted-glass-overlay pointer-events-none absolute inset-0 opacity-25" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wider text-lum-outline">
            STUDIO IDENTITY
          </span>
          <span className="text-xl font-bold text-lum-primary-container">✦</span>
        </div>
        <div className="mt-4">
          <span className="block font-display text-2xl font-extrabold leading-none tracking-tight text-lum-on-surface">
            DIGITAL
          </span>
          <span className="block font-display text-2xl font-extrabold leading-none tracking-tight text-lum-cobalt">
            SPACE.
          </span>
        </div>
      </div>

      <div className="relative z-10 pt-6">
        <div className="rounded-2xl border border-white/80 bg-lum-surface-lowest/90 p-3.5 shadow-sm backdrop-blur-md">
          <p className="font-display text-sm font-bold text-lum-on-surface">
            Campaign Velocity: 98%
          </p>
          <p className="mt-0.5 text-xs text-lum-outline">
            Multi-network algorithmic amplification active.
          </p>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[10px] font-bold text-lum-primary-deep">
              STATUS: ACCELERATING
            </span>
            <Link
              href="/admin/analytics"
              className="rounded-full bg-lum-on-surface px-2.5 py-0.5 text-[10px] font-semibold text-lum-surface hover:bg-lum-cobalt"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardAiLaunchpad() {
  return (
    <div className="rounded-2xl border border-white/80 bg-lum-surface-lowest/85 p-5 text-center shadow-sm backdrop-blur-xl">
      <div className="mx-auto mb-2.5 flex size-10 items-center justify-center rounded-full bg-lum-primary-container text-lum-on-primary-container shadow-sm">
        <Icons.sparkles className="size-5" />
      </div>
      <h3 className="font-display text-base font-bold text-lum-on-surface">Need AI Content Hooks?</h3>
      <p className="mx-auto mt-1 max-w-xs text-xs text-lum-outline">
        Generate 50 viral captions, hashtag clusters, and video concepts in seconds.
      </p>
      <Link
        href="/admin/analytics"
        className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-full bg-lum-primary-container py-2 text-xs font-bold text-lum-on-primary-container shadow-sm transition-all hover:bg-lum-primary-container/80 active:scale-95"
      >
        <Icons.bot className="size-4" />
        Launch Studio AI
      </Link>
    </div>
  )
}
