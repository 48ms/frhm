import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { socialQueries } from "@/features/social-accounts/api/queries"
import { ClientChannelsBoard } from "@/components/social-accounts/social-accounts-board"
import { Suspense } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import "@/app/admin/admin-stage.css"

// Temporary E2E preview route: renders the Social Accounts board without the
// /admin auth wall so Playwright can click through the Connect Channel modal.
// No `clients` prop: the sidebar falls back to the shared mock repository
// (SOCIAL_CLIENTS), so its ids match the board and the ?clientId= URL state.
export const dynamic = "force-dynamic"

export default async function PreviewSocialAccounts() {
  const queryClient = getQueryClient()

  // Prefetch so `useSuspenseQuery` in ClientChannelsBoard does NOT trigger a
  // Server Action during render (avoid SSR waterfall + React Router warning).
  // Mirrors the real /admin/social-accounts/page.tsx pattern.
  await queryClient.prefetchQuery(socialQueries.listClientsWithChannels())

  return (
    <div className="admin-theme admin-viewport">
      <SidebarProvider>
        {/* nuqs uses useSearchParams; a Suspense boundary lets static prerender
            bail out cleanly instead of throwing a prerender error. */}
        <Suspense fallback={null}>
          <AppSidebar user={{ name: "Auditor", email: "audit@frhm.com", avatar: "" }} />
        </Suspense>
        <SidebarInset className="md:pl-64">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center p-12 text-center animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-muted mb-4" />
                  <div className="h-6 w-48 bg-muted rounded mb-2" />
                  <div className="h-4 w-32 bg-muted/50 rounded" />
                </div>
              }
            >
              <ClientChannelsBoard />
            </Suspense>
          </HydrationBoundary>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
