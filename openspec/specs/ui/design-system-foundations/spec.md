# design-system-foundations Specification

## Purpose
Provides a cohesive, standardized design system foundation adapted from next-shadcn-dashboard-starter (Tailwind CSS tokens, button hierarchy, card and table styling, and overflow menus) to reduce cognitive load and establish visual consistency across Frhm.

## Requirements

### Requirement: Standardized button action hierarchy
The system SHALL strictly distinguish button styling into three visual levels: Primary (high-contrast brand fill for positive actions such as Approve or Publish), Secondary (outline/ghost for passive actions such as Cancel, Edit, or Filter), and Destructive (distinct danger styling for Reject or Delete).

#### Scenario: Visual distinction between approval and rejection
- **WHEN** a user views a content item with action triggers
- **THEN** the Approve action is displayed with primary prominence, Cancel/Edit with secondary/ghost styling, and Reject with distinct destructive red treatment

### Requirement: Single primary action per view
The system SHALL enforce a maximum of one primary action button prominently exposed in any single view or modal, avoiding competing primary action cues.

#### Scenario: Reviewing content details
- **WHEN** a client opens a content review detail view
- **THEN** only the single most critical action (e.g. Approve) is rendered as a primary button, while other actions (Request Revision, Download, Share) are rendered as secondary buttons or placed inside an overflow menu

### Requirement: Overflow action menu for secondary actions
The system SHALL group infrequently used or non-urgent actions into an overflow menu (such as a dropdown triggered by a three-dot icon) rather than cluttering the main screen surface.

#### Scenario: Accessing auxiliary item actions
- **WHEN** a user looks for secondary options on an item (such as Copy Link, View History, Export JSON)
- **THEN** those actions are accessible via an overflow dropdown menu without cluttering the primary workflow surface
