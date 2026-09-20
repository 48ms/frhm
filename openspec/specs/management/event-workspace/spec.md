# event-workspace Specification

## Purpose
Provides a dedicated workspace for managing events, including rundowns, checklists, vendor tracking, and post-mortem evaluations.

## Requirements

### Requirement: Event Workspace Creation
The system SHALL allow admins to create a dedicated event workspace linked to a client.

#### Scenario: Admin creates an event
- **WHEN** an admin clicks 'Create Event' and provides details
- **THEN** a new event workspace is created with tabs for Rundown, Checklist, Vendors, and Post-Mortem

### Requirement: Event Checklists
The system SHALL provide pre/day-of/post event checklists within the event workspace.

#### Scenario: Admin updates checklist
- **WHEN** an admin marks a checklist item as done
- **THEN** the overall event progress is updated
