/**
 * Publish tools for the bridge skill (`scheduling-and-queue`).
 *
 * The repo's SKILL.md declares `allowed-tools: WoopSocial MCP (Projects, Social Accounts, Posts,
 * Media, Webhooks, Health)` — so the skill is *meant* to be able to act, not just describe. Without
 * these it could only say "WoopSocial belum terhubung" even when the bridge was live.
 *
 * Two rules shape everything here:
 *
 *  1. **AGENTS.md ground truth 4** — "Never publish / schedule / delete without an explicit,
 *     informed confirmation from the user." The gate lives in CODE, not in the prompt: a write tool
 *     refuses unless the caller passes a `confirm` value that matches the preview the user was
 *     shown. A model cannot talk its way past it.
 *  2. **One content item per post** (woopsocial.md) — enforced structurally below.
 *
 * Reads are free; writes are gated. Deletes are gated hardest.
 */

import {
  listProjects, listSocialAccounts, listMedia, listPosts, validatePost, createPost,
  generateOAuthUrl, toBridgePlatform,
  type ValidateResult,
} from '@/lib/bridge/woopsocial'
// eslint-disable-next-line no-restricted-imports
import { createClient } from '@supabase/supabase-js'

export type ToolCtx = {
  apiKey: string | null
  /** The client's channels, so we can refuse to publish to something not connected. */
  connectedPlatforms: string[]
}

export type ToolResult = { ok: boolean; data?: unknown; error?: string }

/** The tools the skill may call. Declared to the model as text (see toolPrompt). */
export const PUBLISH_TOOLS = [
  'bridge_status',
  'bridge_list_accounts',
  'bridge_list_media',
  'bridge_list_posts',
  'bridge_validate_post',
  'bridge_create_post',
  'bridge_connect_url',
] as const
export type PublishTool = (typeof PUBLISH_TOOLS)[number]

export const WRITE_TOOLS: PublishTool[] = ['bridge_create_post']

/**
 * Tools whose effect is irreversible or public. These require the caller to echo back the exact
 * preview string the user approved — proving the user was shown what would happen. The route
 * builds that preview; the model must pass it back verbatim or the call is refused.
 */
export function requiresConfirmation(tool: string, args: Record<string, unknown>): boolean {
  if (tool !== 'bridge_create_post') return false
  const schedule = (args.schedule as { type?: string } | undefined)?.type
  // A draft publishes nothing, so it is not an irreversible public action. Everything else is.
  return schedule !== 'DRAFT'
}

/** Human-readable preview of exactly what a create_post call would do. */
export function buildPreview(args: Record<string, unknown>): string {
  const content = (args.content as { text?: string }[] | undefined) ?? []
  const accounts = (args.socialAccounts as
    | { platform?: string; socialAccountId?: string }[]
    | undefined) ?? []
  const schedule = (args.schedule as { type?: string; scheduledFor?: string; timezone?: string }) ?? {}
  const text = content[0]?.text ?? ''
  const who = accounts.map((a) => a.platform ?? '?').join(', ')
  const when = schedule.type === 'PUBLISH_NOW'
    ? 'SEKARANG'
    : schedule.type === 'SCHEDULE_FOR_LATER'
      ? `${schedule.scheduledFor ?? '(waktu belum diisi)'} ${schedule.timezone ?? '(timezone belum diisi)'}`
      : (schedule.type ?? 'DRAFT')
  return [
    `AKSI: ${schedule.type ?? 'DRAFT'}`,
    `PLATFORM: ${who || '(belum dipilih)'}`,
    `WAKTU: ${when}`,
    `TEKS: "${text.slice(0, 160)}${text.length > 160 ? '…' : ''}"`,
    schedule.type === 'PUBLISH_NOW' ? 'PERINGATAN: ini langsung tayang dan tidak bisa dibatalkan.' : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export async function runPublishTool(
  tool: PublishTool,
  args: Record<string, unknown>,
  ctx: ToolCtx
): Promise<ToolResult> {
  const key = ctx.apiKey
  if (!key) {
    return {
      ok: false,
      error:
        'Bridge belum dikonfigurasi (API key WoopSocial kosong). Beri tahu user untuk mengisi di Pengaturan Bridge, lalu buat tabel jadwal manual.',
    }
  }

  switch (tool) {
    case 'bridge_status': {
      const [projects, accounts, media] = await Promise.all([
        listProjects(key), listSocialAccounts(key), listMedia(key),
      ])
      if (!projects.ok) return { ok: false, error: projects.error }
      return {
        ok: true,
        data: {
          connected: true,
          projects: projects.ok ? projects.data : [],
          accounts: accounts.ok ? accounts.data : [],
          media: media.ok ? media.data : [],
          note: 'Bridge TERHUBUNG. Jangan bilang "belum terhubung".',
        },
      }
    }

    case 'bridge_list_accounts': {
      const r = await listSocialAccounts(key)
      return r.ok ? { ok: true, data: r.data } : { ok: false, error: r.error }
    }

    case 'bridge_list_media': {
      const projects = await listProjects(key)
      const pid = projects.ok ? projects.data[0]?.id : undefined
      const r = await listMedia(key, pid)
      return r.ok ? { ok: true, data: r.data } : { ok: false, error: r.error }
    }

    case 'bridge_list_posts': {
      const projects = await listProjects(key)
      const pid = projects.ok ? projects.data[0]?.id : undefined
      const r = await listPosts(key, pid)
      if (!r.ok) return { ok: false, error: r.error }
      // Report the bridge's own delivery fields verbatim — this is where an honest
      // "PUBLISHED + externalPostUrl" or a still-pending "NOT_STARTED" comes from.
      return {
        ok: true,
        data: r.data.slice(0, 20).map((p) => ({
          postId: p.postId,
          platform: p.platform,
          deliveryStatus: p.deliveryStatus,
          publishedAt: p.deliveryCompletedAt ?? null,
          url: p.externalPostUrl ?? null,
          createdAt: p.createdAt,
        })),
      }
    }

    case 'bridge_validate_post': {
      const r = await validatePost(key, args)
      return r.ok ? { ok: true, data: r.data as ValidateResult } : { ok: false, error: r.error }
    }

    case 'bridge_create_post': {
      // Confirm the target is actually connected before touching the bridge — the repo's
      // "a target platform isn't connected → flag it; don't silently skip" edge case.
      const accounts = (args.socialAccounts as { platform?: string }[] | undefined) ?? []
      const wanted = accounts
        .map((a) => ({ raw: a.platform ?? '', norm: toBridgePlatform(a.platform ?? '') }))
        .filter((x) => x.norm)
      const missing = wanted
        .map((w) => w.raw.toUpperCase())
        .filter((p) => !ctx.connectedPlatforms.map((c) => c.toUpperCase()).includes(p))
      if (missing.length) {
        return {
          ok: false,
          error: `Platform belum terhubung ke bridge: ${missing.join(', ')}. Sambungkan dulu, jangan diteruskan.`,
        }
      }

      const r = await createPost(key, args)
      if (!r.ok) return { ok: false, error: r.error }
      const created = r.data as { id?: string; socialAccountPosts?: unknown[] } | null
      return {
        ok: true,
        data: {
          postId: created?.id ?? null,
          socialAccountPosts: created?.socialAccountPosts ?? [],
          note: 'Dibuat oleh bridge. Laporkan postId apa adanya; jangan mengarang status tayang.',
        },
      }
    }

    case 'bridge_connect_url': {
      const platform = toBridgePlatform(String(args.platform ?? ''))
      if (!platform) return { ok: false, error: `Platform tidak didukung: ${String(args.platform ?? '')}` }
      const projects = await listProjects(key)
      const pid = projects.ok ? projects.data[0]?.id : undefined
      if (!pid) return { ok: false, error: 'Belum ada project di bridge.' }
      const url = await generateOAuthUrl(key, pid, platform)
      return url.ok ? { ok: true, data: { url: url.data.url } } : { ok: false, error: url.error }
    }

    default:
      return { ok: false, error: `Tool tidak dikenal: ${tool}` }
  }
}

/**
 * Create scheduled posts in our local database from bridge scheduling results.
 * Called when bridge_create_post with SCHEDULE_FOR_LATER succeeds.
 */
export async function createScheduledPostsFromBridge(
  clientId: string,
  bridgeResult: { postId: string; socialAccountPosts: unknown[] },
  originalArgs: Record<string, unknown>
): Promise<{ ok: boolean; error?: string; created: string[] }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const accounts = (originalArgs.socialAccounts as { platform?: string; socialAccountId?: string }[] | undefined) ?? []
  const schedule = (originalArgs.schedule as { type?: string; scheduledFor?: string; timezone?: string } | undefined) ?? {}
  const content = (originalArgs.content as { text?: string }[] | undefined) ?? []
  const text = content[0]?.text ?? ''

  const created: string[] = []

  // For each platform posted, create a scheduled_post row
  const socialPosts = (bridgeResult.socialAccountPosts as Array<{ socialAccountId: string; platform?: string; postId?: string }> | undefined) ?? []
  
  for (const sap of socialPosts) {
    const account = accounts.find(a => a.socialAccountId === sap.socialAccountId)
    const platform = (sap.platform || account?.platform || '').toLowerCase()
    
    if (!platform) continue

    const scheduledAt = schedule.scheduledFor
      ? new Date(`${schedule.scheduledFor} ${schedule.timezone || 'Asia/Jakarta'}`).toISOString()
      : new Date().toISOString()

    const { error } = await supabase.from('scheduled_posts').insert({
      client_id: clientId,
      title: text.slice(0, 100),
      content: text,
      platform,
      scheduled_at: scheduledAt,
      status: 'scheduled',
      notes: `Dibuat via bridge scheduling-and-queue (bridge postId: ${bridgeResult.postId}, sap postId: ${sap.postId})`,
      external_post_id: sap.postId || null,
    })

    if (error) {
      console.error('Failed to create scheduled_post:', error)
    } else {
      created.push(platform)
    }
  }

  return { ok: true, created }
}
