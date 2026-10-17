import { useMutation } from '@tanstack/react-query'
import { generateHooks } from './service'
import type { GenerateHooksInput } from './types'

export const hookKeys = {
  all: ['hooks'] as const,
  byClient: (clientId: string) => [...hookKeys.all, clientId] as const,
}

export function useGenerateHooks() {
  return useMutation({
    mutationFn: (input: GenerateHooksInput) => generateHooks(input),
  })
}
