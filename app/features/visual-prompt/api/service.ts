import type {
  GenerateVisualPromptInput,
  GenerateVisualPromptResponse,
  VisualTool,
  AspectRatio,
  VisualJob,
  VisualPromptResult,
  UniversalAnatomy,
} from './types'

export async function generateVisualPrompt(
  input: GenerateVisualPromptInput
): Promise<GenerateVisualPromptResponse> {
  const {
    clientId,
    topic,
    clientName = 'Brand',
    visualBrief,
    tool,
    aspectRatio: customAspectRatio,
    job: customJob,
    format = 'Single',
  } = input

  if (!topic || topic.trim().length === 0) {
    return {
      success: false,
      error: 'Harap masukkan topik atau judul visual yang ingin dirancang.',
    }
  }

  const cleanTopic = topic.trim()
  const lowerTopic = cleanTopic.toLowerCase()
  const briefText = (visualBrief || '').toLowerCase()
  const combinedContext = `${lowerTopic} ${briefText}`

  // Step 0 — Gate: Should this even be AI-generated?
  // Gate criteria: real people/team, actual physical store, authentic customer proof
  const hasRealPeopleOrLocation =
    combinedContext.includes('petani') ||
    combinedContext.includes('tim kami') ||
    combinedContext.includes('founder') ||
    combinedContext.includes('barista') ||
    combinedContext.includes('pak ') ||
    combinedContext.includes('bunda ') ||
    combinedContext.includes('toko fisik') ||
    combinedContext.includes('kedai kami') ||
    combinedContext.includes('review asli') ||
    combinedContext.includes('testimoni')

  const shouldGenerateAI = !hasRealPeopleOrLocation
  const gateReasoning = hasRealPeopleOrLocation
    ? 'Direkomendasikan foto/video dokumentasi nyata! Standar kedaulatan platform melarang memfabrikasi sosok manusia asli, petani mitra, atau kedai fisik dengan AI agar tidak menyesatkan audiens dan menjaga integritas brand.'
    : 'Cocok untuk AI Generative: Kebutuhan visual bersifat konseptual, estetika produk, ilustrasi edukasi, atau b-roll pendukung tanpa memalsukan sosok nyata.'

  // Step 1 — Route to tool & determine format
  let recommendedTool: VisualTool = tool || 'flux'
  let aspectRatio: AspectRatio = customAspectRatio || '4:5'
  let job: VisualJob = customJob || 'hero_product'

  if (!tool) {
    if (format === 'Reel' || format === 'Story' || combinedContext.includes('video') || combinedContext.includes('b-roll') || combinedContext.includes('asmr')) {
      recommendedTool = 'veo'
      aspectRatio = '9:16'
      job = 'lifestyle_broll'
    } else if (format === 'Carousel' || combinedContext.includes('carousel') || combinedContext.includes('infografis') || combinedContext.includes('teks') || combinedContext.includes('slide')) {
      recommendedTool = 'ideogram'
      aspectRatio = '4:5'
      job = 'carousel_slide'
    } else if (combinedContext.includes('quote') || combinedContext.includes('kutipan') || combinedContext.includes('poster')) {
      recommendedTool = 'ideogram'
      aspectRatio = '1:1'
      job = 'infographic_quote'
    } else if (combinedContext.includes('template') || combinedContext.includes('banner') || combinedContext.includes('flyer')) {
      recommendedTool = 'canva'
      aspectRatio = '1:1'
      job = 'announcement'
    } else {
      recommendedTool = 'flux'
      aspectRatio = format === 'Single' ? '4:5' : '1:1'
      job = 'hero_product'
    }
  }

  // Step 2 — Model-agnostic Universal Anatomy (8 elements, no token spam)
  const universalAnatomy: UniversalAnatomy = {
    subject: `Authentic representation of ${cleanTopic} for ${clientName}`,
    composition:
      recommendedTool === 'veo'
        ? 'Vertical 9:16 framing, eye-level camera angle with dynamic subject movement and center-weighted safe area'
        : recommendedTool === 'ideogram'
        ? 'Balanced editorial composition with ample negative space in top or bottom third for legible typographic elements'
        : 'Rule of thirds composition, crisp focal subject, elegant depth with soft organic separation from background',
    lighting:
      'Warm directional morning sunlight, soft natural diffusion, delicate rim light highlighting organic textures, zero harsh synthetic flashes',
    colorPalette:
      'Earthy, warm organic tones harmonized with subtle brand accents (warm amber, espresso brown, soft cream, muted forest undertones)',
    style:
      recommendedTool === 'ideogram'
        ? 'Contemporary editorial design with clean sans-serif headline typography integrated seamlessly into the visual canvas'
        : recommendedTool === 'veo'
        ? 'Cinematic commercial-grade documentary video, smooth camera movement, natural color grade'
        : 'Realistic lifestyle photography, 35mm lens perspective, f/2.8 shallow aperture, tactile natural textures',
    mood: 'Grounding, calm, premium yet accessible, inviting viewer attention as a deliberate pause',
    detail:
      'Fine micro-textures on tactile surfaces, subtle natural steam or environmental elements, authentic atmosphere without plastic smoothing',
    negativeConstraints:
      'Over-saturated neon colors, cartoonish rendering, generic AI gloss, distorted anatomy, floating hands, illegible noisy text artifacts, artificial vignette',
  }

  // Step 3 — Tool-specific prompt craft
  let toolSpecificPrompt = ''
  let negativePrompt = universalAnatomy.negativeConstraints

  if (recommendedTool === 'ideogram') {
    const headline = cleanTopic.length > 60 ? cleanTopic.slice(0, 57) + '...' : cleanTopic
    toolSpecificPrompt = `Editorial graphic layout. Bold, elegant modern typography featuring the quote "${headline}" rendered crisply in centered layout. Surrounding scene: ${universalAnatomy.subject}. ${universalAnatomy.lighting}, ${universalAnatomy.colorPalette}. High contrast text legibility, generous negative space, minimalist professional design --ar ${aspectRatio}`
    negativePrompt = 'blurry text, misspelled words, chaotic typography, overlapping letters, low contrast, 3d bubble text'
  } else if (recommendedTool === 'veo') {
    toolSpecificPrompt = `Cinematic 8-second vertical 9:16 video. Smooth slow-dolly camera movement capturing ${universalAnatomy.subject}. Natural action unfolds with tactile interaction. ${universalAnatomy.lighting}, ${universalAnatomy.colorPalette}. Commercial grade, continuous natural motion, clear visual framing for sound-off social viewing, 60fps 4k.`
    negativePrompt = 'jump cuts, jittery camera, distorted hands, morphing objects, unnatural fast motion, low frame rate'
  } else if (recommendedTool === 'midjourney') {
    const arFlag = aspectRatio === '9:16' ? '--ar 9:16' : aspectRatio === '4:5' ? '--ar 4:5' : aspectRatio === '16:9' ? '--ar 16:9' : '--ar 1:1'
    toolSpecificPrompt = `Authentic editorial photograph of ${cleanTopic}, ${universalAnatomy.composition}, ${universalAnatomy.lighting}, ${universalAnatomy.style}, rich natural textures, ${universalAnatomy.mood} ${arFlag} --v 6.1 --style raw`
    negativePrompt = 'plastic skin, 3d render, oversaturated, CGI, doll-like, fake reflections, watermark'
  } else if (recommendedTool === 'canva') {
    toolSpecificPrompt = `Social media graphic template for ${clientName}. Topic: ${cleanTopic}. Clean modular grid with dedicated hero container, headline banner, 3 key takeaway bullet containers, and CTA footer strip. Harmonious brand colors: ${universalAnatomy.colorPalette}.`
    negativePrompt = 'cluttered layouts, unaligned elements, inconsistent spacing'
  } else {
    // Flux (Default photorealism)
    toolSpecificPrompt = `Photorealistic editorial shot of ${cleanTopic} for ${clientName}. ${universalAnatomy.composition}. ${universalAnatomy.lighting}. ${universalAnatomy.style}, capturing genuine tactile details. Natural color grading with ${universalAnatomy.colorPalette}. Aspect ratio ${aspectRatio}, authentic documentary aesthetic.`
    negativePrompt = 'render, plastic, airbrushed, cartoon, oversaturated, deformed, extra limbs'
  }

  const aiDisclosureTag = 'Dibuat dengan bantuan AI (Meta "Made with AI" / EU AI Act compliant)'
  const overlayTextGuidance =
    'Sisakan ruang kosong (negative space) minimal 30% di area tengah atau sepertiga atas. Pastikan rasio kontras teks terhadap latar belakang minimal 4.5:1 untuk keterbacaan optimal di layar ponsel saat sound-off.'

  const copyableMarkdown = `### Visual Production Brief: ${cleanTopic}
> **Rekomendasi Alat**: ${recommendedTool.toUpperCase()} | **Rasio**: ${aspectRatio} | **Fungsi**: ${job}
> **Status Gate**: ${shouldGenerateAI ? '✅ Cocok untuk AI' : '⚠️ Prioritaskan Aset Riil'}

#### Prompt Siap Pakai (${recommendedTool.toUpperCase()}):
\`\`\`
${toolSpecificPrompt}
\`\`\`

#### Negative Prompt:
\`\`\`
${negativePrompt}
\`\`\`

#### Anatomi Universal 8 Elemen:
- **Subject**: ${universalAnatomy.subject}
- **Composition**: ${universalAnatomy.composition}
- **Lighting**: ${universalAnatomy.lighting}
- **Color Palette**: ${universalAnatomy.colorPalette}
- **Style**: ${universalAnatomy.style}
- **Mood**: ${universalAnatomy.mood}
- **Detail**: ${universalAnatomy.detail}
- **Constraints**: ${universalAnatomy.negativeConstraints}

#### Pedoman Publikasi:
- **Pengungkapan**: ${aiDisclosureTag}
- **Keterbacaan Teks**: ${overlayTextGuidance}
`

  const result: VisualPromptResult = {
    title: `Visual Brief: ${cleanTopic}`,
    shouldGenerateAI,
    gateReasoning,
    recommendedTool,
    aspectRatio,
    job,
    universalAnatomy,
    toolSpecificPrompt,
    negativePrompt,
    aiDisclosureTag,
    overlayTextGuidance,
    copyableMarkdown,
  }

  return {
    success: true,
    data: result,
  }
}
