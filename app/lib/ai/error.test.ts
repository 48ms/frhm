import { describe, expect, it } from 'vitest'
import { formatAiErrorMessage } from './error'

describe('formatAiErrorMessage', () => {
  it('explains a rejected API key', () => {
    const msg = formatAiErrorMessage(
      new Error('401 {"error":"API key required for remote API access"}')
    )
    expect(msg).toContain('401')
    expect(msg).toContain('AI Provider')
    expect(msg).not.toContain('API key required for remote API access')
  })

  it('explains a forbidden / permission error', () => {
    expect(formatAiErrorMessage(new Error('403 Forbidden'))).toContain('403')
  })

  it('explains a wrong model or endpoint', () => {
    const msg = formatAiErrorMessage(new Error('404 model_not_found'))
    expect(msg).toContain('404')
    expect(msg).toContain('Model Identifier')
  })

  it('keeps the rate-limit message', () => {
    expect(formatAiErrorMessage(new Error('429 Too Many Requests'))).toContain('Rate Limit')
  })

  it('falls back to the default message when the error is empty', () => {
    expect(formatAiErrorMessage(null)).toContain('kesalahan')
  })
})
