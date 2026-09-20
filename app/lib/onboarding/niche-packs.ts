/**
 * Shared onboarding constants and helpers — deliberately NOT a 'use client' module,
 * so both the client dialog and the server route can import it without pulling
 * client components into the server bundle.
 */

export const NICHE_OPTIONS = [
  { id: 'fnb', label: 'F&B / Kuliner' },
  { id: 'fashion', label: 'Fashion & Apparel' },
  { id: 'personal-brand', label: 'Personal Brand / Creator' },
  { id: 'b2b', label: 'B2B / Corporate / Agency' },
  { id: 'ecommerce', label: 'E-Commerce & Retail' },
  { id: 'beauty', label: 'Health & Beauty' },
  { id: 'other', label: 'Other / Lainnya' },
] as const

export type NicheId = typeof NICHE_OPTIONS[number]['id']

// Map niche ID to skill pack slugs (always includes social-media-starter-kit).
// Every slug here must exist in the seeded skill_packs catalogue (see app/scripts/seed_skills.py).
export const NICHE_PACK_MAP: Record<NicheId, string[]> = {
  fnb: [
    'social-media-starter-kit',
    'instagram-reels-growth',
    'tiktok-growth',
    'facebook-growth',
    'visual-design',
    'engagement-community',
    'analytics-optimization',
  ],
  fashion: [
    'social-media-starter-kit',
    'instagram-reels-growth',
    'tiktok-growth',
    'pinterest-growth',
    'visual-design',
    'engagement-community',
    'analytics-optimization',
  ],
  'personal-brand': [
    'social-media-starter-kit',
    'linkedin-growth',
    'x-twitter-growth',
    'youtube-creator-kit',
    'video-creation-studio',
    'ai-voice-music',
    'engagement-community',
    'analytics-optimization',
  ],
  b2b: [
    'social-media-starter-kit',
    'linkedin-growth',
    'x-twitter-growth',
    'content-calendar-planning',
    'analytics-optimization',
    'agency-client-management',
  ],
  ecommerce: [
    'social-media-starter-kit',
    'instagram-reels-growth',
    'tiktok-growth',
    'facebook-growth',
    'visual-design',
    'analytics-optimization',
    'engagement-community',
  ],
  beauty: [
    'social-media-starter-kit',
    'instagram-reels-growth',
    'tiktok-growth',
    'visual-design',
    'engagement-community',
    'analytics-optimization',
  ],
  other: [
    'social-media-starter-kit',
    'instagram-reels-growth',
    'tiktok-growth',
    'analytics-optimization',
  ],
}

// Build the system prompt for brand-profile generation
export function buildBrandProfilePrompt(
  clientName: string,
  niche: NicheId,
  targetAudience: string,
  products: string,
  usp: string
): string {
  const nicheLabel = NICHE_OPTIONS.find((n) => n.id === niche)?.label ?? niche
  return `You are an expert Brand Strategist and Social Media Consultant. Your task is to synthesize a complete Brand Profile document (brand-profile.md) from the given inputs.

CLIENT NAME: ${clientName}
NICHE / INDUSTRY: ${nicheLabel}
TARGET AUDIENCE: ${targetAudience || 'Not specified'}
CORE PRODUCTS / SERVICES: ${products || 'Not specified'}
UNIQUE SELLING PROPOSITION (USP): ${usp || 'Not specified'}

You must output ONLY a valid JSON object with this exact structure:
{
  "brand_profile_md": "string (full markdown content of brand-profile.md)"
}

The brand-profile.md MUST follow this exact template and include ALL sections:

# Brand Profile — ${clientName}

## Who We Are
[Elevator pitch: what this brand does, who it serves, and its unique value. 2-3 sentences.]

## Audience Persona
[Detailed persona based on target audience and niche. Include demographics, psychographics, pain points, desires, and buying triggers.]

## Voice & Guardrails
### Tone of Voice
[3-5 adjectives describing the brand voice. e.g., Warm, Authentic, Expert, Approachable]

### Do's (Keywords & Phrases to Use)
[Bullet list of words/phrases that reinforce the brand voice]

### Don'ts (Guardrails)
[Bullet list of words/phrases to avoid. e.g., No corporate jargon, No hard selling, No technical terms without explanation]

## Content Pillars
[Exactly 4 pillars with name, description, and percentage allocation. Must sum to 100%.]
| Pillar | Description | Allocation |
|--------|-------------|------------|
| 1. [Name] | [What this pillar covers] | 40% |
| 2. [Name] | [What this pillar covers] | 30% |
| 3. [Name] | [What this pillar covers] | 20% |
| 4. [Name] | [What this pillar covers] | 10% |

## Channels (Active Platforms)
[List the 3-5 most relevant platforms for this niche with recommended handle format. e.g., Instagram, TikTok, LinkedIn, YouTube, X/Twitter]

## Brand Assets Needed
[List of required assets: Logo variations, Color palette, Typography, Photo/Video style guide, Brand voice guide]

---

CRITICAL RULES:
- Output ONLY the JSON object, no markdown fences, no extra text.
- The brand_profile_md value must be a single string with literal \\n newlines.
- All sections above MUST be present.
- Tone and pillars must be tailored to the niche and USP.
- If inputs are generic, infer best-practice defaults for the niche.
`
}
