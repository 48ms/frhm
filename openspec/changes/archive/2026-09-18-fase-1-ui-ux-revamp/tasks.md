# Tasks

## 1. Setup & Tooling

- [x] 1.1 Verify shadcn UI command palette (`cmdk`) is installed and configure basic component. Verify by running the dev server and checking it builds.

## 2. Admin UI Revamp

- [x] 2.1 Refactor Admin Sidebar to use categorized groups (Overview, Marketing, AI Core, Clients, System). Verify by loading an admin page and inspecting the sidebar visually.
- [x] 2.2 Consolidate Settings into a centralized route `/app/admin/settings` with a sub-navigation layout. Verify by navigating to settings and checking layout.

## 3. Client UI Revamp

- [x] 3.1 Implement mobile bottom navigation for clients (hide sidebar on small screens, show bottom bar). Verify by simulating a mobile device in the browser and ensuring the layout switches correctly.
- [x] 3.2 Add notification badge on the "Deliverables" bottom navigation item for clients. Verify by injecting a mock unread notification count.

## 4. Command Palette

- [x] 4.1 Implement global Ctrl+K shortcut listener to toggle Command Palette. Verify by pressing Ctrl+K and observing the modal open.
- [x] 4.2 Populate Command Palette with quick navigation links (clients, settings, deliverables). Verify by searching for a keyword in the palette.
