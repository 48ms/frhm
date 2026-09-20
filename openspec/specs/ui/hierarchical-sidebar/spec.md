# hierarchical-sidebar

## Purpose
Groups admin navigation into logical sections (Overview, Marketing, AI Core, Clients, System) to reduce clutter and improve findability.

## Requirements

### Requirement: Categorized navigation groups
The system SHALL display the admin sidebar navigation items categorized into logical groups: Overview, Marketing, AI Core, Clients, and System.

#### Scenario: Admin views sidebar
- **WHEN** an admin views the sidebar
- **THEN** they see navigation links grouped under collapsible or distinct headers for each category

### Requirement: Quick client creation action in sidebar
The system SHALL display a quick action button (such as a '+' icon) on the CLIENTS navigation group header within the admin sidebar that triggers the client creation modal directly.

#### Scenario: Admin clicks add client button in sidebar
- **WHEN** the admin clicks the '+' action button located in the CLIENTS sidebar header
- **THEN** the client creation dialog opens immediately regardless of which page the admin is currently viewing
