"use client"

import { motion } from "framer-motion"
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
import { ChevronRight } from "@/components/icon/registry/icons/chevron-right"

export type NavItem = {
  title: string
  url: string
  icon?: React.ReactNode
  isActive?: boolean
  badge?: string
  shortcut?: string
  items?: {
    title: string
    url: string
    isActive?: boolean
  }[]
}

export function NavMain({
  items,
  label = "Platform",
  action,
}: {
  items: NavItem[]
  label?: string
  action?: React.ReactNode
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-muted-foreground/70 font-semibold tracking-wider text-[10px] uppercase flex items-center justify-between">
        <span>{label}</span>
        {action}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map((item) =>
          item.items && item.items.length > 0 ? (
            <Collapsible
              key={item.title}
              defaultOpen={item.isActive}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={<SidebarMenuButton tooltip={item.title} className="relative overflow-hidden transition-colors hover:text-foreground" />}
              >
                {item.isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-md bg-brand-accent/10 border border-brand-accent/20 z-0"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity {item.isActive ? 'text-brand-accent opacity-100' : ''}">{item.icon}</span>
                <span className="relative z-10 font-medium">{item.title}</span>
                <ChevronRight animateOnHover className="relative z-10 ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90 opacity-50" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="mt-1 border-l-brand-accent/20">
                  {item.items.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton isActive={subItem.isActive} render={<a href={subItem.url} className="relative" />}>
                        {subItem.isActive && (
                          <motion.div
                            layoutId="sidebar-sub-active"
                            className="absolute inset-0 rounded-md bg-brand-accent/10 z-0"
                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                          />
                        )}
                        <span className={`relative z-10 ${subItem.isActive ? "text-brand-accent font-semibold" : "text-muted-foreground hover:text-foreground transition-colors"}`}>{subItem.title}</span>
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
                isActive={item.isActive}
                render={<a href={item.url} className="relative overflow-hidden group/btn transition-colors hover:text-foreground" />}
              >
                {item.isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-md bg-brand-accent/10 border border-brand-accent/20 z-0"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <span className={`relative z-10 flex items-center justify-center transition-opacity ${item.isActive ? "text-brand-accent opacity-100" : "opacity-70 group-hover/btn:opacity-100"}`}>{item.icon}</span>
                <span className="relative z-10 font-medium">{item.title}</span>
                {item.shortcut && (
                  <kbd className="relative z-10 ml-auto hidden font-sans text-[10px] font-medium text-muted-foreground/60 md:inline-block bg-background/50 px-1.5 rounded border border-border/50">
                    {item.shortcut}
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
