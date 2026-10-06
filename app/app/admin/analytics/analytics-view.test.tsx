import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { AnalyticsView } from './analytics-view'

// Mock sumber data: clients dari DB (useActiveDashboard) & campaigns dari Supabase.
const mockClients = [
  { id: 'client-1', name: 'Shell Reps' },
  { id: 'client-2', name: 'Wizard Corp' },
  { id: 'client-3', name: 'Aura Luxury' },
]

vi.mock('@/components/dashboard-stitch/dashboard-data', () => ({
  useActiveDashboard: () => ({
    clientId: 'client-1',
    setClientId: vi.fn(),
    client: { id: 'client-1', name: 'Shell Reps' },
    profile: null,
    clients: mockClients,
  }),
}))

vi.mock('@/features/campaigns/api/queries', () => ({
  campaignQueries: {
    listByClient: (clientId: string) => ({
      queryKey: ['campaigns', 'client', clientId],
      queryFn: async () => [
        {
          id: 'camp-1',
          client_id: clientId,
          name: 'Ramadan Promo',
          type: 'promo',
          start_date: '2026-01-01',
          end_date: '2026-02-01',
          color: '#4353FF',
          notes: 'notes',
          created_at: null,
        },
      ],
    }),
  },
}))

vi.mock('@/features/scheduled-posts/api/queries', () => ({
  scheduledPostQueries: {
    listByClient: (clientId: string) => ({
      queryKey: ['scheduled_posts', 'list', clientId],
      queryFn: async () => [],
      enabled: Boolean(clientId),
    }),
  },
}))

vi.mock('@/features/analytics/api/queries', () => ({
  analyticsQueries: {
    listMetricsByClient: (clientId: string) => ({
      queryKey: ['analytics', 'metrics', clientId],
      queryFn: async () => [],
      enabled: Boolean(clientId),
    }),
    listSummariesByClient: (clientId: string) => ({
      queryKey: ['analytics', 'summaries', clientId],
      queryFn: async () => [
        {
          id: 'sum-1',
          client_id: clientId,
          campaign_tag: null,
          period_start: '2026-01-01',
          period_end: '2026-01-31',
          ai_insight: 'Reach naik stabil pada periode ini.',
          total_reach: 1200,
          total_engagement: 80,
          created_at: '2026-01-31T00:00:00Z',
        },
      ],
      enabled: Boolean(clientId),
    }),
  },
}))

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{ui}</NuqsAdapter>
    </QueryClientProvider>
  )
}

describe('AnalyticsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the factual KPI cards (Aggregate Reach, Engagement Rate, Clicks, Inquiry Rate)', () => {
    renderWithProviders(<AnalyticsView />)
    expect(screen.getByText('Aggregate Reach')).toBeInTheDocument()
    expect(screen.getByText('Engagement Rate')).toBeInTheDocument()
    expect(screen.getByText('Total Clicks')).toBeInTheDocument()
    expect(screen.getByText('Inquiry Rate')).toBeInTheDocument()
  })

  it('renders the AI contextual summary panel', () => {
    renderWithProviders(<AnalyticsView />)
    expect(screen.getByText('AI Contextual Summary')).toBeInTheDocument()
  })

  it('renders the campaign analytics section for the active client', () => {
    renderWithProviders(<AnalyticsView />)
    expect(screen.getByText('Semua Client')).toBeInTheDocument()
  })

  it('renders the factual ai_insight from analytics_summaries, not fabricated copy', async () => {
    renderWithProviders(<AnalyticsView />)
    expect(await screen.findByText('Reach naik stabil pada periode ini.')).toBeInTheDocument()
  })

  it('does not render fabricated statistics (no hardcoded 12% claim)', () => {
    renderWithProviders(<AnalyticsView />)
    expect(screen.queryByText(/12%/)).toBeNull()
    expect(screen.queryByText(/dibandingkan bulan lalu/)).toBeNull()
  })

  it('does not claim an unsourced industry benchmark', () => {
    renderWithProviders(<AnalyticsView />)
    expect(screen.queryByText(/industry benchmark/i)).toBeNull()
  })
})
