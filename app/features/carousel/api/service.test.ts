import { describe, it, expect } from 'vitest'
import { generateCarousel } from './service'

describe('generateCarousel service', () => {
  it('rejects empty topic', async () => {
    const res = await generateCarousel({
      clientId: 'c-1',
      topic: '',
    })

    expect(res.success).toBe(false)
    expect(res.error).toBeDefined()
  })

  it('generates slide-by-slide storyboard ending on save-leaning CTA', async () => {
    const res = await generateCarousel({
      clientId: 'c-1',
      clientName: 'Pawon Sengon',
      topic: 'Teknik Roasting Kopi Rumahan',
      structure: 'how_to',
      platform: 'instagram',
    })

    expect(res.success).toBe(true)
    expect(res.data).toBeDefined()

    const data = res.data!
    expect(data.slides.length).toBeGreaterThanOrEqual(5)
    expect(data.slides[0].slideRole).toBe('cover')
    expect(data.slides[data.slides.length - 1].slideRole).toBe('cta')
    expect(data.singleActionCta).toContain('Simpan')

    data.slides.forEach((slide) => {
      expect(slide.slideNumber).toBeGreaterThan(0)
      expect(slide.headline).toBeDefined()
      expect(slide.visualLayoutDirection).toBeDefined()
      expect(slide.ideogramPrompt).toBeDefined()
    })
  })
})
