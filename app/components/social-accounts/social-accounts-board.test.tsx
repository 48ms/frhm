import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SocialAccountsBoard } from "./social-accounts-board"
import { NuqsAdapter } from "nuqs/adapters/react"
import { vi, describe, it, expect } from "vitest"

// Every icon key resolves to a lightweight stub so the board can render any
// icon without enumerating them all (the prototype uses a dozen+).
vi.mock("@/components/icons", () => {
  const Stub = (props: Record<string, unknown>) => <span data-testid="icon" {...props} />
  return { Icons: new Proxy({}, { get: () => Stub }) }
})

describe("SocialAccountsBoard", () => {
  it("renders correctly with default state", () => {
    render(
      <NuqsAdapter>
        <SocialAccountsBoard />
      </NuqsAdapter>
    )

    expect(screen.getByText(/Social Accounts/i)).toBeDefined()
    expect(screen.getByText(/CONNECTED HANDLES/i)).toBeDefined()
  })

  it("changes client when clicking client switcher", async () => {
    render(
      <NuqsAdapter>
        <SocialAccountsBoard />
      </NuqsAdapter>
    )

    const wizardBtn = screen.getByText(/Wizard Corp/i)
    fireEvent.click(wizardBtn)

    await waitFor(() => {
        expect(screen.getByText(/E2E Wizard Dev/i)).toBeDefined()
    })
  })

  it("filters accounts when clicking tabs", async () => {
    render(
      <NuqsAdapter>
        <SocialAccountsBoard />
      </NuqsAdapter>
    )

    const igTab = screen.getByRole("tab", { name: /^Instagram$/i })
    fireEvent.click(igTab)

    await waitFor(() => {
        // Empty sections now render an explicit empty state instead of disappearing.
        expect(screen.getAllByText(/No accounts connected on this platform/i).length).toBeGreaterThan(0)
    })
  })

  it("switches to Action Required when the Needs Attention KPI is clicked", async () => {
    render(
      <NuqsAdapter>
        <SocialAccountsBoard />
      </NuqsAdapter>
    )

    fireEvent.click(screen.getByRole("button", { name: /Show Needs Attention/i }))

    await waitFor(() => {
      const actionTab = screen.getByRole("tab", { name: /^Action Required$/i })
      expect(actionTab.getAttribute("aria-selected")).toBe("true")
    })
  })
})
