import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserApprovalDialog } from './user-approval-dialog'

const mockPendingUser = {
  id: 'user-bebek-123',
  email: 'bebekbek9191@gmail.com',
  fullName: 'Bima Maulana Saputra',
  provider: 'google',
  createdAt: new Date().toISOString(),
  role: null,
  clientId: null,
}

const mockClients = [
  { id: 'client-taraju-1', name: 'Taraju' },
  { id: 'client-pawon-2', name: 'Pawon Sengon' },
]

const mockMutateAsync = vi.fn()
const mockRefetch = vi.fn()

vi.mock('@/features/pending-users/api/queries', () => ({
  usePendingUsers: vi.fn(() => ({
    data: {
      pendingUsers: [mockPendingUser],
      count: 1,
      clients: mockClients,
    },
    isLoading: false,
    refetch: mockRefetch,
  })),
  useApproveUserMutation: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}))

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('UserApprovalDialog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders pending user details when opened', () => {
    renderWithClient(
      <UserApprovalDialog open={true} onOpenChange={vi.fn()} />
    )

    expect(screen.getByText('Persetujuan Akses & Role Pengguna')).toBeInTheDocument()
    expect(screen.getByText('bebekbek9191@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('Bima Maulana Saputra')).toBeInTheDocument()
    expect(screen.getByText(/Google Login/i)).toBeInTheDocument()
  })

  it('allows switching role to Admin Agensi and submitting', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      ok: true,
      message: 'Akun berhasil disetujui sebagai Admin Agensi',
    })

    const onOpenChange = vi.fn()
    renderWithClient(
      <UserApprovalDialog open={true} onOpenChange={onOpenChange} />
    )

    // Click on Admin Agensi role card
    const adminRoleCard = screen.getByText('Admin Agensi')
    fireEvent.click(adminRoleCard)

    // Click submit button
    const submitBtn = screen.getByRole('button', { name: /Setujui & Aktifkan Role/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        userId: 'user-bebek-123',
        role: 'admin',
        clientId: null,
      })
    })
  })

  it('allows approving as Klien Partner with brand assignment', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      ok: true,
      message: 'Akun berhasil disetujui sebagai Klien Partner',
    })

    const onOpenChange = vi.fn()
    renderWithClient(
      <UserApprovalDialog open={true} onOpenChange={onOpenChange} />
    )

    // Click on Klien Partner card
    const clientRoleCard = screen.getByText('Klien Partner')
    fireEvent.click(clientRoleCard)

    // Brand selector should be visible
    expect(screen.getByText(/Pilih Brand Klien \(Workspace\)/i)).toBeInTheDocument()

    // Click submit button
    const submitBtn = screen.getByRole('button', { name: /Setujui & Aktifkan Role/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        userId: 'user-bebek-123',
        role: 'client',
        clientId: 'client-taraju-1',
      })
    })
  })
})
