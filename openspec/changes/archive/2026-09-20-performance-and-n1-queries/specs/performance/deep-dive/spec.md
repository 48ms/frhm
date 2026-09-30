## ADDED Requirements

### Requirement: Missing Security Headers

`next.config.mjs` MUST have a `headers()` function with security headers: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, `Content-Security-Policy`.

**Why:** Prevent Clickjacking, MIME sniffing, XSS.

#### Scenario: Security Headers
- **WHEN** `curl -I /`
- **THEN** headers contain `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, etc.

### Requirement: Image Optimization Config

`next.config.mjs` MUST have `images.remotePatterns` to allow CDN domains (e.g. Supabase Storage, Imgur).

**Why:** External images fail to render because `unoptimized: false` processes them via Next.js Image component, which requires whitelisting.

#### Scenario: Supabase CDN
- **WHEN** `<Image src="https://xyz.supabase.co/..." />`
- **THEN** Next.js optimizes and serves the image successfully

### Requirement: Missing Segment Config

Mutation API routes (e.g. `export/route.ts`, `send/route.ts`) MUST have `export const dynamic = 'force-dynamic'`.

**Why:** Without this, Next.js defaults to static rendering, serving stale mutation responses.

#### Scenario: Dynamic route
- **WHEN** hitting a mutation API
- **THEN** it does not serve cached/static responses

### Requirement: Missing Loading/State Fallbacks

Critical pages (dashboard, analytics, clients, deliverables) MUST have `loading.tsx` and `error.tsx` in their directory.

**Why:** Prevent blank white screens while fetching data on slow connections.

#### Scenario: Loading state
- **WHEN** navigating to `/admin/dashboard`
- **THEN** a fallback UI (spinner or skeleton) shows immediately

### Requirement: Stale-While-Revalidate Cache Headers

Analytics routes (e.g. `metrics/route.ts`) MUST return a `Cache-Control: public, max-age=60, stale-while-revalidate=300` header.

**Why:** Prevent heavy DB queries on every browser refresh; serve stale data instantly while revalidating.

#### Scenario: SWR header
- **WHEN** GET `/api/admin/clients/:id/analytics/metrics`
- **THEN** response headers include `Cache-Control` with SWR

### Requirement: Database Views for Dashboard

Common aggregations (dashboard summaries) MUST use a Supabase materialized view or standard view instead of multiple separate fetches in API routes.

**Why:** Offload JOIN complexity and grouping to Postgres.

#### Scenario: View usage
- **WHEN** dashboard loads
- **THEN** it queries a single `dashboard_summary` view

### Requirement: Table Virtualization

`data-table.tsx` MUST use `react-window` or `@tanstack/react-virtual` for row rendering.

**Why:** Rendering 1000 DOM rows freezes the browser.

#### Scenario: 1000 rows
- **WHEN** 1000 rows are loaded into data-table
- **THEN** DOM only contains visible rows (~20)

### Requirement: Next 15 `params` Awaited

Pages receiving dynamic route params (e.g. `deliverables/[id]/page.tsx`) MUST await the `params` promise (`const { id } = await params`).

**Why:** Next.js 15 breaking change; accessing synchronously causes warnings and potential crashes.

#### Scenario: Next 15 params
- **WHEN** compiling Next.js
- **THEN** no warnings about synchronous `params` access

### Requirement: React Compiler

`package.json` MUST include `@react-compiler/runtime` and Babel configuration.

**Why:** Auto-memoize components, shrinking bundle and improving render speed without manual `useMemo`.

#### Scenario: React Compiler
- **WHEN** building the app
- **THEN** the React Compiler plugin runs and optimizes components