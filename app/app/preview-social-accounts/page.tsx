import { Suspense } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ClientChannelsBoard } from "@/components/social-accounts/social-accounts-board"
import "@/app/admin/admin-stage.css"

// Temporary E2E preview route: renders the Social Accounts board without the
// /admin auth wall so Playwright can click through the Connect Channel modal.
// No `clients` prop: the sidebar falls back to the shared mock repository
// (SOCIAL_CLIENTS), so its ids match the board and the ?clientId= URL state.
export default function PreviewSocialAccounts() {
  return (
    <div className="admin-theme admin-viewport">
      <SidebarProvider>
        {/* nuqs uses useSearchParams; a Suspense boundary lets static prerender
            bail out cleanly instead of throwing a prerender error. */}
        <Suspense fallback={null}>
          <AppSidebar user={{ name: "Auditor", email: "audit@frhm.com", avatar: "" }} />
        </Suspense>
        <SidebarInset className="md:pl-64">
          <Suspense fallback={null}>
            <ClientChannelsBoard />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
