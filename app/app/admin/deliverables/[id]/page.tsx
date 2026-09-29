import { HydrationBoundary, dehydrate, QueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/server'
import { deliverableDetailQueryOptions } from '@/features/deliverables/api/queries'
import DeliverableDetailPage from './page-client'
import { notFound } from 'next/navigation'

export default async function AdminDeliverableDetailServerPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const queryClient = new QueryClient()
  
  await queryClient.prefetchQuery(deliverableDetailQueryOptions(params.id, supabase))
  
  const state = dehydrate(queryClient)
  const data = state.queries.find(q => q.queryKey.includes(params.id))?.state.data
  
  if (!data) {
    notFound()
  }

  return (
    <HydrationBoundary state={state}>
      <DeliverableDetailPage deliverableId={params.id} />
    </HydrationBoundary>
  )
}
