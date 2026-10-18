import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchPendingUsers, approvePendingUser } from './service'

describe('pending-users service', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetchPendingUsers calls GET /api/admin/pending-users', async () => {
    const mockData = {
      pendingUsers: [{ id: '1', email: 'bebekbek9191@gmail.com', fullName: 'Bima', provider: 'google', createdAt: '', role: null, clientId: null }],
      count: 1,
      clients: [{ id: 'c1', name: 'Taraju' }],
    }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response)

    const result = await fetchPendingUsers()
    expect(result).toEqual(mockData)
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/pending-users', expect.objectContaining({
      method: 'GET',
    }))
  })

  it('fetchPendingUsers throws error on non-ok response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Akses ditolak' }),
    } as Response)

    await expect(fetchPendingUsers()).rejects.toThrow('Akses ditolak')
  })

  it('approvePendingUser calls POST /api/admin/pending-users with JSON payload', async () => {
    const payload = {
      userId: 'user-1',
      role: 'admin' as const,
      clientId: null,
    }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, message: 'Berhasil' }),
    } as Response)

    const result = await approvePendingUser(payload)
    expect(result.ok).toBe(true)
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/pending-users', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }))
  })

  it('approvePendingUser throws error when api fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'User tidak ditemukan' }),
    } as Response)

    await expect(approvePendingUser({ userId: 'u1', role: 'client', clientId: 'c1' })).rejects.toThrow('User tidak ditemukan')
  })
})
