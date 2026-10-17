import { useMutation } from '@tanstack/react-query'
import { generateVisualPrompt } from './service'
import type { GenerateVisualPromptInput } from './types'

export const visualPromptKeys = {
  all: ['visual-prompt'] as const,
  byClient: (clientId: string) => [...visualPromptKeys.all, clientId] as const,
}

export function useGenerateVisualPrompt() {
  return useMutation({
    mutationFn: (input: GenerateVisualPromptInput) => generateVisualPrompt(input),
  })
}
