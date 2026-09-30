# Spec Delta: ui/data-table-advanced-suite

## Purpose

Menyediakan sub-komponen penyaring dan pengatur tabel data tingkat lanjut (faceted multi-select, date range picker, slider numerik, toggle visibilitas kolom, dan skeleton loader adaptif).

## ADDED Requirements

### Requirement: Faceted Multi-Select Filter Component
The system SHALL provide a `DataTableFacetedFilter` component displaying filterable options with checkboxes, counts, and badges.

#### Scenario: User filters table rows by multiple statuses
- **WHEN** the user selects one or more statuses from the faceted filter popover
- **THEN** only matching rows are displayed and the filter trigger displays a count badge reflecting active choices

### Requirement: Interactive Date Range Filter Component
The system SHALL provide a `DataTableDateFilter` supporting preset intervals (Today, Last 7 Days, Last 30 Days) and custom date ranges.

#### Scenario: User selects a date range preset
- **WHEN** the user selects a date range preset in the date filter popover
- **THEN** the start and end timestamps are bound to query parameters and the table filters rows accordingly

### Requirement: Column Visibility Management
The system SHALL provide a `DataTableViewOptions` dropdown allowing users to toggle column display dynamically.

#### Scenario: User toggles column visibility
- **WHEN** the user unchecks a column title in the view options menu
- **THEN** the corresponding column is immediately hidden from the table without re-fetching data

### Requirement: Adaptive Table Skeleton Loading
The system SHALL provide a `DataTableSkeleton` that renders animated skeleton cells matching the requested column and row count during data loading.

#### Scenario: Data table is in prefetch or loading state
- **WHEN** the table is waiting for initial or filtered query data
- **THEN** the skeleton layout renders placeholder cells preventing layout collapse
