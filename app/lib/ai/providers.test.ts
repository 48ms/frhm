import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRoot, chat, chatDetailed } from './providers'

function stubFetch(body: unknown, status = 200) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiRoot', () => {
  it('strips a trailing version segment exactly once', () => {
    expect(apiRoot('https://openrouter.ai/api/v1', 'https://api.openai.com', ['/v1'])).toBe(
      'https://openrouter.ai/api'
    )
    expect(apiRoot('https://openrouter.ai/api/v1/', 'https://api.openai.com', ['/v1'])).toBe(
      'https://openrouter.ai/api'
    )
    expect(apiRoot('https://x.test/v1beta', 'https://x.test', ['/v1beta', '/v1'])).toBe(
      'https://x.test'
    )
  })

  it('strips a pasted full endpoint path', () => {
    expect(
      apiRoot('https://x.test/v1/chat/completions', 'https://api.openai.com', [
        '/chat/completions',
        '/v1',
      ])
    ).toBe('https://x.test')
  })

  it('falls back when the base URL is empty', () => {
    expect(apiRoot(null, 'https://api.openai.com', ['/v1'])).toBe('https://api.openai.com')
    expect(apiRoot('   ', 'https://api.openai.com', ['/v1'])).toBe('https://api.openai.com')
  })
})

describe('chat URL building', () => {
  it('does not double /v1 for an OpenAI-compatible base that already has it', async () => {
    const fetchMock = stubFetch({ choices: [{ message: { content: 'ok' } }] })

    await chat(
      { kind: 'custom', model: '48ms', base_url: 'http://43.129.38.221:20128/v1', api_key: 'k' },
      'system',
      [{ role: 'user', content: 'hi' }]
    )

    expect(fetchMock.mock.calls[0][0]).toBe('http://43.129.38.221:20128/v1/chat/completions')
  })

  it('adds /v1 when the base is a bare host', async () => {
    const fetchMock = stubFetch({ choices: [{ message: { content: 'ok' } }] })

    await chat(
      { kind: 'openai', model: 'gpt-4o-mini', base_url: 'https://api.openai.com', api_key: 'k' },
      'system',
      [{ role: 'user', content: 'hi' }]
    )

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/chat/completions')
  })

  it('keeps the Gemini version path intact', async () => {
    const fetchMock = stubFetch({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] })

    await chat(
      {
        kind: 'gemini',
        model: 'gemini-2.0-flash',
        base_url: 'https://generativelanguage.googleapis.com/v1beta',
        api_key: 'k',
      },
      'system',
      [{ role: 'user', content: 'hi' }]
    )

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=k'
    )
  })

  it('does not double /v1 for Anthropic and returns usage', async () => {
    const fetchMock = stubFetch({
      content: [{ text: 'ok' }],
      usage: { input_tokens: 10, output_tokens: 5 },
    })

    const res = await chatDetailed(
      {
        kind: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        base_url: 'https://api.anthropic.com/v1',
        api_key: 'k',
      },
      'system',
      [{ role: 'user', content: 'hi' }]
    )

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.anthropic.com/v1/messages')
    expect(res.text).toBe('ok')
    expect(res.usage).toEqual({ promptTokens: 10, completionTokens: 5 })
  })
})
