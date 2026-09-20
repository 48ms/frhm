# Tasks

## 1. Database & Infrastructure Setup

- [x] 1.1 Create Supabase migrations for `tasks`, `kols`, `brand_assets`, and `content_items` tables. Verify by checking if the migration succeeds and tables exist in the local or remote database.
- [x] 1.2 Setup Supabase Storage bucket for `brand_assets` and configure Row Level Security (RLS) policies. Verify by successfully uploading a test file via the Supabase dashboard.

## 2. Dependencies & Core Components

- [x] 2.1 Install and configure `@hello-pangea/dnd` and `react-big-calendar`. Verify by confirming package installation and successful Next.js build.
- [x] 2.2 Create shared layout and navigation tabs for the CRM and Production routes under `/admin/production` and `/admin/crm`. Verify by navigating to these routes and observing the layout structure.

## 3. Brand Asset Hub

- [x] 3.1 Implement Asset Hub UI on the client details page. Verify by navigating to a client's page and observing the new Brand Assets section.
- [x] 3.2 Implement asset upload functionality connected to Supabase Storage. Verify by uploading a file and confirming it appears in the asset list.
- [x] 3.3 Implement brand guidelines form (HEX colors, typography). Verify by saving text guidelines and confirming they display correctly as visual swatches.

## 4. KOL & Vendor CRM

- [x] 4.1 Implement KOL directory listing and search functionality. Verify by adding mock KOLs and searching by niche.
- [x] 4.2 Implement KOL profile detail view with collaboration history. Verify by viewing a profile and confirming past campaigns are listed.

## 5. Production Kanban (State-Machine)

- [x] 5.1 Implement Content Production page with Kanban board wrapper. Verify by navigating to the page and ensuring the layout loads without error.
- [x] 5.2 Implement column rendering mapping to `content_items` status. Verify by creating mock items and ensuring they appear in the correct columns.
- [x] 5.3 Implement drag-and-drop using `@hello-pangea/dnd` to update state. Verify by dragging an item across columns and confirming the status updates in Supabase.

## 6. Calendar Integration

- [x] 6.1 Implement Calendar view component utilizing `react-big-calendar`. Verify by loading the Calendar tab without errors.
- [x] 6.2 Integrate `date-fns` for event parsing and map `content_items` to calendar events. Verify by ensuring items with publish dates appear on the calendar.
- [x] 6.3 Sync calendar drag-and-drop changes back to Supabase `publish_date`. Verify by dragging an event to a new date and confirming the date updates in Supabase.

## 7. Today's Action Center

- [x] 7.1 Implement 'Action Center' dashboard widget showing tasks grouped by urgency (Due Today, Overdue). Verify by checking the dashboard and confirming tasks appear in the correct groups.
- [x] 7.2 Add quick-action buttons (Mark Done, Reschedule). Verify by clicking 'Mark Done' and confirming the task status updates in Supabase.
