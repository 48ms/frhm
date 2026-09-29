import { mutationOptions } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query-client'
import { createClient } from '@/lib/supabase/client'
import { createClientRecord, updateClientRecord, deleteClientRecord } from './service'
import { clientKeys } from './queries'
import type { CreateClientInput, UpdateClientInput } from './types'

export const createClientMutation = mutationOptions({
  mutationFn: (input: CreateClientInput) => createClientRecord(createClient(), input),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: clientKeys.all })
  },
})

export const updateClientMutation = mutationOptions({
  mutationFn: (input: UpdateClientInput) => updateClientRecord(createClient(), input),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: clientKeys.all })
  },
})

export const deleteClientMutation = mutationOptions({
  mutationFn: (id: string) => deleteClientRecord(createClient(), id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: clientKeys.all })
  },
})
