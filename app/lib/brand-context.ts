import type { BrandProfile } from "@/features/social-accounts/api/types"

/**
 * Pure brand-context helpers.
 *
 * These two functions contain no server-only dependencies, yet the editor
 * dialog (a client component) needs them. Keeping them in a module that also
 * imports `@/lib/supabase/server` (which pulls in `next/headers`) dragged the
 * server client into the client bundle and broke the production build. They
 * live here so both the server service and client components can share them.
 */

/**
 * Reverse-engineer standard brand-profile.md back into the BrandProfile JSON
 * structure so that editing the markdown also keeps clients.brand_profile
 * updated in real-time.
 */
export function markdownToBrandProfile(md: string): Partial<BrandProfile> {
  const result: Partial<BrandProfile> = {}

  const whoMatch = md.match(/## Who We Are\s+([\s\S]*?)(?=\n##|$)/i)
  if (whoMatch) result.who = whoMatch[1].trim()

  const audMatch = md.match(/## Audience Persona\s+([\s\S]*?)(?=\n##|$)/i)
  if (audMatch) result.audience = audMatch[1].trim()

  const voiceMatch = md.match(/### Tone of Voice\s+([\s\S]*?)(?=\n###|\n##|$)/i)
  if (voiceMatch) result.voice = voiceMatch[1].trim()

  const povMatch = md.match(/### Point of View\s+([\s\S]*?)(?=\n###|\n##|$)/i)
  if (povMatch) result.pov = povMatch[1].trim()

  const proofMatch = md.match(/### Proof & Credibility\s+([\s\S]*?)(?=\n###|\n##|$)/i)
  if (proofMatch) result.proof = proofMatch[1].trim()

  const guardMatch = md.match(/### Do's and Don'ts \(Guardrails\)\s+([\s\S]*?)(?=\n###|\n##|$)/i)
  if (guardMatch) result.guardrails = guardMatch[1].trim()

  const pillarsMatch = md.match(/## Content Pillars\s+([\s\S]*?)(?=\n##|$)/i)
  if (pillarsMatch) {
    const rawPillars = pillarsMatch[1]
      .split("\n")
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean)
    if (rawPillars.length > 0) {
      result.pillars = rawPillars
    }
  }

  return result
}

/**
 * Construct the compiled brand context exact string that Copilot prompt consumes.
 */
export function compileBrandContext(clientName: string, files: Record<string, string>): string {
  const sections: string[] = []

  const bp = files["brand-profile.md"]
  if (bp) {
    sections.push(bp)
  } else {
    sections.push(
      `# Brand Profile — ${clientName}\n\n(belum ada brand-profile.md; buat dulu sebelum skill lain dijalankan)`
    )
  }

  if (files["voice.md"]?.trim()) {
    sections.push(`## Brand Voice & Tone Guide\n${files["voice.md"]}`)
  }

  if (files["content-pillars.md"]?.trim()) {
    sections.push(`## Content Pillars & Focus Areas\n${files["content-pillars.md"]}`)
  }

  if (files["guardrails.md"]?.trim()) {
    sections.push(`## Brand Guardrails & Never-List\n${files["guardrails.md"]}`)
  }

  return sections.join("\n\n---\n\n")
}
