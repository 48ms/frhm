import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ClientError from './error'
import * as Sentry from '@sentry/nextjs'

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

describe('ClientError Boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('captures exception with Sentry tag and renders recovery options', () => {
    const error = new Error('Database connection failed')
    const reset = vi.fn()

    render(<ClientError error={error} reset={reset} />)

    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ tags: { boundary: 'ClientError' } })
    )

    expect(screen.getByText('Gagal Memuat Halaman Portal Klien')).toBeInTheDocument()
    expect(screen.getByText('Database connection failed')).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: /Coba Lagi/i })
    expect(retryBtn).toBeInTheDocument()
    fireEvent.click(retryBtn)
    expect(reset).toHaveBeenCalledTimes(1)

    const homeLink = screen.getByRole('link', { name: /Dashboard Klien/i })
    expect(homeLink).toHaveAttribute('href', '/client/dashboard')
  })
})
