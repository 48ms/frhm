import { mutationOptions } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query-client'
import { createClient } from '@/lib/supabase/client'
import { updateDeliverableStatus, createDeliverable } from './service'
import { deliverableKeys } from './queries'
import type { Deliverable } from '@/lib/supabase/types'

export const updateDeliverableStatusMutation = mutationOptions({
  mutationFn: ({ id, status }: { id: string; status: Deliverable['status'] }) =>
    updateDeliverableStatus(createClient(), id, status),
  onSuccess: (updated) => {
    const queryClient = getQueryClient()
    queryClient.invalidateQueries({ queryKey: deliverableKeys.lists() })
    queryClient.invalidateQueries({ queryKey: deliverableKeys.detail(updated.id) })
  },
})

export const createDeliverableMutation = mutationOptions({
  mutationFn: (data: {
    title: string
    client_id: string
    type: Deliverable['type']
    description?: string
    content?: string
  }) => createDeliverable(createClient(), data),
  onSuccess: () => {
    const queryClient = getQueryClient()
    queryClient.invalidateQueries({ queryKey: deliverableKeys.lists() })
  },
})
