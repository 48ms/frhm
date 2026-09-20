"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { PRODUCT_NAME } from "@/lib/config"

import { NavMain, type NavItem } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useCreateClient } from "@/components/client/create-client-provider"
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
import { Button } from "@/components/ui/button"
import { LayoutDashboard } from "@/components/icon/registry/icons/layout-dashboard"
import { Layers } from "@/components/icon/registry/icons/layers"
import { Sparkles } from "@/components/icon/registry/icons/sparkles"
import { Link as LinkAnim } from "@/components/icon/registry/icons/link"
import { Users } from "@/components/icon/registry/icons/users"
import {
  Building2Icon,
  FileTextIcon,
  WorkflowIcon,
  HistoryIcon,
  CalendarIcon,
  Settings2Icon,
  VideoIcon,
  ContactIcon,
  CheckCircle2Icon,
  PlusIcon,
} from "lucide-react"

export type AppUser = {
  name: string
  email: string
  avatar: string
}

export type ClientOption = { id: string; name: string }

const clientNav: NavItem[] = [
  {
    title: "Dashboard",
    url: "/client/dashboard",
    icon: <LayoutDashboard animateOnHover />,
  },
  {
    title: "Progres",
    url: "/client/pipeline",
    icon: <WorkflowIcon />,
  },
  {
    title: "Kalender Saya",
    url: "/client/calendar",
    icon: <CalendarIcon />,
  },
  {
    title: "Deliverable Saya",
    url: "/client/deliverables",
    icon: <FileTextIcon />,
  },
  {
    title: "Content Approvals",
    url: "/client/approvals",
    icon: <CheckCircle2Icon />,
  },
]

type NavGroup = {
  label: string
  items: NavItem[]
  action?: React.ReactNode
}

export function AppSidebar({
  user,
  role,
  clients = [],
  pendingCount = 0,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: AppUser
  role: "admin" | "client"
  clients?: ClientOption[]
  pendingCount?: number
}) {
  const pathname = usePathname()
  const { openCreateClient } = useCreateClient()

  let adminGroups: NavGroup[] = []
  let clientItems: NavItem[] = []

  if (role === "admin") {
    adminGroups = [
      {
        label: "OVERVIEW",
        items: [
          {
            title: "Dashboard",
            url: "/admin/dashboard",
            icon: <LayoutDashboard animateOnHover />,
            isActive: pathname === "/admin/dashboard",
          },
          {
            title: "Global Pipeline",
            url: "/admin/global-pipeline",
            icon: <WorkflowIcon />,
            isActive: pathname.startsWith("/admin/global-pipeline"),
          },
          {
            title: "Analytics",
            url: "/admin/analytics",
            icon: <Sparkles className="size-4" />,
            isActive: pathname.startsWith("/admin/analytics"),
          },
          {
            title: "Kalender",
            url: "/admin/calendar",
            icon: <CalendarIcon />,
            isActive: pathname.startsWith("/admin/calendar"),
          },
        ],
      },
      {
        label: "OPERATIONS",
        items: [
          {
            title: "Content Production",
            url: "/admin/production",
            icon: <VideoIcon />,
            isActive: pathname.startsWith("/admin/production"),
          },
          {
            title: "KOL & Vendor CRM",
            url: "/admin/crm",
            icon: <ContactIcon />,
            isActive: pathname.startsWith("/admin/crm"),
          },
          {
            title: "Batch Automations",
            url: "/admin/automations",
            icon: <Sparkles className="size-4" />,
            isActive: pathname.startsWith("/admin/automations"),
          },
        ],
      },
      {
        label: "CLIENTS",
        action: (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={openCreateClient}
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            aria-label="Tambah client baru"
          >
            <PlusIcon className="size-3" />
          </Button>
        ),
        items: [
          {
            title: "Client Workspace",
            url: "/admin/clients",
            icon: <Building2Icon />,
            isActive: pathname.startsWith("/admin/clients"),
            items:
              clients.length > 0
                ? clients.map((c) => ({
                    title: c.name,
                    url: `/admin/clients/${c.id}`,
                    isActive: pathname === `/admin/clients/${c.id}`,
                  }))
                : [{ title: "Belum ada client", url: "/admin/clients", isActive: false }],
          },
        ],
      },
      {
        label: "AI CORE",
        items: [
          {
            title: "Skill Library",
            url: "/admin/skills",
            icon: <Layers animateOnHover />,
            isActive: pathname.startsWith("/admin/skills"),
          },
          {
            title: "Pengaturan AI",
            url: "/admin/settings/ai",
            icon: <Sparkles animateOnHover />,
            isActive: pathname.startsWith("/admin/settings/ai"),
          },
        ],
      },
      {
        label: "SYSTEM",
        items: [
          {
            title: "Pengaturan Utama",
            url: "/admin/settings",
            icon: <Settings2Icon />,
            isActive: pathname === "/admin/settings" || pathname === "/admin/settings/bridge",
          },
          {
            title: "Pengaturan Bridge",
            url: "/admin/settings/bridge",
            icon: <LinkAnim animateOnHover />,
            isActive: pathname.startsWith("/admin/settings/bridge"),
          },
          {
            title: "Manajemen User",
            url: "/admin/settings/users",
            icon: <Users animateOnHover />,
            isActive: pathname.startsWith("/admin/settings/users"),
          },
          {
            title: "Audit Log",
            url: "/admin/settings/audit",
            icon: <HistoryIcon />,
            isActive: pathname.startsWith("/admin/settings/audit"),
          },
        ],
      },
    ]
  } else {
    clientItems = clientNav.map((item) => ({
      ...item,
      isActive: pathname === item.url || pathname.startsWith(item.url + "/"),
      ...(item.url === "/client/deliverables" && (pendingCount ?? 0) > 0
        ? { badge: String(pendingCount) }
        : {}),
    }))
  }

  return (
    <Sidebar collapsible="icon" {...props} className="hidden md:flex">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<a href={role === "admin" ? "/admin/dashboard" : "/client/dashboard"} />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-transparent overflow-hidden">
                <Image src="/logo-frhm.png" alt="Frhm Logo" width={32} height={32} className="object-contain" unoptimized priority />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold tracking-tight">{PRODUCT_NAME}</span>
                <span className="truncate text-[10px] uppercase text-muted-foreground font-medium tracking-widest">
                  Marketing ERP
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {role === "admin" ? (
          adminGroups.map((group) => (
            <NavMain key={group.label} items={group.items} label={group.label} action={group.action} />
          ))
        ) : (
          <NavMain items={clientItems} label="Menu" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
