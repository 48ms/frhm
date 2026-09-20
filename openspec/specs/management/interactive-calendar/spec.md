# interactive-calendar Specification

## Purpose
Provides fluid, interactive drag-and-drop capabilities to the production calendar, allowing admins to easily reschedule posts.

## Requirements

### Requirement: Drag-and-drop rescheduling
The system SHALL allow admins to reschedule scheduled posts by dragging them from one date to another on the calendar view.

#### Scenario: Admin reschedules a post
- **WHEN** an admin drags a post card from Tuesday to Thursday
- **THEN** the system updates the post's scheduled date to Thursday and saves the change automatically
