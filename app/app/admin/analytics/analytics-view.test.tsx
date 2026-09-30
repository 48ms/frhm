import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { AnalyticsView } from './analytics-view'
import { useAppStore } from '@/lib/store/app-store'

function renderWithNuqs(ui: React.ReactElement) {
  return render(<NuqsAdapter>{ui}</NuqsAdapter>)
}

describe('AnalyticsView', () => {
  beforeEach(() => {
    useAppStore.getState().reset()
  })

  it('renders the page title and headline KPI cards', () => {
    renderWithNuqs(<AnalyticsView />)
    expect(screen.getByText('Analytics & Insights')).toBeInTheDocument()
    expect(screen.getByText('Total Reach')).toBeInTheDocument()
    expect(screen.getByText('Total Engagement')).toBeInTheDocument()
    expect(screen.getByText('Web Clicks')).toBeInTheDocument()
    expect(screen.getByText('Inquiries Bisnis')).toBeInTheDocument()
  })

  it('shows the client switcher populated with the mock clients', () => {
    renderWithNuqs(<AnalyticsView />)
    const select = screen.getByLabelText('Pilih klien untuk analitik')
    expect(select).toBeInTheDocument()
    const options = screen.getAllByRole('option')
    expect(options.length).toBeGreaterThanOrEqual(3)
  })

  it('shows campaign section for the active client', () => {
    renderWithNuqs(<AnalyticsView />)
    expect(screen.getByText('Performa per Campaign')).toBeInTheDocument()
    // All mock campaigns are deterministic, so any non-zero reach should appear
    expect(screen.getByText(/Total Reach/i)).toBeInTheDocument()
  })
})
