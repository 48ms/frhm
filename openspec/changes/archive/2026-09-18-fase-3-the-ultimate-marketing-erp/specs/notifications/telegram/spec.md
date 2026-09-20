# Spec Delta

## MODIFIED Requirements

### Requirement: Notification rules
The system SHALL support configurable notification rules that determine when a Telegram message should be sent based on specific system events.

#### Scenario: Send a notification when a new comment is posted
- **WHEN** a user posts a comment on an issue or document
- **THEN** a Telegram notification is sent to the relevant users or channel if configured to do so

#### Scenario: Critical budget threshold alert
- **WHEN** a client's recorded expenses reach or exceed 90% of their monthly budget
- **THEN** a Telegram alert is automatically sent to the configured agency administrators
