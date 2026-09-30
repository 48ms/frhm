# tanstack-query-ssr Specification

## Purpose
Menyediakan standar data fetching terpadu berbasis TanStack React Query dengan SSR prefetching, cache hydration, dan 3-lapis service layer per domain fitur.

## Requirements

### Requirement: 3-File Feature Service Architecture
The system SHALL organize every feature data layer into `api/types.ts` for contracts, `api/service.ts` for database/Supabase access, and `api/queries.ts` for query key factories and query options.

#### Scenario: Component retrieves or mutates data
- **WHEN** a feature component requires data or performs a mutation
- **THEN** it accesses functions and query options defined in `service.ts` and `queries.ts` rather than calling Supabase or `fetch()` directly in UI files

### Requirement: TanStack Query SSR Prefetching and Hydration
The system SHALL prefetch server-side data using `void queryClient.prefetchQuery(...)` inside Server Components and hydrate it to client components using `<HydrationBoundary>`.

#### Scenario: User visits a data-intensive page
- **WHEN** the route is rendered on the server
- **THEN** initial data is prefetched into cache and hydrated seamlessly so the client renders immediate content with zero skeleton flash

### Requirement: Automated Cache Invalidation via Key Factories
The system SHALL use structured query key factories (`entityKeys.all`, `entityKeys.list`, `entityKeys.detail`) to invalidate relevant queries automatically upon successful mutations.

#### Scenario: User creates, updates, or deletes an entity
- **WHEN** the mutation succeeds
- **THEN** the system invalidates the corresponding query keys, causing active tables and views to refetch fresh data automatically
