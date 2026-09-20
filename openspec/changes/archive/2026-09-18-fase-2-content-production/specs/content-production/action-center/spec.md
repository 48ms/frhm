# Spec Delta

## Purpose
Provides a role-based action center on the dashboard that highlights a personalized "Today's Action" list to improve daily operational focus.

## ADDED Requirements

### Requirement: Role-based daily tasks
The system SHALL aggregate and display tasks assigned to the currently logged-in user, filtered by their role (e.g., editor, copywriter) and sorted by urgency/due date.

#### Scenario: User views dashboard
- **WHEN** a user logs into the admin panel
- **THEN** they see a "Today's Action Center" widget displaying only the deliverables or tasks that require their immediate action

### Requirement: Task quick actions
The system SHALL allow users to update the status of their assigned tasks directly from the Action Center widget.

#### Scenario: User completes a task
- **WHEN** a user clicks "Mark Complete" on a task in the Action Center
- **THEN** the system updates the task status in the database and removes it from the daily view
