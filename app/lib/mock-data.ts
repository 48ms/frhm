/**
 * Mock Repository , Fast Prototype data source.
 *
 * Single source of dummy data for the prototype phase. When real data is wired
 * in later, swap the exports in this file (or the call sites importing them)
 * without touching UI components.
 *
 * Numbers are generated deterministically (seeded by post id) so server and
 * client renders agree , no hydration mismatch, no flickering on refresh.
 */

export type MockClient = {
  id: string
  name: string
}

export type MockCampaign = {
  id: string
  name: string
  type: string
  start_date: string | null
  end_date: string | null
  color: string | null
  notes: string | null
  client_id: string
}

export type MockScheduledPost = {
  id: string
  client_id: string
  title: string
  campaign_tag: string | null
  scheduled_at: string
  platform: string
  status: string
}

export type MockPostMetric = {
  post_id: string
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  clicks: number
  wa_inquiries: number
  dm_inquiries: number
}

// ─── Clients ────────────────────────────────────────────────────────────────

export const MOCK_CLIENTS: MockClient[] = [
  { id: 'client-shell', name: 'B2B Shell Representatives' },
  { id: 'client-wizard', name: 'E2E Wizard Corp' },
  { id: 'client-aura', name: 'Aura Luxury Group' },
]

// ─── Campaigns ──────────────────────────────────────────────────────────────

const today = new Date()
function isoDaysAgo(days: number): string {
  const d = new Date(today)
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}
function isoDaysAhead(days: number): string {
  return isoDaysAgo(-days)
}

export const MOCK_CAMPAIGNS: MockCampaign[] = [
  {
    id: 'camp-ramadan',
    name: 'Ramadan Promo',
    type: 'promo',
    start_date: isoDaysAgo(40),
    end_date: isoDaysAhead(10),
    color: '#4335EF',
    notes: 'Boost menu paket buka puasa',
    client_id: 'client-shell',
  },
  {
    id: 'camp-lebaran',
    name: 'Lebaran Hampers',
    type: 'campaign',
    start_date: isoDaysAhead(5),
    end_date: isoDaysAhead(35),
    color: '#B775FC',
    notes: 'Pre-order hampers Lebaran',
    client_id: 'client-shell',
  },
  {
    id: 'camp-tani',
    name: 'Petani Lokal',
    type: 'branding',
    start_date: isoDaysAgo(60),
    end_date: isoDaysAgo(10),
    color: '#526600',
    notes: 'Kisah petani sengon di balik produk',
    client_id: 'client-wizard',
  },
  {
    id: 'camp-brew',
    name: 'Brewing 101',
    type: 'edukasi',
    start_date: isoDaysAgo(25),
    end_date: isoDaysAhead(15),
    color: '#D4FF32',
    notes: 'Series edukasi seduh manual',
    client_id: 'client-aura',
  },
  {
    id: 'camp-wedding',
    name: 'Wedding Season',
    type: 'campaign',
    start_date: isoDaysAgo(15),
    end_date: isoDaysAhead(45),
    color: '#FB7185',
    notes: 'Paket bunga pernikahan',
    client_id: 'client-aura',
  },
]

// ─── Scheduled posts ────────────────────────────────────────────────────────

type PostSeed = {
  id: string
  client_id: string
  title: string
  campaign_tag: string | null
  daysAgo: number
  platform: string
}

const POST_SEEDS: PostSeed[] = [
  { id: 'post-001', client_id: 'client-shell', title: 'Menu Buka Puasa Hemat', campaign_tag: 'ramadan promo', daysAgo: 30, platform: 'instagram' },
  { id: 'post-002', client_id: 'client-shell', title: 'Kolam Renang Family Package', campaign_tag: 'ramadan promo', daysAgo: 25, platform: 'tiktok' },
  { id: 'post-003', client_id: 'client-shell', title: 'Testimoni Pengunjung', campaign_tag: 'ramadan promo', daysAgo: 20, platform: 'instagram' },
  { id: 'post-004', client_id: 'client-shell', title: 'Behind The Scene Dapur', campaign_tag: null, daysAgo: 12, platform: 'facebook' },
  { id: 'post-005', client_id: 'client-shell', title: 'Pre Order Hampers', campaign_tag: 'lebaran hampers', daysAgo: -3, platform: 'instagram' },

  { id: 'post-006', client_id: 'client-wizard', title: 'Kisah Pak Slamet', campaign_tag: 'petani lokal', daysAgo: 45, platform: 'instagram' },
  { id: 'post-007', client_id: 'client-wizard', title: 'Proses Panen Sengon', campaign_tag: 'petani lokal', daysAgo: 35, platform: 'tiktok' },
  { id: 'post-008', client_id: 'client-wizard', title: 'Resep Olahan Sengon', campaign_tag: null, daysAgo: 18, platform: 'facebook' },

  { id: 'post-009', client_id: 'client-aura', title: 'V60 Seduh Manual', campaign_tag: 'brewing 101', daysAgo: 20, platform: 'instagram' },
  { id: 'post-010', client_id: 'client-aura', title: 'Pilih Bijak Menggiling', campaign_tag: 'brewing 101', daysAgo: 8, platform: 'tiktok' },

  { id: 'post-011', client_id: 'client-aura', title: 'Bouquet Buket Wisuda', campaign_tag: 'wedding season', daysAgo: 14, platform: 'instagram' },
  { id: 'post-012', client_id: 'client-aura', title: 'Mekar di Pagi Hari', campaign_tag: null, daysAgo: 5, platform: 'facebook' },
]

export const MOCK_SCHEDULED_POSTS: MockScheduledPost[] = POST_SEEDS.map((s) => {
  const d = new Date(today)
  d.setDate(d.getDate() - s.daysAgo)
  d.setHours(9, 0, 0, 0)
  return {
    id: s.id,
    client_id: s.client_id,
    title: s.title,
    campaign_tag: s.campaign_tag,
    scheduled_at: d.toISOString(),
    platform: s.platform,
    status: s.daysAgo >= 0 ? 'published' : 'scheduled',
  }
})

// ─── Deterministic metric generator ─────────────────────────────────────────

/**
 * Deterministic string hash (FNV-1a variant) → 32-bit int.
 */
function hashId(id: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Map a seed to a number in [min, max] with a predictable spread.
 */
function seededRange(seed: number, salt: number, min: number, max: number): number {
  const x = (seed ^ (salt * 0x9e3779b9)) >>> 0
  // xorshift mix for a smoother distribution
  let v = x
  v ^= v << 13
  v ^= v >>> 17
  v ^= v << 5
  v >>>= 0
  const t = v / 0xffffffff
  return Math.round(min + t * (max - min))
}

export function generateMockMetrics(posts: MockScheduledPost[]): MockPostMetric[] {
  return posts.map((p) => {
    const seed = hashId(p.id)
    const reach = seededRange(seed, 1, 1200, 18500)
    // Engagement is a rough funnel of reach.
    const likes = Math.round(reach * (0.03 + (seededRange(seed, 2, 0, 40) / 1000)))
    const comments = Math.round(likes * 0.08)
    const shares = Math.round(likes * 0.05)
    const saves = Math.round(likes * 0.12)
    const clicks = Math.round(reach * (0.01 + (seededRange(seed, 3, 0, 30) / 1000)))
    const waInquiries = Math.round(clicks * 0.12)
    const dmInquiries = Math.round(clicks * 0.07)
    return {
      post_id: p.id,
      reach,
      likes,
      comments,
      shares,
      saves,
      clicks,
      wa_inquiries: waInquiries,
      dm_inquiries: dmInquiries,
    }
  })
}
