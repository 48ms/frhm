import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from './logger'

describe('logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs structured JSON when NODE_ENV is production', () => {
    const oldEnv = (process.env as Record<string, string | undefined>).NODE_ENV
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    logger.info('User created', { userId: '123', route: 'api/users' })

    expect(consoleLogSpy).toHaveBeenCalled()
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0] as string)
    expect(output.level).toBe('info')
    expect(output.msg).toBe('User created')
    expect(output.userId).toBe('123')
    expect(output.timestamp).toBeDefined()

    ;(process.env as Record<string, string | undefined>).NODE_ENV = oldEnv
  })

  it('does not log debug messages when level is info', () => {
    const oldEnv = (process.env as Record<string, string | undefined>).NODE_ENV
    const oldLevel = (process.env as Record<string, string | undefined>).LOG_LEVEL
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    delete (process.env as Record<string, string | undefined>).LOG_LEVEL
    logger.debug('hidden debug')

    expect(consoleLogSpy).not.toHaveBeenCalled()
    ;(process.env as Record<string, string | undefined>).NODE_ENV = oldEnv
    if (oldLevel) (process.env as Record<string, string | undefined>).LOG_LEVEL = oldLevel
  })
})
