import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { createClient } from "@/lib/supabase/server";
import { clientsListQueryOptions } from "@/features/clients/api/queries";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { DeliverableNewForm } from "@/features/deliverables/components/deliverable-new-form";

export default async function NewDeliverablePage() {
  const queryClient = getQueryClient();
  const supabase = await createClient();

  // Prefetch client options untuk form (anti loading-flash)
  void queryClient.prefetchQuery(
    clientsListQueryOptions({ page: 1, perPage: 100 }, supabase)
  );

  return (
    <PageContainer
      pageTitle="Buat Deliverable Baru"
      pageDescription="Isi informasi di bawah untuk menyusun deliverable konten atau dokumen terarah untuk brand klien."
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
          <DeliverableNewForm />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
