import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractVoiceGuide, saveVoiceGuide } from './service'

vi.mock('@/lib/auth/guard', () => ({
  assertClientAccess: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { name: 'Kopi Nusantara' } }),
    })),
  })),
}))

vi.mock('@/lib/supabase/service', () => ({
  createSupabaseServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}))

vi.mock('@/lib/ai/server', () => ({
  resolveProvider: vi.fn().mockResolvedValue({
    kind: 'custom',
    model: 'test-model',
    base_url: 'http://localhost:11434',
    api_key: 'test-key',
  }),
  loadSkillBundle: vi.fn().mockResolvedValue('# Voice Builder Playbook'),
  loadClientFiles: vi.fn().mockResolvedValue({}),
  brandContext: vi.fn().mockReturnValue('# Brand Profile Context'),
}))

vi.mock('@/lib/ai/providers', () => ({
  chatJsonDetailed: vi.fn().mockResolvedValue({
    data: {
      summary: 'Suara otentik hangat dan bersahabat.',
      fingerprint: ['Menggunakan analogi keseharian', 'Kalimat pendek ritmis'],
      negativeSpace: ['Tidak pernah menggunakan kata revolusioner'],
      dimensions: {
        formality: 2,
        warmth: 5,
        authority: 4,
        energy: 4,
        humor: 3,
        polish: 4,
      },
      toneMap: {
        linkedin: 'Lebih strategis',
        instagram: 'Lebih visual',
        tiktok: 'Lebih santai',
        xTwitter: 'Lebih ringkas',
      },
      rewrites: [
        {
          generic: 'Kami menyajikan kopi terbaik di kota.',
          onVoice: 'Kopi yang diseduh dari biji pilihan petani lereng gunung.',
          why: 'Konkret dan tidak bombastis.',
        },
      ],
      markdown: '# Voice Guide\n\n## The Voice Fingerprint\n- Analogi keseharian',
    },
    usage: { promptTokens: 100, completionTokens: 50 },
  }),
}))

vi.mock('@/lib/ai/usage', () => ({
  logAiUsage: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn() },
}))

describe('Voice Builder Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('extractVoiceGuide', () => {
    it('returns error if samples are empty', async () => {
      const res = await extractVoiceGuide({
        clientId: 'c1',
        samples: [],
        targetType: 'brand',
      })
      expect(res.success).toBe(false)
      expect(res.error).toMatch(/minimal/i)
    })

    it('extracts voice guide successfully from valid samples', async () => {
      const res = await extractVoiceGuide({
        clientId: 'c1',
        samples: ['Kopi enak itu sederhana. Biji segar, air bersih, takaran pas.'],
        targetType: 'brand',
      })
      expect(res.success).toBe(true)
      expect(res.data?.fingerprint).toHaveLength(2)
      expect(res.data?.dimensions.warmth).toBe(5)
      expect(res.data?.markdown).toContain('# Voice Guide')
    })
  })

  describe('saveVoiceGuide', () => {
    it('successfully saves voice.md to client_files', async () => {
      const res = await saveVoiceGuide({
        clientId: 'c1',
        content: '# Voice Guide\n\n## Content',
      })
      expect(res.success).toBe(true)
    })
  })
})
