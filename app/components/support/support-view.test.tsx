import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { SupportView } from './support-view'

function renderView() {
  return render(
    <NuqsAdapter>
      <SupportView />
    </NuqsAdapter>
  )
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
