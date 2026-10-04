'use server'

import { createClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { mediaAdapter } from '@/lib/media/adapter'
import { logAudit } from '@/lib/audit/log'
import type {
  Asset,
  AssetFileType,
  AssetListFilters,
  AssetUploadResponse,
  BatchResult,
} from './types'

const MAX_BYTES = 25 * 1024 * 1024
const MAX_BATCH = 100
const MAX_TAGS = 20
const MAX_TAG_LENGTH = 40
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']

function fileTypeOf(mime: string): AssetFileType {
  return mime.startsWith('video/') ? 'video' : 'image'
}

function rowToAsset(row: Record<string, unknown>): Asset {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    url: row.url as string,
    publicId: row.public_id as string,
    fileType: row.file_type as AssetFileType,
    tags: (row.tags as string[]) ?? [],
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
  }
}

function normalizeTags(input: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of input) {
    const tag = raw.trim().toLowerCase()
    if (!tag) continue
    if (tag.length > MAX_TAG_LENGTH) continue
    if (seen.has(tag)) continue
    seen.add(tag)
    out.push(tag)
    if (out.length >= MAX_TAGS) break
  }
  return out
}

/**
 * Resolve the caller's profile. Throws on missing session or when the caller
 * has no business reading this client's data.
 *
 * Returns the auth user id so callers can attribute audit rows.
 */
async function authorizeFor(clientId: string): Promise<{ userId: string; isAdmin: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized: no session')

  const { data: profile, error } = await supabase
    .from('users')
    .select('role, client_id')
    .eq('id', user.id)
    .single()

  if (error) throw new Error(`Failed to load profile: ${error.message}`)

  const isAdmin = profile?.role === 'admin'
  if (!isAdmin && profile?.client_id !== clientId) {
    throw new Error('Forbidden: caller cannot access this client')
  }

  return { userId: user.id, isAdmin }
}

export async function listAssets(filters: AssetListFilters): Promise<Asset[]> {
  const { userId } = await authorizeFor(filters.clientId)
  void userId

  const supabase = await createClient()
  let query = supabase
    .from('assets')
    .select('id, client_id, url, public_id, file_type, tags, sort_order, created_at')
    .eq('client_id', filters.clientId)

  if (filters.fileType) {
    query = query.eq('file_type', filters.fileType)
  }
  if (filters.tag) {
    query = query.contains('tags', [filters.tag])
  }

  const { data, error } = await query
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => rowToAsset(row as Record<string, unknown>))
}

export async function uploadAsset(clientId: string, file: File): Promise<AssetUploadResponse> {
  const fail = (error: string): AssetUploadResponse => ({
    asset: null as unknown as Asset,
    success: false,
    error,
  })

  let userId: string
  try {
    userId = (await authorizeFor(clientId)).userId
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Authorization failed')
  }

  if (file.size > MAX_BYTES) return fail('File exceeds the 25MB limit')
  if (!ALLOWED_TYPES.includes(file.type)) return fail(`Unsupported file type: ${file.type}`)
  if (!mediaAdapter.isConfigured()) return fail('Media storage is not configured')

  const fileType = fileTypeOf(file.type)
  const upload = await mediaAdapter.uploadFile(file, `frhm/${clientId}`)
  if (!upload.success) return fail(upload.error)

  const admin = createSupabaseServiceClient()
  const { data: asset, error } = await admin
    .from('assets')
    .insert({
      client_id: clientId,
      url: upload.url,
      public_id: upload.publicId,
      file_type: fileType,
    })
    .select('id, client_id, url, public_id, file_type, tags, sort_order, created_at')
    .single()

  if (error) return fail(`Failed to record asset: ${error.message}`)

  const created = asset as Record<string, unknown>

  void logAudit({
    actorId: userId,
    action: 'asset.upload',
    entityType: 'asset',
    entityId: created.id as string,
    clientId,
    summary: `Uploaded a ${fileType} asset for client ${clientId}`,
    metadata: { publicId: upload.publicId, fileType, size: file.size },
  })

  return { asset: rowToAsset(created), success: true }
}

export async function deleteAsset(assetId: string, clientId: string): Promise<{ success: boolean; error?: string }> {
  let userId: string
  try {
    userId = (await authorizeFor(clientId)).userId
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Authorization failed' }
  }

  const admin = createSupabaseServiceClient()
  const { data: asset, error: findError } = await admin
    .from('assets')
    .select('public_id')
    .eq('id', assetId)
    .eq('client_id', clientId)
    .maybeSingle()

  if (findError) return { success: false, error: findError.message }
  if (!asset) return { success: false, error: 'Asset not found' }

  const { error } = await admin.from('assets').delete().eq('id', assetId).eq('client_id', clientId)
  if (error) return { success: false, error: error.message }

  void logAudit({
    actorId: userId,
    action: 'asset.delete',
    entityType: 'asset',
    entityId: assetId,
    clientId,
    summary: `Deleted an asset from client ${clientId}`,
    metadata: { publicId: (asset as { public_id: string }).public_id },
  })

  return { success: true }
}

/**
 * Delete many assets in one tenant-scoped statement. The client_id predicate is
 * applied on every row so a caller can never reach across tenants.
 */
export async function deleteAssets(assetIds: string[], clientId: string): Promise<BatchResult> {
  if (assetIds.length === 0) return { success: false, affected: 0, error: 'No assets selected' }
  if (assetIds.length > MAX_BATCH) {
    return { success: false, affected: 0, error: `Batch limit is ${MAX_BATCH} assets` }
  }

  let userId: string
  try {
    userId = (await authorizeFor(clientId)).userId
  } catch (err) {
    return { success: false, affected: 0, error: err instanceof Error ? err.message : 'Authorization failed' }
  }

  const admin = createSupabaseServiceClient()
  const { count, error } = await admin
    .from('assets')
    .delete({ count: 'exact' })
    .in('id', assetIds)
    .eq('client_id', clientId)

  if (error) return { success: false, affected: 0, error: error.message }

  void logAudit({
    actorId: userId,
    action: 'asset.batch_delete',
    entityType: 'asset',
    clientId,
    summary: `Deleted ${count ?? 0} assets from client ${clientId}`,
    metadata: { ids: assetIds, count: count ?? 0 },
  })

  return { success: true, affected: count ?? 0 }
}

/**
 * Merge tags into the selected assets. Existing tags are preserved (union),
 * never overwritten.
 */
export async function tagAssets(assetIds: string[], clientId: string, tags: string[]): Promise<BatchResult> {
  if (assetIds.length === 0) return { success: false, affected: 0, error: 'No assets selected' }
  if (assetIds.length > MAX_BATCH) {
    return { success: false, affected: 0, error: `Batch limit is ${MAX_BATCH} assets` }
  }

  const normalized = normalizeTags(tags)
  if (normalized.length === 0) {
    return { success: false, affected: 0, error: 'No valid tags provided' }
  }

  let userId: string
  try {
    userId = (await authorizeFor(clientId)).userId
  } catch (err) {
    return { success: false, affected: 0, error: err instanceof Error ? err.message : 'Authorization failed' }
  }

  const admin = createSupabaseServiceClient()

  // Read current tags first so the merge is additive, not destructive.
  const { data: current, error: readError } = await admin
    .from('assets')
    .select('id, tags')
    .in('id', assetIds)
    .eq('client_id', clientId)

  if (readError) return { success: false, affected: 0, error: readError.message }
  if (!current || current.length === 0) return { success: false, affected: 0, error: 'No matching assets found' }

  const updates = (current as Array<{ id: string; tags: string[] }>).map((row) => {
    const merged = new Set([...(row.tags ?? []), ...normalized])
    return { id: row.id, tags: Array.from(merged).sort() }
  })

  let affected = 0
  for (const update of updates) {
    const { error } = await admin
      .from('assets')
      .update({ tags: update.tags })
      .eq('id', update.id)
      .eq('client_id', clientId)
    if (!error) affected += 1
  }

  void logAudit({
    actorId: userId,
    action: 'asset.batch_tag',
    entityType: 'asset',
    clientId,
    summary: `Tagged ${affected} assets on client ${clientId} with [${normalized.join(', ')}]`,
    metadata: { ids: assetIds, tags: normalized, count: affected },
  })

  return { success: true, affected }
}

/**
 * Persist a manual grid order. Each id is written at its index in `orderedIds`,
 * scoped to the caller's client. Ids that do not belong to the tenant are simply
 * ignored by the row predicate rather than raising.
 *
 * Fails on duplicates up front: a repeated id would otherwise give two assets the
 * same position and the resulting ordering is ambiguous.
 */
export async function reorderAssets(
  clientId: string,
  orderedIds: string[]
): Promise<BatchResult> {
  if (orderedIds.length === 0) {
    return { success: false, affected: 0, error: 'No assets provided' }
  }
  if (new Set(orderedIds).size !== orderedIds.length) {
    return { success: false, affected: 0, error: 'Duplicate asset ids in order' }
  }

  let userId: string
  try {
    userId = (await authorizeFor(clientId)).userId
  } catch (err) {
    return {
      success: false,
      affected: 0,
      error: err instanceof Error ? err.message : 'Authorization failed',
    }
  }

  const admin = createSupabaseServiceClient()

  // Await every update so the reported `affected` count is real, not a guess
  // about writes that may still be in flight.
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      admin
        .from('assets')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('client_id', clientId)
        .then(({ error }: { error: Error | null }) => !error)
    )
  )
  const failed = results.filter((ok) => !ok).length
  const affected = results.length - failed

  void logAudit({
    actorId: userId,
    action: 'asset.reorder',
    entityType: 'asset',
    clientId,
    summary: `Reordered ${orderedIds.length} assets for client ${clientId}`,
    metadata: { ids: orderedIds, count: orderedIds.length },
  })

  if (failed > 0) {
    return { success: false, affected, error: `${failed} update(s) failed` }
  }

  return { success: true, affected: orderedIds.length }
}
