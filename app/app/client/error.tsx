'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Icons } from '@/components/icons'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Client Portal Segment Error Boundary (/client/*).
 *
 * Sesuai Aturan 14 AGENTS.md:
 * - Mencegah "White Screen of Death" jika Server Component atau query Supabase gagal.
 * - Mengisolasi error di dalam segment /client tanpa melepas shell navigasi klien.
 * - Merekam stack trace ke Sentry secara senyap dengan tag { boundary: 'ClientError' }.
 */
export default function ClientError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[client portal error boundary]', error)
    Sentry.captureException(error, { tags: { boundary: 'ClientError' } })
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-xs">
          <Icons.warning className="size-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Gagal Memuat Halaman Portal Klien
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {error.message ||
              'Terjadi kendala saat memuat data akun brand Anda. Silakan coba kembali atau kembali ke dashboard.'}
          </p>
          {error.digest && (
            <p className="font-mono text-2xs text-muted-foreground/70 bg-muted/40 px-2 py-0.5 rounded-md inline-block">
              ID Masalah: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Button
            onClick={reset}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 min-h-11 cursor-pointer"
          >
            <Icons.refresh className="size-4" />
            <span>Coba Lagi</span>
          </Button>

          <Link
            href="/client/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/40 px-4 text-xs font-semibold text-foreground hover:bg-muted min-h-11"
          >
            <Icons.home className="size-4 text-primary" />
            <span>Dashboard Klien</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
