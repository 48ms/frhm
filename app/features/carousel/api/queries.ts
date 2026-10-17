import { useMutation } from '@tanstack/react-query'
import { generateCarousel } from './service'
import type { GenerateCarouselInput } from './types'

export const carouselKeys = {
  all: ['carousel'] as const,
  byClient: (clientId: string) => [...carouselKeys.all, clientId] as const,
}

export function useGenerateCarousel() {
  return useMutation({
    mutationFn: (input: GenerateCarouselInput) => generateCarousel(input),
  })
}
