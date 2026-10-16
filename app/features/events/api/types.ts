export type EventItem = {
  id: string
  client_id: string
  name: string
  description: string | null
  event_date: string | null
  location: string | null
  status: string | null
  created_at: string | null
  updated_at: string | null
}

export type CreateEventInput = {
  client_id: string
  name: string
  description?: string | null
  event_date?: string | null
  location?: string | null
  status?: string | null
}
