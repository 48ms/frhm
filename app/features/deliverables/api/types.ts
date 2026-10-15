export type DeliverableStatus = "draft" | "sent" | "approved" | "revision_requested"
export type DeliverableType = "brief" | "content" | "report"

export type Deliverable = {
  id: string
  client_id: string
  type: DeliverableType
  title: string
  content_md: string | null
  external_link: string | null
  status: DeliverableStatus
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  sent_at: string | null
  approved_at: string | null
}

export interface DeliverableComment {
  id: string
  deliverable_id: string
  author_name: string
  author_role: string
  content: string
  created_at: string
}

export interface DeliverableFeedback {
  id: string
  deliverable_id: string | null
  client_id: string
  rating: number
  title: string
  comment: string | null
  status: string
  created_at: string
}

export interface DeliverableDetailResponse {
  deliverable: Deliverable
  client: {
    id: string
    name: string
    brand_profile?: any
  } | null
  comments: DeliverableComment[]
  feedback: DeliverableFeedback[]
}

export type {
  PromoteSkillOutputInput,
  UpdateDeliverableStatusInput,
  SubmitDeliverableReviewInput,
} from "./schema"
