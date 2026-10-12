"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { NavUser } from "@/components/nav-user"
import { Icons } from "@/components/icons"
import { isActiveFor } from "@/hooks/use-nav"
import { cn } from "@/lib/utils"
import { adminNavStitch } from "@/config/nav-config"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/animate-ui/components/radix/sheet"
import { useSidebar } from "@/components/ui/sidebar"

export type AppUser = {
  name: string
  email: string
  avatar: string
}

export function AppSidebar({ user, ...props }: React.ComponentProps<"aside"> & { user: AppUser }) {
  const pathname = usePathname()
  const { clientId: activeClientId } = useActiveDashboard()
  const { isMobile, open, setOpen, openMobile, setOpenMobile } = useSidebar()

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
            "flex items-center gap-3.5 px-3.5 py-2.5 rounded-full text-sm transition-all",
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

  // ─── Desktop expanded sidebar ──────────────────────────────────────────
  const desktopExpanded = (
    <motion.div
      initial={false}
      animate={{ width: open ? "16rem" : "3rem" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden md:flex h-svh sticky top-0 z-30 border-r border-border bg-background/95 backdrop-blur-xl shrink-0"
      data-state={open ? "expanded" : "collapsed"}
      {...(props as Record<string, unknown>)}
    >
      {/* Collapsed icon-only mode */}
      {!open && (
        <div className="w-16 flex flex-col items-center py-4 gap-2">
          {adminNavStitch.map((item) => {
            const active = isActiveFor(pathname, item.url)
            const targetUrl = activeClientId ? `${item.url}?clientId=${activeClientId}` : item.url
            return (
              <a
                key={item.title}
                href={targetUrl}
                aria-label={item.title}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full transition-all",
                  active
                    ? "bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-ink))] shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {renderIcon(item.icon ?? "")}
              </a>
            )
          })}
          <div className="mt-auto mb-4 flex flex-col gap-2">
            <a
              href="/admin/settings"
              aria-label="Settings"
              className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            >
              <Icons.settings className="size-[18px]" />
            </a>
            <a
              href="/admin/support"
              aria-label="Support"
              className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            >
              <Icons.help className="size-[18px]" />
            </a>
          </div>
          <NavUser user={user} />
        </div>
      )}

      {/* Expanded full nav */}
      {open && (
        <div className="w-64 flex flex-col h-full p-4">
          <WorkspaceSwitcher />

          <nav className="mt-4 flex flex-col gap-1" aria-label="Main Navigation">
            {navItems()}
          </nav>

          <div className="mt-8">
            <a
              href={`/admin/composer${activeClientId ? `?clientId=${activeClientId}` : ""}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[hsl(var(--admin-cobalt))] text-white font-semibold text-xs shadow-md transition-all hover:bg-opacity-90 active:scale-95 cursor-pointer"
            >
              <Icons.add className="size-4" />
              New Post
            </a>
          </div>

          <div className="mt-auto pt-3 border-t border-border/50 space-y-1">
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
      )}
    </motion.div>
  )

  // ─── Mobile drawer (Sheet) ─────────────────────────────────────────────
  const mobileSheet = (
    <Sheet open={openMobile} onOpenChange={setOpenMobile}>
      <SheetContent
        side="left"
        className="w-64 p-0 bg-background/95 backdrop-blur-xl [&>button]:hidden"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Sidebar</SheetTitle>
          <SheetDescription>Navigation menu</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col h-full p-4">
          <WorkspaceSwitcher />

          <nav className="mt-4 flex flex-col gap-1" aria-label="Main Navigation">
            {navItems()}
          </nav>

          <div className="mt-8">
            <a
              href={`/admin/composer${activeClientId ? `?clientId=${activeClientId}` : ""}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[hsl(var(--admin-cobalt))] text-white font-semibold text-xs shadow-md transition-all hover:bg-opacity-90 active:scale-95 cursor-pointer"
              onClick={() => setOpenMobile(false)}
            >
              <Icons.add className="size-4" />
              New Post
            </a>
          </div>

          <div className="mt-auto pt-3 border-t border-border/50 space-y-1">
            <a
              href="/admin/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted text-xs cursor-pointer transition-all"
              onClick={() => setOpenMobile(false)}
            >
              <Icons.settings className="size-[18px]" />
              <span>Settings</span>
            </a>
            <a
              href="/admin/support"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted text-xs cursor-pointer transition-all"
              onClick={() => setOpenMobile(false)}
            >
              <Icons.help className="size-[18px]" />
              <span>Support</span>
            </a>
            <NavUser user={user} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <>
      {desktopExpanded}
      {mobileSheet}
    </>
  )
}
