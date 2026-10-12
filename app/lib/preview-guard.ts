import { notFound } from 'next/navigation'

/**
 * Preview routes (app/preview-*) are unauthenticated UI fixtures used by the
 * Playwright suite (and local design review). They render full admin shells and
 * must never be reachable in production — there is no navigation link to them,
 * so the only thing exposing them is the public route itself.
 *
 * Call this at the top of every preview page: in production it 404s, in
 * development/test it returns so the fixtures keep working.
 */
export function assertPreviewAllowed(): void {
  // Vite statically inlines process.env.NODE_ENV at transform time. In tests
  // NODE_ENV is the string "test"; in dev it's "development". Both must remain
  // reachable so the Playwright suite can use these pages as UI fixtures.
  const env = process.env.NODE_ENV
  if (env === 'production') {
    notFound()
  }
}
