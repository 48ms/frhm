# Spec Delta: ui/dashboard-parallel-routes

## Purpose

Mengorganisasi tata letak widget dashboard analitik menggunakan parallel routes Next.js dengan error boundary mandiri dan styling kartu berbasis container queries.

## ADDED Requirements

### Requirement: Parallel Route Slot Isolation
The system SHALL organize dashboard analytics widgets into dedicated parallel route slots (`@sales`, `@bar_stats`, `@pie_stats`, `@area_stats`) rendered within the overview layout.

#### Scenario: User navigates to overview dashboard
- **WHEN** the dashboard page renders
- **THEN** all chart slots stream independently and render their respective visual cards without blocking one another

### Requirement: Independent Slot Error Boundary
The system SHALL isolate chart component failures so that an error in one analytics slot does not disrupt or crash other dashboard widgets.

#### Scenario: An external metrics API endpoint fails
- **WHEN** one widget query fails or throws an error
- **THEN** that specific slot displays a localized error fallback card with a retry button while other widgets continue functioning normally

### Requirement: Container Query Font Sizing
The system SHALL format metric stat cards using container query classes (`@container/card`) so that font scales respond to card width rather than window viewport.

#### Scenario: Metric card is resized in responsive grid
- **WHEN** the layout column expands or contracts
- **THEN** the metric numerical figures dynamically adjust font size according to the container boundary
