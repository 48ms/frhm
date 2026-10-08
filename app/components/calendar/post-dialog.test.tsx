import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PostDialog } from './post-dialog'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

const listAssetsMock = vi.fn()
const deletePostMock = vi.fn()

vi.mock('@/features/library/api/service', () => ({
  listAssets: (...args: unknown[]) => listAssetsMock(...args),
}))

vi.mock('@/features/scheduled-posts/api/queries', () => ({
  useCreateScheduledPost: () => ({ mutateAsync: vi.fn() }),
  useUpdateScheduledPost: () => ({ mutateAsync: vi.fn() }),
  useDeleteScheduledPost: () => ({ mutateAsync: (...args: unknown[]) => deletePostMock(...args) }),
}))

vi.mock('@/components/social-accounts/use-dialog-a11y', () => ({
  useDialogA11y: vi.fn(),
}))

beforeEach(() => {
  listAssetsMock.mockReset()
  listAssetsMock.mockResolvedValue([])
  deletePostMock.mockReset()
  deletePostMock.mockResolvedValue({ success: true })
})

describe('PostDialog', () => {
  it('renders the dialog with the create-post title when open', () => {
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
      />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Jadwalkan Postingan Baru')).toBeInTheDocument()
  })

  it('renders the edit title when an editing post is provided', () => {
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
        editingPost={{
          id: 'post-1',
          client_id: 'client-shell',
          deliverable_id: null,
          title: 'Launch teaser',
          content: 'Body copy',
          platform: 'instagram',
          scheduled_at: '2026-10-01T09:00:00.000Z',
          status: 'scheduled',
          notes: null,
          is_reserved: false,
          is_placeholder: false,
          reserved_for: null,
          reserved_until: null,
          created_at: new Date().toISOString(),
        }}
      />
    )
    expect(screen.getByText('Edit Jadwal Postingan')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Launch teaser')).toBeInTheDocument()
  })

  it('does not render dialog content when closed', () => {
    renderWithProviders(
      <PostDialog
        isOpen={false}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
      />
    )
    expect(screen.queryByText('Jadwalkan Postingan Baru')).not.toBeInTheDocument()
  })

  it('shows a media preview when initialMediaUrl is provided', () => {
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
        initialDate={new Date('2026-10-01T09:00:00.000Z')}
        initialMediaUrl="https://res.cloudinary.com/demo/image.jpg"
      />
    )
    const img = screen.getByAltText('Media terlampir') as HTMLImageElement
    expect(img.src).toBe('https://res.cloudinary.com/demo/image.jpg')
  })

  it('shows the empty-media hint when no media is attached', () => {
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
        initialDate={new Date('2026-10-01T09:00:00.000Z')}
      />
    )
    expect(screen.getByText(/Belum ada media/i)).toBeInTheDocument()
  })

  it('opens the asset picker from the media section', async () => {
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
        initialDate={new Date('2026-10-01T09:00:00.000Z')}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Pilih dari Library/i }))
    expect(await screen.findByText('Pilih Media')).toBeInTheDocument()
  })

  it('attaches the chosen asset as the media preview', async () => {
    listAssetsMock.mockResolvedValue([
      {
        id: 'a1',
        clientId: 'client-shell',
        url: 'https://res.cloudinary.com/demo/image/upload/picked.jpg',
        publicId: 'demo/picked',
        fileType: 'image',
        tags: [],
        sortOrder: 0,
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    ])
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
        initialDate={new Date('2026-10-01T09:00:00.000Z')}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Pilih dari Library/i }))
    fireEvent.click(await screen.findByAltText('demo/picked'))

    const img = await screen.findByAltText('Media terlampir')
    expect((img as HTMLImageElement).src).toBe('https://res.cloudinary.com/demo/image/upload/picked.jpg')
  })

  it('renders a video player when the picked asset is a video', async () => {
    listAssetsMock.mockResolvedValue([
      {
        id: 'v1',
        clientId: 'client-shell',
        url: 'https://res.cloudinary.com/demo/video/upload/clip.mp4',
        publicId: 'demo/clip',
        fileType: 'video',
        tags: [],
        sortOrder: 0,
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    ])
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
        initialDate={new Date('2026-10-01T09:00:00.000Z')}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Pilih dari Library/i }))
    fireEvent.click(await screen.findByAltText('demo/clip'))

    // The Dialog portal is outside `render`'s container; query the document.
    await waitFor(() => {
      const video = document.querySelector('video[src*="clip.mp4"]')
      expect(video).not.toBeNull()
    })
    expect(screen.queryByAltText('Media terlampir')).not.toBeInTheDocument()
  })

  it('shows the post\'s existing media when editing a post that has one', () => {
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
        editingPost={{
          id: 'post-1',
          client_id: 'client-shell',
          deliverable_id: null,
          title: 'Launch teaser',
          content: 'Body copy',
          platform: 'instagram',
          scheduled_at: '2026-10-01T09:00:00.000Z',
          status: 'scheduled',
          media_url: 'https://res.cloudinary.com/demo/image/upload/existing.jpg',
          notes: null,
          is_reserved: false,
          is_placeholder: false,
          reserved_for: null,
          reserved_until: null,
          created_at: new Date().toISOString(),
        }}
      />
    )
    const img = screen.getByAltText('Media terlampir') as HTMLImageElement
    expect(img.src).toBe('https://res.cloudinary.com/demo/image/upload/existing.jpg')
  })

  it('asks for confirmation before deleting instead of deleting immediately', async () => {
    // Regression: the delete button used to call the native blocking
    // window.confirm() and delete in the same click. It must now open a styled
    // AlertDialog and only delete after the user confirms.
    const onDelete = vi.fn()
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
        onDelete={onDelete}
        editingPost={{
          id: 'post-1',
          client_id: 'client-shell',
          deliverable_id: null,
          title: 'Launch teaser',
          content: 'Body copy',
          platform: 'instagram',
          scheduled_at: '2026-10-01T09:00:00.000Z',
          status: 'scheduled',
          notes: null,
          is_reserved: false,
          is_placeholder: false,
          reserved_for: null,
          reserved_until: null,
          created_at: new Date().toISOString(),
        }}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hapus' }))

    // A confirmation dialog appears; nothing deleted yet.
    expect(await screen.findByText('Hapus postingan?')).toBeInTheDocument()
    expect(deletePostMock).not.toHaveBeenCalled()

    // Confirming actually deletes.
    fireEvent.click(screen.getByRole('button', { name: /^Hapus$/i }))
    await waitFor(() => {
      expect(deletePostMock).toHaveBeenCalledWith({ id: 'post-1', clientId: 'client-shell' })
    })
  })
})
