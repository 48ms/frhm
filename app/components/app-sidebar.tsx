"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { NavUser } from "@/components/nav-user"
import { Icons } from "@/components/icons"
import { isActiveFor } from "@/hooks/use-nav"
import { cn } from "@/lib/utils"
import { adminNavStitch } from "@/config/nav-config"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/animate-ui/components/radix/tooltip"

export type AppUser = {
  name: string
  email: string
  avatar: string
}

export function AppSidebar({ user, className, ...props }: React.ComponentProps<typeof Sidebar> & { user: AppUser }) {
  const pathname = usePathname()
  const { clients, clientId: activeClientId } = useActiveDashboard()
  const { isMobile, open, setOpenMobile } = useSidebar()
  const activeClient = clients.find((c) => c.id === activeClientId) ?? clients[0]

  function renderIcon(icon: string) {
    const IconCmp = Icons[icon as keyof typeof Icons]
    return IconCmp ? <IconCmp className="size-5" /> : null
  }

  function navItems() {
    return adminNavStitch.map((item) => {
      const active = isActiveFor(pathname, item.url)
      const targetUrl = activeClientId ? `${item.url}?clientId=${activeClientId}` : item.url
      return (
        <a
          key={item.title}
          href={targetUrl}
          aria-current={active ? "page" : undefined}
          onClick={() => isMobile && setOpenMobile(false)}
          className={cn(
            "flex items-center gap-3.5 px-3.5 py-2.5 rounded-full text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active
              ? "bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-ink))] font-semibold shadow-xs"
              : "text-muted-foreground font-semibold hover:text-foreground hover:bg-muted/60"
          )}
        >
          <span className="flex items-center justify-center shrink-0">{renderIcon(item.icon ?? "")}</span>
          <span className="truncate">{item.title}</span>
        </a>
      )
    })
  }

  return (
    <Sidebar
      collapsible="icon"
      className={cn("border-r border-border/40 bg-background/95 backdrop-blur-xl", className)}
      {...props}
    >
      {/* Header — sejajar horizontal presisi dengan AdminHeader (md:h-14 / h-16) */}
      <SidebarHeader className="h-16 md:h-14 border-b border-border/40 px-3 flex flex-row items-center justify-between gap-2 overflow-hidden shrink-0">
        <WorkspaceSwitcher className="mb-0" collapsed={!open} />
      </SidebarHeader>

      {/* Content Navigation */}
      <SidebarContent className="no-scrollbar p-3 gap-1 overflow-y-auto">
        {open ? (
          <>
            <nav className="flex flex-col gap-1" aria-label="Main Navigation">
              {navItems()}
            </nav>

            <div className="mt-6 px-1">
              <a
                href={`/admin/composer${activeClientId ? `?clientId=${activeClientId}` : ""}`}
                onClick={() => isMobile && setOpenMobile(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[hsl(var(--admin-cobalt))] text-primary-foreground font-semibold text-xs shadow-md transition-all hover:bg-opacity-90 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Icons.add className="size-4" />
                New Post
              </a>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-2 gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={`/admin/composer${activeClientId ? `?clientId=${activeClientId}` : ""}`}
                  aria-label="New Post"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-[hsl(var(--admin-cobalt))] text-primary-foreground shadow-md hover:bg-opacity-90 active:scale-95 transition-all mb-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Icons.add className="size-5" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="right">New Post</TooltipContent>
            </Tooltip>
            {adminNavStitch.map((item) => {
              const active = isActiveFor(pathname, item.url)
              const targetUrl = activeClientId ? `${item.url}?clientId=${activeClientId}` : item.url
              return (
                <Tooltip key={item.title}>
                  <TooltipTrigger asChild>
                    <a
                      href={targetUrl}
                      aria-label={item.title}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        active
                          ? "bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-ink))] shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      )}
                    >
                      {renderIcon(item.icon ?? "")}
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        )}
      </SidebarContent>

      {/* Footer User & Quick Settings */}
      <SidebarFooter className="p-3 border-t border-border/40 space-y-1 shrink-0">
        {open ? (
          <>
            <a
              href="/admin/settings"
              onClick={() => isMobile && setOpenMobile(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted text-xs cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icons.settings className="size-[18px]" />
              <span>Settings</span>
            </a>
            <a
              href="/admin/support"
              onClick={() => isMobile && setOpenMobile(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted text-xs cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icons.help className="size-[18px]" />
              <span>Support</span>
            </a>
            <NavUser user={user} />
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="/admin/settings"
                  aria-label="Settings"
                  className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-11"
                >
                  <Icons.settings className="size-[18px]" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="/admin/support"
                  aria-label="Support"
                  className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-11"
                >
                  <Icons.help className="size-[18px]" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="right">Support</TooltipContent>
            </Tooltip>
            <NavUser user={user} />
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
