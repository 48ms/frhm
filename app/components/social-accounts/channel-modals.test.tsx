import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TokenHealthModal, ChannelDetailDrawer } from "./channel-modals"
import type { SocialAccount, SocialClient } from "./social-data"

const client: SocialClient = {
  id: "client-test",
  name: "Test Client",
  shortName: "Test",
  initials: "TC",
  tagline: "Testing",
  accounts: [],
}

const account: SocialAccount = {
  id: "acc-test-1",
  platform: "Instagram",
  handle: "@test.handle",
  fans: "428K fans",
  status: "SYNCED",
  icon: "photo_camera",
  bg: "bg-black",
  fg: "text-white",
}

describe("TokenHealthModal — aksesibilitas & interaksi", () => {
  it("render dengan role=dialog dan nama aksesibel dari judul (aria-labelledby)", () => {
    render(
      <TokenHealthModal
        account={account}
        client={client}
        open={true}
        onClose={() => {}}
        onRefreshed={() => {}}
      />
    )
    // shadcn/Base UI memberi nama aksesibel lewat aria-labelledby -> DialogTitle,
    // bukan aria-label manual. getByRole({ name }) memvalidasi kontrak itu.
    const dialog = screen.getByRole("dialog", { name: /token health/i })
    expect(dialog).toBeTruthy()
    expect(dialog.getAttribute("data-slot")).toBe("dialog-content")
    expect(dialog.textContent).toContain("Instagram")
  })

  it("menutup dialog saat tombol Escape ditekan", () => {
    const onClose = vi.fn()
    render(
      <TokenHealthModal
        account={account}
        client={client}
        open={true}
        onClose={onClose}
        onRefreshed={() => {}}
      />
    )
    const dialog = screen.getByRole("dialog")
    fireEvent.keyDown(dialog, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("tidak render saat open=false", () => {
    const { container } = render(
      <TokenHealthModal
        account={account}
        client={client}
        open={false}
        onClose={() => {}}
        onRefreshed={() => {}}
      />
    )
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it("punya tombol close dari primitive shadcn", () => {
    render(
      <TokenHealthModal
        account={account}
        client={client}
        open={true}
        onClose={() => {}}
        onRefreshed={() => {}}
      />
    )
    const closeBtn = document.querySelector('[data-slot="dialog-close"]')
    expect(closeBtn).toBeTruthy()
    expect(closeBtn?.textContent).toContain("Close")
  })

  it("menampilkan metrics deterministik yang BERBEDA antar akun (R-17)", () => {
    const accountB: SocialAccount = {
      ...account,
      id: "acc-test-9999",
      handle: "@different.handle",
    }

    const { unmount } = render(
      <ChannelDetailDrawer
        account={account}
        client={client}
        open={true}
        onClose={() => {}}
        onManage={() => {}}
        onReconnect={() => {}}
      />
    )
    const firstMetrics = Array.from(
      document.querySelectorAll('[role="dialog"] .grid span:first-child')
    ).map((el) => el.textContent)
    unmount()

    render(
      <ChannelDetailDrawer
        account={accountB}
        client={client}
        open={true}
        onClose={() => {}}
        onManage={() => {}}
        onReconnect={() => {}}
      />
    )
    const secondMetrics = Array.from(
      document.querySelectorAll('[role="dialog"] .grid span:first-child')
    ).map((el) => el.textContent)

    // Bukan angka statis yang sama untuk semua akun
    expect(firstMetrics).not.toEqual(secondMetrics)
    expect(firstMetrics[0]).toBe("428")
  })

  it("ChannelDetailDrawer: role=dialog, Escape menutup, tombol close dari primitive", () => {
    const onClose = vi.fn()
    render(
      <ChannelDetailDrawer
        account={account}
        client={client}
        open={true}
        onClose={onClose}
        onManage={() => {}}
        onReconnect={() => {}}
      />
    )
    const dialog = screen.getByRole("dialog", { name: /instagram/i })
    expect(dialog.getAttribute("data-slot")).toBe("sheet-content")
    expect(document.querySelector('[data-slot="sheet-close"]')).toBeTruthy()
    fireEvent.keyDown(dialog, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
