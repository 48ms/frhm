import Link from "next/link"

import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Overview", href: "/admin/dashboard", icon: Icons.dashboard },
  { label: "Social Accounts", href: "/admin/clients", icon: Icons.hub },
  { label: "Campaigns", href: "/admin/deliverables", icon: Icons.campaign },
  { label: "Content Calendar", href: "/admin/calendar", icon: Icons.calendar },
  { label: "Analytics", href: "/admin/analytics", icon: Icons.monitoring },
] as const

export function DashboardSidebar({ activeHref = "/admin/dashboard" }: { activeHref?: string }) {
  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-lum-outline-variant/40 bg-lum-surface-low/85 backdrop-blur-2xl md:block">
      <div className="flex h-full flex-col justify-between p-4">
        <div>
          {/* Top capsule logo */}
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/80 bg-lum-surface-lowest/90 px-3 py-2.5 shadow-sm backdrop-blur-md">
            <div className="flex size-9 items-center justify-center rounded-xl bg-lum-cobalt text-white shadow-inner">
              <Icons.logo className="size-5" />
            </div>
            <div className="overflow-hidden leading-none">
              <span className="block font-display text-base font-bold tracking-tight text-lum-on-surface">
                FRHM
              </span>
              <span className="mt-0.5 block text-xs text-lum-outline">Campaign Hub</span>
            </div>
          </div>

          <nav className="space-y-1" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const active = item.href === activeHref
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-lum-primary-container font-semibold text-lum-on-primary-container shadow-sm"
                      : "font-medium text-lum-outline hover:bg-lum-surface-high/60 hover:text-lum-on-surface",
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-5">
            <Link
              href="/admin/deliverables/new"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-lum-cobalt px-4 py-2.5 text-xs font-semibold tracking-wider text-white shadow-md transition-all hover:bg-lum-cobalt-light active:scale-95"
            >
              <Icons.add className="size-4" />
              New Post
            </Link>
          </div>
        </div>

        <div className="space-y-1 border-t border-lum-outline-variant/30 pt-3">
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-lum-outline transition-colors hover:bg-lum-surface-container hover:text-lum-on-surface"
          >
            <Icons.settings className="size-[18px]" />
            <span>Settings</span>
          </Link>
          <Link
            href="/admin/support"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-lum-outline transition-colors hover:bg-lum-surface-container hover:text-lum-on-surface"
          >
            <Icons.help className="size-[18px]" />
            <span>Support</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}
