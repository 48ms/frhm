/**
 * Unit test for brand-profile-parser.ts
 * Verifies parsing & serialization against the real template output.
 * Exits non-zero on failure so CI can gate on it.
 */

import { describe, it } from 'vitest'
import { parseBrandProfileMarkdown, serializeBrandProfile, calculateTotalPercentage } from './brand-profile-parser'

let failures = 0
function check(label: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`  ✅ ${label}`)
  } else {
    failures++
    console.log(`  ❌ ${label}${detail !== undefined ? ` — got: ${JSON.stringify(detail)}` : ''}`)
  }
}

describe('brand-profile-parser', () => {
  it('parses and serializes brand profile correctly', () => {
    const sampleMarkdown = `# Brand Profile — Pawon Sengon

## Who We Are
Pawon Sengon adalah waralaba kuliner Indonesia yang menyajikan hidangan tradisional dengan resep turun-temurun sejak 1985. Kami melayani keluarga Indonesia dengan makanan halal, sehat, dan penuh rempah asli.

## Audience Persona
Ibu rumah tangga usia 30-50 tahun dari kelas menengah yang mencari makanan halal dan sehat untuk keluarga.

## Voice & Guardrails
### Tone of Voice
Hangat, Otentik, Tradisional

### Do's (Keywords & Phrases to Use)
- Resep rempah turun-temurun
- Masak kayu bakar
- Tanpa MSG
- Halal & sehat

### Don'ts (Guardrails)
- Tidak ada istilah modern seperti "gourmet" atau "fusion"
- Hindari bahasa korporat atau marketing hype
- Jangan gunakan istilah teknis tanpa penjelasan

## Content Pillars
| Pillar | Description | Allocation |
|--------|-------------|------------|
| 1. Resep Tradisional | Penjelasan resep, cara masak, tips | 40% |
| 2. Kuliner Nusantara | Cerita budaya, bahan lokal | 30% |
| 3. Keluarga Indonesia | Testimoni, momen keluarga | 20% |
| 4. Kesehatan & Halal | Info gizi, kehalalan | 10% |

## Channels (Active Platforms)
- Instagram
- TikTok
- Facebook
- WhatsApp Business

## Brand Assets Needed
- Logo variasi (horizontal, vertical)
- Color palette (merah, coklat, emas)
- Typography (font tradisional)
`

console.log('parseBrandProfileMarkdown:')
const parsed = parseBrandProfileMarkdown(sampleMarkdown)

check('client name', parsed.clientName === 'Pawon Sengon', parsed.clientName)
check('whoWeAre non-empty', parsed.whoWeAre.length > 50, parsed.whoWeAre.length)
check('audiencePersona non-empty', parsed.audiencePersona.length > 20, parsed.audiencePersona.length)
check('tone has 3 items', parsed.voice.tone.length === 3, parsed.voice.tone)
check('tone[0] === Hangat', parsed.voice.tone[0] === 'Hangat', parsed.voice.tone[0])
check('dos has 4 items', parsed.voice.dos.length === 4, parsed.voice.dos)
check('donts has 3 items', parsed.voice.donts.length === 3, parsed.voice.donts)
check('pillars has 4 items', parsed.pillars.length === 4, parsed.pillars.length)
check('pillar total = 100', calculateTotalPercentage(parsed.pillars) === 100, calculateTotalPercentage(parsed.pillars))
check('channels has 4 items', parsed.channels.length === 4, parsed.channels)
check('brandAssets has 3 items', parsed.brandAssets.length === 3, parsed.brandAssets)

console.log('\nserializeBrandProfile:')
const serialized = serializeBrandProfile(parsed)
check('has title', serialized.includes('# Brand Profile — Pawon Sengon'))
check('has Who We Are', serialized.includes('## Who We Are'))
check('has pillars table header', serialized.includes('| Pillar | Description | Allocation |'))
check('has tone text', serialized.includes('Hangat'))
check('has channel bullet', serialized.includes('- Instagram'))

console.log('\nround-trip (serialize → parse):')
const reparsed = parseBrandProfileMarkdown(serialized)
check('client name stable', reparsed.clientName === parsed.clientName, reparsed.clientName)
check('pillars stable', reparsed.pillars.length === parsed.pillars.length, reparsed.pillars.length)
check('channels stable', reparsed.channels.join(',') === parsed.channels.join(','), reparsed.channels)
check('tone stable', reparsed.voice.tone.join(',') === parsed.voice.tone.join(','), reparsed.voice.tone)

    console.log('')
    if (failures > 0) {
      throw new Error(`${failures} assertion(s) failed`)
    }
  })
})