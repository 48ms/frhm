import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ComposerClient } from './composer-client'

// ---------------------------------------------------------------------------
// Mocks 
// ---------------------------------------------------------------------------

const createPostMock = vi.fn()
const pushMock = vi.fn()
const activeDashboardMock = vi.fn()
const generateCaptionMock = vi.fn()

const CLIENT_ID = 'client-11111111-1111-1111-1111-111111111111'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/components/dashboard-stitch/dashboard-data', () => ({
  useActiveDashboard: () => activeDashboardMock(),
}))

vi.mock('@/features/scheduled-posts/api/queries', () => ({
  useCreateScheduledPost: () => ({ mutateAsync: (...args: unknown[]) => createPostMock(...args) }),
}))

vi.mock('@/features/copilot/api/queries', () => ({
  useGenerateCaption: () => ({ mutate: (...args: unknown[]) => generateCaptionMock(...args), isPending: false }),
  useGenerateVideoScript: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRepurposeCrossPlatform: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/lib/auth/use-current-user', () => ({
  useCurrentUser: () => ({
    user: { email: 'dheia.buleud@gmail.com' },
    loading: false,
    authorName: 'Dheia Buleud',
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('motion/react', () => ({
  motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div>, path: 'path' },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const DEFAULT_DASHBOARD = {
  clientId: CLIENT_ID,
  client: {
    id: CLIENT_ID,
    name: 'Taraju',
    contact_email: null,
    contact_phone: null,
    brand_profile: null,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
    channels: [
      { id: 'ch-ig', platform: 'instagram', handle: '@taraju', status: 'terhubung', avatar_url: null },
      { id: 'ch-x', platform: 'twitter', handle: '@taraju_id', status: 'terhubung', avatar_url: null },
      { id: 'ch-tt', platform: 'tiktok', handle: '@taraju.tiktok', status: 'draft', avatar_url: null },
    ],
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  createPostMock.mockResolvedValue({ id: 'post-1' })
  activeDashboardMock.mockReturnValue(DEFAULT_DASHBOARD)
  generateCaptionMock.mockImplementation((_input: unknown, opts?: { onSuccess?: (d: unknown) => void }) => {
    opts?.onSuccess?.({ caption: 'Caption hasil copilot' })
  })
})

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

function futureDateTime() {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  // Build the date from LOCAL components, matching how the component reads
  // the two inputs back (`new Date(`${date}T${time}:00`)`). Using
  // toISOString() here would emit the UTC date and desync the two fields
  // in any non-UTC timezone (e.g. WIB, UTC+7), failing the "2 minutes ahead"
  // guard.
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  return { date, time }
}

function localDateTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

describe('ComposerClient', () => {
  it('shows connect-accounts CTA when no channel is connected', async () => {
    activeDashboardMock.mockReturnValue({
      clientId: CLIENT_ID,
      client: { id: CLIENT_ID, name: 'Taraju', channels: [] },
    })
    
    renderWithProviders(<ComposerClient />)
    
    await waitFor(() => {
      expect(screen.getByText(/Akun Belum Terhubung/i)).toBeInTheDocument()
    })
  })

  it('creates one scheduled post per selected platform using the real author identity', async () => {
    renderWithProviders(<ComposerClient />)

    // Step 1: title + content
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('e.g. Campaign Natal 2026'), {
        target: { value: 'Campaign Natal 2026' },
      })
      fireEvent.change(screen.getByPlaceholderText('Tulis pesan brilian Anda di sini, atau gunakan AI Copilot...'), {
        target: { value: 'Caption promo akhir tahun' },
      })
    })

    // Step 2: select platforms
    await act(async () => {
      fireEvent.click(screen.getByText('Selanjutnya'))
    })
    
    await waitFor(() => {
      expect(screen.getByText('@taraju')).toBeInTheDocument()
    })
    
    await act(async () => {
      fireEvent.click(screen.getByText('@taraju'))
      fireEvent.click(screen.getByText('@taraju_id'))
    })

    // Step 3: schedule
    await act(async () => {
      fireEvent.click(screen.getByText('Selanjutnya'))
    })
    
    const { date, time } = futureDateTime()
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Tanggal Tayang'), { target: { value: date } })
      fireEvent.change(screen.getByLabelText('Waktu Tayang'), { target: { value: time } })
    })

    // Step 4: publish
    await act(async () => {
      fireEvent.click(screen.getByText('Selanjutnya'))
    })
    
    await waitFor(() => {
      expect(screen.getByText('Siap Meluncur!')).toBeInTheDocument()
    })
    
    await act(async () => {
      fireEvent.click(screen.getByText('Jadwalkan & Publish Otomatis'))
    })

    await waitFor(() => {
      expect(createPostMock).toHaveBeenCalledTimes(2)
    })

    const args = createPostMock.mock.calls.map((c) => c[0])
    expect(args.every((a) => a.author === 'Dheia Buleud')).toBe(true)
    expect(args.map((a) => a.platform).sort()).toEqual(['instagram', 'twitter'])
    expect(args.every((a) => a.client_id === CLIENT_ID)).toBe(true)
    expect(args.every((a) => a.status === 'scheduled')).toBe(true)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(`/admin/calendar?clientId=${CLIENT_ID}`)
    })
  })

  it('blocks scheduling when required fields are missing', async () => {
    renderWithProviders(<ComposerClient />)

    // Skip to step 4 without filling anything
    await act(async () => {
      fireEvent.click(screen.getByText('Selanjutnya'))
      fireEvent.click(screen.getByText('Selanjutnya'))
      fireEvent.click(screen.getByText('Selanjutnya'))
    })
    
    await act(async () => {
      fireEvent.click(screen.getByText('Jadwalkan & Publish Otomatis'))
    })

    await waitFor(() => {
      expect(createPostMock).not.toHaveBeenCalled()
    })
  })

  it('blocks scheduling closer than 2 minutes from now', async () => {
    renderWithProviders(<ComposerClient />)

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('e.g. Campaign Natal 2026'), {
        target: { value: 'Campaign Natal 2026' },
      })
      fireEvent.change(screen.getByPlaceholderText('Tulis pesan brilian Anda di sini, atau gunakan AI Copilot...'), {
        target: { value: 'Caption promo' },
      })
      fireEvent.click(screen.getByText('Selanjutnya'))
    })
    
    // Select platform
    await waitFor(() => {
      expect(screen.getByText('@taraju')).toBeInTheDocument()
    })
    
    await act(async () => {
      fireEvent.click(screen.getByText('@taraju'))
      fireEvent.click(screen.getByText('Selanjutnya'))
    })
    
    const now = new Date()
    const { date: nowDate, time: nowTime } = localDateTime(now)
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Tanggal Tayang'), {
        target: { value: nowDate },
      })
      fireEvent.change(screen.getByLabelText('Waktu Tayang'), {
        target: { value: nowTime },
      })
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Selanjutnya'))
    })
    await waitFor(() => {
      expect(screen.getByText('Siap Meluncur!')).toBeInTheDocument()
    })
    await act(async () => {
      fireEvent.click(screen.getByText('Jadwalkan & Publish Otomatis'))
    })

    await waitFor(() => {
      expect(createPostMock).not.toHaveBeenCalled()
    })
  })

  it('only lists channels with status "terhubung" as publish destinations', async () => {
    renderWithProviders(<ComposerClient />)

    await act(async () => {
      fireEvent.click(screen.getByText('Selanjutnya'))
    })
    
    await waitFor(() => {
      expect(screen.getByText('@taraju')).toBeInTheDocument()
      expect(screen.getByText('@taraju_id')).toBeInTheDocument()
    })
    
    // TikTok is "draft" and must not appear as a destination.
    expect(screen.queryByText('@taraju.tiktok')).not.toBeInTheDocument()
  })

  it('generates the Copilot caption for the FIRST connected channel, not a hardcoded platform', async () => {
    // The regression this guards: handleGenerateCopilot used to send
    // `platforms[0] || "Instagram"`. On step 1 `platforms` is always empty
    // (platforms are picked on step 2), so every caption was authored for
    // Instagram no matter where it would be published. Here the client's first
    // connected channel is Twitter, so the caption must be generated for
    // Twitter — proving the platform now derives from real channel data.
    activeDashboardMock.mockReturnValue({
      clientId: CLIENT_ID,
      client: {
        id: CLIENT_ID,
        name: 'Taraju',
        channels: [
          { id: 'ch-x', platform: 'twitter', handle: '@taraju_id', status: 'terhubung', avatar_url: null },
          { id: 'ch-ig', platform: 'instagram', handle: '@taraju', status: 'terhubung', avatar_url: null },
        ],
      },
    })

    renderWithProviders(<ComposerClient />)

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('e.g. Campaign Natal 2026'), {
        target: { value: 'Thread peluncuran' },
      })
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Generate AI Copilot'))
    })

    await waitFor(() => {
      expect(generateCaptionMock).toHaveBeenCalledTimes(1)
    })

    const input = generateCaptionMock.mock.calls[0][0]
    expect(input.platform).toBe('twitter')
    expect(input.platform).not.toBe('Instagram')
    expect(input.topic).toBe('Thread peluncuran')
  })

  it('uses the platform selected in the Copilot dropdown for caption generation', async () => {
    renderWithProviders(<ComposerClient />)

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('e.g. Campaign Natal 2026'), {
        target: { value: 'Promo IG' },
      })
    })

    // Open the platform Select that sits next to the Copilot button.
    const trigger = screen.getByRole('combobox')
    await act(async () => {
      fireEvent.click(trigger)
    })

    const option = await screen.findByRole('option', { name: 'twitter' })
    await act(async () => {
      // Base UI's SelectItem only commits a real mouse click when a
      // pointerdown preceded it (it tracks allowMouseSelectionRef); a bare
      // fireEvent.click is ignored.
      fireEvent.pointerDown(option, { pointerType: 'mouse' })
      fireEvent.click(option)
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Generate AI Copilot'))
    })

    await waitFor(() => {
      expect(generateCaptionMock).toHaveBeenCalledTimes(1)
    })
    expect(generateCaptionMock.mock.calls[0][0].platform).toBe('twitter')
  })

  it('changing the Copilot platform dropdown does not drop platforms chosen in Step 2', async () => {
    // The dropdown used to call setPlatforms([val]), which overwrote the whole
    // selection. A user who picked 3 platforms and then retargeted the Copilot
    // caption would silently lose 2 destinations at publish time. The dropdown
    // now writes to a separate copilotPlatform state.
    renderWithProviders(<ComposerClient />)

    // Step 2: pick both connected channels.
    await act(async () => {
      fireEvent.click(screen.getByText('Selanjutnya'))
    })
    await waitFor(() => expect(screen.getByText('@taraju')).toBeInTheDocument())
    await act(async () => {
      fireEvent.click(screen.getByText('@taraju'))
      fireEvent.click(screen.getByText('@taraju_id'))
    })

    // Back to step 1 and retarget the Copilot dropdown.
    await act(async () => {
      fireEvent.click(screen.getByText('Kembali'))
    })

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('e.g. Campaign Natal 2026'), {
        target: { value: 'Promo' },
      })
    })

    const trigger = screen.getByRole('combobox')
    await act(async () => {
      fireEvent.click(trigger)
    })
    const option = await screen.findByRole('option', { name: 'twitter' })
    await act(async () => {
      fireEvent.pointerDown(option, { pointerType: 'mouse' })
      fireEvent.click(option)
    })

    // Copilot itself must use the dropdown's platform.
    await act(async () => {
      fireEvent.click(screen.getByText('Generate AI Copilot'))
    })
    await waitFor(() => expect(generateCaptionMock).toHaveBeenCalledTimes(1))
    expect(generateCaptionMock.mock.calls[0][0].platform).toBe('twitter')

    // ...and Step 2's selection must survive: advance to scheduling and publish.
    // If the dropdown had clobbered `platforms`, the publish guard would reject
    // the run (it requires platforms.length > 0) and no post would be created.
    await act(async () => {
      fireEvent.click(screen.getByText('Selanjutnya'))
      fireEvent.click(screen.getByText('Selanjutnya'))
    })
    const { date, time } = futureDateTime()
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Tanggal Tayang'), { target: { value: date } })
      fireEvent.change(screen.getByLabelText('Waktu Tayang'), { target: { value: time } })
    })
    await act(async () => {
      fireEvent.click(screen.getByText('Selanjutnya'))
    })
    await waitFor(() => expect(screen.getByText('Siap Meluncur!')).toBeInTheDocument())
    await act(async () => {
      fireEvent.click(screen.getByText('Jadwalkan & Publish Otomatis'))
    })
    await waitFor(() => expect(createPostMock).toHaveBeenCalledTimes(2))
  })
})
