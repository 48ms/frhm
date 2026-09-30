# information-architecture Specification

## Purpose
Establishes a clear, domain-driven information architecture separating Admin and Client roles completely, and segregating client features by explicit user objectives: Review Content, Approval, and Reports.

## Requirements

### Requirement: Strict role-based navigation and surface separation
The system SHALL provide completely separate navigation structures and surface layouts for Admin and Client roles, ensuring Client users never see Admin management tools or disabled Admin triggers.

#### Scenario: Client user logs in
- **WHEN** a client user (e.g. Taraju) authenticates into the application
- **THEN** the system routes them exclusively to the client workspace with navigation restricted to client-relevant features (Review, Approvals, Reports) without exposure to Admin management controls

### Requirement: Objective-based client feature segregation
The system SHALL organize client dashboard capabilities into three distinct, dedicated sections based on the client's explicit intent: Content Review (browsing drafts & calendar), Approvals (pending action items requiring decisions), and Reports (performance metrics and ROI).

#### Scenario: Client focuses on pending approvals
- **WHEN** the client navigates to the Approvals section
- **THEN** only items actively requiring client sign-off or revision requests are shown, without mingling unready drafts or long-term analytics

### Requirement: Separation of approval controls from navigational headers
The system SHALL render decision-making controls (Approve, Request Changes) directly in the content review context rather than mixed with top-level or global navigational chrome.

#### Scenario: Making an approval decision
- **WHEN** the client reviews a deliverable in the approval view
- **THEN** the action buttons are attached directly to the active item context, completely decoupled from global header and navigation menus
