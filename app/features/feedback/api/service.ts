import type { ClientFeedback, CreateFeedbackPayload } from './types'

export async function fetchClientFeedback(clientId: string): Promise<ClientFeedback[]> {
  const res = await fetch(`/api/admin/clients/${clientId}/feedback`)
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error ?? 'Gagal memuat feedback')
  }
  const data = await res.json()
  return (data.feedback ?? []) as ClientFeedback[]
}

export async function createClientFeedback(
  clientId: string,
  payload: CreateFeedbackPayload
): Promise<ClientFeedback> {
  const res = await fetch(`/api/admin/clients/${clientId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error ?? 'Gagal mengirim feedback')
  }
  const data = await res.json()
  return (data.feedback ?? data) as ClientFeedback
}
