import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { AdminCalendarClient } from './calendar-client'
import * as dashboardData from '@/components/dashboard-stitch/dashboard-data'
import * as postQueries from '@/features/scheduled-posts/api/queries'
import * as analyticsHooks from '@/features/analytics/api/hooks'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{ui}</NuqsAdapter>
    </QueryClientProvider>
  )
}

vi.mock('@/components/dashboard-stitch/dashboard-data', () => ({
  useActiveDashboard: vi.fn(),
}))

vi.mock('@/features/scheduled-posts/api/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/scheduled-posts/api/queries')>()
  return {
    ...actual,
    useScheduledPosts: vi.fn(),
    useUpdateScheduledPost: vi.fn(),
  }
})

vi.mock('@/features/analytics/api/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/analytics/api/hooks')>()
  return {
    ...actual,
    useLatestPrediction: vi.fn(),
  }
})

const mutateMock = vi.fn()

beforeEach(() => {
  mutateMock.mockReset()
  vi.mocked(dashboardData.useActiveDashboard).mockReturnValue({
    clientId: '123', setClientId: vi.fn(), clients: [], client: { id: '123', name: 'Test', channels: [] }
  } as unknown as ReturnType<typeof dashboardData.useActiveDashboard>)
  vi.mocked(postQueries.useScheduledPosts).mockReturnValue({
    data: [{ id: 'post-1', scheduled_at: '2026-10-10T10:00:00.000Z', status: 'scheduled', title: 'Test', platform: 'instagram' }]
  } as unknown as ReturnType<typeof postQueries.useScheduledPosts>)
  vi.mocked(postQueries.useUpdateScheduledPost).mockReturnValue({ mutate: mutateMock } as unknown as ReturnType<typeof postQueries.useUpdateScheduledPost>)
  vi.mocked(analyticsHooks.useLatestPrediction).mockReturnValue({ data: null, isPending: false } as unknown as ReturnType<typeof analyticsHooks.useLatestPrediction>)
})

describe('AdminCalendarClient P1 Regressions', () => {
  it('Reschedule shifts the release +1 day instead of opening the media editor', async () => {
    renderWithProviders(<AdminCalendarClient />)

    // The soonest scheduled post is surfaced in the "Next Release" card.
    const rescheduleBtn = screen.getByText('Reschedule (+1 day)')
    fireEvent.click(rescheduleBtn)

    // Regression: the old code pointed Reschedule at handleEditMedia, which
    // opened the post dialog. It must NOT open the editor any more.
    expect(screen.queryByText(/Edit Post/i)).not.toBeInTheDocument()

    // It must instead persist a new scheduled_at one day later, same time.
    await waitFor(() => expect(mutateMock).toHaveBeenCalledTimes(1))
    const [payload] = mutateMock.mock.calls[0]
    expect(payload.id).toBe('post-1')
    expect(payload.scheduled_at).toBe('2026-10-11T10:00:00.000Z')
  })
})
