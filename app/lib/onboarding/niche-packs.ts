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
