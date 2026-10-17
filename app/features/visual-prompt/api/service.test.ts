import { describe, it, expect } from 'vitest'
import { generateVisualPrompt } from './service'

describe('generateVisualPrompt service', () => {
  it('fails with clear error message when topic is empty', async () => {
    const res = await generateVisualPrompt({
      clientId: 'client-1',
      topic: '',
    })
    expect(res.success).toBe(false)
    expect(res.error).toBe('Harap masukkan topik atau judul visual yang ingin dirancang.')
  })

  it('detects real people / farm workers and sets shouldGenerateAI to false', async () => {
    const res = await generateVisualPrompt({
      clientId: 'client-1',
      clientName: 'Taraju Coffee',
      topic: 'Pak Jajang memetik ceri kopi di lereng Taraju',
      visualBrief: 'Foto asli petani mitra tersenyum di kebun',
    })

    expect(res.success).toBe(true)
    expect(res.data?.shouldGenerateAI).toBe(false)
    expect(res.data?.gateReasoning).toContain('Direkomendasikan foto/video dokumentasi nyata')
  })

  it('allows AI generation for conceptual product still-life and auto-routes to Flux', async () => {
    const res = await generateVisualPrompt({
      clientId: 'client-1',
      clientName: 'Taraju Coffee',
      topic: 'Biji kopi Yellow Honey di atas meja kayu jati',
      format: 'Single',
    })

    expect(res.success).toBe(true)
    expect(res.data?.shouldGenerateAI).toBe(true)
    expect(res.data?.recommendedTool).toBe('flux')
    expect(res.data?.aspectRatio).toBe('4:5')
    expect(res.data?.toolSpecificPrompt).toContain('Photorealistic editorial shot')
    // Universal anatomy checks
    expect(res.data?.universalAnatomy.subject).toBeDefined()
    expect(res.data?.universalAnatomy.lighting).toBeDefined()
    expect(res.data?.universalAnatomy.composition).toBeDefined()
    // No quality spam
    expect(res.data?.toolSpecificPrompt).not.toContain('4k masterpiece')
    expect(res.data?.toolSpecificPrompt).not.toContain('hyperrealistic')
  })

  it('auto-routes video / Reels to Veo with 9:16 aspect ratio and 8-second camera direction', async () => {
    const res = await generateVisualPrompt({
      clientId: 'client-1',
      clientName: 'Taraju Coffee',
      topic: 'Proses pouring V60 dengan uap mengepul',
      format: 'Reel',
      visualBrief: 'Video vertikal b-roll ASMR seduhan kopi pagi',
    })

    expect(res.success).toBe(true)
    expect(res.data?.recommendedTool).toBe('veo')
    expect(res.data?.aspectRatio).toBe('9:16')
    expect(res.data?.toolSpecificPrompt).toContain('Cinematic 8-second vertical 9:16 video')
  })

  it('auto-routes carousel / infographic to Ideogram with quote text styling', async () => {
    const res = await generateVisualPrompt({
      clientId: 'client-1',
      clientName: 'Taraju Coffee',
      topic: '5 Kesalahan Menyeduh Kopi yang Bikin Pahit',
      format: 'Carousel',
      visualBrief: 'Infografis breakdown visual slide',
    })

    expect(res.success).toBe(true)
    expect(res.data?.recommendedTool).toBe('ideogram')
    expect(res.data?.aspectRatio).toBe('4:5')
    expect(res.data?.toolSpecificPrompt).toContain('Editorial graphic layout')
    expect(res.data?.toolSpecificPrompt).toContain('"5 Kesalahan Menyeduh Kopi yang Bikin Pahit"')
  })

  it('supports explicit tool override like Midjourney with flags', async () => {
    const res = await generateVisualPrompt({
      clientId: 'client-1',
      clientName: 'Taraju Coffee',
      topic: 'Secangkir kopi di teras pagi berkabut',
      tool: 'midjourney',
      aspectRatio: '16:9',
    })

    expect(res.success).toBe(true)
    expect(res.data?.recommendedTool).toBe('midjourney')
    expect(res.data?.aspectRatio).toBe('16:9')
    expect(res.data?.toolSpecificPrompt).toContain('--ar 16:9')
    expect(res.data?.toolSpecificPrompt).toContain('--v 6.1 --style raw')
  })
})
