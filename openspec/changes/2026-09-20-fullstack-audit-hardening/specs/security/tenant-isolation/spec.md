# tenant-isolation Specification

## ADDED Requirements

### Requirement: Row Level Security enforces tenant boundaries
The system SHALL enforce per-tenant isolation on all client-scoped tables via Row Level Security policies that constrain access to the requesting user's own client_id. Policies MUST NOT use `USING (true)` for write operations.

#### Scenario: Client A cannot read Client B data
- **WHEN** a client user attempts to query a client-scoped table (events, expenses, client_budgets, ad_spend_logs, kols, brand_assets)
- **THEN** the query returns zero rows for records belonging to other clients

#### Scenario: Admin writes are scoped
- **WHEN** an authenticated admin modifies a client-scoped row
- **THEN** the policy validates the row belongs to a client the admin manages

### Requirement: No direct client-side database writes
The system SHALL NOT allow browser-side components to write to the database directly via the Supabase client. All create/update/delete operations SHALL go through authenticated API routes that validate authorization server-side.

#### Scenario: Form submission routes through API
- **WHEN** a user submits an event, expense, ad spend, budget, KOL, approval, or kanban update
- **THEN** the write is performed by a Next.js API route with server-side authorization, never by a `'use client'` component calling `.insert()`/`.update()` directly

### Requirement: Missing tables have RLS enabled
The system SHALL enable Row Level Security on every table the application references, including `platform_posts`, `content_assets`, and `content_items` which currently have no `ENABLE ROW LEVEL SECURITY`.

#### Scenario: New table is queried via PostgREST
- **WHEN** any application table has RLS enabled
- **THEN** unauthenticated and cross-tenant access is rejected by default

### Requirement: Data fetch failures render gracefully
Client workspace page loads SHALL tolerate individual query failures instead of failing the whole page with a 500.

#### Scenario: One table is temporarily unavailable
- **WHEN** a single Supabase query in the client workspace data-load fails
- **THEN** the page still renders with the remaining data and an inline error notice for the failed section

### Requirement: API routes require authentication
The system SHALL require authentication on every API route that reads or writes application data. Routes using the `service_role` key MUST additionally verify the caller is an admin, because `service_role` bypasses Row Level Security.

#### Scenario: Anonymous request to admin API route
- **WHEN** an unauthenticated request hits `/api/admin/clients/[id]/outputs` (POST or GET)
- **THEN** the route returns 401 Unauthorized and performs no database operation

#### Scenario: Client user requests admin route
- **WHEN** an authenticated client-role user requests an `/api/admin/*` route
- **THEN** the route returns 403 Forbidden

### Requirement: Mutations invalidate cached views
The system SHALL invalidate Next.js cached views after data mutations so users see fresh data without a manual refresh.

#### Scenario: Data created via API route
- **WHEN** an event, budget, ad spend, expense, or KOL is created via its API route
- **THEN** the affected page path is revalidated via `revalidatePath` (or the client calls `router.refresh`) so the workspace reflects the new row immediately

### Requirement: No dead code in client bundles
The system SHALL NOT ship unused mock-data components in client-side bundles.

#### Scenario: Bundle excludes unused components
- **WHEN** the application is built
- **THEN** components that are exported but never imported (e.g. `CommandCenterView`) do not appear in the client bundle
