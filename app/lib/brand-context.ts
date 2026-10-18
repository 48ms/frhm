import type { BrandProfile } from "@/features/social-accounts/api/types"

/**
 * Pure brand-context helpers.
 *
 * These functions contain no server-only dependencies, yet the editor
 * dialog (a client component) needs them. Keeping them in a module that also
 * imports `@/lib/supabase/server` (which pulls in `next/headers`) dragged the
 * server client into the client bundle and broke the production build. They
 * live here so both the server service and client components can share them.
 */

/** Helper to extract content under a markdown ## section */
function extractH2Section(md: string, headerName: string): string | null {
  const escaped = headerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(?:^|\\n)##\\s+${escaped}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, "i")
  const match = md.match(regex)
  return match ? match[1].trim() : null
}

/**
 * Reverse-engineer standard brand-profile.md back into the BrandProfile JSON
 * structure so that editing the markdown also keeps clients.brand_profile
 * updated in real-time.
 *
 * Fully supports upstream Social-Media-Skills 10 Canonical Pillars:
 * 1. Identity (aliased to who)
 * 2. Positioning (aliased to pov)
 * 3. Audience
 * 4. Voice
 * 5. Proof
 * 6. Offers & CTAs
 * 7. Channels
 * 8. Operational defaults
 * 9. Guardrails
 * 10. Show, don't tell — example posts
 *
 * Also maintains 100% backward compatibility for legacy 6-section stub headers.
 */
export function markdownToBrandProfile(md: string): Partial<BrandProfile> {
  const result: Partial<BrandProfile> = {}

  // 1. Identity / Who We Are
  const identity = extractH2Section(md, "Identity") ?? extractH2Section(md, "Who We Are")
  if (identity) {
    result.identity = identity
    result.who = identity
  }

  // 2. Positioning / Point of View
  const positioning = extractH2Section(md, "Positioning")
  if (positioning) {
    result.positioning = positioning
    result.pov = positioning
  } else {
    const legacyPov = md.match(/### Point of View\s+([\s\S]*?)(?=\n###|\n##|$)/i)
    if (legacyPov) {
      const val = legacyPov[1].trim()
      result.positioning = val
      result.pov = val
    }
  }

  // 3. Audience / Audience Persona
  const audience = extractH2Section(md, "Audience") ?? extractH2Section(md, "Audience Persona")
  if (audience) {
    result.audience = audience
  }

  // 4. Voice
  // If legacy "## Voice & Guardrails" exists, extract subheader "### Tone of Voice"
  const isLegacyVoiceAndGuardrails = /(?:^|\n)##\s+Voice\s*&\s*Guardrails/i.test(md)
  if (isLegacyVoiceAndGuardrails) {
    const legacyVoice = md.match(/### Tone of Voice\s+([\s\S]*?)(?=\n###|\n##|$)/i)
    if (legacyVoice) result.voice = legacyVoice[1].trim()
  } else {
    const canonicalVoice = extractH2Section(md, "Voice")
    if (canonicalVoice) result.voice = canonicalVoice
  }

  // 5. Proof
  const proof = extractH2Section(md, "Proof")
  if (proof) {
    result.proof = proof
  } else {
    const legacyProof = md.match(/### Proof & Credibility\s+([\s\S]*?)(?=\n###|\n##|$)/i)
    if (legacyProof) result.proof = legacyProof[1].trim()
  }

  // 6. Offers & CTAs
  const offers = extractH2Section(md, "Offers & CTAs") ?? extractH2Section(md, "Offers")
  if (offers) {
    result.offers_ctas = offers
  }

  // 7. Channels
  const channels = extractH2Section(md, "Channels")
  if (channels) {
    result.channels = channels
  }

  // 8. Operational defaults
  const ops = extractH2Section(md, "Operational defaults") ?? extractH2Section(md, "Operational Defaults")
  if (ops) {
    result.operational_defaults = ops
  }

  // 9. Guardrails
  if (isLegacyVoiceAndGuardrails) {
    const legacyGuardrails = md.match(/### Do's and Don'ts \(Guardrails\)\s+([\s\S]*?)(?=\n###|\n##|$)/i)
    if (legacyGuardrails) result.guardrails = legacyGuardrails[1].trim()
  } else {
    const canonicalGuardrails = extractH2Section(md, "Guardrails")
    if (canonicalGuardrails) result.guardrails = canonicalGuardrails
  }

  // 10. Show, don't tell — example posts
  const examples =
    extractH2Section(md, "Show, don't tell — example posts") ??
    extractH2Section(md, "Show, don't tell") ??
    extractH2Section(md, "Examples")
  if (examples) {
    result.examples = examples
  }

  // Notes
  const notes = extractH2Section(md, "Notes")
  if (notes) {
    result.notes = notes
  }

  // Content Pillars
  const pillarsSection = extractH2Section(md, "Content Pillars")
  if (pillarsSection) {
    const rawPillars = pillarsSection
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("-") || line.startsWith("*"))
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean)
    if (rawPillars.length > 0) {
      result.pillars = rawPillars
    }
  }

  return result
}

/**
 * Render the BrandProfile JSON into the upstream Social-Media-Skills canonical brand-profile.md shape.
 */
export function brandProfileToMarkdown(
  profile: Partial<BrandProfile>,
  clientName?: string
): string {
  const name =
    clientName ||
    (profile.who && profile.who.length < 50 ? profile.who : null) ||
    "Client"

  const identityText = profile.identity || profile.who || ""
  const positioningText = profile.positioning || profile.pov || ""
  const audienceText = profile.audience || ""
  const voiceText = profile.voice || ""
  const proofText = profile.proof || ""
  const offersText = profile.offers_ctas || ""
  const channelsText = Array.isArray(profile.channels)
    ? profile.channels.map((c) => `- ${c}`).join("\n")
    : profile.channels || ""
  const opsText = profile.operational_defaults || ""
  const guardrailsText = profile.guardrails || ""
  const examplesText = profile.examples || ""
  const notesText = profile.notes || ""
  const pillarsText = (profile.pillars ?? [])
    .map((p) => (p.startsWith("-") ? p : `- ${p}`))
    .join("\n")

  const sections: string[] = [
    `# Brand Profile — ${name}`,
    `<!-- version: 1.0 · review: quarterly or on rebrand/pivot/new offer -->`,
    "",
    "## Identity",
    identityText,
    "",
    "## Positioning",
    positioningText,
    "",
    "## Audience",
    audienceText,
    "",
    "## Voice",
    voiceText,
    "",
    "## Proof",
    proofText,
    "",
    "## Offers & CTAs",
    offersText,
    "",
    "## Channels",
    channelsText,
    "",
    "## Operational defaults",
    opsText,
    "",
    "## Guardrails",
    guardrailsText,
    "",
    "## Show, don't tell — example posts",
    examplesText,
  ]

  if (pillarsText.trim()) {
    sections.push("", "## Content Pillars", pillarsText)
  }

  if (notesText.trim()) {
    sections.push("", "## Notes", notesText)
  }

  return sections.join("\n").trim() + "\n"
}

/**
 * Construct the compiled brand context exact string that Copilot prompt consumes.
 */
export function compileBrandContext(clientName: string, files: Record<string, string>): string {
  const sections: string[] = []

  const bp = files["brand-profile.md"]
  if (bp?.trim()) {
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

  if (files["audience.md"]?.trim()) {
    sections.push(`## Audience Research & Voice of Customer\n${files["audience.md"]}`)
  }

  if (files["social-strategy.md"]?.trim()) {
    sections.push(`## Social Media Strategy & Platform Choices\n${files["social-strategy.md"]}`)
  }

  if (files["goals-and-kpis.md"]?.trim()) {
    sections.push(`## Goals, SMART Targets & North Star Metrics\n${files["goals-and-kpis.md"]}`)
  }

  if (files["content-calendar.md"]?.trim()) {
    sections.push(`## Content Calendar & Recurring Cadence\n${files["content-calendar.md"]}`)
  }

  if (files["offers.md"]?.trim()) {
    sections.push(`## Offers & Product Catalog\n${files["offers.md"]}`)
  }

  if (files["style-guide.md"]?.trim()) {
    sections.push(`## Visual Style Guide & Creative Rules\n${files["style-guide.md"]}`)
  }

  if (files["campaign-plan.md"]?.trim()) {
    sections.push(`## Active Campaigns & Launch Plans\n${files["campaign-plan.md"]}`)
  }

  // Include any other specialized strategic client documents (e.g., competitor-analysis.md, etc.)
  const knownKeys = new Set([
    "brand-profile.md",
    "voice.md",
    "content-pillars.md",
    "guardrails.md",
    "audience.md",
    "social-strategy.md",
    "goals-and-kpis.md",
    "content-calendar.md",
    "offers.md",
    "style-guide.md",
    "campaign-plan.md",
  ])

  for (const [key, content] of Object.entries(files)) {
    if (!knownKeys.has(key) && content?.trim() && key.endsWith(".md")) {
      const heading = key.replace(/\.md$/, "").replace(/[-_]/g, " ").toUpperCase()
      sections.push(`## Specialized Strategic Document: ${heading}\n${content.trim()}`)
    }
  }

  return sections.join("\n\n---\n\n")
}
