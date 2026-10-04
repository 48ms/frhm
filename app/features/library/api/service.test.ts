import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uploadAsset, deleteAsset, listAssets, deleteAssets, tagAssets, reorderAssets } from '@/features/library/api/service'

// Shared tracked rows.
const inserted: Array<Record<string, unknown>> = []

let mockRole: 'admin' | 'client' = 'admin'
let mockClientId = 'client-A'

function createUserRow(role: string, clientId: string) {
  return { role, client_id: clientId }
}

function createAssetRow(row: Record<string, unknown>) {
  return { id: 'asset-new', ...row }
}

// Build a supabase-chain factory per mockSupabase() call.
function mockSupabase() {
  const chain: Record<string, unknown> = {
    select: () => chain,
    eq: (_field: string, value: unknown) => chain,
    insert: (row: Record<string, unknown>) => {
      const asset = createAssetRow(row)
      inserted.push(asset)
      return chain
    },
    delete: () => chain,
    // `single()` for 'users' table → user profile row.
    single: async () => ({
      data: createUserRow(mockRole, mockClientId),
      error: null,
    }),
    maybeSingle: async () => ({ data: { public_id: 'p-1' }, error: null }),
    // `order()` chains (callable repeatedly) and is awaitable, mirroring the
    // real PostgREST builder used with two .order() calls.
    order: () => chain,
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: inserted.map(createAssetRow), error: null }).then(resolve),
  }
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'u-1' } } }) },
    from: () => mockSupabase(),
  }),
}))

// Service client must have `.from()` returning a chain distinct from the server one.
function mockServiceChain() {
  const chain = {
    select: () => chain,
    eq: (_field: string, value: unknown) => chain,
    insert: (row: Record<string, unknown>) => {
      const asset = createAssetRow(row)
      inserted.push(asset)
      return chain
    },
    delete: () => chain,
    single: async () => ({
      data: {
        id: 'asset-new',
        client_id: inserted[inserted.length - 1]?.client_id ?? mockClientId,
        url: 'https://res.cloudinary.com/demo/x.jpg',
        public_id: 'demo/x',
        file_type: 'image',
        created_at: new Date().toISOString(),
      },
      error: null,
    }),
    maybeSingle: async () => ({ data: { public_id: 'p-1' }, error: null }),
    order: async () => ({ data: inserted.map(createAssetRow), error: null }),
  }
  return chain
}

vi.mock('@/lib/supabase/service', () => ({
  createSupabaseServiceClient: () => ({
    from: () => mockServiceChain(),
  }),
}))

vi.mock('@/lib/media/adapter', () => ({
  mediaAdapter: {
    isConfigured: () => true,
    uploadFile: async () => ({
      success: true as const,
      url: 'https://res.cloudinary.com/demo/x.jpg',
      publicId: 'demo/x',
    }),
    deleteFile: async () => true,
  },
}))

vi.mock('@/lib/audit/log', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

const png = new File(
  [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  'test.png',
  { type: 'image/png' }
)

describe('library service — tenant isolation & validation', () => {
  beforeEach(() => {
    inserted.length = 0
    mockRole = 'admin'
    mockClientId = 'client-A'
  })

  it('rejects an oversized file before touching storage', async () => {
    const big = new File([new Uint8Array(30 * 1024 * 1024)], 'big.mp4', { type: 'video/mp4' })
    const res = await uploadAsset('client-A', big)
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/25MB/)
    expect(inserted).toHaveLength(0)
  })

  it('rejects an unsupported mime type', async () => {
    const exe = new File([new Uint8Array(8)], 'evil.exe', { type: 'application/x-msdownload' })
    const res = await uploadAsset('client-A', exe)
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Unsupported/)
    expect(inserted).toHaveLength(0)
  })

  it('forbids a client user from uploading to another tenant', async () => {
    mockRole = 'client'
    mockClientId = 'client-A'
    const res = await uploadAsset('client-B', png)
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Forbidden/)
    expect(inserted).toHaveLength(0)
  })

  it('allows an admin to upload for any client', async () => {
    const res = await uploadAsset('client-B', png)
    expect(res.success).toBe(true)
    expect(res.asset.clientId).toBe('client-B')
    expect(inserted[0]).toMatchObject({ client_id: 'client-B', file_type: 'image' })
  })

  it('returns assets for an admin without throwing on mismatched clientId', async () => {
    mockRole = 'admin'
    const res = await listAssets({ clientId: 'client-B' })
    expect(Array.isArray(res)).toBe(true)
  })

  it('forbids a client user from listing another tenant', async () => {
    mockRole = 'client'
    mockClientId = 'client-A'
    // authorizeFor throws for non-admin + mismatch; service listsAssets does not catch, so expect rejection.
    await expect(listAssets({ clientId: 'client-B' })).rejects.toThrow(/Forbidden/)
  })

  it('forbids a client user from deleting another tenant asset', async () => {
    mockRole = 'client'
    mockClientId = 'client-A'
    const res = await deleteAsset('asset-1', 'client-B')
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Forbidden/)
  })
})

describe('library service — tag normalization & batch guards', () => {
  beforeEach(() => {
    inserted.length = 0
    mockRole = 'admin'
    mockClientId = 'client-A'
  })

  it('rejects batch ops with no selection', async () => {
    const res = await tagAssets([], 'client-A', ['promo'])
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/No assets selected/)
  })

  it('rejects tagging with empty tags', async () => {
    const res = await tagAssets(['asset-1'], 'client-A', ['  '])
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/No valid tags/)
  })

  it('rejects a client user from batch tagging another tenant', async () => {
    mockRole = 'client'
    mockClientId = 'client-A'
    const res = await tagAssets(['asset-1'], 'client-B', ['promo'])
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Forbidden/)
  })
})

describe('library service — reorder', () => {
  beforeEach(() => {
    inserted.length = 0
    mockRole = 'admin'
    mockClientId = 'client-A'
  })

  it('rejects a reorder with no ids', async () => {
    const res = await reorderAssets('client-A', [])
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/No assets/i)
  })

  it('rejects a reorder containing duplicate ids', async () => {
    const res = await reorderAssets('client-A', ['a-1', 'a-1'])
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/duplicate/i)
  })

  it('forbids a client user from reordering another tenant', async () => {
    mockRole = 'client'
    mockClientId = 'client-A'
    const res = await reorderAssets('client-B', ['a-1', 'a-2'])
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Forbidden/)
  })
})
