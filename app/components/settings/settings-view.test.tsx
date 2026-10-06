import { screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SettingsView } from './settings-view'
import { renderWithProviders } from '@/test/render-with-providers'

// useActiveDashboard menarik client dari Supabase. Kita beri satu client
// supaya header ter-render tanpa menyentuh jaringan.
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
  return renderWithProviders(<SettingsView />)
}

describe('SettingsView', () => {
  it('renders the page header and defaults to the Workspace tab', () => {
    renderView()
    expect(screen.getByText(/Agency Configuration & Settings/i)).toBeInTheDocument()
    expect(screen.getByText(/Agency Workspace Profile/i)).toBeInTheDocument()
  })

  it('renders all four tab buttons', () => {
    renderView()
    expect(screen.getByRole('tab', { name: /Workspace/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Billing/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Integrations/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /User Access/i })).toBeInTheDocument()
  })

  it('shows the Media Operations toggles inside the Workspace tab', () => {
    renderView()
    expect(screen.getByText(/Strict Client Approval Gate/i)).toBeInTheDocument()
    expect(screen.getByText(/AI Caption Auto-Optimization/i)).toBeInTheDocument()
    expect(screen.getByText(/High-Bandwidth 4K Video Preservation/i)).toBeInTheDocument()
  })
})
