# Spec Delta

## Purpose
Provides a multi-layered, omni-channel calendar to visualize content production and publication schedules across different campaigns and platforms.

## ADDED Requirements

### Requirement: Multi-layer filtering
The system SHALL provide calendar filters allowing users to view schedules by Campaign, by Platform (Instagram, TikTok, etc.), or by Client.

#### Scenario: User filters by platform
- **WHEN** an admin selects "Instagram" in the calendar filter
- **THEN** the calendar displays only content deliverables scheduled for Instagram publication

### Requirement: Drag-and-drop rescheduling
The system SHALL allow admins to change the deadline or publication date of a deliverable by dragging it to a different date on the calendar.

#### Scenario: Admin reschedules content
- **WHEN** an admin drags a content block to a new date
- **THEN** the system updates the `target_date` for that deliverable and visually snaps it to the new date
