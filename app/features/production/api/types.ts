export type ProductionStage =
  | 'idea'
  | 'script'
  | 'shooting'
  | 'editing'
  | 'design'
  | 'caption'
  | 'review'
  | 'ready'

export type ProductionPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface ContentProduction {
  id: string
  client_id: string
  title: string
  platform: string
  stage: ProductionStage
  priority: ProductionPriority
  assignee: string | null
  due_date: string | null
  assets: { name: string; url: string }[]
  notes: string | null
  created_at: string
}
