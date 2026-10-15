import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExportPdfDialog } from './export-pdf-dialog'

const mockBuildDeliverablePdfBlob = vi.fn()

vi.mock('@/lib/pdf/deliverable-pdf', () => ({
  buildDeliverablePdfBlob: (...args: any[]) => mockBuildDeliverablePdfBlob(...args),
}))

// Mock URL methods
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost:3000/mock-pdf-blob')
global.URL.revokeObjectURL = vi.fn()

describe('ExportPdfDialog', () => {
  const mockOnOpenChange = vi.fn()
  const defaultDeliverable = {
    id: 'del-123',
    title: 'Strategi Kampanye Q4 Taraju',
    type: 'strategy',
    status: 'approved',
    content_md: '## Pilar Utama\nFokus pada ekspansi digital dan retention.',
    created_at: '2026-10-15T00:00:00Z',
    approved_at: '2026-10-15T02:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    mockBuildDeliverablePdfBlob.mockResolvedValue(
      new Blob(['%PDF-1.4 dummy'], { type: 'application/pdf' })
    )
  })

  it('renders dialog elements correctly when open', () => {
    render(
      <ExportPdfDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        deliverable={defaultDeliverable}
        clientName="Taraju"
      />
    )

    expect(screen.getByText('Ekspor PDF Eksekutif')).toBeDefined()
    expect(screen.getByText('Strategi Kampanye Q4 Taraju')).toBeDefined()
    expect(screen.getByText(/Klien:\s*Taraju/i)).toBeDefined()
    expect(screen.getByText('Cobalt Blue')).toBeDefined()
    expect(screen.getByText('Emerald Growth')).toBeDefined()
    expect(screen.getByText('Royal Indigo')).toBeDefined()
    expect(screen.getByText('Monochrome')).toBeDefined()
  })

  it('allows switching theme color', () => {
    render(
      <ExportPdfDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        deliverable={defaultDeliverable}
        clientName="Taraju"
      />
    )

    const emeraldBtn = screen.getByText('Emerald Growth').closest('button')
    expect(emeraldBtn).toBeDefined()
    fireEvent.click(emeraldBtn!)
    expect(emeraldBtn?.className).toContain('border-primary')
  })

  it('calls buildDeliverablePdfBlob when clicking Unduh PDF', async () => {
    render(
      <ExportPdfDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        deliverable={defaultDeliverable}
        clientName="Taraju"
      />
    )

    const unduhBtn = screen.getByRole('button', { name: /Unduh PDF/i })
    fireEvent.click(unduhBtn)

    await waitFor(() => {
      expect(mockBuildDeliverablePdfBlob).toHaveBeenCalledTimes(1)
    })

    const callArgs = mockBuildDeliverablePdfBlob.mock.calls[0][0]
    expect(callArgs.title).toBe('Strategi Kampanye Q4 Taraju')
    expect(callArgs.clientName).toBe('Taraju')
    expect(callArgs.themeColor).toBe('cobalt')
  })

  it('closes modal when Batal is clicked', () => {
    render(
      <ExportPdfDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        deliverable={defaultDeliverable}
        clientName="Taraju"
      />
    )

    const batalBtn = screen.getByRole('button', { name: /Batal/i })
    fireEvent.click(batalBtn)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
