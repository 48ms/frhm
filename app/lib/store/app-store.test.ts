import { describe, it, expect, beforeEach } from "vitest"

/**
 * Fase 0: Client Store (TDD).
 * Store ini adalah single source of truth untuk data MUTABLE sesi:
 * campaigns + social accounts + posts.
 * Migrasi FAKTUAL: Seed awal sekarang KOSONG (DB-factual).
 */
import { useAppStore } from "@/lib/store/app-store"

// Helper: reset store ke kondisi seed (empty) sebelum tiap test (isolasi).
beforeEach(() => {
  useAppStore.getState().reset()
})

describe("AppStore — social accounts", () => {
  it("berisi state kosong setelah reset (factual seed)", () => {
    const accounts = useAppStore.getState().accounts
    const clients = useAppStore.getState().socialClients
    expect(accounts.length).toBe(0)
    expect(clients.length).toBe(0)
  })

  it("connectAccount menambah akun baru ke client yang benar", () => {
    // Hubungi client dulu karena seed kosong
    useAppStore.getState().addSocialClient({ name: "Test Client" })
    const before = useAppStore.getState().accounts.length
    useAppStore.getState().connectAccount({
      clientId: useAppStore.getState().socialClients[0].id,
      platform: "Twitter / X",
      handle: "@newaccount",
    })
    const after = useAppStore.getState().accounts
    expect(after.length).toBe(before + 1)
    expect(after.some((a) => a.handle === "@newaccount")).toBe(true)
  })

  it("disconnectAccount menghapus akun yang dipilih saja", () => {
    const client = useAppStore.getState().socialClients[0]
    if (!client) useAppStore.getState().addSocialClient({ name: "Test Client" })
    const id = useAppStore.getState().socialClients[0]?.id
    useAppStore.getState().connectAccount({
      clientId: id!,
      platform: "Twitter / X",
      handle: "@newaccount",
    })
    const target = useAppStore.getState().accounts.find((a) => a.handle === "@newaccount")!
    useAppStore.getState().disconnectAccount(target.id)
    const after = useAppStore.getState().accounts
    expect(after.some((a) => a.id === target.id)).toBe(false)
  })

  it("updateAccount mengubah field akun tanpa mengganti id", () => {
    const client = useAppStore.getState().socialClients[0]
    if (!client) useAppStore.getState().addSocialClient({ name: "Test Client" })
    useAppStore.getState().connectAccount({
      clientId: useAppStore.getState().socialClients[0].id,
      platform: "Instagram",
      handle: "@original",
    })
    const target = useAppStore.getState().accounts[0]
    useAppStore.getState().updateAccount(target.id, { handle: "@updated", fans: "1M fans" })
    const updated = useAppStore.getState().accounts.find((a) => a.id === target.id)!
    expect(updated.handle).toBe("@updated")
    expect(updated.fans).toBe("1M fans")
    expect(updated.platform).toBe("Instagram")
  })
})

describe("AppStore — posts (pipeline content queue)", () => {
  it("berisi state kosong setelah reset (factual seed)", () => {
    const posts = useAppStore.getState().posts
    expect(posts.length).toBe(0)
  })

  it("schedulePost menambah post baru ber-status scheduled", () => {
    const client = useAppStore.getState().socialClients[0]
    if (!client) useAppStore.getState().addSocialClient({ name: "Test Client" })
    const before = useAppStore.getState().posts.length
    useAppStore.getState().schedulePost({
      clientId: client?.id ?? useAppStore.getState().socialClients[0].id,
      title: "Post Test",
      caption: "Caption test",
      channel: "Instagram",
      scheduledAt: new Date().toISOString(),
      status: "scheduled",
    })
    const after = useAppStore.getState().posts
    expect(after.length).toBe(before + 1)
    expect(after[after.length - 1].status).toBe("scheduled")
  })

  it("addPost menambah post baru ke pipeline", () => {
    const before = useAppStore.getState().posts.length
    useAppStore.getState().addPost({
      clientId: "client-1",
      title: "Add Post",
      caption: "Test",
      platform: "Facebook",
      status: "draft",
      scheduledAt: new Date().toISOString(),
      author: "Author",
    })
    const after = useAppStore.getState().posts
    expect(after.length).toBe(before + 1)
    expect(after[after.length - 1].platform).toBe("Facebook")
  })

  it("removePost menghapus post berdasarkan id", () => {
    const client = useAppStore.getState().socialClients[0]
    if (!client) useAppStore.getState().addSocialClient({ name: "Test Client" })
    useAppStore.getState().schedulePost({
      clientId: client?.id ?? useAppStore.getState().socialClients[0].id,
      title: "Remove Me",
      caption: "X",
      channel: "Twitter",
      scheduledAt: new Date().toISOString(),
    })
    const target = useAppStore.getState().posts.find((p) => p.title === "Remove Me")!
    useAppStore.getState().removePost(target.id)
    expect(useAppStore.getState().posts.some((p) => p.id === target.id)).toBe(false)
  })

  it("reset mengembalikan state ke awal (kosong)", () => {
    useAppStore.getState().addPost({
      clientId: "client-1",
      title: "Resettable",
      caption: "C",
      platform: "IG",
      status: "draft",
      scheduledAt: new Date().toISOString(),
      author: "A",
    })
    useAppStore.getState().reset()
    expect(useAppStore.getState().posts.length).toBe(0)
    expect(useAppStore.getState().accounts.length).toBe(0)
    expect(useAppStore.getState().socialClients.length).toBe(0)
  })
})
