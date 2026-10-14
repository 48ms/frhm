import { z } from "zod"

export const ProviderKindSchema = z.enum(["gemini", "anthropic", "openai", "custom"])
export type ProviderKind = z.infer<typeof ProviderKindSchema>

export const AiProviderSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(2, "Label provider minimal 2 karakter"),
  kind: ProviderKindSchema,
  model: z.string().min(2, "Model minimal 2 karakter"),
  base_url: z.string().url("Format URL tidak valid").nullable().optional(),
  api_key: z.string().nullable().optional(),
  is_default: z.boolean().default(false),
  created_at: z.string(),
})

export type AiProvider = z.infer<typeof AiProviderSchema>

export type AiProviderMasked = Omit<AiProvider, "api_key"> & {
  has_key: boolean
  masked_key: string
}

export const CreateAiProviderSchema = z.object({
  label: z.string().min(2, "Label provider minimal 2 karakter"),
  kind: ProviderKindSchema,
  model: z.string().min(2, "Model minimal 2 karakter"),
  base_url: z.string().url("Format URL tidak valid").nullable().optional().or(z.literal("")),
  api_key: z.string().min(4, "API Key minimal 4 karakter").optional().or(z.literal("")),
  is_default: z.boolean().default(false),
})

export type CreateAiProviderInput = z.infer<typeof CreateAiProviderSchema>

export const UpdateAiProviderSchema = CreateAiProviderSchema.partial()
export type UpdateAiProviderInput = z.infer<typeof UpdateAiProviderSchema>
