import { useMutation } from "@tanstack/react-query"
import { generateCaption, generateContentIdeas, generateVideoScript, repurposeCrossPlatform, generateBatchPlan } from "./service"
import type { GenerateCaptionInput, GenerateIdeasInput, GenerateVideoScriptInput, RepurposeCrossPlatformInput, GenerateBatchPlanInput } from "./types"

export function useGenerateCaption() {
  return useMutation({
    mutationFn: (input: GenerateCaptionInput) => generateCaption(input),
  })
}

export function useGenerateContentIdeas() {
  return useMutation({
    mutationFn: (input: GenerateIdeasInput) => generateContentIdeas(input),
  })
}

export function useGenerateVideoScript() {
  return useMutation({
    mutationFn: (input: GenerateVideoScriptInput) => generateVideoScript(input),
  })
}

export function useRepurposeCrossPlatform() {
  return useMutation({
    mutationFn: (input: RepurposeCrossPlatformInput) => repurposeCrossPlatform(input),
  })
}

export function useGenerateBatchPlan() {
  return useMutation({
    mutationFn: (input: GenerateBatchPlanInput) => generateBatchPlan(input),
  })
}
