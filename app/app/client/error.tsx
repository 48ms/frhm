'use client'

import { useEffect } from 'react'
import { Icons } from '@/components/icons'
import Link from 'next/link'

/**
 * Client-portal error boundary.
 *
 * Same rationale as `app/admin/error.tsx`: the root boundary blanks the whole page, this one
 * keeps the client portal chrome mounted so the client can move on instead of hitting a dead end.
 */
export default function ClientError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[client error boundary]', error)
    // Report to Telegram + structured log
    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        name: error.name,
        stack: error.stack,
        digest: error.digest,
        url: window.location.href,
        component: 'ClientError',
      }),
    }).catch(() => {})
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <Icons.warning className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Terjadi kesalahan</h2>
          <p className="text-sm text-muted-foreground">
            {error.message || 'Halaman gagal dimuat. Coba muat ulang atau kembali ke dashboard.'}
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground/70">Kode: {error.digest}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={reset}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Icons.refresh className="size-4" /> Coba lagi
          </button>
          <Link
            href="/client/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
          >
            <Icons.home className="size-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
