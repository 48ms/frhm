'use server'

import { createClient } from '@/lib/supabase/server'
import type { Provider } from '@/lib/ai/providers'
import { previewUrl } from '@/lib/media/transform'

export interface CaptionResult {
  caption: string
  error?: string
}

/**
 * Auth mirror of the library service guard: the caller must hold a session and
 * either be an admin or own the target client. Kept local so this module has no
 * import cycle with service.ts.
 */
async function assertCanUseClient(clientId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized: no session')

  const { data: profile, error } = await supabase
    .from('users')
    .select('role, client_id')
    .eq('id', user.id)
    .single()
  if (error) throw new Error(`Failed to load profile: ${error.message}`)

  const isAdmin = profile?.role === 'admin'
  if (!isAdmin && profile?.client_id !== clientId) {
    throw new Error('Forbidden: caller cannot access this client')
  }
}

/**
 * Ask a vision-capable model for two draft captions for one image.
 *
 * Fails closed: a missing provider or a non-2xx answer returns an error string
 * instead of a made-up caption, so the UI never shows text the model did not
 * actually produce.
 */
export async function generateAssetCaption(
  clientId: string,
  assetUrl: string,
  assetType: string
): Promise<CaptionResult> {
  try {
    await assertCanUseClient(clientId)
  } catch (err) {
    return { caption: '', error: err instanceof Error ? err.message : 'Authorization failed' }
  }

  if (assetType === 'video') {
    return { caption: '', error: 'Caption AI belum mendukung video. Buat manual dulu, ya.' }
  }

  const provider: Provider = {
    kind: 'custom',
    model: process.env.AI_DEFAULT_MODEL || 'gpt-4o-mini',
    base_url: process.env.AI_DEFAULT_BASE_URL || 'http://localhost:11434/v1',
    api_key: process.env.AI_DEFAULT_API_KEY || 'ollama',
  }

  const system = `Kamu copywriter media sosial.
Tulis DUA opsi caption pendek dan menarik untuk gambar yang dikirim.
Pakai bahasa Indonesia santai tapi rapi, masing-masing sertakan 3 hashtag relevan.
Balas HANYA teks captionnya, tanpa pembuka atau penutup.`

  const base = (provider.base_url || 'https://api.openai.com').replace(/\/$/, '')

  try {
    const res = await fetch(`${base}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.api_key ?? ''}`,
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 300,
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Buatkan caption untuk gambar ini.' },
              { type: 'image_url', image_url: { url: previewUrl(assetUrl), detail: 'low' } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      return { caption: '', error: `Provider menolak permintaan (${res.status})` }
    }

    const data = await res.json()
    const content: string = data?.choices?.[0]?.message?.content ?? ''
    if (!content.trim()) {
      return { caption: '', error: 'Model tidak mengembalikan caption.' }
    }

    return { caption: content.trim() }
  } catch (err) {
    console.error('[AI Caption] request failed:', err)
    return { caption: '', error: 'Caption AI gagal. Coba lagi nanti.' }
  }
}
