import { useMutation } from "@tanstack/react-query"
import {
  generateCaption,
  generateContentIdeas,
  generateVideoScript,
  repurposeCrossPlatform,
  generateBatchPlan,
  generateHooks,
  generateCarousel,
  validatePlatformPost,
  generateVisualPrompt,
  evaluateTrend,
} from "./service"
import type {
  GenerateCaptionInput,
  GenerateIdeasInput,
  GenerateVideoScriptInput,
  RepurposeCrossPlatformInput,
  GenerateBatchPlanInput,
  GenerateHooksInput,
  GenerateCarouselInput,
  ValidatePostInput,
  GenerateVisualPromptInput,
  EvaluateTrendInput,
} from "./types"

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

export function useGenerateHooks() {
  return useMutation({
    mutationFn: (input: GenerateHooksInput) => generateHooks(input),
  })
}

export function useGenerateCarousel() {
  return useMutation({
    mutationFn: (input: GenerateCarouselInput) => generateCarousel(input),
  })
}

export function useValidatePlatformPost() {
  return useMutation({
    mutationFn: (input: ValidatePostInput) => validatePlatformPost(input),
  })
}

export function useGenerateVisualPrompt() {
  return useMutation({
    mutationFn: (input: GenerateVisualPromptInput) => generateVisualPrompt(input),
  })
}

export function useEvaluateTrend() {
  return useMutation({
    mutationFn: (input: EvaluateTrendInput) => evaluateTrend(input),
  })
}


