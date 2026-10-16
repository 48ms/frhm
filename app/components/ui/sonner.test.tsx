import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Toaster } from './sonner'

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    resolvedTheme: 'dark',
    setTheme: vi.fn(),
  }),
}))

describe('Toaster (Notification Toast)', () => {
  it('renders the Toaster without crashing', () => {
    const { container } = render(<Toaster />)
    expect(container).toBeDefined()
  })

  it('renders sonner toaster element with custom class', () => {
    const { container } = render(<Toaster className="test-toaster" />)
    expect(container.querySelector('[data-sonner-toaster]')).toBeDefined()
  })
})
