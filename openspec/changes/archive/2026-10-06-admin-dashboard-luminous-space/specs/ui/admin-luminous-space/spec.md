## Purpose

Menyediakan sistem desain visual Luminous Space secara utuh ke seluruh 31 halaman admin dashboard, mencakup sidebar capsule, topbar glass, hero banner, KPI bento grid, analytics chart glass, dan content queue cards.

## ADDED Requirements

### Requirement: Admin Sidebar & Header Visual Parity
The admin layout SHALL render a frosted glass sidebar with brand capsule logo, active state lime pill highlights, and a sticky glass header with studio branding and Quick Export/Create Campaign action buttons matching the Luminous Space reference design.

#### Scenario: Admin layout renders Luminous Space shell
- **WHEN** admin navigates to any `/admin/*` route
- **THEN** the viewport displays the mesh aurora gradient background and floating glow orbs
- **AND** the sidebar features rounded capsule navigation with active lime highlight

### Requirement: Admin Dashboard Overview Redesign
The admin dashboard overview SHALL render a welcome hero banner, 4 KPI Bento cards with progress bars and sparklines, an analytics trajectory chart with glass styling, and a content queue pipeline matching the stitch reference.

#### Scenario: Admin views dashboard overview
- **WHEN** admin visits `/admin/dashboard`
- **THEN** the page displays the "Good day, Creator" hero card
- **AND** displays 4 KPI cards for Total Reach, Scheduled Queue, Avg Engagement, and Active Campaigns with exact styling

### Requirement: All Admin Pages Luminous Space UI
All internal admin pages under `/admin/clients`, `/admin/deliverables`, `/admin/analytics`, `/admin/settings`, `/admin/calendar`, `/admin/production`, and `/admin/skills` SHALL incorporate admin-card, fluted glass, and brand accent token styling without altering backend RLS or data fetching.

#### Scenario: Admin visits clients or deliverables pages
- **WHEN** admin navigates to `/admin/clients` or `/admin/deliverables`
- **THEN** tables and lists render within Luminous Space styled cards and chips
- **AND** no backend regressions or query errors occur
