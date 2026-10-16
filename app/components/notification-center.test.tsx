import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NotificationCenter } from './notification-center'

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))



describe('NotificationCenter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders trigger button without false badge when notifications are empty', () => {
    render(<NotificationCenter role="admin" initialCount={0} />)

    const button = screen.getByRole('button', { name: /Pusat Notifikasi/i })
    expect(button).toBeInTheDocument()

    // Tidak boleh ada badge angka 1 palsu pada trigger
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })

  it('opens popover and shows clean empty state without badge mismatch or dead gap', async () => {
    render(<NotificationCenter role="admin" initialCount={0} />)

    const trigger = screen.getByRole('button', { name: /Pusat Notifikasi/i })
    fireEvent.click(trigger)

    // Header popover
    expect(screen.getByText('Notifikasi')).toBeInTheDocument()
    // Tidak boleh ada badge "1 Baru"
    expect(screen.queryByText(/1 Baru/i)).not.toBeInTheDocument()

    // Tab filter
    expect(screen.getByText('Semua')).toBeInTheDocument()
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

    render(
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
})
