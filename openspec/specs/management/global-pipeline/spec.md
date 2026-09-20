# global-pipeline Specification

## Purpose
Provides a unified view for agency admins to monitor and manage all content deliverables across all clients from a single Kanban board.

## Requirements

### Requirement: Cross-client aggregate view
The system SHALL display all active deliverables from all clients in a single unified pipeline view for users with the admin role.

#### Scenario: Admin views global pipeline
- **WHEN** an admin navigates to the Global Pipeline
- **THEN** they see deliverables from all their assigned clients consolidated into one view

### Requirement: Visual status tracking
The system SHALL use distinct visual indicators for different deliverable statuses to enable quick scanning.

#### Scenario: Scanning for blocked items
- **WHEN** an admin scans the pipeline
- **THEN** items requiring revision are visually distinct from items that are approved or in draft

### Requirement: Quick filtering
The system SHALL provide immediate filtering mechanisms by client and by status.

#### Scenario: Filtering by specific client
- **WHEN** an admin selects a specific client from the pipeline filter
- **THEN** the pipeline immediately updates to show only that client's deliverables
