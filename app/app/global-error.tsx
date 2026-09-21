'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex max-w-md flex-col items-center gap-3 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <h2 className="text-lg font-semibold">Terjadi kesalahan</h2>
            <p className="text-sm text-muted-foreground">
              {error.message || 'Gagal memuat aplikasi.'}
            </p>
            <button
              onClick={reset}
              className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Coba lagi
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
