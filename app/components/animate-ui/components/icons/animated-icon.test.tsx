import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { AnimatedIcon } from "./animated-icon"

describe("AnimatedIcon", () => {
  it("renders the icon SVG corresponding to registry key", () => {
    const { container } = render(<AnimatedIcon name="rocket" />)
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("returns null if icon name does not exist in registry", () => {
    const { container } = render(<AnimatedIcon name="nonExistentIconNameXYZ" />)
    expect(container.querySelector("svg")).not.toBeInTheDocument()
  })
})
