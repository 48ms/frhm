# Spec Delta

## Purpose
Implements a production state-machine via a Kanban board to track the internal lifecycle of content creation from Idea to Editing.

## ADDED Requirements

### Requirement: Internal production stages
The system SHALL track deliverables through internal production stages (Idea, Script, Shoot, Edit, Review) using a visual Kanban board interface.

#### Scenario: Moving content to next stage
- **WHEN** a team member drags a content card from "Script" to "Shoot"
- **THEN** the system updates the internal stage of the deliverable and records a timeline event

### Requirement: Fast-track priority
The system SHALL allow marking specific deliverables as "Urgent" or "Fast-Track", visually highlighting them to bypass standard queue times.

#### Scenario: Marking content urgent
- **WHEN** a manager sets the priority of a deliverable to "Urgent"
- **THEN** the card gets a prominent red highlight and floats to the top of its current column
