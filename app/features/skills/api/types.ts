import { z } from "zod"

export interface Skill {
  id: string
  name: string
  description: string | null
  category: string
  job: string | null
  allowed_tools: string | null
  created_at?: string
}

export interface SkillFile {
  skill_id: string
  path: string
  content: string
}

export interface SkillPack {
  id: string
  name: string
  description: string | null
  category: string | null
  sort_order: number
  skill_count?: number
  skills?: Skill[]
}

export type ClientSkillStatus = "belum" | "jalan" | "selesai"

export interface ClientSkill {
  id: string
  client_id: string
  skill_id: string
  status: ClientSkillStatus
  notes: string | null
  created_at: string
  updated_at: string
  skill?: Skill
}

export interface SkillOutput {
  id: string
  client_id: string
  skill_id: string
  stage?: string | null
  title: string
  content: string
  status: string
  deliverable_id?: string | null
  production_id?: string | null
  created_at: string
  updated_at: string
}

export interface SkillChatTurn {
  role: "user" | "assistant" | "system"
  content: string
}

export interface SkillChatResponse {
  reply: string
  done: boolean
  preview?: { title: string; content: string } | null
  output?: { title: string; content: string } | null
  file?: { path: string; content: string } | null
  error?: string
}

export interface SkillFilters {
  category?: string
  search?: string
  packId?: string
}

export const SaveSkillOutputSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  skillId: z.string().min(1, "Skill ID required"),
  title: z.string().min(1, "Title required"),
  content: z.string().min(1, "Content required"),
  status: z.string().optional(),
  stage: z.string().optional(),
})

export type SaveSkillOutputInput = z.infer<typeof SaveSkillOutputSchema>

export const ExecuteGenericSkillSchema = z.object({
  clientId: z.string().min(1, "Client ID required"),
  skillId: z.string().min(1, "Skill ID required"),
  prompt: z.string().default(""),
  parameters: z.record(z.string(), z.any()).optional(),
  autoSave: z.boolean().optional(),
})

export type ExecuteGenericSkillInput = z.infer<typeof ExecuteGenericSkillSchema>

export interface GenericSkillRunResult {
  success: boolean
  title: string
  content: string
  summary?: string
  outputId?: string | null
  error?: string
  tokensUsed?: {
    promptTokens: number
    completionTokens: number
  }
}

