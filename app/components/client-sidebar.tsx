"use client"

import * as React from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Icons } from "@/components/icons"
import { clientNavGroups } from "@/config/nav-config"
import { isActiveFor } from "@/hooks/use-nav"
import type { AppUser } from "@/components/app-sidebar"

export function ClientSidebar({
  user,
  pendingCount = 0,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: AppUser
  pendingCount?: number
}) {
  const pathname = usePathname()

  function renderItemIcon(icon: keyof typeof Icons | undefined) {
    if (!icon) return null
    const IconCmp = Icons[icon]
    return IconCmp ? <IconCmp className="size-4" /> : null
  }

  const groups = React.useMemo(() => {
    return clientNavGroups.map((g) => {
      if (g.label === "DECISION CENTER") {
        return {
          ...g,
          items: g.items.map((item) => {
            if (item.url === "/client/approvals") {
              return {
                ...item,
                badge: pendingCount > 0 ? String(pendingCount) : undefined,
              }
            }
            return item
          }),
        }
      }
      return g
    })
  }, [pendingCount])

  return (
    <Sidebar collapsible="icon" {...props} className="hidden md:flex">
      <SidebarHeader className="px-1 pt-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<a href="/client/dashboard" />}
              className="h-auto gap-3 rounded-full border border-white/60 bg-[hsl(var(--admin-surface-lowest))]/80 px-3 py-3 shadow-sm backdrop-blur-md"
            >
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--admin-cobalt))] shadow-inner">
                <Image
                  src="/logo-frhm.png"
                  alt="Frhm Logo"
                  width={28}
                  height={28}
                  className="object-contain"
                  unoptimized
                  priority
                />
              </div>
              <div className="grid flex-1 text-left leading-none">
                <span className="admin-wordmark truncate text-lg font-bold tracking-tight">
                  FRHM
                </span>
                <span className="mt-0.5 truncate text-[11px] font-medium text-[hsl(var(--admin-outline))]">
                  Client Portal
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="admin-group-label px-4 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">
              {group.label}
            </div>
            <SidebarMenu className="mt-1 gap-1">
              {group.items.map((item) => {
                const active = isActiveFor(pathname, item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={active}
                      className={active ? "admin-nav-active" : undefined}
                      render={<a href={item.url} />}
                    >
                      {renderItemIcon(item.icon)}
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto inline-flex size-5 items-center justify-center rounded-full bg-brand-accent/15 text-[10px] font-semibold text-brand-accent">
                          {item.badge}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-[hsl(var(--admin-outline-variant))]/30 pt-4">
        <div className="mt-3">
          <NavUser user={user} />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
