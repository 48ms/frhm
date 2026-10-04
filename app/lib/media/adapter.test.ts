import { describe, it, expect } from 'vitest'
import { mediaAdapter } from './adapter'

describe('MediaAdapter', () => {
  it('reports isConfigured() based on environment credentials', () => {
    const configured = Boolean(
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_UPLOAD_PRESET
    )
    expect(mediaAdapter.isConfigured()).toBe(configured)
  })

  it('fails closed instead of inventing a fake upload when unconfigured', async () => {
    if (mediaAdapter.isConfigured()) return // covered by the configured path in integration

    const fakeFile = new File(['dummy'], 'test.png', { type: 'image/png' })
    const res = await mediaAdapter.uploadFile(fakeFile, 'taraju/assets')

    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toMatch(/not configured/i)
    }
  })
})
