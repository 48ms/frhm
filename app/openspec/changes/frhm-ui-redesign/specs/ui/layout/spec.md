## ADDED Requirements

### Requirement: Admin UI Shell Upgrade
The admin dashboard layout SHALL use a collapsible sidebar with `SidebarRail`, a sticky header with skip-link, dark-mode toggle, and infobar trigger.

#### Scenario: Admin opens dashboard
- **WHEN** an admin navigates to `/admin/dashboard`
- **THEN** a collapsible sidebar SHALL render with grouped nav (OVERVIEW, OPERATIONS, CLIENTS, AI CORE, SYSTEM)
- **AND** the header SHALL include a visually-hidden "Skip to content" link that becomes visible on keyboard focus
- **AND** the header SHALL include a functional dark-mode toggle
- **AND** the header SHALL include an `InfobarTrigger` button

### Requirement: Workspace Tab Consolidation
The client workspace SHALL render exactly 5 primary tab groups instead of 15 flat tabs.

#### Scenario: Admin opens a client workspace
- **WHEN** an admin opens `/admin/clients/[id]`
- **THEN** the workspace SHALL render exactly 5 primary tab groups: Setup, Produksi, Marketing, Insight, Output
- **AND** the 15 existing views SHALL be nested as sub-navigation or sections within these 5 groups

### Requirement: Action Grouping
Destructive workspace actions SHALL be separated from the primary save action.

#### Scenario: Admin views workspace header actions
- **WHEN** an admin views the action buttons in the client workspace header
- **THEN** the Simpan action SHALL remain a primary visible button
- **AND** Reset Password and Cabut Session SHALL live in a secondary overflow menu

### Requirement: Deliverables Data Table
The deliverables list SHALL use a DataTable with toolbar search and pagination.

#### Scenario: Admin views deliverables in workspace
- **WHEN** an admin opens the Output group and views deliverables
- **THEN** the list SHALL render as a DataTable with sticky header and scroll area
- **AND** a DataTableToolbar SHALL provide at least a text-search filter
- **AND** a DataTablePagination SHALL control rows-per-page and page navigation

### Requirement: Contextual Infobar
A right-side infobar SHALL toggle with keyboard shortcut and close on route change.

#### Scenario: Admin toggles infobar
- **WHEN** an admin presses `i` or `Cmd+i`
- **THEN** a right-side Infobar panel SHALL expand or collapse
- **AND** the infobar SHALL auto-close when the route pathname changes
