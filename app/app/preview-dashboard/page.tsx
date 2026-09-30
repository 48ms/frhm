import { Suspense } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AdminHeader } from "@/app/admin/header"
import AdminDashboardPage from "@/app/admin/dashboard/page"
import "@/app/admin/admin-stage.css"

export default async function PreviewShell() {
  // The dashboard tree reads URL state (nuqs), so it must sit inside a
  // Suspense boundary for static prerendering to bail out cleanly.
  const dashboard = await AdminDashboardPage()

  return (
    <div className="admin-theme admin-viewport">
      <div aria-hidden className="admin-orb admin-orb-lavender" />
      <div aria-hidden className="admin-orb admin-orb-lime" />
      <div aria-hidden className="admin-orb admin-orb-cobalt" />
      <SidebarProvider>
        {/* nuqs uses useSearchParams; a Suspense boundary lets static prerender
            bail out cleanly instead of throwing a prerender error. */}
        <Suspense fallback={null}>
          <AppSidebar user={{ name: "Auditor", email: "audit@frhm.com", avatar: "" }} />
        </Suspense>
        <SidebarInset className="md:pl-64">
          <AdminHeader userName="Auditor" />
          <Suspense fallback={null}>{dashboard}</Suspense>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
