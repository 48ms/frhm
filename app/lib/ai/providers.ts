/**
 * The four wire shapes for talking to an LLM. One place so the one-shot runner and the
 * interactive chat runner behave identically. `custom` is treated as OpenAI-compatible,
 * which is what lets 9router (and any other OpenAI-compatible endpoint) work unchanged.
 */

export type Provider = {
  kind: 'gemini' | 'anthropic' | 'openai' | 'custom'
  model: string
  base_url: string | null
  api_key: string | null
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

/** The loosest common shape across gemini / anthropic / openai-compatible responses. */
type AiResponse = {
  error?: { message?: string }
  choices?: { message?: { content?: string }; delta?: { content?: string } }[]
  candidates?: { content?: { parts?: { text?: string }[] } }[]
  content?: { text?: string }[]
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
    input_tokens?: number
    output_tokens?: number
    prompt_tokens_details?: { cached_tokens?: number }
  }
}

/** Normalise each provider's usage shape into one common form. */
export type AiUsage = {
  promptTokens: number
  completionTokens: number
}

function extractUsage(j: AiResponse | undefined): AiUsage | null {
  if (!j?.usage) return null
  const u = j.usage
  // OpenAI/Anthropic use prompt/completion; Gemini uses input/output.
  const promptTokens = u.prompt_tokens ?? u.input_tokens ?? 0
  const completionTokens = u.completion_tokens ?? u.output_tokens ?? 0
  if (!promptTokens && !completionTokens) return null
  return { promptTokens, completionTokens }
}

const TIMEOUT_MS = 120_000

async function post(url: string, headers: Record<string, string>, body: unknown) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    const text = await res.text()

    // Some gateways (9router among them) answer in SSE even when not asked to. Parse it.
    if (text.startsWith('data:')) {
      let out = ''
      for (const line of text.split('\n')) {
        const s = line.trim()
        if (!s.startsWith('data:')) continue
        const payload = s.slice(5).trim()
        if (!payload || payload === '[DONE]') continue
        try {
          const chunk = JSON.parse(payload)
          out += chunk?.choices?.[0]?.delta?.content ?? chunk?.choices?.[0]?.message?.content ?? ''
        } catch {
          /* ignore malformed chunk */
        }
      }
      const j: AiResponse = { choices: [{ message: { content: out } }] }
      return { ok: res.ok, status: res.status, j } as const
    }

    let j: AiResponse = {}
    try {
      j = JSON.parse(text)
    } catch {
      /* leave j empty; caller reports the status */
    }
    return { ok: res.ok, status: res.status, j } as const
  } finally {
    clearTimeout(t)
  }
}

export async function chat(
  p: Provider,
  system: string,
  messages: ChatMessage[]
): Promise<string> {
  if (p.kind === 'gemini') {
    const base = p.base_url || 'https://generativelanguage.googleapis.com'
    const { ok, status, j } = await post(
      `${base}/v1beta/models/${p.model}:generateContent?key=${p.api_key ?? ''}`,
      {},
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: { temperature: 0.8, maxOutputTokens: 16384 },
      }
    )
    if (!ok) throw new Error(j?.error?.message || `Gemini ${status}`)
    return (
      j?.candidates?.[0]?.content?.parts?.map((x: { text?: string }) => x.text ?? '').join('') ?? ''
    )
  }

  if (p.kind === 'anthropic') {
    const base = p.base_url || 'https://api.anthropic.com'
    const { ok, status, j } = await post(
      `${base}/v1/messages`,
      { 'x-api-key': p.api_key ?? '', 'anthropic-version': '2023-06-01' },
      { model: p.model, max_tokens: 16384, system, messages }
    )
    if (!ok) throw new Error(j?.error?.message || `Anthropic ${status}`)
    return (j?.content ?? []).map((c: { text?: string }) => c.text ?? '').join('')
  }

  // openai + custom (9router) share the OpenAI-compatible shape
  const base = (p.base_url || 'https://api.openai.com').replace(/\/$/, '')
  const res = await post(
    `${base}/v1/chat/completions`,
    { Authorization: `Bearer ${p.api_key ?? ''}` },
    {
      model: p.model,
      temperature: 0.8,
      max_tokens: 16384,
      stream: false,
      messages: [{ role: 'system', content: system }, ...messages],
    }
  )
  const { ok, status, j } = res
  if (!ok) throw new Error(j?.error?.message || `OpenAI ${status}`)
  return j?.choices?.[0]?.message?.content ?? ''
}

/** Ask the model for JSON. Returns null when the model answered in prose instead. */
export async function chatJson<T>(
  p: Provider,
  system: string,
  messages: ChatMessage[]
): Promise<T | null> {
  const raw = await chat(p, system, messages)
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fence ? fence[1] : raw).trim()
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T
  } catch {
    return null
  }
}

/**
 * Same as chat() but also returns the provider's token usage, so callers can
 * record cost per client (O20). Falls back to null when the gateway omits usage.
 */
export async function chatDetailed(
  p: Provider,
  system: string,
  messages: ChatMessage[]
): Promise<{ text: string; usage: AiUsage | null }> {
  if (p.kind === 'gemini') {
    const base = p.base_url || 'https://generativelanguage.googleapis.com'
    const { ok, status, j } = await post(
      `${base}/v1beta/models/${p.model}:generateContent?key=${p.api_key ?? ''}`,
      {},
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: { temperature: 0.8, maxOutputTokens: 16384 },
      }
    )
    if (!ok) throw new Error(j?.error?.message || `Gemini ${status}`)
    const text =
      j?.candidates?.[0]?.content?.parts?.map((x: { text?: string }) => x.text ?? '').join('') ?? ''
    return { text, usage: extractUsage(j) }
  }

  if (p.kind === 'anthropic') {
    const base = p.base_url || 'https://api.anthropic.com'
    const { ok, status, j } = await post(
      `${base}/v1/messages`,
      { 'x-api-key': p.api_key ?? '', 'anthropic-version': '2023-06-01' },
      { model: p.model, max_tokens: 16384, system, messages }
    )
    if (!ok) throw new Error(j?.error?.message || `Anthropic ${status}`)
    const text = (j?.content ?? []).map((c: { text?: string }) => c.text ?? '').join('')
    return { text, usage: extractUsage(j) }
  }

  // openai + custom (9router) share the OpenAI-compatible shape
  const base = (p.base_url || 'https://api.openai.com').replace(/\/$/, '')
  const res = await post(
    `${base}/v1/chat/completions`,
    { Authorization: `Bearer ${p.api_key ?? ''}` },
    {
      model: p.model,
      temperature: 0.8,
      max_tokens: 16384,
      stream: false,
      messages: [{ role: 'system', content: system }, ...messages],
    }
  )
  const { ok, status, j } = res
  if (!ok) throw new Error(j?.error?.message || `OpenAI ${status}`)
  const text = j?.choices?.[0]?.message?.content ?? ''
  return { text, usage: extractUsage(j) }
}

/**
 * One model turn that may request a tool call.
 *
 * We use a JSON envelope rather than native function-calling because the dashboard runs against
 * whatever OpenAI-compatible endpoint the operator configured (9router, Ollama, …) and native
 * tool support varies wildly. A JSON envelope works everywhere and keeps the gate in our code:
 * the model can *ask* to publish, but only the route decides whether to execute.
 */
export type ToolTurn =
  | { kind: 'tool'; tool: string; args: Record<string, unknown> }
  | { kind: 'final'; text: string }

export async function chatWithToolEnvelope(
  p: Provider,
  system: string,
  messages: ChatMessage[]
): Promise<ToolTurn> {
  const raw = await chat(p, system, messages)
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fence ? fence[1] : raw).trim()

  // Models sometimes emit more than one JSON object in a single turn (e.g. a tool call followed by
  // a reply). Scan for balanced objects and act on the FIRST that parses; ignore the rest rather
  // than letting them leak into the user-visible reply.
  const objects: string[] = []
  let depth = 0, start = -1, inStr = false, esc = false
  for (let i = 0; i < candidate.length; i++) {
    const ch = candidate[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') { inStr = true; continue }
    if (ch === '{') { if (depth === 0) start = i; depth++ }
    else if (ch === '}') {
      depth--
      if (depth === 0 && start >= 0) { objects.push(candidate.slice(start, i + 1)); start = -1 }
    }
  }

  for (const obj of objects) {
    try {
      const j = JSON.parse(obj) as {
        tool?: string
        args?: Record<string, unknown>
        reply?: string
      }
      if (j.tool && typeof j.tool === 'string') {
        return { kind: 'tool', tool: j.tool, args: j.args ?? {} }
      }
      if (typeof j.reply === 'string') return { kind: 'final', text: j.reply }
    } catch {
      /* try the next object */
    }
  }
  return { kind: 'final', text: raw }
}
