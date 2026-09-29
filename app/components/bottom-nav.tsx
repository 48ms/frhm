"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Icons } from "@/components/icons"
import { isActiveFor } from "@/hooks/use-nav"

// Mobile-only tab bar. Mirrors the primary client destinations from
// config/nav-config.ts (clientNavGroups) — keep the two in sync by hand.
const CLIENT_TABS = [
  { title: "Approvals", url: "/client/approvals", icon: Icons.circleCheck },
  { title: "Kalender", url: "/client/calendar", icon: Icons.calendar },
  { title: "Laporan", url: "/client/dashboard", icon: Icons.dashboard },
  { title: "Akun", url: "/client/settings", icon: Icons.user },
]

export function BottomNav({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed bottom-0 left-0 z-50 flex h-16 w-full border-t border-border bg-card pb-safe md:hidden"
    >
      <div className="grid h-full w-full grid-cols-4 font-medium">
        {CLIENT_TABS.map((item) => {
          const isActive = isActiveFor(pathname, item.url)
          const badge =
            item.url === "/client/approvals" && pendingCount > 0
              ? String(pendingCount)
              : undefined
          const Icon = item.icon

          return (
            <Link
              key={item.title}
              href={item.url}
              aria-current={isActive ? "page" : undefined}
              className={`relative inline-flex flex-col items-center justify-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                isActive
                  ? "font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="size-5" />
              <span className="mt-1 text-xs">{item.title}</span>
              {badge && (
                <span className="absolute right-[25%] top-2 inline-flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-card">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
