import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AssetPicker } from './asset-picker'
import type { Asset } from '@/features/library/api/types'

const listAssetsMock = vi.fn()

vi.mock('@/features/library/api/service', () => ({
  listAssets: (...args: unknown[]) => listAssetsMock(...args),
}))

function makeAsset(id: string, over: Partial<Asset> = {}): Asset {
  return {
    id,
    clientId: 'client-shell',
    url: `https://res.cloudinary.com/demo/image/upload/${id}.jpg`,
    publicId: `demo/${id}`,
    fileType: 'image',
    tags: [],
    sortOrder: 0,
    createdAt: '2026-10-01T00:00:00.000Z',
    ...over,
  }
}

describe('AssetPicker', () => {
  beforeEach(() => {
    listAssetsMock.mockReset()
    listAssetsMock.mockResolvedValue([])
  })

  it('does not fetch or render content while closed', () => {
    render(
      <AssetPicker clientId="client-shell" open={false} onOpenChange={vi.fn()} onSelect={vi.fn()} />
    )
    expect(listAssetsMock).not.toHaveBeenCalled()
    expect(screen.queryByText('Pilih Media')).not.toBeInTheDocument()
  })

  it('lists the assets the server returns for the client', async () => {
    listAssetsMock.mockResolvedValue([makeAsset('a1'), makeAsset('a2')])
    render(
      <AssetPicker clientId="client-shell" open={true} onOpenChange={vi.fn()} onSelect={vi.fn()} />
    )

    await waitFor(() => expect(listAssetsMock).toHaveBeenCalledWith({ clientId: 'client-shell', fileType: undefined }))
    expect(await screen.findByAltText('demo/a1')).toBeInTheDocument()
    expect(screen.getByAltText('demo/a2')).toBeInTheDocument()
  })

  it('calls onSelect with the clicked asset', async () => {
    const onSelect = vi.fn()
    listAssetsMock.mockResolvedValue([makeAsset('a1')])
    render(
      <AssetPicker clientId="client-shell" open={true} onOpenChange={vi.fn()} onSelect={onSelect} />
    )

    const tile = await screen.findByAltText('demo/a1')
    fireEvent.click(tile)
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls[0][0]).toMatchObject({ id: 'a1' })
  })

  it('shows the empty state when the library has no assets', async () => {
    listAssetsMock.mockResolvedValue([])
    render(
      <AssetPicker clientId="client-shell" open={true} onOpenChange={vi.fn()} onSelect={vi.fn()} />
    )
    expect(await screen.findByText(/Belum ada aset/i)).toBeInTheDocument()
  })

  it('shows an error state (not fake data) when loading fails', async () => {
    listAssetsMock.mockRejectedValue(new Error('Forbidden: caller cannot access this client'))
    render(
      <AssetPicker clientId="client-shell" open={true} onOpenChange={vi.fn()} onSelect={vi.fn()} />
    )
    expect(await screen.findByText(/Forbidden/i)).toBeInTheDocument()
    expect(screen.queryByText(/Belum ada aset/i)).not.toBeInTheDocument()
  })

  it('filters the grid by the search query', async () => {
    listAssetsMock.mockResolvedValue([
      makeAsset('sunset', { tags: ['beach'] }),
      makeAsset('logo', { tags: ['brand'] }),
    ])
    render(
      <AssetPicker clientId="client-shell" open={true} onOpenChange={vi.fn()} onSelect={vi.fn()} />
    )

    await screen.findByAltText('demo/sunset')
    fireEvent.change(screen.getByPlaceholderText(/Cari/i), { target: { value: 'brand' } })

    expect(screen.queryByAltText('demo/sunset')).not.toBeInTheDocument()
    expect(screen.getByAltText('demo/logo')).toBeInTheDocument()
  })
})
