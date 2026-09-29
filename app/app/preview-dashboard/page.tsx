import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AdminHeader } from "@/app/admin/header"
import AdminDashboardPage from "@/app/admin/dashboard/page"
import "@/app/admin/admin-stage.css"

export default async function PreviewShell() {
  return (
    <div className="admin-theme admin-viewport">
      <div aria-hidden className="admin-orb admin-orb-lavender" />
      <div aria-hidden className="admin-orb admin-orb-lime" />
      <div aria-hidden className="admin-orb admin-orb-cobalt" />
      <SidebarProvider>
        <AppSidebar
          clients={[{ id: "1", name: "Taraju" }, { id: "2", name: "Pawon" }]}
          user={{ name: "Auditor", email: "audit@frhm.com", avatar: "" }}
        />
        <SidebarInset className="md:pl-64">
          <AdminHeader userName="Auditor" />
          {await AdminDashboardPage()}
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
