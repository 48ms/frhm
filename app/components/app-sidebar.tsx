"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useQueryState, parseAsString } from "nuqs"
import { NavUser } from "@/components/nav-user"
import { Icons } from "@/components/icons"
import { BrandLogo } from "@/components/brand-logo"
import { PRODUCT_NAME } from "@/lib/config"
import { isActiveFor } from "@/hooks/use-nav"
import { cn } from "@/lib/utils"
import { adminNavStitch } from "@/config/nav-config"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"

export type AppUser = {
  name: string
  email: string
  avatar: string
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<"aside"> & {
  user: AppUser
}) {
  const pathname = usePathname()

  const { clientId: activeClientId } = useActiveDashboard()

  function renderIcon(icon: string) {
    const IconCmp = Icons[icon as keyof typeof Icons]
    return IconCmp ? <IconCmp className="size-5" /> : null
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 z-30 backdrop-blur-2xl border-r border-border hidden md:block overflow-y-auto bg-background/85"
      {...props}
    >
      <div className="flex flex-col justify-between h-full p-4">
        
        <div>
          {/* Brand capsule */}
          <div className="flex items-center gap-3 px-3 py-2.5 mb-8 bg-card/95 backdrop-blur-md rounded-2xl shadow-sm border border-border/50">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shadow-inner">
              <BrandLogo size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-foreground">{PRODUCT_NAME}</span>
              <span className="text-[10px] font-bold text-muted-foreground">Admin Hub</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1" aria-label="Main Navigation">
            {adminNavStitch.map((item) => {
              const active = isActiveFor(pathname, item.url)
              const targetUrl = activeClientId
                ? `${item.url}?clientId=${activeClientId}` 
                : item.url
                
              return (
                <a
                  key={item.title}
                  href={targetUrl}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm cursor-pointer transition-all",
                    active
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-muted-foreground font-medium hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <span className="flex items-center justify-center">{renderIcon(item.icon ?? "")}</span>
                  <span>{item.title}</span>
                </a>
              )
            })}
          </nav>

          {/* New Post CTA → opens Composer */}
          <div className="mt-8">
            <a
              href={`/admin/composer${activeClientId ? `?clientId=${activeClientId}` : ''}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[hsl(var(--admin-cobalt))] text-white font-semibold text-xs shadow-md transition-all hover:bg-opacity-90 active:scale-95 cursor-pointer"
            >
              <Icons.add className="size-4" />
              New Post
            </a>
          </div>
        </div>
        
        <div className="pt-3 border-t border-border/50 space-y-1">
          <a
            href="/admin/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted text-xs cursor-pointer transition-all"
          >
            <Icons.settings className="size-[18px]" />
            <span>Settings</span>
          </a>
          <a
            href="/admin/support"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted text-xs cursor-pointer transition-all"
          >
            <Icons.help className="size-[18px]" />
            <span>Support</span>
          </a>
          <NavUser user={user} />
        </div>
      </div>
    </aside>
  )
}
