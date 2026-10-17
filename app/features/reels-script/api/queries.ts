import { useMutation } from '@tanstack/react-query'
import { generateReelsScript } from './service'
import type { GenerateReelsScriptInput } from './types'

export const reelsScriptKeys = {
  all: ['reels-script'] as const,
  byClient: (clientId: string) => [...reelsScriptKeys.all, clientId] as const,
}

export function useGenerateReelsScript() {
  return useMutation({
    mutationFn: (input: GenerateReelsScriptInput) => generateReelsScript(input),
  })
}
