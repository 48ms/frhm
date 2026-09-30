import { Suspense } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SocialAccountsBoard } from "@/components/social-accounts/social-accounts-board"
import "@/app/admin/admin-stage.css"

// Temporary E2E preview route: renders the Social Accounts board without the
// /admin auth wall so Playwright can click through the Connect Channel modal.
export default function PreviewSocialAccounts() {
  return (
    <div className="admin-theme admin-viewport">
      <SidebarProvider>
        <AppSidebar
          clients={[{ id: "1", name: "Taraju" }, { id: "2", name: "Pawon" }]}
          user={{ name: "Auditor", email: "audit@frhm.com", avatar: "" }}
        />
        <SidebarInset className="md:pl-64">
          <Suspense fallback={null}>
            <SocialAccountsBoard />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
