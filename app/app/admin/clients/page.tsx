import { Suspense } from "react"
import type { Metadata } from "next"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { socialQueries } from "@/features/social-accounts/api/queries"
import { supportTicketQueries } from "@/features/support/api/queries"
import { PageContainer } from "@/components/layout/page-container"
import {
  ClientManager,
  ClientManagerSkeleton,
  AddClientHeaderButton,
  SupportTicketsHeaderButton,
} from "@/components/client/client-manager"

import { clientsParamsCache } from "@/lib/searchparams"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Client Workspaces | Frahma",
  description: "Kelola portofolio klien, profil brand, dan workspace multi-tenant Frahma.",
}

export default async function ClientsPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { q } = clientsParamsCache.parse(await props.searchParams)
  const queryClient = getQueryClient()

  // 1. Server-side data prefetching (Aturan #3 TanStack Query v5)
  await Promise.all([
    queryClient.prefetchQuery(socialQueries.listClientsWithChannels()),
    queryClient.prefetchQuery(supportTicketQueries.listAll()),
  ])

  return (
    <PageContainer
      pageTitle="Client Workspaces"
      pageDescription="Manage your client portfolio, brand profiles, and workspace settings."
      pageHeaderAction={
        <div className="flex items-center gap-2.5">
          <SupportTicketsHeaderButton />
          <AddClientHeaderButton />
        </div>
      }
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<ClientManagerSkeleton />}>
          <ClientManager />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  )
}

