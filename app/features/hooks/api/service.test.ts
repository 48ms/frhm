import { describe, it, expect } from 'vitest'
import { generateHooks } from './service'

describe('generateHooks service', () => {
  it('rejects empty topic', async () => {
    const res = await generateHooks({
      clientId: 'c-1',
      topic: '',
    })

    expect(res.success).toBe(false)
    expect(res.candidates).toHaveLength(0)
    expect(res.error).toBeDefined()
  })

  it('generates 4 candidates across mechanisms for caption format', async () => {
    const res = await generateHooks({
      clientId: 'c-1',
      topic: 'Seduh Teh Daun Kelor',
      format: 'caption',
      surprisingFactOrDetail: 'suhu 85 derajat',
    })

    expect(res.success).toBe(true)
    expect(res.candidates).toHaveLength(4)
    expect(res.format).toBe('caption')
    expect(res.sendsQuestion).toBeDefined()

    const mechanisms = res.candidates.map((c) => c.mechanism)
    expect(mechanisms).toContain('curiosity_gap')
    expect(mechanisms).toContain('contrarian')
    expect(mechanisms).toContain('high_stakes')
    expect(mechanisms).toContain('relatable_identity')

    const recommended = res.candidates.find((c) => c.isRecommended)
    expect(recommended).toBeDefined()
    expect(recommended?.recommendationRationale).toBeDefined()
  })

  it('generates 3-channel video layers when format is video', async () => {
    const res = await generateHooks({
      clientId: 'c-1',
      topic: 'Rahasia Panen Pagi',
      format: 'video',
    })

    expect(res.success).toBe(true)
    res.candidates.forEach((c) => {
      expect(c.videoLayers).toBeDefined()
      expect(c.videoLayers?.visualShot).toBeDefined()
      expect(c.videoLayers?.onScreenText).toBeDefined()
      expect(c.videoLayers?.spokenAudio).toBeDefined()
    })
  })
})
