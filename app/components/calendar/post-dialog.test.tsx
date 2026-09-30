import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PostDialog } from './post-dialog'

vi.mock('@/components/social-accounts/use-dialog-a11y', () => ({
  useDialogA11y: vi.fn(),
}))

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
})
