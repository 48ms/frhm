import { describe, it, expect } from 'vitest'
import { generateReelsScript } from './service'

describe('generateReelsScript service', () => {
  it('returns error when topic is empty', async () => {
    const res = await generateReelsScript({
      clientId: 'c-1',
      topic: '',
    })

    expect(res.success).toBe(false)
    expect(res.error).toBeDefined()
  })

  it('generates 3-column production beats with sound-off on-screen text and sends question', async () => {
    const res = await generateReelsScript({
      clientId: 'c-1',
      topic: 'Seduh Kopi V60 Tanpa Pahit',
      clientName: 'Pawon Kopi',
      goal: 'reach',
      lengthTier: '15-30s',
      audioType: 'trending_audio_in_app',
    })

    expect(res.success).toBe(true)
    expect(res.data).toBeDefined()

    const data = res.data!
    expect(data.conceptOneIdea).toBeDefined()
    expect(data.sendsQuestion).toContain('Siapa yang akan mem-forward video ini')
    expect(data.coverFrameBrief.gridSafeVisual).toBeDefined()
    expect(data.coverFrameBrief.centerBoldText).toBeDefined()
    expect(data.instagramSeo.primaryKeyword).toContain('seduh kopi v60')
    expect(data.audioNotes).toContain('Instagram WAJIB')

    // Verify beats structure
    expect(data.beats.length).toBeGreaterThanOrEqual(4)
    data.beats.forEach((beat) => {
      expect(beat.timecode).toBeDefined()
      expect(beat.visualShot).toBeDefined()
      expect(beat.onScreenText).toBeDefined() // Sound-off first
      expect(beat.spokenAudio).toBeDefined()
    })
  })
})
