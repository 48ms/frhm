# hierarchical-sidebar

## Purpose
Groups admin navigation into logical sections (Overview, Marketing, AI Core, Clients, System) to reduce clutter and improve findability.

## Requirements

### Requirement: Categorized navigation groups
The system SHALL display the admin sidebar navigation items categorized into structured feature-based groups (Overview, Marketing, Production, Clients, System) driven dynamically by a centralized navigation configuration (`config/nav-config.ts`), with collapsible shell layout pattern, isolated completely from client portal views.

#### Scenario: Admin views sidebar
- **WHEN** an admin views the sidebar
- **THEN** navigation links are rendered dynamically from the centralized navigation configuration array with active route indicators and collapsible/mobile drawer support

### Requirement: Quick client creation action in sidebar
The system SHALL display a quick action button (such as a '+' icon) on the CLIENTS navigation group header within the admin sidebar that triggers the client creation modal directly.

#### Scenario: Admin clicks add client button in sidebar
- **WHEN** the admin clicks the '+' action button located in the CLIENTS sidebar header
- **THEN** the client creation dialog opens immediately regardless of which page the admin is currently viewing
