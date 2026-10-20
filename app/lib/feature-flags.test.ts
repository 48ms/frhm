import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const maybeSingle = vi.fn()
const eq = vi.fn(() => ({ maybeSingle }))
const select = vi.fn(() => ({ eq }))
const from = vi.fn(() => ({ select }))
const createSupabaseServiceClient = vi.fn(() => ({ from }))

vi.mock('@/lib/supabase/service', () => ({ createSupabaseServiceClient }))

/**
 * The flag cache lives at module scope, so every case re-imports a fresh copy.
 */
async function load() {
  vi.resetModules()
  return import('./feature-flags')
}

describe('isFeatureEnabled', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warn.mockRestore()
  })

  it('returns the seeded value when the row exists', async () => {
    maybeSingle.mockResolvedValue({ data: { enabled: true }, error: null })
    const { isFeatureEnabled } = await load()

    await expect(isFeatureEnabled('auto_publish_enabled')).resolves.toBe(true)
    expect(warn).not.toHaveBeenCalled()
  })

  it('reports an unseeded flag as a data problem, not a lookup failure', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    const { isFeatureEnabled } = await load()

    await expect(isFeatureEnabled('reminder_enabled')).resolves.toBe(false)
    expect(warn).toHaveBeenCalledWith(
      'Feature flag not seeded: reminder_enabled (treated as disabled)'
    )
    expect(warn).not.toHaveBeenCalledWith(
      'Feature flag lookup failed: reminder_enabled',
      expect.anything()
    )
  })

  it('reports a database error with the error object attached', async () => {
    const error = { code: 'PGRST303', message: 'JWT issued at future' }
    maybeSingle.mockResolvedValue({ data: null, error })
    const { isFeatureEnabled } = await load()

    await expect(isFeatureEnabled('auto_publish_enabled')).resolves.toBe(false)
    expect(warn).toHaveBeenCalledWith('Feature flag lookup failed: auto_publish_enabled', {
      error,
    })
  })

  it('caches a resolved value for the next call', async () => {
    maybeSingle.mockResolvedValue({ data: { enabled: true }, error: null })
    const { isFeatureEnabled } = await load()

    await isFeatureEnabled('audit_logging')
    await isFeatureEnabled('audit_logging')

    expect(maybeSingle).toHaveBeenCalledTimes(1)
  })
})
