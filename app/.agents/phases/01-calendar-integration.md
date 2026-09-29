# Phase 1: Calendar Integration

## Goal
Link `content_productions` → `scheduled_posts` → `calendar-view`
so tasks scheduled via the "Jadwalkan ke Kalender" button
automatically appear in the content calendar.

---

## Schema (Already Exists)

`scheduled_posts` table (migration 019+024):
- `id UUID PK`
- `client_id UUID → clients`
- `scheduled_at TIMESTAMP`
- `title TEXT`
- `content TEXT`
- `platform TEXT`
- `priority TEXT` (low/normal/high/urgent)
- **`production_id UUID → content_productions(id)`** ← our link
- `skill_output_id UUID → skill_outputs(id)`
- `is_reserved BOOLEAN DEFAULT false`
- `publishing_status TEXT` (pending/scheduled/publishing/published/failed/cancelled)

---

## Implementation Plan

### Step 1: Add "Schedule to Calendar" Handler
- [ ] In `content-production-board.tsx`, update `openCalendar`
- [ ] Pass `productionId` to `PostDialog`
- [ ] On save, insert row to `scheduled_posts`
- [ ] Update `production_id` in scheduled_posts (not just notes)

### Step 2: Calendar View Integration
- [ ] In `calendar-view.tsx`, fetch scheduled_posts by client_id
- [ ] Group by date
- [ ] Show production tasks as calendar events
- [ ] Add color coding by stage/priority

### Step 3: Unified Planning View
- [ ] Create `/admin/clients/[id]/planning` page
- [ ] Tab 1: Calendar view (all scheduled posts)
- [ ] Tab 2: Kanban pipeline (all production tasks)
- [ ] Global filter: date range, platform, priority

---

## Files to Modify
- `components/production/content-production-board.tsx`
- `components/calendar/post-dialog.tsx`
- `app/admin/clients/[id]/workspace.tsx` (add planning tab)
- `components/calendar/calendar-view.tsx`

---

## Verification Checklist
- [ ] Scheduled posts appear in calendar
- [ ] Production task link visible
- [ ] Drag-drop in planning view works
- [ ] TypeScript compiles
