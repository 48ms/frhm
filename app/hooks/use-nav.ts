import type { NavGroup, NavItem } from "@/types/nav"

export function isActiveFor(pathname: string, url: string): boolean {
  if (!url || url === "#") return false
  return pathname === url || pathname.startsWith(`${url}/`)
}

export function getActiveGroup(pathname: string, groups: NavGroup[]): NavGroup | null {
  for (const g of groups) {
    for (const item of g.items) {
      if (isActiveFor(pathname, item.url)) return g
      if (item.items?.some((sub: NavItem) => isActiveFor(pathname, sub.url))) return g
    }
  }
  return null
}
