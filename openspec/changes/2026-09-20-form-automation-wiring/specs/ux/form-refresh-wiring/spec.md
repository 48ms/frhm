# form-refresh-wiring Specification

## ADDED Requirements

### Requirement: Mutations revalidate dependent tab data
The system SHALL revalidate workspace data after a mutation so every tab that depends on the changed table shows fresh rows without a manual browser refresh.

#### Scenario: Expense added in Budget tab
- **WHEN** an expense is created via `ExpenseFormModal` in the Budget tab
- **THEN** the ROI tab, which reads `expenses`, reflects the new row when next opened, and the Budget tab's local state updates immediately

#### Scenario: Ad spend log added in Ads tab
- **WHEN** an ad spend log is created via `AdSpendFormModal`
- **THEN** the ROI tab, which reads `ad_spend_logs`, reflects the new row when next opened

#### Scenario: Event created in Events tab
- **WHEN** an event is created via `CreateEventModal`
- **THEN** the Calendar tab reflects the new scheduled item when next opened

### Requirement: Shared workspace props refresh after mutation
The system SHALL refresh workspace-level shared props (`client_files`, `deliverables`, `skills`) after a mutation that changes them, instead of serving stale props fetched once at page load.

#### Scenario: File uploaded in Setup tab
- **WHEN** a brand asset or client file is added in the Setup tab
- **THEN** tabs consuming the shared `files` prop see the new entry without a full page reload

### Requirement: Form boards provide a refresh affordance
The system SHALL provide every form-bearing board with a deterministic way to reload its data after a successful submit: either optimistic local state update, `router.refresh()`, or `revalidatePath()` in the backing API route.

#### Scenario: Board reloads after submit
- **WHEN** any marketing or operational form submits successfully
- **THEN** the owning board re-renders with the new row via local state update or a router/cache refresh, and no stale row remains
