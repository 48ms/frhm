export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed"
export type SupportTicketPriority = "Low" | "Normal" | "High" | "Urgent"

export type SupportTicket = {
  id: string
  client_id: string | null
  created_by: string | null
  subject: string
  message: string
  priority: SupportTicketPriority
  status: SupportTicketStatus
  admin_reply: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export type CreateSupportTicketInput = {
  clientId: string
  subject: string
  message: string
  priority: SupportTicketPriority
}
