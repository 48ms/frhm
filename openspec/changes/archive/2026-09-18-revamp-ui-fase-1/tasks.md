# Tasks

## 1. Sidebar Refactoring (Admin)

- [x] 1.1 Update `app-sidebar.tsx` to group Admin navigation items (OVERVIEW, AI CORE, CLIENTS, SYSTEM) and verify visual grouping renders correctly
- [x] 1.2 Verify that clicking each grouped item navigates to the correct existing route without errors

## 2. Client Mobile Navigation

- [x] 2.1 Create new `bottom-nav.tsx` component with Dashboard, Pipeline, and Deliverables links and verify it renders fixed to bottom
- [x] 2.2 Update client layout to hide `app-sidebar.tsx` on mobile viewports (`hidden md:flex`) and show `bottom-nav.tsx` (`flex md:hidden`) and verify transition by resizing window
- [x] 2.3 Implement notification badge for pending deliverables on `bottom-nav.tsx` and verify it displays the correct count

## 3. Global Pipeline View

- [x] 3.1 Create new page `/admin/global-pipeline/page.tsx` and verify route is accessible
- [x] 3.2 Implement Supabase data fetching to retrieve all active deliverables across all clients and verify data logs correctly
- [x] 3.3 Build unified Kanban board component rendering the fetched deliverables grouped by status and verify drag-and-drop or status updates work
- [x] 3.4 Add filtering by client dropdown and verify the board updates reactively

## 4. Settings Consolidation

- [x] 4.1 Create `/admin/settings/layout.tsx` to serve as a wrapper/tabbed view for AI, Bridge, User, and Audit logs and verify layout mounts
- [x] 4.2 Move existing setting pages into `/admin/settings/[tab]` sub-routes and verify they load properly under the new layout
- [x] 4.3 Update redirects or update the sidebar links to point to the new settings routes and verify no 404s occur
