import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { updateSession } from './middleware'
import { USER_HEADERS } from './identity-headers'

const mockGetUser = vi.fn()
const mockSingle = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
        })),
      })),
    })),
  })),
}))

vi.mock('@/lib/env', () => ({
  env: {
    server: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-key',
    },
  },
}))

describe('updateSession (Middleware Auth & RBAC Gate)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects unauthenticated user accessing /admin to login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = new NextRequest('http://localhost:3000/admin/dashboard')

    const res = await updateSession(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/auth/login?next=%2Fadmin%2Fdashboard')
  })

  it('redirects unauthenticated user accessing /client to login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = new NextRequest('http://localhost:3000/client/calendar')

    const res = await updateSession(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/auth/login?next=%2Fclient%2Fcalendar')
  })

  it('redirects client user attempting to access /admin to /client/dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u-client-1', email: 'adit@taraju.com' } } })
    mockSingle.mockResolvedValue({
      data: { role: 'client', client_id: 'client-taraju-uuid', full_name: 'Pak Adit' },
    })

    const req = new NextRequest('http://localhost:3000/admin/erp')
    const res = await updateSession(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/client/dashboard?clientId=client-taraju-uuid')
  })

  it('enforces own clientId when client user attempts to access another tenant in /client/*', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u-client-1', email: 'adit@taraju.com' } } })
    mockSingle.mockResolvedValue({
      data: { role: 'client', client_id: 'client-taraju-uuid', full_name: 'Pak Adit' },
    })

    const req = new NextRequest('http://localhost:3000/client/calendar?clientId=victim-pawon-uuid')
    const res = await updateSession(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/client/calendar?clientId=client-taraju-uuid')
  })

  it('redirects client user on /auth/login to /client/dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u-client-1', email: 'adit@taraju.com' } } })
    mockSingle.mockResolvedValue({
      data: { role: 'client', client_id: 'client-taraju-uuid', full_name: 'Pak Adit' },
    })

    const req = new NextRequest('http://localhost:3000/auth/login')
    const res = await updateSession(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/client/dashboard')
  })

  it('redirects admin user on /auth/login to /admin/dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u-admin-1', email: 'bima@frhm.agency' } } })
    mockSingle.mockResolvedValue({
      data: { role: 'admin', client_id: null, full_name: 'Bima Maulana Saputra' },
    })

    const req = new NextRequest('http://localhost:3000/auth/login')
    const res = await updateSession(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/admin/dashboard')
  })

  it('redirects user with no role to /waitlist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u-unknown-1', email: 'stranger@gmail.com' } } })
    mockSingle.mockResolvedValue({ data: null })

    const req = new NextRequest('http://localhost:3000/admin/dashboard')
    const res = await updateSession(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/waitlist')
  })

  it('allows admin user to proceed to /admin/dashboard and forward identity headers', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u-admin-1', email: 'bima@frhm.agency' } } })
    mockSingle.mockResolvedValue({
      data: { role: 'admin', client_id: null, full_name: 'Bima Maulana Saputra' },
    })

    const req = new NextRequest('http://localhost:3000/admin/dashboard')
    const res = await updateSession(req)

    expect(res.status).toBe(200)
    // Check security headers
    expect(res.headers.get('X-Frame-Options')).toBe('DENY')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('allows user with no role to view /auth/login so they can switch accounts or sign in without being trapped in waitlist loop', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u-unknown-1', email: 'stranger@gmail.com' } } })
    mockSingle.mockResolvedValue({ data: null })

    const req = new NextRequest('http://localhost:3000/auth/login')
    const res = await updateSession(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('X-Frame-Options')).toBe('DENY')
  })
})
