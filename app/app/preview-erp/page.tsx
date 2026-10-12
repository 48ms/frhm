import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { socialQueries } from "@/features/social-accounts/api/queries"
import { scheduledPostQueries } from "@/features/scheduled-posts/api/queries"
import { deliverableQueries } from "@/features/deliverables/api/queries"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"
import { ErpDashboardClient } from "@/app/admin/erp/erp-client"
import { Suspense } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { assertPreviewAllowed } from "@/lib/preview-guard"
import "@/app/admin/admin-stage.css"

export const dynamic = "force-dynamic"

export default async function PreviewErp() {
  assertPreviewAllowed()
  const queryClient = getQueryClient()
  // Resolve the SAME clientId the client component will read via
  // useActiveDashboard() (first valid client). Prefetching with a different key
  // (e.g. listAll() or "") leaves the suspense query without cache -> it calls a
  // Server Action during initial render -> "Server Functions cannot be called
  // during initial render" crash. Mirrors the real /admin/erp/page.tsx pattern.
  const clientId = await resolveClientId("")

  await queryClient.prefetchQuery(socialQueries.listClientsWithChannels())
  await queryClient.prefetchQuery(scheduledPostQueries.listByClient(clientId))
  await queryClient.prefetchQuery(deliverableQueries.listByClient(clientId))

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
