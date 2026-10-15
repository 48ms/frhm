import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

const runAuditMock = vi.fn()

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
  useAuditPerformanceAndIterate: () => ({
    mutateAsync: (...args: unknown[]) => runAuditMock(...args),
    isPending: false,
  }),
  useSyncMultiAccountSocialData: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true, message: "Synced" }),
    mutate: vi.fn(),
    isPending: false,
  }),
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
    multiAccount: (clientId: string, period = "30d") => ({
      queryKey: ['analytics', 'multi-account', clientId, period],
      queryFn: async () => ({
        clientId,
        clientName: 'Shell Reps',
        connectedAccountsCount: 2,
        totalReach: 5000,
        totalViews: 8000,
        totalEngagement: 450,
        totalClicks: 120,
        totalInquiries: 15,
        overallEngagementRate: 9.0,
        platforms: {},
        platformList: [
          {
            platform: 'instagram',
            accountHandle: '@shell.creative',
            accountAvatar: null,
            accountStatus: 'terhubung',
            postCount: 5,
            totalReach: 4000,
            totalViews: 6000,
            totalLikes: 300,
            totalComments: 30,
            totalShares: 20,
            totalSaves: 50,
            totalClicks: 90,
            totalInquiries: 10,
            engagementRate: 10.0,
          },
          {
            platform: 'tiktok',
            accountHandle: '@b2bshell',
            accountAvatar: null,
            accountStatus: 'terhubung',
            postCount: 2,
            totalReach: 1000,
            totalViews: 2000,
            totalLikes: 40,
            totalComments: 5,
            totalShares: 3,
            totalSaves: 2,
            totalClicks: 30,
            totalInquiries: 5,
            engagementRate: 5.0,
          },
        ],
        instagramInsights: {
          reelsCount: 3,
          carouselCount: 1,
          staticCount: 1,
          totalReach: 4000,
          avgSaves: 10,
          dmInquiries: 4,
          avgEngagementRate: 10.0,
          topPostTitle: 'Top Reel Post',
        },
        tiktokInsights: {
          videoCount: 2,
          totalViews: 2000,
          avgShares: 2,
          viralPotentialScore: 65,
          waInquiries: 3,
          avgEngagementRate: 5.0,
          topPostTitle: 'Top TikTok Video',
        },
        lastSyncedAt: '2026-10-15T00:00:00Z',
      }),
      enabled: Boolean(clientId),
    }),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
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

  it('renders the factual KPI cards (Aggregate Reach, Engagement Rate, Clicks, Inquiry Rate)', async () => {
    renderWithProviders(<AnalyticsView />)
    await waitFor(() => {
      expect(screen.getByText('Aggregate Reach')).toBeInTheDocument()
      expect(screen.getByText('Engagement Rate')).toBeInTheDocument()
      expect(screen.getByText('Total Clicks')).toBeInTheDocument()
      expect(screen.getByText('Inquiry Rate')).toBeInTheDocument()
    })
  })

  it('renders the AI contextual summary panel', async () => {
    renderWithProviders(<AnalyticsView />)
    await waitFor(() => {
      expect(screen.getByText(/AI Contextual Summary/i)).toBeInTheDocument()
    })
  })

  it('renders the campaign analytics section for the active client', async () => {
    renderWithProviders(<AnalyticsView />)
    await waitFor(() => {
      expect(screen.getByText('Semua Client')).toBeInTheDocument()
    })
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

  it('runs METER Performance Audit and renders signal score, winners, and next actions', async () => {
    runAuditMock.mockResolvedValueOnce({
      report: {
        overallHealth: 'STABLE',
        signalScore: 82,
        summary: 'Kinerja metrik signal menunjukkan retensi kuat.',
        signalAnalysis: {
          reachSignal: 'Reach bagus',
          engagementSignal: 'ER kuat',
          conversionSignal: 'Inquiry tinggi',
        },
        winners: [{ title: 'Konten Edukasi Resep', reason: 'Saves tertinggi' }],
        underperformers: [{ title: 'Konten Promo Diskon', rootCause: 'Hook lemah', fixAngle: 'Ganti POV' }],
        actionableIterations: [
          {
            action: 'Buat Carousel 5 Slide',
            targetPlatform: 'instagram',
            priority: 'HIGH',
            recommendedPrompt: '5 Tips Dapur',
          },
        ],
      },
    })

    renderWithProviders(<AnalyticsView />)

    const auditBtn = await screen.findByRole('button', { name: /Audit METER/i })
    fireEvent.click(auditBtn)

    await waitFor(() => {
      expect(runAuditMock).toHaveBeenCalledWith({ clientId: 'client-1', period: '30d' })
    })

    expect(await screen.findByText(/Status: STABLE/i)).toBeInTheDocument()
    expect(screen.getByText(/Signal Score: 82\/100/i)).toBeInTheDocument()
    expect(screen.getByText('Konten Edukasi Resep')).toBeInTheDocument()
    expect(screen.getByText('Buat Carousel 5 Slide')).toBeInTheDocument()
  })
})
