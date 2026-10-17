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
const createPostMock = vi.fn()
const updatePostMock = vi.fn()

vi.mock('@/features/library/api/service', () => ({
  listAssets: (...args: unknown[]) => listAssetsMock(...args),
}))

vi.mock('@/features/scheduled-posts/api/queries', () => ({
  useCreateScheduledPost: () => ({ mutateAsync: (...args: unknown[]) => createPostMock(...args) }),
  useUpdateScheduledPost: () => ({ mutateAsync: (...args: unknown[]) => updatePostMock(...args) }),
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
  createPostMock.mockReset()
  createPostMock.mockResolvedValue({ success: true })
  updatePostMock.mockReset()
  updatePostMock.mockResolvedValue({ success: true })
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

  it('renders a split-pane workspace with a labelled settings panel', () => {
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
      />
    )
    // The redesigned dialog exposes the settings column as a labelled
    // landmark (aside) so the editor and the controls are distinct regions.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText('Pengaturan postingan')).toBeInTheDocument()
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
    expect(screen.getByText(/Pilih dari Media Library/i)).toBeInTheDocument()
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
    fireEvent.click(screen.getByRole('button', { name: /Pilih dari Media Library/i }))
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
    fireEvent.click(screen.getByRole('button', { name: /Pilih dari Media Library/i }))
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
    fireEvent.click(screen.getByRole('button', { name: /Pilih dari Media Library/i }))
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
    fireEvent.click(screen.getByRole('button', { name: /^Hapus Postingan$/i }))
    await waitFor(() => {
      expect(deletePostMock).toHaveBeenCalledWith({ id: 'post-1', clientId: 'client-shell' })
    })
  })

  // --- Hardening: the composer must not accept a post the publish cron will
  // reject hours later. Each test below guards one such rejected-input path.

  it('blocks submission when both caption and media are empty', async () => {
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
        initialDate={new Date('2026-10-01T09:00:00.000Z')}
      />
    )

    fireEvent.change(screen.getByLabelText(/Judul Postingan/i), {
      target: { value: 'Post tanpa isi' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Jadwalkan Postingan/i }))

    // The cron rejects "Post content and media are both empty"; the dialog
    // must refuse first and never call the create mutation.
    expect(
      await screen.findByText(/Isi caption atau lampirkan media/i)
    ).toBeInTheDocument()
    expect(createPostMock).not.toHaveBeenCalled()
  })

  it('blocks submission when the caption exceeds the platform limit', async () => {
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
        initialDate={new Date('2026-10-01T09:00:00.000Z')}
      />
    )

    fireEvent.change(screen.getByLabelText(/Judul Postingan/i), {
      target: { value: 'Caption kepanjangan' },
    })
    fireEvent.change(screen.getByLabelText(/Isi Caption/i), {
      target: { value: 'x'.repeat(2201) },
    })

    fireEvent.click(screen.getByRole('button', { name: /Jadwalkan Postingan/i }))

    // Two alerts render: the global error banner and the inline field error.
    // Match the field error by its unique recovery suffix.
    expect(
      await screen.findByText(/Publikasi akan ditolak/i)
    ).toBeInTheDocument()
    expect(createPostMock).not.toHaveBeenCalled()
  })

  it('accepts a caption exactly at the platform limit', async () => {
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
        initialDate={new Date('2026-10-01T09:00:00.000Z')}
      />
    )

    fireEvent.change(screen.getByLabelText(/Judul Postingan/i), {
      target: { value: 'Tepat di batas' },
    })
    fireEvent.change(screen.getByLabelText(/Isi Caption/i), {
      target: { value: 'x'.repeat(2200) },
    })

    fireEvent.click(screen.getByRole('button', { name: /Jadwalkan Postingan/i }))

    await waitFor(() => {
      expect(createPostMock).toHaveBeenCalledTimes(1)
    })
  })

  it('treats a whitespace-only title as empty', async () => {
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
        initialDate={new Date('2026-10-01T09:00:00.000Z')}
      />
    )

    fireEvent.change(screen.getByLabelText(/Judul Postingan/i), {
      target: { value: '   ' },
    })
    fireEvent.change(screen.getByLabelText(/Isi Caption/i), {
      target: { value: 'Caption valid' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Jadwalkan Postingan/i }))

    expect(
      await screen.findByText(/Judul, tanggal, dan waktu wajib diisi/i)
    ).toBeInTheDocument()
    expect(createPostMock).not.toHaveBeenCalled()
  })

  it('toggles between Editor and Live Preview tab seamlessly', async () => {
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
        initialDate={new Date('2026-10-01T09:00:00.000Z')}
        initialTitle="Test Post Preview"
        initialContent="Draft copy for live preview"
      />
    )

    // Initially in Editor view
    expect(screen.getByRole('button', { name: /Live Preview/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Isi Caption/i)).toBeInTheDocument()

    // Switch to Live Preview
    fireEvent.click(screen.getByRole('button', { name: /Live Preview/i }))
    expect(await screen.findByText(/Simulasi Feed INSTAGRAM/i)).toBeInTheDocument()

    // Switch to CHECK Audit
    fireEvent.click(screen.getByRole('button', { name: /CHECK Audit/i }))
    expect(await screen.findByText(/CHECK Framework Pre-Flight Audit/i)).toBeInTheDocument()
    expect(await screen.findByText(/Collect Target Channel/i)).toBeInTheDocument()

    // Switch back to Editor
    fireEvent.click(screen.getByRole('button', { name: /Editor/i }))
    expect(await screen.findByLabelText(/Isi Caption/i)).toBeInTheDocument()
  })

  it('inserts CTA text into caption when a CTA chip is clicked', async () => {
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
        initialDate={new Date('2026-10-01T09:00:00.000Z')}
        initialTitle="Post with CTA"
        initialContent="Halo sobat digital"
      />
    )

    const ctaButton = screen.getByRole('button', { name: /📲 Link Bio/i })
    expect(ctaButton).toBeInTheDocument()
    fireEvent.click(ctaButton)

    const textarea = screen.getByLabelText(/Isi Caption/i) as HTMLTextAreaElement
    expect(textarea.value).toContain('Klik link di bio')
  })

  it('renders AI caption and hook action buttons', () => {
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
        initialDate={new Date('2026-10-01T09:00:00.000Z')}
      />
    )

    expect(screen.getByRole('button', { name: /✨ AI Caption/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /🔥 3 Hook/i })).toBeInTheDocument()
  })

  it('submits with mapped priority, status, and content to createPost', async () => {
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
        initialDate={new Date('2026-10-01T09:00:00.000Z')}
      />
    )

    fireEvent.change(screen.getByLabelText(/Judul Postingan/i), {
      target: { value: 'Post Lengkap' },
    })
    fireEvent.change(screen.getByLabelText(/Isi Caption/i), {
      target: { value: 'Isi caption lengkap' },
    })

    // Click Urgent priority
    fireEvent.click(screen.getByText('Urgent'))

    fireEvent.click(screen.getByRole('button', { name: /Jadwalkan Postingan/i }))

    await waitFor(() => {
      expect(createPostMock).toHaveBeenCalledTimes(1)
      expect(createPostMock).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: 'client-shell',
          title: 'Post Lengkap',
          content: 'Isi caption lengkap',
          priority: 'urgent',
          status: 'scheduled',
          is_reserved: false,
        })
      )
    })
  })

  it('submits reserved slot correctly with is_reserved true and draft status', async () => {
    renderWithProviders(
      <PostDialog
        isOpen={true}
        onClose={vi.fn()}
        clientId="client-shell"
        onSave={vi.fn()}
        initialDate={new Date('2026-10-01T09:00:00.000Z')}
      />
    )

    // Toggle reserved slot
    const reserveCheckbox = screen.getByLabelText(/Ini adalah slot reserve untuk kampanye/i)
    fireEvent.click(reserveCheckbox)

    // Fill Nama Kampanye
    const campaignInput = await screen.findByLabelText(/Nama Kampanye/i)
    fireEvent.change(campaignInput, { target: { value: 'Promo Q4' } })

    fireEvent.click(screen.getByRole('button', { name: /Reservasi Slot/i }))

    await waitFor(() => {
      expect(createPostMock).toHaveBeenCalledTimes(1)
      expect(createPostMock).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: 'client-shell',
          is_reserved: true,
          reserved_for: 'Promo Q4',
          status: 'draft',
        })
      )
    })
  })
})
