import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ConnectChannelModal } from "./connect-channel-modal"
import type { SocialClient } from "./social-data"

const client: SocialClient = {
  id: "client-test",
  name: "B2B Shell Representatives",
  shortName: "Test",
  initials: "BS",
  tagline: "Testing",
  accounts: [],
}

describe("ConnectChannelModal - Authorize Button State", () => {
  it("tombol Authorize & Link HARUS disabled saat input kosong", () => {
    render(
      <ConnectChannelModal
        open={true}
        client={client}
        existingPlatforms={[]}
        onClose={() => {}}
        onConnected={() => {}}
      />
    )
    
    // Klik "Continue" untuk pindah ke step "details"
    fireEvent.click(screen.getByText("Continue"))
    
    // Cari tombol "Authorize & Link"
    const authBtn = screen.getByRole("button", { name: /Authorize & Link/i })
    
    // Pastikan tombol disabled
    expect(authBtn.hasAttribute("disabled")).toBe(true)
    expect(authBtn.className).toContain("disabled:opacity-50")
  })
})
