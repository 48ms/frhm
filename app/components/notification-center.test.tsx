import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotificationCenter } from './notification-center'

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

let mockPendingUsersData = {
  pendingUsers: [] as Array<{
    id: string
    email: string
    fullName: string
    avatarUrl?: string | null
    provider: string
    createdAt: string
    role: string | null
    clientId: string | null
  }>,
  count: 0,
  clients: [] as Array<{ id: string; name: string }>,
}

vi.mock('@/features/pending-users/api/queries', () => ({
  usePendingUsers: vi.fn(() => ({
    data: mockPendingUsersData,
    isLoading: false,
    refetch: vi.fn(),
  })),
  useApproveUserMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}))

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('NotificationCenter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPendingUsersData = {
      pendingUsers: [],
      count: 0,
      clients: [],
    }
  })

  it('renders trigger button without false badge when notifications are empty', () => {
    renderWithClient(<NotificationCenter role="admin" initialCount={0} />)

    const button = screen.getByRole('button', { name: /Pusat Notifikasi/i })
    expect(button).toBeInTheDocument()

    // Tidak boleh ada badge angka 1 palsu pada trigger
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })

  it('opens popover and shows clean empty state without badge mismatch or dead gap', async () => {
    renderWithClient(<NotificationCenter role="admin" initialCount={0} />)

    const trigger = screen.getByRole('button', { name: /Pusat Notifikasi/i })
    fireEvent.click(trigger)

    // Header popover
    expect(screen.getByText('Notifikasi')).toBeInTheDocument()
    // Tidak boleh ada badge "1 Baru"
    expect(screen.queryByText(/1 Baru/i)).not.toBeInTheDocument()

    // Tab filter
    expect(screen.getByText('Semua (0)')).toBeInTheDocument()
    expect(screen.getByText('Belum Dibaca (0)')).toBeInTheDocument()

    // Pesan empty state
    expect(screen.getByText('Tidak ada notifikasi')).toBeInTheDocument()
    expect(screen.getByText(/Semua pembaruan sistem dan antrean telah dibaca/i)).toBeInTheDocument()
  })

  it('displays factual notifications and badge when notifications exist', () => {
    const mockNotifications = [
      {
        id: 'notif-1',
        title: 'Draft Konten Siap Review',
        description: 'Materi Reels dari klien Pawon Sengon siap direview.',
        timestamp: '10m lalu',
        read: false,
        href: '/admin/erp',
      },
    ]

    renderWithClient(
      <NotificationCenter
        role="admin"
        initialNotifications={mockNotifications}
      />
    )

    // Badge 1 pada trigger
    expect(screen.getByText('1')).toBeInTheDocument()

    const trigger = screen.getByRole('button', { name: /Pusat Notifikasi/i })
    fireEvent.click(trigger)

    // Badge 1 Baru di popover
    expect(screen.getByText('1 Baru')).toBeInTheDocument()
    expect(screen.getByText('Belum Dibaca (1)')).toBeInTheDocument()

    // Item notifikasi
    expect(screen.getByText('Draft Konten Siap Review')).toBeInTheDocument()
    expect(screen.getByText('Materi Reels dari klien Pawon Sengon siap direview.')).toBeInTheDocument()
  })

  it('displays pending user approval notification and badge when pending users exist', () => {
    mockPendingUsersData = {
      pendingUsers: [
        {
          id: 'user-bebek-123',
          email: 'bebekbek9191@gmail.com',
          fullName: 'Bima Maulana Saputra',
          provider: 'google',
          createdAt: new Date().toISOString(),
          role: null,
          clientId: null,
        },
      ],
      count: 1,
      clients: [{ id: 'client-1', name: 'Taraju' }],
    }

    renderWithClient(<NotificationCenter role="admin" />)

    // Badge must be visible on bell trigger with count 1
    expect(screen.getByText('1')).toBeInTheDocument()

    const trigger = screen.getByRole('button', { name: /Pusat Notifikasi/i })
    fireEvent.click(trigger)

    // Notification popover shows "Persetujuan Role (1)"
    expect(screen.getByText(/Persetujuan Role \(1\)/i)).toBeInTheDocument()
    expect(screen.getAllByText(/bebekbek9191@gmail\.com/i).length).toBeGreaterThan(0)

    // "Pilih Role" button is present
    const pilihRoleBtn = screen.getByRole('button', { name: /Pilih Role/i })
    expect(pilihRoleBtn).toBeInTheDocument()
  })
})
