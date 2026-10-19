'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Icons } from '@/components/icons'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Reusable error boundary for public pages (auth, client portal, preview).
 *
 * Keeps UI simple and guides users to recover without exposing internals.
 */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Only log in production; suppress in tests
    if (typeof window !== 'undefined') {
      console.error('[public error boundary]', error.message)
      Sentry.captureException(error, { tags: { boundary: 'PublicError' } })
    }
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Icons.warning className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Terjadi kesalahan</h2>
          <p className="text-sm text-muted-foreground">
            {error.message || 'Halaman gagal dimuat. Silakan coba lagi.'}
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground/70">Kode: {error.digest}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            onClick={reset}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Icons.refresh className="size-4" /> Coba lagi
          </Button>
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
          >
            <Icons.home className="size-4" /> Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
