import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PostDialog } from './post-dialog'

const listAssetsMock = vi.fn()

vi.mock('@/features/library/api/service', () => ({
  listAssets: (...args: unknown[]) => listAssetsMock(...args),
}))

vi.mock('@/components/social-accounts/use-dialog-a11y', () => ({
  useDialogA11y: vi.fn(),
}))

beforeEach(() => {
  listAssetsMock.mockReset()
  listAssetsMock.mockResolvedValue([])
})

describe('PostDialog', () => {
  it('renders the dialog with the create-post title when open', () => {
    render(
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
    render(
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
        }}
      />
    )
    expect(screen.getByText('Edit Jadwal Postingan')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Launch teaser')).toBeInTheDocument()
  })

  it('does not render dialog content when closed', () => {
    render(
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
    render(
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
    render(
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
    render(
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
    render(
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
    render(
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
})
