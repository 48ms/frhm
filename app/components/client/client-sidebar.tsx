"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Icons } from "@/components/icons"
import { isActiveFor } from "@/hooks/use-nav"
import { cn } from "@/lib/utils"
import { clientNav } from "@/config/nav-config"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/animate-ui/components/radix/tooltip"
import { NavUser } from "@/components/nav-user"

export type ClientBrandInfo = {
  id: string
  name: string
  logo_url?: string | null
  contact_email?: string | null
}

export type ClientUserInfo = {
  name: string
  email: string
  avatar?: string
}

interface ClientSidebarProps extends React.ComponentProps<typeof Sidebar> {
  client: ClientBrandInfo
  user: ClientUserInfo
}

export function ClientSidebar({
  client,
  user,
  className,
  ...props
}: ClientSidebarProps) {
  const pathname = usePathname()
  const { isMobile, open, setOpenMobile } = useSidebar()

  function renderIcon(icon: string) {
    const IconCmp = Icons[icon as keyof typeof Icons]
    return IconCmp ? <IconCmp className="size-5" /> : null
  }

  const brandInitial = (client.name?.charAt(0) || "C").toUpperCase()

  return (
    <Sidebar
      collapsible="icon"
      className={cn("border-r border-border/40 bg-background/95 backdrop-blur-xl", className)}
      {...props}
    >
      {/* Brand Header — Locked to this client tenant */}
      <SidebarHeader className="h-16 md:h-14 border-b border-border/40 px-3 flex flex-row items-center justify-between gap-2 overflow-hidden shrink-0">
        <div className="flex items-center gap-3 w-full min-w-0">
          <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm text-primary shrink-0 shadow-xs">
            {brandInitial}
          </div>
          {open && (
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-sm text-foreground truncate leading-tight">
                {client.name}
              </h2>
              <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
                Client Workspace
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation Links */}
      <SidebarContent className="no-scrollbar p-3 gap-1 overflow-y-auto">
        {open ? (
          <>
            <nav className="flex flex-col gap-1" aria-label="Client Navigation">
              {clientNav.map((item) => {
                const active = isActiveFor(pathname, item.url)
                const targetUrl = `${item.url}?clientId=${client.id}`
                return (
                  <a
                    key={item.title}
                    href={targetUrl}
                    aria-current={active ? "page" : undefined}
                    onClick={() => isMobile && setOpenMobile(false)}
                    className={cn(
                      "flex items-center gap-3.5 px-3.5 py-2.5 rounded-full text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground font-medium hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <span className="flex items-center justify-center shrink-0">
                      {renderIcon(item.icon ?? "")}
                    </span>
                    <span className="truncate">{item.title}</span>
                  </a>
                )
              })}
            </nav>

            {/* Quick Urgent Request Card */}
            <div className="mt-6 p-3 rounded-2xl bg-muted/40 border border-border/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Icons.messageSquare className="size-4 text-primary" />
                <span>Butuh Bantuan?</span>
              </div>
              <p className="text-2xs text-muted-foreground leading-relaxed">
                Punya revisi mendesak atau request konten baru? Ajukan langsung ke hotline tim Frhm.
              </p>
              <a
                href={`/client/support?clientId=${client.id}`}
                onClick={() => isMobile && setOpenMobile(false)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-background border border-border/50 text-foreground text-xs font-semibold shadow-2xs hover:bg-muted transition-all active:scale-95"
              >
                <span>Ajukan Tiket</span>
                <Icons.arrowRight className="size-3" />
              </a>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-2 gap-2">
            {clientNav.map((item) => {
              const active = isActiveFor(pathname, item.url)
              const targetUrl = `${item.url}?clientId=${client.id}`
              return (
                <Tooltip key={item.title}>
                  <TooltipTrigger asChild>
                    <a
                      href={targetUrl}
                      aria-label={item.title}
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-11",
                        active
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
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

      {/* Footer User Info */}
      <SidebarFooter className="p-3 border-t border-border/40 space-y-1 shrink-0">
        <NavUser
          user={{
            name: user.name,
            email: user.email,
            avatar: user.avatar || "",
          }}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
