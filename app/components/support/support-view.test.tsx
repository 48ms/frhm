import { screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SupportView } from './support-view'
import { renderWithProviders } from '@/test/render-with-providers'

// useActiveDashboard menarik client dari Supabase. Kita beri satu client
// supaya header & form ter-render tanpa menyentuh jaringan.
vi.mock('@/components/dashboard-stitch/dashboard-data', () => ({
  useActiveDashboard: () => ({
    clientId: 'client-shell',
    setClientId: vi.fn(),
    client: { id: 'client-shell', name: 'Shell Reps', channels: [] },
    clients: [{ id: 'client-shell', name: 'Shell Reps', channels: [] }],
    profile: null,
  }),
}))

function renderView() {
  return renderWithProviders(<SupportView />)
}

describe('SupportView', () => {
  it('renders the page header and quick-help channels', () => {
    renderView()
    expect(screen.getAllByText(/Support Center/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Email Support/i)).toBeInTheDocument()
    expect(screen.getByText(/Priority Live Chat/i)).toBeInTheDocument()
    expect(screen.getByText(/Knowledge Base/i)).toBeInTheDocument()
  })

  it('renders the FAQ list and the contact form', () => {
    renderView()
    expect(screen.getByText(/Frequently Asked Questions/i)).toBeInTheDocument()
    expect(screen.getByText(/Submit a Request/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument()
  })

  it('renders the recent tickets table', () => {
    renderView()
    expect(screen.getByText(/Your Recent Tickets/i)).toBeInTheDocument()
    expect(screen.getByText('SUP-4821')).toBeInTheDocument()
    expect(screen.getByText(/Instagram Reels publish failing/i)).toBeInTheDocument()
  })
})
