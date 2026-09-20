# command-palette

## Purpose
Provides a global search and quick navigation mechanism via a command palette triggered by Ctrl+K (or Cmd+K).

## Requirements

### Requirement: Global keyboard shortcut activation
The system SHALL open the command palette when the user presses Ctrl+K (Windows/Linux) or Cmd+K (macOS).

#### Scenario: User triggers command palette
- **WHEN** the user presses Ctrl+K
- **THEN** the command palette modal appears in the center of the screen, ready for input

### Requirement: Quick navigation and search
The system SHALL allow users to search for specific features, clients, or deliverables and navigate to them directly from the command palette.

#### Scenario: User searches for client
- **WHEN** the user types a client's name in the command palette
- **THEN** the command palette displays a quick link to that client's dashboard or settings

### Requirement: Client creation command in command palette
The system SHALL register a 'Create New Client' or 'Tambah Client Baru' action in the global command palette accessible via Ctrl+K / Cmd+K.

#### Scenario: Admin invokes client creation from command palette
- **WHEN** the admin opens the command palette and selects or types 'Tambah Client Baru'
- **THEN** the client creation dialog opens immediately
