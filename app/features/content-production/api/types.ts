export type ContentStage =
  | "idea"
  | "script"
  | "shooting"
  | "editing"
  | "design"
  | "caption"
  | "review"
  | "ready"

export type ContentPriority = "low" | "normal" | "high" | "urgent"

export type ContentProductionAsset = {
  name: string
  url: string
}

export type ContentProduction = {
  id: string
  client_id: string
  title: string
  platform: string
  stage: ContentStage
  priority: ContentPriority
  assignee: string | null
  due_date: string | null
  assets: ContentProductionAsset[]
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

export type CreateContentProductionInput = Omit<ContentProduction, "id" | "created_at" | "updated_at">
export type UpdateContentProductionInput = Partial<CreateContentProductionInput>
