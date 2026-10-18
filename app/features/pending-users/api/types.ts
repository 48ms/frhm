import { z } from 'zod'

export interface PendingUser {
  id: string
  email: string
  fullName: string
  avatarUrl?: string | null
  provider: string
  createdAt: string
  lastSignInAt?: string | null
  role: string | null
  clientId: string | null
}

export interface ClientOption {
  id: string
  name: string
}

export interface PendingUsersResponse {
  pendingUsers: PendingUser[]
  count: number
  clients: ClientOption[]
}

export const approveUserSchema = z.object({
  userId: z.string().uuid('User ID harus berupa UUID valid'),
  role: z.enum(['admin', 'client']),
  clientId: z.string().uuid('Client ID harus berupa UUID valid').optional().nullable(),
})

export type ApproveUserInput = z.infer<typeof approveUserSchema>

export interface ApproveUserResponse {
  ok: boolean
  message: string
}
