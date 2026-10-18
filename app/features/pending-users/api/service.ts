import type { PendingUsersResponse, ApproveUserInput, ApproveUserResponse } from './types'

export async function fetchPendingUsers(): Promise<PendingUsersResponse> {
  const res = await fetch('/api/admin/pending-users', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Gagal memuat antrean persetujuan pengguna')
  }

  return res.json()
}

export async function approvePendingUser(input: ApproveUserInput): Promise<ApproveUserResponse> {
  const res = await fetch('/api/admin/pending-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || 'Gagal menyetujui akun pengguna')
  }

  return data
}
