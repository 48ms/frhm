import { render, screen, fireEvent, act } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { AnimateIcon } from "./icon"
import { ArrowRight } from "./arrow-right"
import { AnimatedIcon } from "@/components/animate-ui/components/icons/animated-icon"

describe("AnimateIcon Primitive & ArrowRight Component", () => {
  it("renders ArrowRight icon component inside AnimateIcon wrapper", () => {
    const { container } = render(
      <AnimateIcon animateOnHover>
        <ArrowRight size={24} data-testid="arrow-right-icon" />
      </AnimateIcon>
    )

    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute("width", "24")
    expect(svg).toHaveAttribute("height", "24")
  })

  it("handles mouse hover interactions without throwing errors", async () => {
    const { container } = render(
      <AnimateIcon animateOnHover>
        <ArrowRight size={20} />
      </AnimateIcon>
    )

    const span = container.querySelector("span")
    expect(span).toBeInTheDocument()
    if (span) {
      await act(async () => {
        fireEvent.mouseEnter(span)
      })
      await act(async () => {
        fireEvent.mouseLeave(span)
      })
    }
  })

  it("renders AnimatedIcon wrapper with children correctly", () => {
    const { container } = render(
      <AnimatedIcon animateOnHover>
        <ArrowRight size={18} />
      </AnimatedIcon>
    )
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("renders AnimatedIcon with name and supports animateOnHover trigger", () => {
    const { container } = render(
      <AnimatedIcon name="rocket" isActive animateOnHover />
    )
    expect(container.querySelector("svg")).toBeInTheDocument()
  })
})
