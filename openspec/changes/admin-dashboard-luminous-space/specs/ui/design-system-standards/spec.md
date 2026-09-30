## ADDED Requirements

### Requirement: Admin Luminous Space Visual System
The system SHALL apply the Luminous Space visual language to every page under `/admin/*`, using `--primary-container` (#D4FF32 chartreuse) for active navigation and primary emphasis, `--secondary-container` (#4353FF cobalt) for creation CTAs, and the fluted-glass / mesh-aurora surface treatments, WITHOUT altering any data-fetching, auth, or RLS behavior.

#### Scenario: Admin renders any admin route
- **WHEN** an authenticated admin loads any route under `/admin/*`
- **THEN** the page is wrapped in the Luminous Space theme (mesh aurora background, glass surfaces, capsule navigation)
- **AND** active navigation items use the chartreuse accent while creation actions use the cobalt accent

#### Scenario: Visual-only change preserves behavior
- **WHEN** the Luminous Space restyle is applied to an admin page
- **THEN** all existing data queries, mutations, URL state, and role checks behave identically to before the restyle

### Requirement: Icon Registry Compliance in Admin Redesign
The system SHALL render all admin redesign icons through the centralized `@/components/icons` registry and SHALL NOT introduce Material Symbols or direct icon-library imports in admin feature components.

#### Scenario: Redesign requires an icon
- **WHEN** an admin redesign surface needs an icon (e.g. a KPI card glyph or channel badge)
- **THEN** the icon is resolved from the `Icons` registry using a semantic key
- **AND** if no suitable key exists, a new mapping is added to `@/components/icons.tsx` rather than importing an icon library directly
