import { Suspense } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AdminCalendarClient } from "@/app/admin/calendar/calendar-client"
import "@/app/admin/admin-stage.css"

export const dynamic = "force-dynamic"

export default function PreviewCalendar() {
  return (
    <div className="admin-theme admin-viewport">
      <SidebarProvider>
        <Suspense fallback={null}>
          <AppSidebar user={{ name: "Auditor", email: "audit@frhm.com", avatar: "" }} />
        </Suspense>
        <SidebarInset className="md:pl-64">
          <Suspense fallback={null}>
            <AdminCalendarClient />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
