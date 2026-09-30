# Spec Delta: Client Workspace Coverage

## ADDED Requirements: Test Coverage

### Requirement: Dynamic Admin Routes Shall Be Tested

The system SHALL have E2E tests covering all dynamic admin `[id]` routes:
- `/admin/clients/[id]` (workspace)
- `/admin/crm/[id]`
- `/admin/deliverables/[id]`
- `/admin/skills/[id]`

### Scenario: Route Loads Without 5xx

- **WHEN** user navigates to any dynamic admin `[id]` route as authenticated admin
- **THEN** HTTP status SHALL be < 500
- **THEN** page SHALL NOT bounce to login
- **THEN** body SHALL NOT contain error markers ("Application error", "Something went wrong", etc.)
- **THEN** console SHALL NOT log errors

### Scenario: Workspace Tabs Render

- **WHEN** user visits `/admin/clients/[id]`
- **THEN** tab triggers SHALL be present: `setup`, `skills`, `pipeline`, `deliverables`

### Requirement: Client Portal Pages Shall Be Tested

The system SHALL have E2E tests covering all client portal pages:
- `/client/dashboard`
- `/client/deliverables`
- `/client/calendar`
- `/client/pipeline`
- `/client/settings`
- `/client/approvals`
- `/client/deliverables/[id]`

### Scenario: Client Page Renders

- **WHEN** user navigates to any client portal page as authenticated client
- **THEN** page SHALL render heading (h1 or h2 visible)
- **THEN** HTTP status SHALL be < 500
- **THEN** console SHALL NOT log errors

### Requirement: Realtime-Aware Test Strategy

### Scenario: Client Pages With Realtime

- **WHEN** testing client portal pages that use `DeliverableNotifier` (Supabase Realtime websocket)
- **THEN** test SHALL use `waitUntil: 'domcontentloaded'` + explicit selector wait
- **THEN** test SHALL NOT use `networkidle` (it never settles)

## MODIFIED Requirements: Test Infrastructure

### Requirement: Client ID Resolution Pattern

### Scenario: Resolve Client ID from DOM

- **WHEN** test needs a real client ID
- **THEN** resolve from `/admin/clients` list via DOM (not hard-coded)
- **THEN** resolution SHALL happen in each test (not `beforeAll`)

### Scenario: Avoid Page Fixture in beforeAll

- **WHEN** writing test setup code
- **THEN** SHALL NOT use `page` or `context` fixtures in `beforeAll`
- **THEN** SHALL use per-test fixtures instead
