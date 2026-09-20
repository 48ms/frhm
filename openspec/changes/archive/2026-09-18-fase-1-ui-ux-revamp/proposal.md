# Proposal

## Why
Frhm needs a solid foundation for its UX to transition from a simple social media management tool to a full digital marketing agency ERP. Currently, the interface can feel cluttered and hard to navigate, especially on mobile devices for clients, and lacks a global view for admins. Phase 1 focuses on revamping the UI/UX foundation.

## What Changes
- **Global Pipeline (Kanban):** A single overview board for admins to track all deliverables across all clients.
- **Hierarchical Admin Sidebar:** Grouping navigation links (Overview, Marketing, AI Core, Clients, System) to reduce clutter.
- **Client Mobile-First Nav:** Converting the sidebar into a Bottom Navigation Bar for clients accessing via mobile.
- **Settings Consolidation:** Merging various settings (AI, Bridge, User, Audit) into one centralized page.
- **Global Command Palette:** Adding a quick search and instant navigation feature (Ctrl+K) across features and clients.

## Capabilities

### New Capabilities
- `ui/hierarchical-sidebar`: Groups admin navigation into logical sections (Overview, Marketing, AI Core, Clients, System).
- `ui/settings-consolidation`: Centralized settings page combining AI, Bridge, User, and Audit settings.
- `ui/command-palette`: Global search and navigation using Ctrl+K.

### Modified Capabilities
<!-- None. Existing specs for global pipeline and mobile navigation already cover the requirements. -->

## Impact
- Admin Dashboard layout and sidebar component.
- Client layout and mobile navigation components.
- Settings pages routing and consolidation.
- New Command Palette component integrated globally.
