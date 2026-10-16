"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { NavUser } from "@/components/nav-user"
import { Icons } from "@/components/icons"
import { AnimatedIcon } from "@/components/animate-ui/components/icons/animated-icon"
import { isActiveFor } from "@/hooks/use-nav"
import { cn } from "@/lib/utils"
import { adminNavStitch } from "@/config/nav-config"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { useCreateClient } from "@/components/client/create-client-provider"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/animate-ui/components/radix/tooltip"

const MotionLink = motion.create(Link)

export type AppUser = {
  name: string
  email: string
  avatar: string
}

export function AppSidebar({ user, className, ...props }: React.ComponentProps<typeof Sidebar> & { user: AppUser }) {
  const pathname = usePathname()
  const { clients, clientId: activeClientId } = useActiveDashboard()
  const { isMobile, open, setOpenMobile } = useSidebar()
  const { openCreateClient } = useCreateClient()
  const activeClient = clients.find((c) => c.id === activeClientId) ?? clients[0]

  function navItems() {
    return adminNavStitch.map((item) => {
      const active = isActiveFor(pathname, item.url)
      const targetUrl = activeClientId ? `${item.url}?clientId=${activeClientId}` : item.url
      return (
        <MotionLink
          key={item.title}
          href={targetUrl}
          aria-current={active ? "page" : undefined}
          onClick={() => isMobile && setOpenMobile(false)}
          whileHover="hover"
          initial="idle"
          className={cn(
            "relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group",
            active
              ? "text-[hsl(var(--admin-lime-ink))]"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          {active && (
            <motion.span
              layoutId="admin-active-pill"
              className="absolute inset-0 rounded-full bg-[hsl(var(--admin-lime))] shadow-xs -z-10"
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            />
          )}
          <AnimatedIcon
            name={item.icon ?? ""}
            isActive={active}
            className="size-5 shrink-0"
          />
          <span className="truncate">{item.title}</span>
        </MotionLink>
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
      <SidebarHeader className="h-16 md:h-14 border-b border-border/40 px-3 flex flex-row items-center justify-between gap-1.5 overflow-hidden shrink-0">
        <div className="flex items-center gap-1.5 w-full min-w-0">
          <WorkspaceSwitcher className="mb-0 flex-1 min-w-0" collapsed={!open} />
          {open && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (isMobile) setOpenMobile(false)
                    openCreateClient()
                  }}
                  className="h-10 w-10 rounded-xl shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all border border-border/40 hover:border-brand-accent/50 cursor-pointer"
                  aria-label="Tambah Client Baru"
                >
                  <AnimatedIcon name="add" className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Tambah Client Baru</TooltipContent>
            </Tooltip>
          )}
        </div>
      </SidebarHeader>

      {/* Content Navigation */}
      <SidebarContent className="no-scrollbar px-3 py-2 gap-1 overflow-y-auto">
        {open ? (
          <>
            <nav className="flex flex-col gap-1" aria-label="Main Navigation">
              {navItems()}
            </nav>

            <div className="mt-6 px-1">
              <Link
                href={`/admin/composer${activeClientId ? `?clientId=${activeClientId}` : ""}`}
                onClick={() => isMobile && setOpenMobile(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[hsl(var(--admin-cobalt))] text-primary-foreground font-semibold text-xs shadow-md transition-all hover:bg-opacity-90 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
              >
                <AnimatedIcon name="rocket" className="size-4 text-primary-foreground" />
                <span>New Post</span>
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-2 gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/admin/composer${activeClientId ? `?clientId=${activeClientId}` : ""}`}
                  aria-label="New Post"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-[hsl(var(--admin-cobalt))] text-primary-foreground shadow-md hover:bg-opacity-90 active:scale-95 transition-all mb-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
                >
                  <AnimatedIcon name="rocket" className="size-5 text-primary-foreground" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">New Post</TooltipContent>
            </Tooltip>
            {adminNavStitch.map((item) => {
              const active = isActiveFor(pathname, item.url)
              const targetUrl = activeClientId ? `${item.url}?clientId=${activeClientId}` : item.url
              return (
                <Tooltip key={item.title}>
                  <TooltipTrigger asChild>
                    <MotionLink
                      href={targetUrl}
                      aria-label={item.title}
                      aria-current={active ? "page" : undefined}
                      whileHover="hover"
                      initial="idle"
                      className={cn(
                        "relative flex items-center justify-center size-10 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group",
                        active
                          ? "text-[hsl(var(--admin-lime-ink))] font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="admin-active-pill-collapsed"
                          className="absolute inset-0 rounded-full bg-[hsl(var(--admin-lime))] shadow-xs -z-10"
                          transition={{ type: "spring", stiffness: 380, damping: 28 }}
                        />
                      )}
                      <AnimatedIcon name={item.icon ?? ""} isActive={active} className="size-5" />
                    </MotionLink>
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
            <MotionLink
              href="/admin/settings"
              whileHover="hover"
              initial="idle"
              onClick={() => isMobile && setOpenMobile(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted text-xs cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
            >
              <AnimatedIcon name="settings" className="size-[18px]" />
              <span>Settings</span>
            </MotionLink>
            <MotionLink
              href="/admin/support"
              whileHover="hover"
              initial="idle"
              onClick={() => isMobile && setOpenMobile(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted text-xs cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
            >
              <AnimatedIcon name="help" className="size-[18px]" />
              <span>Support</span>
            </MotionLink>
            <NavUser user={user} />
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <MotionLink
                  href="/admin/settings"
                  whileHover="hover"
                  initial="idle"
                  aria-label="Settings"
                  className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-11 group"
                >
                  <AnimatedIcon name="settings" className="size-[18px]" />
                </MotionLink>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <MotionLink
                  href="/admin/support"
                  whileHover="hover"
                  initial="idle"
                  aria-label="Support"
                  className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-11 group"
                >
                  <AnimatedIcon name="help" className="size-[18px]" />
                </MotionLink>
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
