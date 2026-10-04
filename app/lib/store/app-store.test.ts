import { describe, it, expect, beforeEach } from "vitest"

/**
 * Fase 0 , Client Store (TDD, RED dulu).
 * Store ini adalah single source of truth untuk data MUTABLE sesi:
 * campaigns + social accounts + posts. Seed dari Mock Repository.
 */
import { useAppStore } from "@/lib/store/app-store"

// Helper: reset store ke kondisi seed sebelum tiap test (isolasi).
beforeEach(() => {
  useAppStore.getState().reset()
})

const newCampaignInput = {
  name: "Test Campaign",
  type: "campaign" as const,
  startDate: "2026-10-01",
  endDate: "2026-10-31",
  color: "#4353FF",
  notes: "Catatan test",
}

describe("AppStore — campaigns", () => {
  it("berisi seed dari Mock Repository saat dibuka pertama kali", () => {
    const campaigns = useAppStore.getState().campaigns
    expect(campaigns.length).toBeGreaterThan(0)
    // Seed harus berisi campaign dari CAMPAIGNS yang sudah ada
    expect(campaigns.some((c) => c.name === "Summer Drop 2026")).toBe(true)
  })

  it("addCampaign memasukkan campaign baru DAN bertambah ukuran listnya", () => {
    const before = useAppStore.getState().campaigns.length
    useAppStore.getState().addCampaign({
      ...newCampaignInput,
      clientId: "client-shell",
    })
    const after = useAppStore.getState().campaigns
    expect(after.length).toBe(before + 1)
    expect(after.some((c) => c.name === "Test Campaign")).toBe(true)
  })

  it("addCampaign membuat id unik (forced unique, bukan index)", () => {
    useAppStore.getState().addCampaign({ ...newCampaignInput, clientId: "client-shell" })
    useAppStore.getState().addCampaign({ ...newCampaignInput, clientId: "client-shell" })
    const campaigns = useAppStore.getState().campaigns.filter((c) => c.name === "Test Campaign")
    expect(campaigns.length).toBe(2)
    expect(campaigns[0].id).not.toBe(campaigns[1].id)
  })

  it("updateCampaign mengubah field yang ada tanpa mengganti id", () => {
    useAppStore.getState().addCampaign({ ...newCampaignInput, clientId: "client-shell" })
    const created = useAppStore.getState().campaigns.find((c) => c.name === "Test Campaign")!
    useAppStore.getState().updateCampaign(created.id, { notes: "Catatan diupdate" })
    const updated = useAppStore.getState().campaigns.find((c) => c.id === created.id)!
    expect(updated.notes).toBe("Catatan diupdate")
    expect(updated.name).toBe("Test Campaign") // field lain tak terganggu
  })

  it("removeCampaign menghapus campaign yang dimaksud (bukan yang lain)", () => {
    useAppStore.getState().addCampaign({ ...newCampaignInput, clientId: "client-shell" })
    const created = useAppStore.getState().campaigns.find((c) => c.name === "Test Campaign")!
    useAppStore.getState().removeCampaign(created.id)
    const after = useAppStore.getState().campaigns
    expect(after.some((c) => c.id === created.id)).toBe(false)
    // campaign lain masih utuh
    expect(after.some((c) => c.name === "Summer Drop 2026")).toBe(true)
  })

  it("campaignByClient memfilter dengan benar per client", () => {
    const store = useAppStore.getState()
    store.addCampaign({ ...newCampaignInput, clientId: "client-wizard" })
    const wizardCampaigns = store.campaignByClient("client-wizard")
    expect(wizardCampaigns.length).toBeGreaterThan(0)
    expect(wizardCampaigns.every((c) => c.clientId === "client-wizard")).toBe(true)
  })
})

describe("AppStore — social accounts", () => {
  it("berisi seed akun dari Mock Repository", () => {
    const accounts = useAppStore.getState().accounts
    expect(accounts.length).toBeGreaterThan(0)
    expect(accounts.some((a) => a.handle === "@shell.creative")).toBe(true)
  })

  it("connectAccount menambah akun baru ke client yang benar", () => {
    const before = useAppStore.getState().accounts.length
    useAppStore.getState().connectAccount({
      clientId: "client-shell",
      platform: "Twitter / X",
      handle: "@newaccount",
    })
    const after = useAppStore.getState().accounts
    expect(after.length).toBe(before + 1)
    expect(after.some((a) => a.handle === "@newaccount")).toBe(true)
  })

  it("disconnectAccount menghapus akun yang dipilih saja", () => {
    useAppStore.getState().connectAccount({
      clientId: "client-shell",
      platform: "Twitter / X",
      handle: "@newaccount",
    })
    const target = useAppStore.getState().accounts.find((a) => a.handle === "@newaccount")!
    useAppStore.getState().disconnectAccount(target.id)
    const after = useAppStore.getState().accounts
    expect(after.some((a) => a.id === target.id)).toBe(false)
    // akun lain masih ada
    expect(after.some((a) =>a.handle === "@shell.creative")).toBe(true)
  })

  it("refreshAccount memperbarui status akun jadi SYNCED", () => {
    useAppStore.getState().connectAccount({
      clientId: "client-shell",
      platform: "Twitter / X",
      handle: "@newaccount",
    })
    const target = useAppStore.getState().accounts.find((a) => a.handle === "@newaccount")!
    useAppStore.getState().refreshAccount(target.id)
    const refreshed = useAppStore.getState().accounts.find((a) => a.id === target.id)!
    expect(refreshed.status).toBe("SYNCED")
  })

  it("connectAccount menyimpan meta visual (icon/bg/fg/fans) dari modal", () => {
    useAppStore.getState().connectAccount({
      clientId: "client-shell",
      platform: "Instagram",
      handle: "@ig.new",
      fans: "1.2K fans",
      icon: "photo_camera",
      bg: "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600",
      fg: "text-white",
    })
    const acc = useAppStore.getState().accounts.find((a) => a.handle === "@ig.new")!
    expect(acc.icon).toBe("photo_camera")
    expect(acc.fans).toBe("1.2K fans")
    expect(acc.bg).toContain("amber-400")
  })

  it("accountsByClient memfilter akun per client dengan benar", () => {
    const store = useAppStore.getState()
    store.connectAccount({
      clientId: "client-aura",
      platform: "Facebook",
      handle: "@aura.fb",
    })
    const auraAccounts = store.accountsByClient("client-aura")
    expect(auraAccounts.length).toBeGreaterThan(0)
    expect(auraAccounts.every((a) => a.clientId === "client-aura")).toBe(true)
  })

  it("clientsWithAccounts mengembalikan client dengan akun live (bukan seed statis)", () => {
    useAppStore.getState().connectAccount({
      clientId: "client-aura",
      platform: "Facebook",
      handle: "@aura.fb",
      fans: "100 fans",
      icon: "hub",
      bg: "bg-[#1877F2]",
      fg: "text-white",
    })
    useAppStore.getState().disconnectAccount("acc-aura-1")

    const live = useAppStore.getState().clientsWithAccounts()
    const aura = live.find((c) => c.id === "client-aura")!
    expect(aura.accounts.some((a) => a.handle === "@aura.fb")).toBe(true)
    expect(aura.accounts.some((a) => a.id === "acc-aura-1")).toBe(false)
  })

  it("updateAccount mengubah field akun tanpa mengganti id", () => {
    const target = useAppStore.getState().accounts[0]
    useAppStore.getState().updateAccount(target.id, { handle: "@updated", fans: "1M fans" })
    const updated = useAppStore.getState().accounts.find((a) => a.id === target.id)!
    expect(updated.handle).toBe("@updated")
    expect(updated.fans).toBe("1M fans")
    expect(updated.platform).toBe(target.platform) // field lain tak terganggu
  })

  it("accountStats menghitung total, synced persen, dan reach agregat dari data nyata", () => {
    const stats = useAppStore.getState().accountStats()
    const accounts = useAppStore.getState().accounts
    expect(stats.totalChannels).toBe(accounts.length)
    // seed punya 1 akun ACTION_NEEDED, jadi persen < 100 tapi > 0
    expect(stats.syncedPercent).toBeGreaterThan(0)
    expect(stats.syncedPercent).toBeLessThan(100)
    // reach agregat = jumlah fans numerik (dalam ribuan)
    expect(stats.aggregateReachK).toBeGreaterThan(0)
  })

  it("accountStats melaporkan status FAILED sebagai tidak_SYNCED", () => {
    useAppStore.getState().updateAccount("acc-shell-1", { status: "FAILED" })
    const stats = useAppStore.getState().accountStats()
    expect(stats.syncedPercent).toBeLessThan(100)
    // restore seed
    useAppStore.getState().updateAccount("acc-shell-1", { status: "SYNCED" })
  })

  it("Action Needed count = jumlah akun dengan status bukan SYNCED", () => {
    const baseline = useAppStore.getState().actionNeededCount()
    useAppStore.getState().updateAccount("acc-shell-1", { status: "ACTION_NEEDED" })
    useAppStore.getState().updateAccount("acc-wiz-1", { status: "TOKEN_EXPIRING" })
    const acn = useAppStore.getState().actionNeededCount()
    expect(acn).toBe(baseline + 2)
    // restore
    useAppStore.getState().updateAccount("acc-shell-1", { status: "SYNCED" })
    useAppStore.getState().updateAccount("acc-wiz-1", { status: "SYNCED" })
  })

  it("actionNeededAccounts mengembalikan akun yang butuh penanganan", () => {
    useAppStore.getState().updateAccount("acc-shell-3", { status: "FAILED" })
    const needed = useAppStore.getState().actionNeededAccounts()
    expect(needed.some((a) => a.id === "acc-shell-3")).toBe(true)
    // restore
    useAppStore.getState().updateAccount("acc-shell-3", { status: "SYNCED" })
  })

  it("accountStats menurun saat akun disconnect (bukan angka statis)", () => {
    const before = useAppStore.getState().accountStats().totalChannels
    const target = useAppStore.getState().accounts.find((a) => a.status === "SYNCED")!
    useAppStore.getState().disconnectAccount(target.id)
    const after = useAppStore.getState().accountStats()
    expect(after.totalChannels).toBe(before - 1)
    expect(after.syncedPercent).toBeLessThan(100)
  })
})

describe("AppStore — posts (pipeline content queue)", () => {
  it("berisi seed post dari Mock Repository", () => {
    const posts = useAppStore.getState().posts
    expect(posts.length).toBeGreaterThan(0)
  })

  it("schedulePost menambah post baru ber-status scheduled", () => {
    const before = useAppStore.getState().posts.length
    useAppStore.getState().schedulePost({
      clientId: "client-shell",
      title: "Post Test",
      caption: "Caption test",
      channel: "Instagram",
      scheduledAt: "2026-10-05T18:00:00",
    })
    const after = useAppStore.getState().posts
    expect(after.length).toBe(before + 1)
    const created = after.find((p) => p.title === "Post Test")!
    expect(created.status).toBe("scheduled")
  })

  it("addSocialClient menambahkan client baru ke socialClients", () => {
    const before = useAppStore.getState().socialClients.length
    useAppStore.getState().addSocialClient({
      name: "Test Brand",
    })
    const after = useAppStore.getState().socialClients
    expect(after.length).toBe(before + 1)
    const created = after.find((c) => c.name === "Test Brand")!
    expect(created.shortName).toBe("Test Brand")
  })
})
