# Design

## Context

Phase 2 focuses on moving the agency's content production and CRM into the system. See `proposal.md` for motivation. The primary technical constraints involve managing complex UI states (Kanban drag-and-drop, interactive calendar) and handling file uploads securely using Supabase Storage.

## Goals / Non-Goals

**Goals:**
- Create an intuitive drag-and-drop Kanban interface for production state-machine.
- Implement an interactive, filterable multi-layer calendar.
- Build a lightweight KOL/Vendor CRM directory.
- Support secure brand asset storage per client using Supabase.

**Non-Goals:**
- Deep analytics or financial tracking (reserved for Phase 3).
- Automated payments to vendors.

## Decisions

### 1. Kanban Board Implementation
- **Decision:** Use `@hello-pangea/dnd` for the Kanban board.
- **Rationale:** The project already utilizes modern React patterns. `@hello-pangea/dnd` is a robust, well-maintained fork of `react-beautiful-dnd` that works flawlessly with React 18+ and Next.js App Router (client components). 
- **Alternative:** `dnd-kit` is also good but can be overly complex for a simple stage-to-stage board. 

### 2. Calendar Implementation
- **Decision:** Use `react-big-calendar` (or a custom Grid calendar built on top of date-fns/shadcn). 
- **Rationale:** It's the standard for full-featured, event-based calendars in React.
- **Alternative:** FullCalendar (too heavy/commercial). Building from scratch is possible using `date-fns` but time-consuming for drag-and-drop events.

### 3. Supabase Storage for Brand Assets
- **Decision:** Use a dedicated `brand_assets` Supabase Storage bucket with Row Level Security (RLS).
- **Rationale:** Avoids managing external S3 providers. Supabase is already configured for auth and database in this project.
- **Alternative:** Storing files in AWS S3 or Cloudinary directly.

### 4. Database Schema Additions
- **Tasks Table:** `tasks` (id, title, role, status, due_date, assignee_id).
- **KOLs Table:** `kols` (id, name, niche, contact_info, rate_card, created_at).
- **Brand Assets Table:** `brand_assets` (id, client_id, category, file_path, file_type, guidelines).
- **Content Production:** `content_items` (id, campaign_id, title, stage, is_urgent, target_date, platform).

## Risks / Trade-offs

- **Risk:** High latency on drag-and-drop actions if database updates are blocking.
  - **Mitigation:** Implement Optimistic UI updates. The UI should reflect the change immediately while the database update happens in the background.
- **Risk:** Large file uploads (raw footage) taking too long or failing.
  - **Mitigation:** Enforce file size limits and provide clear loading progress UI. Consider using multipart uploads if files exceed standard limits.
