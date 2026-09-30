# Spec Delta: ui/hierarchical-sidebar

## MODIFIED Requirements

### Requirement: Categorized navigation groups
The system SHALL display the admin sidebar navigation items categorized into logical groups (Overview, Marketing, AI Core, Clients, and System) driven dynamically by a centralized navigation configuration (`config/nav-config.ts`).

#### Scenario: Admin views sidebar
- **WHEN** an admin views the sidebar
- **THEN** navigation links are rendered dynamically from the centralized navigation configuration array with active route indicators

### Requirement: Quick client creation action in sidebar
The system SHALL display a quick action button (such as a '+' icon) on the CLIENTS navigation group header within the admin sidebar that triggers the client creation modal directly.

#### Scenario: Admin clicks add client button in sidebar
- **WHEN** the admin clicks the '+' action button located in the CLIENTS sidebar header
- **THEN** the client creation dialog opens immediately regardless of which page the admin is currently viewing
