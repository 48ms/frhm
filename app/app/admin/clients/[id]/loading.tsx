import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Route-level skeleton for the client workspace.
 *
 * The page runs ~13 parallel Supabase queries before it can render, so without this
 * file the browser sits on a blank screen and then snaps the whole layout into place.
 * The skeleton mirrors the real chrome (header → tabs → 4 stat cards) so the swap is
 * visually stable instead of a jump.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6 mt-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat workspace klien…</span>

      {/* Guidance banner */}
      <Skeleton className="h-20 w-full rounded-xl" />

      {/* Header */}
      <div>
        <Skeleton className="mb-3 h-5 w-28" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-52" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Skeleton className="h-11 w-max rounded-lg lg:h-9" />

      {/* Overview: four stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-7 w-14" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
