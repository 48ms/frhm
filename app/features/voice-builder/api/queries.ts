import { useMutation, useQueryClient } from '@tanstack/react-query'
import { extractVoiceGuide, saveVoiceGuide } from './service'
import type { ExtractVoiceInput, SaveVoiceGuideInput } from './types'
import { brandFilesKeys } from '@/features/brand-files/api/queries'

export const voiceBuilderKeys = {
  all: ['voice-builder'] as const,
  detail: (clientId: string) => [...voiceBuilderKeys.all, clientId] as const,
}

export function useExtractVoice() {
  return useMutation({
    mutationFn: (input: ExtractVoiceInput) => extractVoiceGuide(input),
  })
}

export function useSaveVoiceGuide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveVoiceGuideInput) => saveVoiceGuide(input),
    onSuccess: (_, variables) => {
      // Invalidate brand files query agar Brand Brain dan AI Studio langsung refresh
      queryClient.invalidateQueries({ queryKey: brandFilesKeys.list(variables.clientId) })
      queryClient.invalidateQueries({ queryKey: voiceBuilderKeys.detail(variables.clientId) })
    },
  })
}
