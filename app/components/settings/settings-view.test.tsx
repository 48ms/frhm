import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { SettingsView } from './settings-view'

function renderView() {
  return render(
    <NuqsAdapter>
      <SettingsView />
    </NuqsAdapter>
  )
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
