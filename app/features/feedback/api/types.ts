export interface ClientFeedback {
  id: string
  rating: number
  title: string
  comment: string | null
  status: 'pending' | 'acknowledged' | 'resolved'
  created_at: string
  responded_at: string | null
  resolved_at: string | null
  deliverable_id: string | null
}

export interface CreateFeedbackPayload {
  rating: number
  title: string
  comment?: string
  deliverable_id?: string
}
