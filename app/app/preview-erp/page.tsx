import { Suspense } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ErpDashboardClient } from "@/app/admin/erp/erp-client"
import { assertPreviewAllowed } from "@/lib/preview-guard"
import "@/app/admin/admin-stage.css"

export const dynamic = "force-dynamic"

/**
 * Preview ERP fixture — mirrors the working preview-calendar pattern.
 *
 * No server-side prefetch / resolveClientId here: those require a session
 * cookie so RLS can resolve clientId, which preview routes don't have.
 * ErpDashboardClient resolves the active client on the client (via
 * useActiveDashboard) and reads data with useQuery + placeholderData, so no
 * cache prefill is required and nothing suspends during SSR.
 */
export default function PreviewErp() {
  assertPreviewAllowed()
  return (
    <div className="admin-theme admin-viewport">
      <SidebarProvider>
        <Suspense fallback={null}>
          <AppSidebar user={{ name: "Auditor", email: "audit@frhm.com", avatar: "" }} />
        </Suspense>
        <SidebarInset className="flex-1">
          <Suspense fallback={null}>
            <ErpDashboardClient />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
