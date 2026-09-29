"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Icons } from "@/components/icons"
import { isActiveFor } from "@/hooks/use-nav"
import type { NavItem } from "@/types/nav"

interface NavMainProps {
  items: NavItem[]
  label?: string
  action?: React.ReactNode
}

function renderItemIcon(icon: NavItem["icon"] | React.ReactNode) {
  if (!icon) return null
  if (typeof icon === "string") {
    const IconCmp = Icons[icon as keyof typeof Icons]
    return IconCmp ? <IconCmp className="size-4" /> : null
  }
  return icon as React.ReactNode
}

export function NavMain({ items, label = "Platform", action }: NavMainProps) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="admin-group-label flex items-center justify-between">
        <span>{label}</span>
        {action}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map((item) =>
          item.items && item.items.length > 0 ? (
            <Collapsible
              key={item.title}
              defaultOpen={isActiveFor(pathname, item.url)}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                nativeButton={false}
                render={
                  <a
                    href={item.url}
                    className="flex w-full items-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  />
                }
              >
                <span className="flex items-center justify-center">
                  {renderItemIcon(item.icon)}
                </span>
                <span className="font-medium">{item.title}</span>
                <Icons.chevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90 opacity-50 size-4" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="mt-1 border-l-brand-accent/20">
                  {item.items.map((subItem, index) => (
                    <SidebarMenuSubItem key={subItem.url || `${subItem.title}-${index}`}>
                      <SidebarMenuSubButton
                        isActive={isActiveFor(pathname, subItem.url)}
                        className={isActiveFor(pathname, subItem.url) ? "admin-nav-active" : undefined}
                        render={<a href={subItem.url} className="relative" />}
                      >
                        <span
                          className={
                            subItem.isActive
                              ? "text-brand-accent font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          }
                        >
                          {subItem.title}
                        </span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isActiveFor(pathname, item.url)}
                className={isActiveFor(pathname, item.url) ? "admin-nav-active" : undefined}
                render={
                  <a
                    href={item.url}
                    className="relative overflow-hidden group/btn rounded-full px-4 py-3 transition-colors hover:text-foreground"
                  />
                }
              >
                <span className="relative z-10 flex items-center justify-center">
                  {renderItemIcon(item.icon)}
                </span>
                <span className="relative z-10 font-medium">{item.title}</span>
                {item.shortcut && (
                  <kbd className="relative z-10 ml-auto hidden font-sans text-[10px] font-medium text-muted-foreground/60 md:inline-block bg-background/50 px-1.5 rounded border border-border/50 uppercase">
                    {item.shortcut.join("")}
                  </kbd>
                )}
                {item.badge && (
                  <span className="relative z-10 ml-auto inline-flex size-5 items-center justify-center rounded-full bg-brand-accent/15 text-[10px] font-semibold text-brand-accent">
                    {item.badge}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
