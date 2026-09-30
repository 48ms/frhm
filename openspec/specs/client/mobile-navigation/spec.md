# mobile-navigation Specification

## Purpose
Provides a mobile-optimized navigation paradigm for client users, ensuring easy access to core features on small screens.

## Requirements

### Requirement: Bottom navigation on mobile
The system SHALL render the primary client navigation as a bottom navigation bar on mobile viewport sizes, reflecting the restructured core pillars: Review (Content/Calendar), Approvals (Action Center), and Reports.

#### Scenario: Client accesses via mobile
- **WHEN** a client opens the application on a mobile device
- **THEN** the primary navigation bar appears fixed at the bottom with clearly labeled tabs for Review, Approvals, and Reports, optimized for single-thumb accessibility

### Requirement: Actionable notification badges
The system SHALL display a clear visual badge on the Approvals navigation item when there are items requiring the client's decision or review.

#### Scenario: Pending approvals exist
- **WHEN** a client has items awaiting approval or revisions
- **THEN** the Approvals tab icon in the bottom navigation displays a prominent numerical count badge
