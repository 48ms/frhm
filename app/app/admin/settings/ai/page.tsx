import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'
import { AiProviders } from './providers'

export const dynamic = 'force-dynamic'

export default function AiSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/dashboard"
          className="hover:bg-accent inline-flex size-11 sm:size-8 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Kembali"
        >
          <ArrowLeftIcon className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Pengaturan AI</h1>
          <p className="text-muted-foreground text-sm">
            Jalur model untuk menjalankan skill social media.
          </p>
        </div>
      </div>
      <AiProviders />
    </div>
  )
}
