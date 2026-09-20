## ADDED Requirements

### Requirement: API routes must execute independent queries in parallel

All independent Supabase reads within a single API route handler MUST be executed in parallel via `Promise.all`. Sequential `await supabase.from(...)` chains (one query waiting for another) are forbidden when the queries do not depend on each other's results.

**Why:** `generate-insight/route.ts` currently runs 12 sequential queries — total latency equals the sum of all queries instead of the max.

#### Scenario: generate-insight parallel execution
- **WHEN** a request hits `POST /api/admin/clients/:id/analytics/generate-insight`
- **WHEN** the handler reads `clients`, `scheduled_posts`, `competitor_benchmarks`, `seasonal_periods`, `analytics_predictions`
- **THEN** at least 5 of these reads execute in parallel via `Promise.all`

### Requirement: Bulk writes must be batched

Any endpoint accepting an array of rows MUST use batch upsert/insert (single query with array payload). Row-by-row `.upsert()`/`.insert()` within a `for` loop is forbidden.

**Why:** `metrics/bulk` does 1 upsert + 1 select per row — 100 rows = 200 DB round-trips.

#### Scenario: metrics/bulk batched
- **WHEN** a request with 100 rows arrives at `POST /api/admin/clients/:id/analytics/metrics/bulk`
- **WHEN** the handler validates and inserts
- **THEN** DB round-trips are ≤ 3 (1 batch select, 1 batch upsert, 1 optional batch for errors)

### Requirement: AI batch jobs must run concurrently with bounded parallelism

AI generation looping over multiple items MUST run in parallel with a concurrency cap (e.g. `Promise.allSettled` + semaphore of 3). Sequential `await chat(...)` in a loop is forbidden when runtime exceeds the platform timeout.

**Why:** `skills/bulk-run` with 5 skills = 50s sequential, exceeding the Vercel 30s function limit.

#### Scenario: skills/bulk-run parallel
- **WHEN** a request with 5 skills arrives at `POST /api/admin/clients/:id/skills/bulk-run`
- **WHEN** the handler invokes AI for each skill
- **THEN** total runtime ≤ max(single skill duration) + overhead, not 5 × duration

### Requirement: List endpoints must paginate

All list APIs (`clients`, `deliverables`, `scheduled-posts`) MUST accept `?page=` and `?limit=` query params with a default limit of 50 and max of 100.

**Why:** Current list routes fetch all rows unconditionally; payload and DB cost grow unbounded with data.

#### Scenario: paginated list
- **WHEN** GET `/api/admin/clients?limit=10&page=2`
- **THEN** response contains exactly 10 clients for page 2 and a `total` count

### Requirement: Only one animation library may ship in the client bundle

`framer-motion` and `motion` are the same package (rebrand). Exactly one MUST be installed and imported.

**Why:** Currently both are installed (`^13.2.0` each); 301 files import `framer-motion`, 271 import `motion/react` — the animation runtime is duplicated in the client bundle.

#### Scenario: single animation runtime
- **WHEN** a client builds the project
- **WHEN** bundle size is analyzed
- **THEN** `framer-motion` OR `motion/react` appears in the dependency tree, not both

### Requirement: Supabase browser client must be a singleton

`lib/supabase/client.ts` MUST return the same client instance across calls within a session.

**Why:** Current code creates a new `createBrowserClient()` per call — new session handshake and memory overhead per component instance.

#### Scenario: singleton client
- **WHEN** `createClient()` is called from multiple components
- **THEN** all calls return the same `createBrowserClient` instance

### Requirement: useEffect with timers/listeners must clean up

Any `useEffect` that calls `setTimeout`, `setInterval`, `addEventListener`, or `.subscribe()` MUST return a cleanup function.

**Why:** 6 components (`hasil.tsx`, `setup.tsx`, `workspace.tsx`, `hero-asset-card.tsx`, `expandable-action-bar.tsx`, `ripple-button.tsx`) leak timers/listeners on unmount.

#### Scenario: cleanup on unmount
- **WHEN** a component with a `setTimeout` unmounts
- **THEN** the timer is cleared and no callbacks execute

### Requirement: Heavy charts must lazy-load

Components importing `recharts` MUST be loaded via `next/dynamic` with a skeleton fallback, not eagerly.

**Why:** `recharts` (~200KB) is imported by 2 marketing board components that sit behind tabs.

#### Scenario: lazy-loaded charts
- **WHEN** the marketing tab is not open
- **THEN** the recharts JS payload is not downloaded