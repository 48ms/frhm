import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DispatchNotificationDialog } from './dispatch-notification-dialog'

const mockMutateAsync = vi.fn()
let mockTargetData: any = null
let mockIsLoading = false

vi.mock('@/features/notifications/api/queries', () => ({
  useNotificationTarget: () => ({
    data: mockTargetData,
    isLoading: mockIsLoading,
  }),
  useDispatchReviewNotification: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}))

describe('DispatchNotificationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsLoading = false
    mockTargetData = {
      deliverableId: 'del-uuid-1',
      title: 'Video Reels Promo Ramadhan',
      type: 'content',
      status: 'sent',
      client: {
        id: 'client-1',
        name: 'Pawon Sengon',
        contactPhone: '081234567890',
        telegramChatId: '987654321',
        telegramEnabled: true,
      },
      reviewUrl: 'http://localhost:3000/review/del-uuid-1',
      suggestedWhatsAppMessage: 'Halo tim *Pawon Sengon*, materi konten baru siap direview: http://localhost:3000/review/del-uuid-1',
      suggestedTelegramMessage: 'Halo tim Pawon Sengon, materi siap direview.',
    }
    mockMutateAsync.mockResolvedValue({
      deliverableId: 'del-uuid-1',
      clientName: 'Pawon Sengon',
      reviewUrl: 'http://localhost:3000/review/del-uuid-1',
      results: [
        {
          channel: 'whatsapp',
          success: true,
          status: 'ready',
          clickUrl: 'https://wa.me/6281234567890?text=test',
        },
        {
          channel: 'telegram',
          success: true,
          status: 'sent',
          messageId: 8899,
        },
      ],
    })
  })

  it('renders client name, deliverable title, and preview message when open', () => {
    render(
      <DispatchNotificationDialog
        open={true}
        onOpenChange={vi.fn()}
        deliverable={{ id: 'del-uuid-1', title: 'Video Reels Promo Ramadhan' }}
      />
    )

    expect(screen.getByText(/Kirim Notifikasi Review Klien/i)).toBeInTheDocument()
    expect(screen.getByText(/Target Klien: Pawon Sengon/i)).toBeInTheDocument()
    expect(screen.getByText('Video Reels Promo Ramadhan')).toBeInTheDocument()
    expect(screen.getAllByText(/WhatsApp/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Telegram Bot/i)).toBeInTheDocument()
    expect(screen.getByText(/081234567890/i)).toBeInTheDocument()
  })

  it('updates the live preview when custom note is entered', () => {
    render(
      <DispatchNotificationDialog
        open={true}
        onOpenChange={vi.fn()}
        deliverable={{ id: 'del-uuid-1', title: 'Video Reels Promo Ramadhan' }}
      />
    )

    const textarea = screen.getByPlaceholderText(/Contoh: Mohon tinjau scene ke-2/i)
    fireEvent.change(textarea, { target: { value: 'Deadline review jam 5 sore' } })

    expect(screen.getAllByText(/Deadline review jam 5 sore/i).length).toBeGreaterThanOrEqual(2)
  })

  it('triggers dispatch mutation when clicking "Kirim Notifikasi Sekarang"', async () => {
    render(
      <DispatchNotificationDialog
        open={true}
        onOpenChange={vi.fn()}
        deliverable={{ id: 'del-uuid-1', title: 'Video Reels Promo Ramadhan' }}
      />
    )

    const dispatchBtn = screen.getByRole('button', { name: /Kirim Notifikasi Sekarang/i })
    fireEvent.click(dispatchBtn)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          deliverableId: 'del-uuid-1',
        })
      )
    })

    // Memastikan hasil pengiriman dan tombol WhatsApp Web muncul
    await waitFor(() => {
      expect(screen.getByText(/Hasil Pengiriman Notifikasi/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Buka di WhatsApp/i })).toBeInTheDocument()
    })
  })
})
