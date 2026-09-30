# empty-states Specification

## Purpose
Menyediakan standar antarmuka kondisi data kosong (Empty State) yang konsisten dengan ikon terpusat, tipografi deskriptif, dan aksi panggilan utama terarah.

## Requirements

### Requirement: Standard Empty State Container
The system SHALL provide an `Empty` component rendering a circular icon wrapper, title, descriptive message, and an optional action container.

#### Scenario: Table or list query returns zero records
- **WHEN** a list view has no matching items or filters yield empty results
- **THEN** an `Empty` visual component is rendered centering the user on what action to take next

### Requirement: Contextual Primary Action Button
The system SHALL allow rendering a primary action button within the empty state container to guide user creation workflows.

#### Scenario: User encounters an empty deliverables list
- **WHEN** no deliverables exist for the selected client
- **THEN** the empty state displays a 'Create Deliverable' button that opens the creation flow directly
