# mobile-navigation Specification

## Purpose
Provides a mobile-optimized navigation paradigm for client users, ensuring easy access to core features on small screens.

## Requirements

### Requirement: Bottom navigation on mobile
The system SHALL render the primary client navigation as a bottom navigation bar when viewed on mobile viewport sizes.

#### Scenario: Client accesses via mobile
- **WHEN** a client opens the application on a mobile device
- **THEN** the primary navigation (Dashboard, Pipeline, Deliverables) appears fixed at the bottom of the screen

### Requirement: Actionable notification badges
The system SHALL display a clear visual badge on the Deliverables navigation item when there are items requiring the client's approval.

#### Scenario: Pending approvals exist
- **WHEN** a client has 2 deliverables in 'revision_requested' status
- **THEN** the Deliverables icon in the bottom navigation shows a prominent '2' badge
