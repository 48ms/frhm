'use server'

import { createClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { logger } from '@/lib/logger'
import { assertClientAccess } from '@/lib/auth/guard'
import { resolveProvider, loadSkillBundle, loadClientFiles, brandContext } from '@/lib/ai/server'
import { chatJsonDetailed } from '@/lib/ai/providers'
import { logAiUsage } from '@/lib/ai/usage'
import type {
  ExtractVoiceInput,
  VoiceExtractionResult,
  SaveVoiceGuideInput,
  SaveVoiceGuideResult,
} from './types'

/**
 * Service Layer untuk Voice Builder
 * Mengekstrak karakteristik suara otentik (voice fingerprint & rules) dari sampel tulisan asli
 * berdasarkan standar playbook upstream social-media-skills/skills/voice-builder.
 */

export async function extractVoiceGuide(input: ExtractVoiceInput): Promise<{
  success: boolean
  data?: VoiceExtractionResult
  error?: string
}> {
  const start = Date.now()
  const { clientId, samples, targetType, brandName } = input

  try {
    await assertClientAccess(clientId)
    const supabase = await createClient()
    const provider = await resolveProvider(supabase)

    if (!provider) {
      return { success: false, error: 'AI Provider belum dikonfigurasi. Hubungi Admin.' }
    }

    if (!samples || samples.length === 0 || samples.every((s) => !s.trim())) {
      return { success: false, error: 'Minimal sertakan 1-3 sampel tulisan atau transkrip asli.' }
    }

    const [skillBundle, clientFiles, clientRow] = await Promise.all([
      loadSkillBundle(supabase, 'voice-builder'),
      loadClientFiles(supabase, clientId),
      supabase.from('clients').select('name').eq('id', clientId).maybeSingle(),
    ])

    const resolvedName = brandName || clientRow?.data?.name || 'Klien'
    const brandCtx = brandContext(resolvedName, clientFiles)

    const samplesText = samples
      .filter((s) => s.trim().length > 0)
      .map((s, idx) => `### Sampel ${idx + 1}:\n${s.trim()}`)
      .join('\n\n---\n\n')

    const systemPrompt = `
[ROLE & MISSION]
You are an expert Brand Voice Architect executing the official "voice-builder" skill.
Your job is to deconstruct real writing samples into a reproducible, operational voice guide (voice.md).
Voice is extracted from EVIDENCE, never described in vague adjectives ("punchy and authentic" is banned; specific syntactic & lexical rules are required).

[BRAND CONTEXT]
---
${brandCtx}
---

[AUTHORITATIVE SKILL PLAYBOOK: voice-builder]
---
${skillBundle || 'Deconstruct voice across: Lexicon, Syntax, Rhetoric, Structure, Stance, Negative Space.'}
---

[ANALYSIS PROTOCOL (6 LAYERS)]
1. Lexicon: Word choice, register, contractions, signature phrases, banned-by-habit words.
2. Syntax: Sentence length and variance, openers, fragments, rhythm.
3. Rhetoric: Questions, direct address, repetition, contrast, humor.
4. Structure: How they open, build, and close; formatting.
5. Stance: Distance from reader, authority posture, confidence.
6. Negative Space: What they conspicuously NEVER do.

[OUTPUT SPECIFICATION (JSON ONLY)]
You MUST return valid JSON ONLY with this exact schema:
{
  "summary": "1-2 sentence executive summary of the voice fingerprint in Indonesian",
  "fingerprint": [
    "5-7 distinctive reproducible signatures with exact quote evidence from the samples"
  ],
  "negativeSpace": [
    "3-5 hard nevers (hal-hal yang secara tegas tidak pernah dilakukan)"
  ],
  "dimensions": {
    "formality": 1-5,
    "warmth": 1-5,
    "authority": 1-5,
    "energy": 1-5,
    "humor": 1-5,
    "polish": 1-5
  },
  "toneMap": {
    "linkedin": "How the voice shifts on LinkedIn (more strategic, thought-leadership)",
    "instagram": "How the voice shifts on Instagram (more visual, hook-driven)",
    "tiktok": "How the voice shifts on TikTok (looser, conversational)",
    "xTwitter": "How the voice shifts on X/Twitter (concise, sharp)"
  },
  "rewrites": [
    {
      "generic": "Contoh kalimat generik/klise AI",
      "onVoice": "Kalimat yang sama setelah ditulis ulang dalam suara otentik ini",
      "why": "Alasan perubahan berdasarkan fingerprint"
    }
  ],
  "markdown": "Complete, production-ready voice.md markdown document adhering to voice-template.md. Must include sections: # Voice Guide, ## The Voice Fingerprint, ## The Negative Space, ## The Tone Map, ## Do / Don't Rewrites, ## Calibration Anchors (Quotes), ## Operational Rules."
}
`

    const userPrompt = `Target Persona: ${targetType.toUpperCase()} (${resolvedName})
Berikut adalah kumpulan sampel tulisan asli:
---
${samplesText}
---
Analisis dan ekstrak seluruh karakteristik suara ke dalam format JSON yang diminta.`

    const { data: result, usage } = await chatJsonDetailed<VoiceExtractionResult>(
      provider,
      systemPrompt,
      [{ role: 'user', content: userPrompt }]
    )

    if (!result || !result.markdown) {
      throw new Error('AI tidak menghasilkan output panduan suara yang valid.')
    }

    const { data: authUser } = await supabase.auth.getUser()
    await logAiUsage({
      userId: authUser?.user?.id ?? null,
      clientId,
      route: 'voice-builder.extract',
      model: provider.model,
      providerKind: provider.kind,
      promptTokens: usage?.promptTokens ?? 0,
      completionTokens: usage?.completionTokens ?? 0,
      latencyMs: Date.now() - start,
    })

    return {
      success: true,
      data: result,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error('voice-builder.extractVoiceGuide.failed', { clientId, error: msg })
    return {
      success: false,
      error: msg || 'Gagal mengekstrak suara brand.',
    }
  }
}

/**
 * Menyimpan dokumen voice.md yang telah diekstrak ke dalam client_files Supabase
 */
export async function saveVoiceGuide(input: SaveVoiceGuideInput): Promise<SaveVoiceGuideResult> {
  const { clientId, content } = input
  try {
    await assertClientAccess(clientId)
    const admin = createSupabaseServiceClient()

    const { error } = await admin.from('client_files').upsert(
      {
        client_id: clientId,
        path: 'voice.md',
        content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'client_id,path' }
    )

    if (error) {
      logger.error('voice-builder.saveVoiceGuide.failed', { clientId, error: error.message })
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan voice guide.'
    return { success: false, error: msg }
  }
}
