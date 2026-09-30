# stepper-wizard-flow Specification

## Purpose
Menyediakan abstraksi hook dan antarmuka formulir multi-langkah (stepper wizard) untuk alur onboarding klien dan penyusunan brief kampanye terarah.

## Requirements

### Requirement: Stepper State Management Hook
The system SHALL provide a `useStepper` hook encapsulating current step index, total step count, next/previous transitions, and step completion flags.

#### Scenario: User progresses through a multi-step workflow
- **WHEN** user finishes entering data in step one and clicks next
- **THEN** current step advances to step two, the progress bar updates, and previous inputs remain preserved

### Requirement: Per-Step Form Validation Gate
The system SHALL prevent advancement to subsequent steps until all required inputs in the current step pass schema validation.

#### Scenario: User clicks next with invalid inputs
- **WHEN** mandatory fields in current step are missing
- **THEN** step transition is blocked and validation errors are highlighted immediately
