import { describe, it, expect, vi, afterEach } from 'vitest'

const { notFound } = vi.hoisted(() => ({
  // Record the call instead of throwing — asserting `toHaveBeenCalled` is
  // robust; relying on next/navigation's real throw complicates the harness.
  notFound: vi.fn(),
}))

vi.mock('next/navigation', () => ({ notFound }))

import { assertPreviewAllowed } from './preview-guard'

describe('assertPreviewAllowed', () => {
  afterEach(() => {
    notFound.mockReset()
    vi.unstubAllEnvs()
  })

  it('invokes notFound() in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    assertPreviewAllowed()
    expect(notFound).toHaveBeenCalledTimes(1)
  })

  it('is a no-op in development', () => {
    vi.stubEnv('NODE_ENV', 'development')
    assertPreviewAllowed()
    expect(notFound).not.toHaveBeenCalled()
  })

  it('is a no-op in test', () => {
    vi.stubEnv('NODE_ENV', 'test')
    assertPreviewAllowed()
    expect(notFound).not.toHaveBeenCalled()
  })
})
