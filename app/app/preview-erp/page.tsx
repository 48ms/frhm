import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { socialQueries } from "@/features/social-accounts/api/queries"
import { scheduledPostQueries } from "@/features/scheduled-posts/api/queries"
import { ErpDashboardClient } from "@/app/admin/erp/erp-client"
import { Suspense } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import "@/app/admin/admin-stage.css"

export const dynamic = "force-dynamic"

export default async function PreviewErp() {
  const queryClient = getQueryClient()

  // Prefetch so that `useSuspenseQuery` in ErpDashboardClient finds data in
  // cache and does NOT trigger a Server Action during render (avoids
  // "Server Functions cannot be called during initial render" + the React
  // Router update warning). Mirrors the real /admin/erp/page.tsx pattern.
  await queryClient.prefetchQuery(socialQueries.listClientsWithChannels())
  await queryClient.prefetchQuery(scheduledPostQueries.listAll())

  return (
    <div className="admin-theme admin-viewport">
      <SidebarProvider>
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
              <ErpDashboardClient />
            </Suspense>
          </HydrationBoundary>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
