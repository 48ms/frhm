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
