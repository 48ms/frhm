import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { env } from "./env"

describe("lib/env (Rule 15 Zod Env Validation)", () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("berhasil memvalidasi client env dengan URL valid", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "anon-key-123"

    expect(env.client.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co")
    expect(env.client.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe("anon-key-123")
  })

  it("berhasil memvalidasi server env di lingkungan node", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "anon-key-123"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-secret-xyz"

    expect(env.server.SUPABASE_SERVICE_ROLE_KEY).toBe("service-role-secret-xyz")
  })

  it("mencegah akses server env jika berada di lingkungan browser", () => {
    ;(globalThis as Record<string, unknown>).__SIMULATE_BROWSER__ = true
    try {
      expect(() => env.server).toThrow(/DILARANG mengakses getServerEnv\(\) di sisi browser/)
    } finally {
      delete (globalThis as Record<string, unknown>).__SIMULATE_BROWSER__
    }
  })
})
