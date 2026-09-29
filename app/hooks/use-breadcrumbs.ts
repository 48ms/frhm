"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"

type BreadcrumbItem = {
  title: string
  link: string
}

const routeMapping: Record<string, BreadcrumbItem[]> = {
  "/admin/dashboard": [{ title: "Dashboard", link: "/admin/dashboard" }],
  "/admin/clients": [{ title: "Dashboard", link: "/admin/dashboard" }, { title: "Clients", link: "/admin/clients" }],
  "/admin/deliverables": [{ title: "Dashboard", link: "/admin/dashboard" }, { title: "Deliverables", link: "/admin/deliverables" }],
  "/admin/settings": [{ title: "Dashboard", link: "/admin/dashboard" }, { title: "Settings", link: "/admin/settings" }],
  "/admin/analytics": [{ title: "Dashboard", link: "/admin/dashboard" }, { title: "Analytics", link: "/admin/analytics" }],
  "/admin/calendar": [{ title: "Dashboard", link: "/admin/dashboard" }, { title: "Calendar", link: "/admin/calendar" }],
  "/client/dashboard": [{ title: "Dashboard", link: "/client/dashboard" }],
  "/client/deliverables": [{ title: "Dashboard", link: "/client/dashboard" }, { title: "Deliverables", link: "/client/deliverables" }],
  "/client/pipeline": [{ title: "Dashboard", link: "/client/dashboard" }, { title: "Pipeline", link: "/client/pipeline" }],
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname()

  return useMemo(() => {
    // Exact match first
    if (routeMapping[pathname]) return routeMapping[pathname]

    // Prefix match (e.g. /admin/clients/abc)
    for (const [prefix, items] of Object.entries(routeMapping)) {
      if (pathname.startsWith(prefix)) return items
    }

    // Fallback: generate from segments
    const segments = pathname.split("/").filter(Boolean)
    return segments.map((segment, index) => ({
      title: segment.charAt(0).toUpperCase() + segment.slice(1),
      link: `/${segments.slice(0, index + 1).join("/")}`,
    }))
  }, [pathname])
}
