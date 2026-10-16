import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// Mock the copilot queries (avoid QueryClient requirement)
vi.mock("@/features/copilot/api/queries", () => ({
  useGenerateContentIdeas: () => ({ mutate: vi.fn(), isPending: false }),
  useEvaluateTrend: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock("@/features/scheduled-posts/api/queries", () => ({
  useCreateScheduledPost: () => ({ mutate: vi.fn(), isPending: false }),
}))

import { BrainstormModal } from "./brainstorm-modal"

describe("BrainstormModal", () => {
  it("renders the dialog when open", () => {
    render(<BrainstormModal clientId="test-client" open={true} />)
    expect(screen.getByRole("dialog")).toBeDefined()
  })
})