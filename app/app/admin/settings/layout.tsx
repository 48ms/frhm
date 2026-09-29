"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { isActiveFor } from "@/hooks/use-nav"
import { settingsNavGroups } from "@/config/nav-config"
import { cn } from "@/lib/utils"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <PageContainer
      pageTitle="Pengaturan Sistem"
      pageDescription="Kelola integrasi, pengguna, dan keamanan platform"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <nav
          aria-label="Navigasi pengaturan"
          className="relative lg:w-52 lg:shrink-0"
        >
          <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
            {settingsNavGroups.map((group, groupIndex) => (
              <li key={group.label} className="shrink-0 lg:shrink">
                <p
                  className={cn(
                    "hidden px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 lg:block",
                    groupIndex > 0 && "lg:pt-4"
                  )}
                >
                  {group.label}
                </p>
                <ul className="contents lg:block lg:space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = isActiveFor(pathname, item.url)
                    return (
                      <li key={item.url} className="shrink-0 lg:shrink">
                        <Link
                          href={item.url}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "block whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors lg:whitespace-normal",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                            isActive
                              ? "bg-accent font-medium text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          )}
                        >
                          {item.title}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
          {/* Fade hints that the mobile row scrolls; hidden on desktop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent lg:hidden"
          />
        </nav>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </PageContainer>
  )
}
