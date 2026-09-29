import type {
  PostMetric,
  Summary,
  Campaign,
  GenerateInsightPayload,
  UpdateMetricPayload,
  UpdateSummaryNotesPayload,
} from './types'

const BASE = '/api/admin/clients'

export async function fetchMetrics(clientId: string): Promise<PostMetric[]> {
  const res = await fetch(`${BASE}/${clientId}/analytics/metrics`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Gagal memuat post metrics')
  }
  const json = await res.json()
  return (json.posts ?? []) as PostMetric[]
}

export async function fetchSummaries(clientId: string): Promise<Summary[]> {
  const res = await fetch(`${BASE}/${clientId}/analytics/summaries`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Gagal memuat summaries')
  }
  const json = await res.json()
  return (json.summaries ?? []) as Summary[]
}

export async function fetchCampaigns(clientId: string): Promise<Campaign[]> {
  const res = await fetch(`${BASE}/${clientId}/campaigns`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Gagal memuat campaigns')
  }
  const json = await res.json()
  return (json.campaigns ?? []) as Campaign[]
}

export async function generateInsight(payload: GenerateInsightPayload): Promise<Summary> {
  const res = await fetch(`${BASE}/${payload.clientId}/analytics/generate-insight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
      campaignTag: payload.campaignTag,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err.error || 'Gagal generate insight'
    if (err.evaluation && !err.evaluation.passed) {
      throw { evaluation: err.evaluation, title: payload.campaignTag || 'Kampanye', msg }
    }
    throw new Error(msg)
  }
  const json = await res.json()
  return (json.summary ?? json) as Summary
}

export async function updateMetric(payload: UpdateMetricPayload): Promise<PostMetric> {
  const res = await fetch(`${BASE}/${payload.postId}/analytics/metrics/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field: payload.field, value: payload.value }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Gagal update metric')
  }
  const json = await res.json()
  return (json.post ?? json) as PostMetric
}

export async function updateSummaryNotes(payload: UpdateSummaryNotesPayload): Promise<Summary> {
  const res = await fetch(`${BASE}/${payload.id}/analytics/summaries/${payload.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ai_insight: payload.ai_insight,
      operator_notes: payload.operator_notes,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Gagal update summary')
  }
  const json = await res.json()
  return (json.summary ?? json) as Summary
}

export async function exportAnalytics(
  clientId: string,
  format: 'pdf' | 'md',
  filters: { from?: string; to?: string; campaign?: string }
): Promise<Blob> {
  const params = new URLSearchParams()
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.campaign) params.set('campaign', filters.campaign)

  const res = await fetch(`${BASE}/${clientId}/analytics/export/${format}?${params.toString()}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Gagal export')
  }
  return res.blob()
}
