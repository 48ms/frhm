import * as React from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/react'

/**
 * Render a component tree that needs the app's providers:
 * React Query (for useSuspenseQuery/useQuery) and nuqs (for useQueryState).
 *
 * A Suspense boundary is included because components using `useSuspenseQuery`
 * suspend on first render; without it the tree renders empty. Tests that hit
 * such components should assert with `await screen.findBy...`.
 */
export function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <React.Suspense fallback={null}>{ui}</React.Suspense>
      </NuqsAdapter>
    </QueryClientProvider>
  )
}
